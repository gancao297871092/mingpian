import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import PermissionButton from '@/components/PermissionButton';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

interface CompanyRecordItem {
  id: string;
  companyName: string;
  creditNumber: string;
  address: string;
  legalPerson?: string;
  establishTime?: string;
  registeredCapital?: string;
  isExist?: number;
}

/** 企业查询（快启API）：未入驻企业信息的入口 */
export default function CompanySearch() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<CompanyRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    const kw = keyword.trim();
    if (!kw) {
      Toast.show({ type: 'error', text1: '请输入企业名称' });
      return;
    }
    if (kw.length > 20) {
      Toast.show({ type: 'error', text1: '搜索关键字不能超过20字' });
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await API.business.collectQuery({ keywords: kw });
      if (res.code !== '200') return;
      const records = res.data?.records || [];
      setList(records);
      setSearched(true);
      if (records.length === 0) Toast.show({ type: 'error', text1: '未查询到相关企业' });
    } catch {
      Toast.show({ type: 'error', text1: '查询失败' });
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const onItemPress = useCallback(
    (item: CompanyRecordItem) => {
      if (!item.id) return;
      navigation.navigate('unjoinedCompanyInfo', { id: item.id, source: 'api' });
    },
    [navigation],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.searchBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="输入企业名称查询"
            placeholderTextColor="#999999"
            returnKeyType="search"
            maxLength={20}
            onSubmitEditing={doSearch}
          />
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={doSearch}>
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.searchBtnText}>搜索</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {list.length === 0 ? (
          searched && !loading ? (
            <Text style={styles.emptyText}>未查询到相关企业</Text>
          ) : (
            <Text style={styles.emptyText}>输入企业名称，查询未入驻的企业信息</Text>
          )
        ) : (
          list.map((item, i) => (
            <PermissionButton
              key={`${item.id}-${i}`}
              activeOpacity={0.8}
              style={styles.card}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.companyName || '-'}
                </Text>
                {item.isExist === 1 ? (
                  <View style={styles.existBadge}>
                    <Text style={styles.existText}>已入驻</Text>
                  </View>
                ) : (
                  <View style={styles.unExistBadge}>
                    <Text style={styles.unExistText}>未入驻</Text>
                  </View>
                )}
              </View>
              {!!item.creditNumber && (
                <Text style={styles.cardLine} numberOfLines={1}>
                  统一社会信用代码：{item.creditNumber}
                </Text>
              )}
              {!!item.address && (
                <Text style={styles.cardLine} numberOfLines={1}>
                  地址：{item.address}
                </Text>
              )}
            </PermissionButton>
          ))
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(10),
    backgroundColor: '#FFFFFF',
  },
  inputWrap: {
    flex: 1,
    height: scaleSizeH(36),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(18),
    paddingHorizontal: scaleSizeW(14),
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  searchBtn: {
    width: scaleSizeW(60),
    height: scaleSizeH(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  emptyText: {
    fontSize: setSpText(14),
    color: GRAY,
    textAlign: 'center',
    marginTop: scaleSizeH(60),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeW(10),
    gap: scaleSizeH(6),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  existBadge: {
    backgroundColor: '#F1F3FF',
    borderRadius: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeH(2),
  },
  existText: {
    fontSize: setSpText(11),
    color: PRIMARY,
  },
  unExistBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeH(2),
  },
  unExistText: {
    fontSize: setSpText(11),
    color: GRAY,
  },
  cardLine: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: GRAY,
  },
});
