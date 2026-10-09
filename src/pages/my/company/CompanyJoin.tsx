import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList } from 'react-native-gesture-handler';
import { Image as ExpoImage } from 'expo-image';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import ListFooter from '@/components/ListFooter';
import EmptyState from '@/components/EmptyState';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { HistorySearchIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
interface CompanyItem {
  id: number;
  name: string;
  avatar?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  /** 审核状态：null/-1 可申请；0未通过 1通过 2待审核 */
  checkStatus?: number | null;
}

const STATUS: Record<number, { label: string; bg: string }> = {
  0: { label: '未通过', bg: '#EE5757' },
  1: { label: '通过', bg: '#2CB563' },
  2: { label: '待审核', bg: '#2962D4' },
};

function addressOf(item: CompanyItem) {
  return [item.province, item.city, item.district, item.address].filter(Boolean).join('');
}

function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (t: string) => void;
  onSearch: () => void;
}) {
  return (
    <View style={styles.searchBar}>
      <HistorySearchIcon size={16} color="#AFB1BB" />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder="请至少输入企业名称的前四个字..."
        placeholderTextColor="#AFB1BB"
        returnKeyType="search"
        onSubmitEditing={onSearch}
      />
      <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={onSearch}>
        <Text style={styles.searchBtnText}>搜索</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 加入企业（搜索企业并提交加入申请；未搜索时展示已申请企业及审核状态，对齐 enterCer.vue） */
export default function CompanyJoin() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(false);
  /** 是否完成过至少一次查询（控制空状态展示时机） */
  const [loaded, setLoaded] = useState(false);
  /** 是否处于搜索结果态（false=预查询已申请列表） */
  const [searched, setSearched] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(async (name: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await API.company.query({ name });
      setList(res.data ?? []);
    } catch {
      // 拦截器已提示
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  /** 预查询已申请企业（对齐小程序 onShow 且未搜索时） */
  const queryPre = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await API.company.queryPre();
      if (res.code !== '200') return;
      const d = res.data;
      setList(Array.isArray(d) ? d : d?.list || d?.records || []);
    } catch {
      // 拦截器已提示
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    queryPre();
  }, [queryPre]);

  const onSearch = useCallback(() => {
    const name = keyword.trim();
    if (!name) {
      setSearched(false);
      queryPre();
      return;
    }
    setSearched(true);
    fetchList(name);
  }, [keyword, fetchList, queryPre]);

  const renderItem = ({ item }: { item: CompanyItem }) => {
    const canApply = item.checkStatus === undefined || item.checkStatus === null || item.checkStatus === -1;
    const status = !canApply && item.checkStatus != null ? STATUS[item.checkStatus] : undefined;
    return (
      <View style={styles.row}>
        <ExpoImage source={{ uri: item.avatar || '' }} style={styles.avatar} contentFit="cover" transition={150} recyclingKey={item.avatar} />
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{addressOf(item)}</Text>
        </View>
        {canApply ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.applyBtn}
            onPress={() => navigation.navigate('companyApply', { cpId: item.id })}
          >
            <Text style={styles.applyText}>申请</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.applyBtn, styles.statusBtn, status && { backgroundColor: status.bg }]}>
            <Text style={styles.statusText}>{status?.label ?? ''}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <SearchBar value={keyword} onChange={setKeyword} onSearch={onSearch} />
      </View>
      <FlatList
        data={list}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : loaded ? (
            <EmptyState variant="search" title={searched ? '暂无搜索结果' : '暂无申请记录'} style={styles.emptyBox} />
          ) : null
        }
        ListFooterComponent={<ListFooter fetching={loading} isLastPage listLength={list.length} />}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(16),
    paddingTop: scaleSizeH(2),
    paddingBottom: scaleSizeH(7),
    gap: scaleSizeW(17),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F4F4F4',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(4),
    gap: scaleSizeW(6),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  searchBtn: {
    paddingHorizontal: scaleSizeW(13),
    paddingVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    lineHeight: setSpText(16),
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleSizeH(78),
    paddingVertical: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  rowText: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  rowName: {
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  rowSub: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  applyBtn: {
    width: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSizeW(10),
  },
  applyText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: PRIMARY,
  },
  statusBtn: {
    backgroundColor: '#F4F4F4',
  },
  statusText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginLeft: scaleSizeW(77),
  },
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
  },
});
