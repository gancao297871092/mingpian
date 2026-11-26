import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { BottomSheetTextInput, type BottomSheetModal } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { API } from '@/api';
import AgreementSheet, { type AgreementType } from '@/components/AgreementSheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { CheckIcon } from '@/assets/login/icons';
import { closePhoneLogin, openPhoneLogin } from '@/native/PhoneLogin';
import { navigationRef } from '@/route/navigationRef';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

/**
 * 绑定手机号弹层（合规要求：未实名且未绑定手机时，发私信/评论/动态前引导绑定）。
 * 一键绑定使用运营商 SDK 授权页；仅短信绑定使用 AppBottomSheet。
 * 短信表单对齐 Figma #2805:7959，支持下拉关闭和遮罩点击关闭。
 *
 * requireBindPhone() 返回 Promise<boolean>：true=绑定成功可继续原操作；false=用户取消。
 * 全局仅需在 App 根节点挂一个 <BindPhoneSheetHost />。
 */

const COUNTDOWN_SECONDS = 60;

type Step = 'sdk' | 'other';

interface SheetSnapshot {
  visible: boolean;
  step: Step;
}

let snapshot: SheetSnapshot = { visible: false, step: 'sdk' };
let pendingResolve: ((ok: boolean) => void) | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;

function setSnapshot(next: SheetSnapshot) {
  snapshot = next;
  emit();
}

/** 弹出绑定手机流程；重复调用共享同一次弹层结果 */
export function requireBindPhone(): Promise<boolean> {
  if (snapshot.visible && pendingResolve) {
    return new Promise(resolve => {
      const prev = pendingResolve!;
      pendingResolve = ok => {
        prev(ok);
        resolve(ok);
      };
    });
  }
  return new Promise(resolve => {
    pendingResolve = resolve;
    setSnapshot({ visible: true, step: 'sdk' });
  });
}

function finishBindPhone(ok: boolean) {
  const resolve = pendingResolve;
  pendingResolve = null;
  setSnapshot({ visible: false, step: 'sdk' });
  resolve?.(ok);
}

/** 绑定成功后刷新 userInfo（wqUser.mobile / authStatus 是守卫判断依据） */
async function refreshUserInfo() {
  try {
    const res = await API.user.info();
    if (res.code === '200' && res.data) {
      useUserStore.getState().setUserInfo(res.data);
    }
  } catch {
    // 绑定已成功，用户信息由后续页面自行刷新
  }
}

