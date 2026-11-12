import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import AgreementSheet from '@/components/AgreementSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API } from '@/api';
import { CheckIcon } from '@/assets/login/icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/theme';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';

const COUNTDOWN_SECONDS = 60;

/** 业务错误（{code,msg}）已由请求拦截层按 msg 统一弹窗，这里只兜底真实网络/HTTP 异常 */
function alertRequestError(e: any) {
  if (e?.msg) return;
  AppAlert.alert('提示', e?.message || '网络错误，请稍后重试');
}

type Props = NativeStackScreenProps<RootStackParamList, 'otherLogin'>;

export default function OtherNumberLogin({ navigation }: Props) {
  const theme = useTheme();
  const { setToken, setUserInfo } = useUserStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 协议同意弹窗：记录被拦截、待用户同意后继续的登录动作
  const [agreeVisible, setAgreeVisible] = useState(false);
  const agreeContinue = useRef<(() => void) | null>(null);

  const showAgreementSheet = (continueAction: () => void) => {
    Keyboard.dismiss();
    agreeContinue.current = continueAction;
    setAgreeVisible(true);
  };

  const onAgreeContinue = () => {
    setAgreed(true);
    setAgreeVisible(false);
    const action = agreeContinue.current;
    agreeContinue.current = null;
    action?.();
  };

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canLogin = isPhoneValid && code.length >= 4 && agreed;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

  const onGetCode = async () => {
    if (countdown > 0) return;
    if (!isPhoneValid) {
      AppAlert.alert('提示', '请输入正确的11位手机号码');
      return;
    }
    try {
      const res = await API.auth.smsSend({ phone });
      const { code: respCode, msg, data } = res;
      if (respCode === '200' && data?.authCode) {
        setAuthCode(data.authCode);
        startCountdown();
        Toast.show({ type: 'success', text1: '验证码已发送' });
      } else {
        AppAlert.alert('提示', msg || '验证码发送失败');
      }
    } catch (e: any) {
      alertRequestError(e);
    }
  };

  /** 协议校验通过后的真正登录流程（不做协议检查，供「同意并继续」继续调用；前置校验保留） */
  const startLogin = async () => {
    if (loading) return;
    if (!isPhoneValid) {
      AppAlert.alert('提示', '请输入正确的11位手机号码');
      return;
    }
    if (code.length < 4) {
      AppAlert.alert('提示', '请输入验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await API.auth.login({ phone, authCode, code });
      const { code: respCode, msg, data } = res;
      if (respCode === '200' && data?.token) {
        setToken(data.token);
        // 获取用户信息（同步小程序逻辑）
        try {
          const infoRes = await API.user.info();
          if (infoRes.code === '200') {
            // 手机号登录即完成绑定：后端未回传 mobile 时用本次登录手机号兜底，保证账号与安全页能脱敏展示
            setUserInfo({
              ...infoRes.data,
              wqUser: { ...infoRes.data?.wqUser, mobile: infoRes.data?.wqUser?.mobile || phone },
            });
          }
        } catch {
          // ignore
        }
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        AppAlert.alert('提示', msg || '登录失败');
      }
    } catch (e: any) {
      alertRequestError(e);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = () => {
    // 未勾选协议：弹协议半屏弹窗，「同意并继续」后接着本次登录
    if (!agreed) {
      showAgreementSheet(startLogin);
      return;
    }
    startLogin();
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
        <Text style={styles.title}>其他号码登录</Text>
        <Text style={styles.subtitle}>未注册的手机号登录成功后将自动注册</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>手机号</Text>
          <TextInput
            style={styles.fieldInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="请输入11位手机号码"
            placeholderTextColor="#BABABA"
            keyboardType="number-pad"
            maxLength={11}
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>验证码</Text>
          <TextInput
            style={styles.fieldInput}
            value={code}
            onChangeText={setCode}
            placeholder="请输入验证码"
            placeholderTextColor="#BABABA"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.getCodeBtn, !isPhoneValid && countdown === 0 && styles.getCodeBtnDisabled]}
            activeOpacity={0.7}
            disabled={!isPhoneValid || countdown > 0}
            onPress={onGetCode}
          >
            <Text style={[styles.getCodeText, !isPhoneValid && countdown === 0 && styles.getCodeTextDisabled]}>
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        <Text style={styles.hint}>验证码 5 分钟内有效，60 秒后可重新发送</Text>

        <TouchableOpacity
          style={[styles.loginBtn, canLogin && styles.loginBtnActive]}
          activeOpacity={0.85}
          disabled={!canLogin || loading}
          onPress={onLogin}
        >
          <Text style={[styles.loginBtnText, canLogin && styles.loginBtnTextActive]}>
            {loading ? '登录中…' : '登录'}
          </Text>
        </TouchableOpacity>

        <View style={styles.agreement}>
          <TouchableOpacity
            style={[styles.checkbox, agreed && styles.checkboxActive]}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            {agreed ? <CheckIcon size={scaleSizeW(12)} /> : null}
          </TouchableOpacity>
          <Text style={styles.agreementText}>
            我已阅读并同意
            <Text
              style={styles.agreementLink}
              onPress={() => navigation.navigate('agreement', { type: 'userSure' })}
            >
              《用户协议》
            </Text>
            和
            <Text
              style={styles.agreementLink}
              onPress={() => navigation.navigate('agreement', { type: 'privates' })}
            >
              《隐私政策》
            </Text>
          </Text>
        </View>
        </View>
        </View>
        </TouchableWithoutFeedback>
      <AgreementSheet
        visible={agreeVisible}
        onClose={() => setAgreeVisible(false)}
        onAgree={onAgreeContinue}
        onOpenAgreement={type => {
          setAgreeVisible(false);
          navigation.navigate('agreement', { type });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginTop: scaleSizeH(60),
    alignItems: 'center',
  },
  title: {
    fontSize: setSpText(24),
    fontWeight: '500',
    color: '#000000',
  },
  subtitle: {
    marginTop: scaleSizeH(8),
    fontSize: setSpText(12),
    color: '#B9B9B9',
  },
  form: {
    marginTop: scaleSizeH(24),
    paddingHorizontal: scaleSizeW(40),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(37),
  },
  fieldLabel: {
    fontSize: setSpText(16),
    color: '#000000',
  },
  fieldInput: {
    flex: 1,
    marginLeft: scaleSizeW(21),
    fontSize: setSpText(16),
    color: '#000000',
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginTop: scaleSizeH(16),
    marginBottom: scaleSizeH(14),
  },
  getCodeBtn: {
    paddingLeft: scaleSizeW(12),
  },
  getCodeBtnDisabled: {
    opacity: 0.5,
  },
  getCodeText: {
    fontSize: setSpText(16),
    color: '#2962D4',
  },
  getCodeTextDisabled: {
    color: '#999999',
  },
  hint: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(12),
    color: '#999999',
  },
  loginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(46),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: '#F5F5F5',
  },
  loginBtnActive: {
    backgroundColor: '#2962D4',
  },
  loginBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#999999',
  },
  loginBtnTextActive: {
    color: '#FFFFFF',
  },
  agreement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(30),
    justifyContent: 'center',
  },
  checkbox: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
    borderRadius: scaleSizeW(3),
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSizeW(5),
  },
  checkboxActive: {
    backgroundColor: '#2962D4',
    borderColor: '#2962D4',
  },
  agreementText: {
    fontSize: setSpText(12),
    color: '#000000',
  },
  agreementLink: {
    color: '#2962D4',
  },
});
