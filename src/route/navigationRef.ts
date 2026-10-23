import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from './map';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToLogin() {
  if (!navigationRef.isReady()) return;
  if (navigationRef.getCurrentRoute()?.name === 'login') return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'login' }],
    }),
  );
}

/** 跳转用户主页：是自己则重置到「我的」tab（对齐小程序 main.js goUserPath），否则进他人主页 */
export function goUserHome(userId?: string | number) {
  if (!navigationRef.isReady()) return;
  const myId = useUserStore.getState().userInfo?.wqUser?.id;
  if (myId && userId && String(myId) === String(userId)) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'my' } }],
      }),
    );
  } else {
    navigationRef.navigate('userHome', { userId: userId ? Number(userId) : undefined });
  }
}
