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
import { PushBannerHost } from '@/components/PushBanner';
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

/** 启动画面最短展示时长（小红书约 0.4s，先按产品要求试 0.8s；从 JS 包加载完成起计，不足补齐、超出立即隐藏） */
const LAUNCH_MIN_MS = 800;
const appStartedAt = Date.now();
/** 距离最短展示时长还剩多少毫秒 */
const launchRemaining = () => Math.max(0, LAUNCH_MIN_MS - (Date.now() - appStartedAt));

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
  /** 启动屏（Android overlay / iOS 原生 BootSplash）是否已完全消失；隐私弹窗必须等它消失后再弹，否则被遮挡点不到 */
  const [splashHidden, setSplashHidden] = useState(false);
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
  }, [consented, setToken, setUserInfo]);

  // iOS：原生启动屏独立隐藏，不能依赖 consented——首次启动未同意时若启动屏不消失，会一直盖住隐私弹窗导致协议点不到
  useEffect(() => {
    if (Platform.OS === 'android') return;
    const timer = setTimeout(() => {
      BootSplash.hide({ fade: true }).finally(() => setSplashHidden(true));
    }, launchRemaining());
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      <AppAlertHost />
      <Toast config={toastConfig} topOffset={80} />
      <PushBannerHost />
      {!consented && splashHidden && (
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
            // 纯透明度淡出（小红书同款）：overlay 与原生 splash 像素级一致，无位移动画、无缩放；
            // 启动画面至少展示 LAUNCH_MIN_MS 再淡出
            setTimeout(() => {
              BootSplash.hide({ fade: false }).then(() => {
                Animated.timing(launchOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowLaunch(false);
                  setSplashHidden(true);
                });
              });
            }, launchRemaining());
          }}
        >
          <Image source={{ uri: 'bootsplash_logo' }} style={styles.wordmark} />
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

/**
 * 与原生启动屏（BootTheme → drawable/bootsplash_logo）同一张图、同一几何：
 * bootsplash 各密度桶 logo 固有尺寸均为 288dp、屏幕居中，这里直接按名引用同一 drawable、
 * 以 288dp 居中渲染，BootSplash.hide(fade:false) 瞬间零跳变。
 *（此前用 58.46% 屏宽的独立词标图，与原生方形 logo 构图不一致，切换瞬间「突然放大」。）
 *
 * 垂直居中补偿：原生 splash 以整块屏幕（含状态栏区）居中。
 * - Android 15+（targetSdk ≥ 35 强制 edge-to-edge）：overlay 也覆盖整块屏幕，同坐标系，无需补偿；
 * - Android 14 及以下：overlay 布局在状态栏之下，中心比整屏中心低状态栏半高，需上移补偿。
 */
const launchStatusBarOffset =
  Platform.OS === 'android' && Number(Platform.Version) < 35 ? (StatusBar.currentHeight ?? 0) / 2 : 0;

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
    top: '50%',
    left: '50%',
    width: 288,
    height: 288,
    marginTop: -144 - launchStatusBarOffset,
    marginLeft: -144,
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
