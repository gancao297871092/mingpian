import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import AgreementSheet from '@/components/AgreementSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { NavBackButton } from '@/components/NavHeader';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { isWechatAvailable, isWechatConfigured, wechatLogin } from '@/utils/wechat';
import { PhoneIcon, WechatIcon } from '@/assets/login/icons';
import type { RootStackParamList } from '@/route/map';
import { CheckIcon } from '@/assets/login/icons';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import {
  checkPhoneLoginSupport,
  closePhoneLogin,
  isPhoneLoginAvailable,
  openPhoneLogin,
  preLoginPhone,
} from '@/native/PhoneLogin';

type Props = NativeStackScreenProps<RootStackParamList, 'login'>;

export default function LoginHome({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const wechatPending = useRef(false);
  const phonePending = useRef(false);
  const { setToken, setUserInfo } = useUserStore();
  // 协议同意弹窗：记录被拦截、待用户同意后继续的登录动作
  const [agreeVisible, setAgreeVisible] = useState(false);
  const agreeContinue = useRef<(() => void) | null>(null);

  const showAgreementSheet = (continueAction: () => void) => {
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

  // 进入登录页即预取号，加速一键登录授权页弹起
  useEffect(() => {
    preLoginPhone();
  }, []);

  const onPhoneLogin = async () => {
    if (phonePending.current) return;
    phonePending.current = true;
    setPhoneLoading(true);
    try {
      // 不支持一键登录（无 SIM/非蜂窝网络/老版本无原生模块）时直接走短信登录
      if (!isPhoneLoginAvailable || !(await checkPhoneLoginSupport())) {
        navigation.navigate('otherLogin');
        return;
      }
      preLoginPhone();
      const auth = await openPhoneLogin({ presentation: 'fullscreen' });
      if (!auth?.token) {
        throw new Error('未获取到登录凭证，请重试');
      }
      const res = await API.auth.oneclick({
        token: auth.token,
        ...(auth.userAuthorization ? { userAuthorization: auth.userAuthorization } : {}),
      });
      if (res.code !== '200' || !res.data?.token) {
        throw new Error(res.msg || '登录失败，请重试');
      }
      setUserInfo(null);
      setToken(res.data.token);
      // 先跳首页，避免后端请求期间露出登录页；用户信息后台拉取
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      try {
        const info = await API.user.info();
        if (info.code === '200') setUserInfo(info.data);
      } catch {
        // 登录已成功，用户信息可由后续页面重新加载。
      }
    } catch (e: any) {
      const code = e?.code;
      if (code === 'CANCELLED' || code === 'SWITCH_BACK') return;
      if (code === 'SWITCH_OTHER' || code === 'UNSUPPORTED') {
        navigation.navigate('otherLogin');
        return;
      }
      // 授权页内点击《用户协议》/《隐私政策》：打开 App 内协议页（与登录页一致）
      if (code === 'OPEN_AGREEMENT') {
        navigation.navigate('agreement', { type: e?.message === 'privates' ? 'privates' : 'userSure' });
        return;
      }
      AppAlert.alert('登录失败', e?.msg ?? e?.message ?? '一键登录失败，请重试');
    } finally {
      closePhoneLogin();
      phonePending.current = false;
      setPhoneLoading(false);
    }
  };

  const onWechatLogin = async () => {
    if (wechatPending.current) return;
    if (!agreed) {
      showAgreementSheet(() => onWechatLogin());
      return;
    }
    if (!isWechatConfigured()) {
      AppAlert.alert('提示', '微信登录暂未开放（未配置 WECHAT_APPID）');
      return;
    }
    wechatPending.current = true;
    setWechatLoading(true);
    try {
      if (!(await isWechatAvailable())) {
        AppAlert.alert('提示', '未检测到微信，请先安装微信');
        return;
      }
      const { code } = await wechatLogin();
      const res = await API.auth.wechatCode({ code });
      if (res.code !== '200' || !res.data) {
        throw new Error(res.msg || '微信登录失败，请重试');
      }
      if (res.data.token) {
        setUserInfo(null);
        setToken(res.data.token);
        try {
          const info = await API.user.info();
          if (info.code === '200') setUserInfo(info.data);
        } catch {
          // 登录已成功，用户信息可由后续页面重新加载。
        }
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        throw new Error('登录信息不完整，请重新授权');
      }
    } catch (e: any) {
      if (e?.code === -2) return;
      AppAlert.alert('登录失败', e?.message ?? '微信登录失败');
    } finally {
      wechatPending.current = false;
      setWechatLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {navigation.canGoBack() && (
        <View style={[styles.backWrap, { top: insets.top + scaleSizeH(10) }]}>
          <NavBackButton onPress={() => navigation.goBack()} />
        </View>
      )}
      <View style={styles.brand}>
        <Image source={require('@/assets/login/logo.png')} style={styles.logo} />
        <Text style={styles.brandName}>联诚采信</Text>
      </View>
      <Text style={styles.slogan}>让中国好企业被看见</Text>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          activeOpacity={0.85}
          disabled={phoneLoading}
          onPress={onPhoneLogin}
        >
          <PhoneIcon size={scaleSizeW(20)} />
          <Text style={styles.btnPrimaryText}>
            {phoneLoading ? '登录中…' : '手机登录'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          activeOpacity={0.85}
          disabled={wechatLoading}
          onPress={onWechatLogin}
        >
          <WechatIcon size={scaleSizeW(20)} /> 
          <Text style={styles.btnSecondaryText}>
            {wechatLoading ? '微信登录中…' : '微信登录'}
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
      <AgreementSheet
        visible={agreeVisible}
        onClose={() => setAgreeVisible(false)}
        onAgree={onAgreeContinue}
        onOpenAgreement={type => {
          setAgreeVisible(false);
          navigation.navigate('agreement', { type });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backWrap: {
    position: 'absolute',
    left: scaleSizeW(16),
    zIndex: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(160),
  },
  logo: {
    width: scaleSizeW(45),
    height: scaleSizeW(45),
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: setSpText(32),
    fontWeight: '700',
    color: '#2962D4',
  },
  slogan: {
    marginTop: scaleSizeH(12),
    fontSize: setSpText(14),
    color: '#323232',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: scaleSizeH(120),
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(6),
    width: scaleSizeW(322),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
  },
  btnPrimary: {
    backgroundColor: '#2962D4',
  },
  btnPrimaryText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  btnSecondary: {
    marginTop: scaleSizeH(16),
    backgroundColor: '#F4F4F4',
  },
  btnSecondaryText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#323232',
  },
  agreement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(30),
  },
  checkbox: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
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
    color: '#6C6C6C',
  },
  agreementLink: {
    color: '#2962D4',
  },
});
