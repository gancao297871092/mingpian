import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BootSplash from 'react-native-bootsplash';
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
        if (res.data.code === '200') {
          setUserInfo(res.data.data);
          storageUtils.set('userInfo', JSON.stringify(res.data.data));
        }
      }).catch(() => {
        // ignore
      });
    }
    BootSplash.hide({ fade: true });
  }, [setToken, setUserInfo]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </QueryClientProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Root />
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

export default App;
