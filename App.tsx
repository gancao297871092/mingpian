import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BootSplash from 'react-native-bootsplash';
import Toast, { type ToastConfig } from 'react-native-toast-message';
import { Text, View } from 'react-native';
import { ThemeProvider, useTheme } from '@/theme';
import RootNavigator from '@/route';
import { initWechat } from '@/utils/wechat';
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

const toastConfig: ToastConfig = {
  success: props => (
    <View style={toastStyles.wrap}>
      <Text style={toastStyles.text}>{props.text1}</Text>
    </View>
  ),
};

function Root() {
  const theme = useTheme();
  const { setToken, setUserInfo } = useUserStore();

  useEffect(() => {
    initWechat();
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
    BootSplash.hide({ fade: true });
  }, [setToken, setUserInfo]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle={Platform.OS === 'android' || theme.dark ? 'light-content' : 'dark-content'}
        {...(Platform.OS === 'android' ? { backgroundColor: '#000000' } : {})}
      />
      <RootNavigator />
      <Toast config={toastConfig} topOffset={80} />
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
