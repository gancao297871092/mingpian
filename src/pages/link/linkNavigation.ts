import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LinkBasisItem } from '@/api';
import type { RootStackParamList } from '@/route/map';

/** 判断依据仅企业动态支持跳转，企业信息与能力卡仅展示。 */
export function canOpenBasis(item: LinkBasisItem): boolean {
  return item.type === 'bbs' && item.refId !== null && item.refId !== undefined
    && String(item.refId).trim() !== '' && Number(item.refId) > 0;
}

export function openBasis(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: LinkBasisItem,
) {
  if (!canOpenBasis(item)) return;
  navigation.navigate('bbsDetail', { id: String(item.refId) });
}
