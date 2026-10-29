import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LinkBasisItem } from '@/api';
import type { RootStackParamList } from '@/route/map';

/**
 * 判断依据 → 来源页。
 * 后端 basisList.type：company_info / card / bbs，refId 为对应主键；未知类型不跳转。
 */
export function openBasis(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  item: LinkBasisItem,
) {
  if (item.refId === null || item.refId === undefined) return;
  if (item.type === 'bbs') {
    navigation.navigate('bbsDetail', { id: String(item.refId) });
  } else if (item.type === 'card') {
    navigation.navigate('cardDetail', { id: item.refId });
  } else if (item.type === 'company_info') {
    navigation.navigate('companyPage', { id: item.refId });
  }
}