export function BindPhoneSheetHost() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  const sheetRef = useRef<BottomSheetModal>(null);

  const [agreed, setAgreed] = useState(true);
  const [agreeVisible, setAgreeVisible] = useState(false);
  const [binding, setBinding] = useState(false);
  const sdkPendingRef = useRef(false);

  // 其他手机（短信绑定）
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsAuthCode, setSmsAuthCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 协议「同意并继续」后待继续的绑定动作
  const pendingActionRef = useRef<(() => void) | null>(null);
  // 阅读协议只是暂时收起表单，不结束绑定，也不清空输入和倒计时。
  const agreementTripRef = useRef<{
    type: AgreementType;
    originKey: string;
    opened: boolean;
  } | null>(null);

  const { visible, step } = snap;

  // 本机号码授权只由 SDK 展示；自定义弹层仅用于短信绑定。
  useEffect(() => {
    if (visible && step !== 'sdk') {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, step]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const setStep = (s: Step) => setSnapshot({ visible: true, step: s });

  useEffect(() => navigationRef.addListener('state', () => {
    const trip = agreementTripRef.current;
    if (!trip?.opened) return;
    const route = navigationRef.getCurrentRoute();
    if (route?.name === 'agreement') return;
    agreementTripRef.current = null;
    if (route?.key === trip.originKey && snapshot.visible && snapshot.step === 'other') {
      sheetRef.current?.present();
    } else {
      // 退出登录或导航重置时不在其他页面恢复旧绑定流程。
      finishBindPhone(false);
    }
  }), []);

  const openAgreement = (type: AgreementType) => {
    if (snapshot.visible && snapshot.step === 'other') {
      if (agreementTripRef.current) return;
      const origin = navigationRef.getCurrentRoute();
      if (!origin) return;
      Keyboard.dismiss();
      pendingActionRef.current = null;
      setAgreeVisible(false);
      agreementTripRef.current = { type, originKey: origin.key, opened: false };
      sheetRef.current?.dismiss();
      return;
    }
    navigationRef.navigate('agreement', { type });
  };

  const onSheetDismiss = () => {
    const trip = agreementTripRef.current;
    if (trip) {
      if (!trip.opened) {
        trip.opened = true;
        navigationRef.navigate('agreement', { type: trip.type });
      }
      return;
    }
    if (snapshot.visible && snapshot.step === 'other') finishBindPhone(false);
  };

  /** 绑定成功统一收尾：提示 → 刷新 userInfo → 关闭弹层并放行原操作 */
  const onBindSuccess = useCallback(async () => {
    Toast.show({ type: 'success', text1: '绑定成功' });
    await refreshUserInfo();
    finishBindPhone(true);
  }, []);

  /** 一键绑定：拉起运营商授权页取 token → /auth/mobile/bind {token}（不做协议检查，供「同意并继续」继续调用）。
   *  不做环境预检（与登录页一致）：授权页能否弹起由 SDK 自己判定，失败按错误码降级短信绑定 */
  const startOneClickBind = useCallback(async () => {
    if (sdkPendingRef.current) return;
    sdkPendingRef.current = true;
    setBinding(true);
    try {
      let auth;
      try {
        // 两端均由运营商 SDK 以底部弹窗展示授权。
        auth = await openPhoneLogin({ presentation: 'bottomSheet' });
      } catch (e: any) {
        const errCode = e?.code;
        if (errCode === 'CANCELLED' || errCode === 'SWITCH_BACK') {
          finishBindPhone(false);
          return;
        }
        if (errCode === 'SWITCH_OTHER' || errCode === 'UNSUPPORTED') {
          setStep('other');
          return;
        }
        if (errCode === 'OPEN_AGREEMENT') {
          finishBindPhone(false);
          openAgreement(e?.message === 'privates' ? 'privates' : 'userSure');
          return;
        }
        // 预取号失败/无 SIM 等：提示并降级短信绑定
        Toast.show({ type: 'info', text1: '当前环境不支持一键绑定，请绑定其他手机' });
        setStep('other');
        return;
      }
      if (!auth?.token) {
        Toast.show({ type: 'error', text1: '未获取到认证凭证，请重试' });
        finishBindPhone(false);
        return;
      }
      try {
        const res = await API.auth.mobileBind({ token: auth.token });
        if (res.code !== '200') {
          finishBindPhone(false);
          return;
        }
        await onBindSuccess();
      } catch {
        // 业务失败仅保留拦截器的错误提示，结束本次操作，不弹第二层绑定面板。
        finishBindPhone(false);
      }
    } finally {
      closePhoneLogin();
      sdkPendingRef.current = false;
      setBinding(false);
    }
  }, [onBindSuccess]);

  useEffect(() => {
    if (visible && step === 'sdk') {
      Keyboard.dismiss();
      startOneClickBind();
    }
  }, [visible, step, startOneClickBind]);

  /** 短信绑定提交（不做协议检查，供「同意并继续」继续调用） */
  const startSmsBind = useCallback(async () => {
    if (binding) return;
    if (!smsAuthCode) {
      Toast.show({ type: 'info', text1: '请先获取验证码' });
      return;
    }
    setBinding(true);
    try {
      const res = await API.auth.mobileBind({ phone, authCode: smsAuthCode, code });
      if (res.code !== '200') return;
      await onBindSuccess();
    } catch {
      // 拦截器已提示
    } finally {
      setBinding(false);
    }
  }, [binding, phone, code, smsAuthCode, onBindSuccess]);

  /** 点主按钮：未勾协议先弹协议确认（「同意并继续」后继续本次绑定） */
  const onPressBind = (action: () => void) => {
    Keyboard.dismiss();
    if (!agreed) {
      pendingActionRef.current = action;
      setAgreeVisible(true);
      return;
    }
    action();
  };

  const onAgree = () => {
    setAgreed(true);
    setAgreeVisible(false);
  };
  const onAgreeDismissed = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  // ===== 其他手机：发送验证码（/auth/sms/send → authCode） =====
  const startCountdown = () => {
    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmitSms = isPhoneValid && code.trim().length >= 4 && !binding;

  const onSendSmsCode = async () => {
    if (!isPhoneValid) {
      Toast.show({ type: 'info', text1: '请输入正确的手机号' });
      return;
    }
    try {
      const res = await API.auth.smsSend({ phone });
      if (res.code === '200' && res.data?.authCode) {
        setSmsAuthCode(res.data.authCode);
        startCountdown();
        Toast.show({ type: 'success', text1: '验证码已发送' });
      }
    } catch {
      // 拦截器已提示
    }
  };

  const agreementRow = (
    <View style={styles.agreementRow}>
      <TouchableOpacity
        style={[styles.checkbox, agreed && styles.checkboxActive]}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
        accessibilityLabel="同意协议"
      >
        {agreed ? <CheckIcon size={scaleSizeW(9)} /> : null}
      </TouchableOpacity>
      <Text style={styles.agreementText}>
        我已阅读并同意
        <Text style={styles.agreementLink} onPress={() => openAgreement('userSure')}>
          《用户协议》
        </Text>
        和
        <Text style={styles.agreementLink} onPress={() => openAgreement('privates')}>
          《隐私政策》
        </Text>
      </Text>
    </View>
  );

  return (
    <AppBottomSheet
      ref={sheetRef}
      onClose={onSheetDismiss}
      backgroundColor="#F6F7FB"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View>
          <View style={styles.otherHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={() => sheetRef.current?.dismiss()}
              accessibilityLabel="关闭"
            >
              <Svg width={scaleSizeW(14)} height={scaleSizeW(14)} viewBox="0 0 14 14" fill="none">
                <Path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="#333333"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.otherTitle}>绑定其他手机</Text>
          </View>
          <Text style={styles.otherDesc}>根据相关法律规定，绑定手机号后可继续使用相关功能</Text>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>+86</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  placeholderTextColor="#999999"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>验证码</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="请输入验证码"
                  placeholderTextColor="#999999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={countdown > 0}
                  onPress={onSendSmsCode}
                >
                  <Text style={countdown > 0 ? styles.smsDisabled : styles.smsActive}>
                    {countdown > 0 ? `${countdown}S 重新发送` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              {countdown > 0 ? (
                <Text style={styles.smsTip}>验证码 5 分钟内有效，60 秒后可重新发送</Text>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, !canSubmitSms && styles.primaryButtonDisabled]}
              activeOpacity={0.85}
              disabled={!canSubmitSms}
              onPress={() => onPressBind(startSmsBind)}
            >
              <Text style={styles.primaryButtonText}>{binding ? '绑定中…' : '确定'}</Text>
            </TouchableOpacity>
            {agreementRow}
          </View>
      </View>
      <AgreementSheet
        visible={agreeVisible}
        onClose={() => setAgreeVisible(false)}
        onAgree={onAgree}
        onAgreeDismissed={onAgreeDismissed}
        onOpenAgreement={type => {
          setAgreeVisible(false);
          openAgreement(type);
        }}
      />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  // ===== 短信绑定 =====
  buttonGroup: {
    marginTop: scaleSizeH(30),
    gap: scaleSizeH(10),
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(100),
    backgroundColor: '#2962D4',
  },
  primaryButtonDisabled: {
    opacity: 0.3,
  },
  primaryButtonText: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  checkbox: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    borderRadius: scaleSizeW(6),
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2962D4',
    borderColor: '#2962D4',
  },
  agreementText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(22),
    color: '#000000',
  },
  agreementLink: {
    color: '#2962D4',
  },
  // ===== 绑定其他手机 =====
  otherHeader: {
    marginTop: scaleSizeH(10),
    height: scaleSizeH(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    width: scaleSizeW(25),
    height: scaleSizeW(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  otherDesc: {
    marginTop: scaleSizeH(14),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#6C6C6C',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(56),
    marginTop: scaleSizeH(12),
  },
  inputLabel: {
    fontSize: setSpText(16),
    color: '#000000',
    marginRight: scaleSizeW(40),
  },
  input: {
    flex: 1,
    fontSize: setSpText(16),
    color: '#000000',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E6E6',
  },
  smsActive: {
    fontSize: setSpText(16),
    color: '#2962D4',
  },
  smsDisabled: {
    fontSize: setSpText(16),
    color: '#999999',
  },
  smsTip: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(12),
    color: '#999999',
  },
});
