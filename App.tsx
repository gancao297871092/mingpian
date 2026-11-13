import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BootSplash from 'react-native-bootsplash';
import Toast, { type ToastConfig, type ToastShowParams } from 'react-native-toast-message';
import { Text, View } from 'react-native';
import { ThemeProvider, useTheme } from '@/theme';
import RootNavigator from '@/route';
import { AppAlertHost } from '@/components/AppAlert';
import { initWechat } from '@/utils/wechat';
import { initPhoneLogin } from '@/native/PhoneLogin';
import { reportActivation } from '@/utils/activation';
import { setupPush } from '@/utils/push';
import PrivacyConsentGate from '@/components/PrivacyConsentGate';
import { hasPrivacyConsent, setPrivacyConsent } from '@/utils/privacyConsent';
import { useUserStore } from '@/store/user';
import { storageUtils } from '@/utils/storage';
import { API } from '@/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

/** 全站统一暗色胶囊提示（对齐原型「验证码已发送」样式），success/error/info 视觉一致 */
const AppToast = (props: ToastShowParams) => (
  <View style={toastStyles.wrap}>
    <Text style={toastStyles.text}>{props.text1}</Text>
  </View>
);

const toastConfig: ToastConfig = {
  success: AppToast,
  error: AppToast,
  info: AppToast,
};

function Root() {
  const [showLaunch, setShowLaunch] = useState(Platform.OS === 'android');
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const launchStarted = useRef(false);
  const theme = useTheme();
  const { setToken, setUserInfo } = useUserStore();

  // 隐私政策是否已同意（MMKV 同步读取，无闪烁）；同意前不初始化三方 SDK、不上报任何数据（工信部合规）
  const [consented, setConsented] = useState(hasPrivacyConsent());

  useEffect(() => {
    if (!consented) return;
    initWechat();
    initPhoneLogin();
    // 渠道激活上报（免登录、幂等、失败静默）
    reportActivation();
    // 极光推送：合规授权 + 初始化 + rid 绑定 + 通知点击路由（后端当前仅推 Android）
    setupPush();
    // 对齐小程序 main.js：启动时从 storage 恢复 token 和用户信息
    const token = storageUtils.getString('token');
    const userInfoStr = storageUtils.getString('userInfo');
    if (token) {
      setToken(token);
    }
    if (userInfoStr) {
      try {
        setUserInfo(JSON.parse(userInfoStr));
      } catch {
        // ignore
      }
    }
    // 如果有 token，刷新用户信息（对齐小程序 onShow）
    if (token) {
      API.user.info().then(res => {
        if (res.code === '200') {
          setUserInfo(res.data);
          storageUtils.set('userInfo', JSON.stringify(res.data));
        }
      }).catch(() => {
        // ignore
      });
    }
    if (Platform.OS !== 'android') BootSplash.hide({ fade: true });
  }, [consented, setToken, setUserInfo]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle={Platform.OS === 'android' || theme.dark ? 'light-content' : 'dark-content'}
        {...(Platform.OS === 'android' ? { backgroundColor: '#000000' } : {})}
      />
      <RootNavigator />
      <AppAlertHost />
      <Toast config={toastConfig} topOffset={80} />
      {!consented && (
        <PrivacyConsentGate
          onAgree={() => {
            setPrivacyConsent();
            setConsented(true);
          }}
        />
      )}
      {showLaunch && (
        <Animated.View
          style={[styles.launch, { opacity: launchOpacity }]}
          onLayout={() => {
            if (launchStarted.current) return;
            launchStarted.current = true;
            BootSplash.hide({ fade: false }).then(() => {
              Animated.timing(launchOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setShowLaunch(false));
            });
          }}
        >
          <Image source={require('./launch/launch-wordmark.png')} style={styles.wordmark} />
        </Animated.View>
      )}
    </QueryClientProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <Root />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  launch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  wordmark: {
    position: 'absolute',
    top: '29.1762%',
    width: '58.4577%',
    aspectRatio: 235 / 96,
    resizeMode: 'contain',
  },
});

const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '55%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default App;
