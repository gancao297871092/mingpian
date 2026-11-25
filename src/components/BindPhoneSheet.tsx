import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Keyboard,
  Platform,
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
import { closePhoneLogin, getMaskPhone, openPhoneLogin } from '@/native/PhoneLogin';
import { navigationRef } from '@/route/navigationRef';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

/**
 * 绑定手机号弹层（合规要求：未实名且未绑定手机时，发私信/评论/动态前引导绑定）。
 * Figma：绑定手机-其他场景 #2805:7941（一键绑定）/ 绑定手机2-其他场景 #2805:7959（绑定其他手机）。
 * 容器复用 AppBottomSheet（@gorhom/bottom-sheet）：自带拖拽条、下拉关闭、遮罩点击关闭。
 *
 * requireBindPhone() 返回 Promise<boolean>：true=绑定成功可继续原操作；false=用户取消。
 * 全局仅需在 App 根节点挂一个 <BindPhoneSheetHost />。
 */

const COUNTDOWN_SECONDS = 60;

type Step = 'main' | 'other';

interface SheetSnapshot {
  visible: boolean;
  step: Step;
}

let snapshot: SheetSnapshot = { visible: false, step: 'main' };
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
    setSnapshot({ visible: true, step: 'main' });
  });
}

function finishBindPhone(ok: boolean) {
  const resolve = pendingResolve;
  pendingResolve = null;
  setSnapshot({ visible: false, step: 'main' });
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

  const [maskPhone, setMaskPhone] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(true);
  const [agreeVisible, setAgreeVisible] = useState(false);
  const [binding, setBinding] = useState(false);

  // 其他手机（短信绑定）
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsAuthCode, setSmsAuthCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 协议「同意并继续」后待继续的绑定动作
  const pendingActionRef = useRef<(() => void) | null>(null);

  const { visible, step } = snap;

  // 模块状态驱动 bottom-sheet 弹层（present/dismiss）
  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      // 预取号掩码（iOS 有值；Android 当前 SDK 无掩码能力返回 null，隐藏号码行）
      getMaskPhone().then(setMaskPhone);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const setStep = (s: Step) => setSnapshot({ visible: true, step: s });

  const openAgreement = (type: AgreementType) => {
    navigationRef.navigate('agreement', { type });
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
    if (binding) return;
    setBinding(true);
    try {
      let auth;
      try {
        // iOS 半屏弹窗形式展示授权页（原生 bottomSheetMode 已适配布局）；
        // Android 的弹窗模式需给 LoginAuthActivity 加 dialog 主题，会影响登录页全屏授权页，暂保持全屏
        auth = await openPhoneLogin({
          presentation: Platform.OS === 'ios' ? 'bottomSheet' : 'fullscreen',
        });
      } catch (e: any) {
        const errCode = e?.code;
        if (errCode === 'CANCELLED' || errCode === 'SWITCH_BACK') return;
        if (errCode === 'SWITCH_OTHER' || errCode === 'UNSUPPORTED') {
          setStep('other');
          return;
        }
        if (errCode === 'OPEN_AGREEMENT') {
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
        return;
      }
      try {
        const res = await API.auth.mobileBind({ token: auth.token });
        if (res.code !== '200') {
          // 业务失败（msg 已由拦截器提示时直接返回；未提示的补提示）
          return;
        }
        await onBindSuccess();
      } catch {
        // 拦截器已提示后端 msg（如「该手机号已绑定其他账号」）
      }
    } finally {
      closePhoneLogin();
      setBinding(false);
    }
  }, [binding, onBindSuccess]);

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
      onClose={() => finishBindPhone(false)}
      backgroundColor="#F6F7FB"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {step === 'main' ? (
        <View>
          <Text style={styles.desc}>根据相关法律规定，绑定手机号后可继续使用相关功能</Text>
          {maskPhone ? <Text style={styles.maskPhone}>+86 {maskPhone}</Text> : null}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              disabled={binding}
              onPress={() => onPressBind(startOneClickBind)}
            >
              <Text style={styles.primaryButtonText}>
                {binding ? '绑定中…' : '本机号码一键绑定'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => setStep('other')}
            >
              <Text style={styles.secondaryButtonText}>绑定其他手机</Text>
            </TouchableOpacity>
            {agreementRow}
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.otherHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={() => setStep('main')}
              accessibilityLabel="返回"
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
      )}
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
  // ===== 一键绑定 =====
  desc: {
    marginTop: scaleSizeH(16),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#6C6C6C',
    textAlign: 'center',
  },
  maskPhone: {
    marginTop: scaleSizeH(15),
    fontSize: setSpText(22),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
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
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(100),
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
  },
  secondaryButtonText: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#000000',
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
