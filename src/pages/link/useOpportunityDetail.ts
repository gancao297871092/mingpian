import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppAlert } from '@/components/AppAlert';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';

/**
 * 进入商机详情统一入口（链接 tab 各卡片共用）：
 * 优先判断是否实名（wqUser.authStatus=1），未实名拦截并引导去实名认证；
 * 已实名直接跳转详情。
 */
export function useOpenOpportunityDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return useCallback(
    (opportunityId: number) => {
      if (useUserStore.getState().userInfo?.wqUser?.authStatus !== 1) {
        AppAlert.alert('提示', '查看合作机会详情前请先完成实名认证', [
          { text: '取消', style: 'cancel' },
          { text: '去认证', onPress: () => navigation.navigate('companyRealName') },
        ]);
        return;
      }
      navigation.navigate('opportunityDetail', { opportunityId });
    },
    [navigation],
  );
}
