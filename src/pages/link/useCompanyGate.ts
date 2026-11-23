import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppAlert } from '@/components/AppAlert';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';

/**
 * 链接 tab 内企业专属功能的统一拦截：
 * 无企业 id（userInfo.cpId / wqUser.cpId）时弹窗引导去认证中心创建/加入企业。
 */
export function useCompanyGate() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return useCallback(
    (action: () => void) => {
      const info = useUserStore.getState().userInfo;
      const cpId = info?.cpId ?? info?.wqUser?.cpId;
      if (!cpId) {
        AppAlert.alert('企业用户专属功能', '此功能面向企业用户开放，请先创建或加入企业', [
          { text: '取消', style: 'cancel' },
          { text: '去创建/加入', onPress: () => navigation.navigate('certificationCenter') },
        ]);
        return;
      }
      action();
    },
    [navigation],
  );
}
