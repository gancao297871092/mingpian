import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { NavBackButton } from '@/components/NavHeader';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { useSelectBbsStore } from '@/store/selectBbs';
import { setSelectBbsResult } from '@/utils/selectBbsBridge';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { mapPost, type PostCardData } from '@/pages/my/tabs/common';
import { SelectablePostCard, SelectBottomBar } from './selectBbsCommon';
import { SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const PAGE_SIZE = 20;

type Props = NativeStackScreenProps<RootStackParamList, 'selectBbsSearch'>;

/** 搜索动态（figma 1599:5270）：企业主页动态按关键词搜索（search 参数），多选共享选中态 */
export default function SelectBbsSearch({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const myCpId = useUserStore(s => s.userInfo?.cpId ?? s.userInfo?.wqUser?.cpId);
  const cpId = route.params?.cpId ?? myCpId;
  const [keyword, setKeyword] = useState('');
  const [searched, setSearched] = useState(false);
  const [list, setList] = useState<PostCardData[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const keywordRef = useRef('');

  const fetchList = useCallback(
    async (pageNum: number, append: boolean) => {
      const kw = keywordRef.current.trim();
      if (loadingRef.current || !cpId || !kw) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await API.company.bbsMain({ cpId, search: kw, pageNum, pageSize: PAGE_SIZE });
        if (res.code !== '200') return;
        const arr = (res.data?.list ?? []).map(mapPost);
        setList(prev => (append ? [...prev, ...arr] : arr));
        setPage(pageNum);
        setPages(res.data?.pages ?? 1);
      } catch {
        // 拦截器已提示
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [cpId],
  );

  const doSearch = useCallback(() => {
    const kw = keyword.trim();
    if (!kw) return;
    Keyboard.dismiss();
    keywordRef.current = kw;
    setSearched(true);
    fetchList(1, false);
  }, [keyword, fetchList]);

  const onEndReached = useCallback(() => {
    if (searched && !loadingRef.current && page < pages) {
      fetchList(page + 1, true);
    }
  }, [searched, fetchList, page, pages]);

  const onConfirm = useCallback(() => {
    setSelectBbsResult(useSelectBbsStore.getState().selected);
    useSelectBbsStore.getState().clear();
    // 返回创建合作意向书（越过选择动态页）
    navigation.pop(2);
  }, [navigation]);

  return (
    <SafeView backgroundColor="#F6F7FB" disableTop={false}>
      {/* 头部：返回 + 搜索框（figma 1599:5275） */}
      <View style={styles.header}>
        <NavBackButton onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <SearchIcon size={16} color="#AFB1BB" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索标题、正文、标签"
            placeholderTextColor="#AFB1BB"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            autoFocus
            onSubmitEditing={doSearch}
          />
          <TouchableOpacity activeOpacity={0.85} style={styles.searchBtn} onPress={doSearch}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        masonry
        numColumns={2}
        renderItem={({ item }) => <SelectablePostCard item={item} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: scaleSizeH(160) + insets.bottom }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : searched ? (
            <EmptyState variant="search" style={styles.emptyBox} />
          ) : null
        }
        ListFooterComponent={
          searched ? (
            <ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />
          ) : null
        }
      />
      <SelectBottomBar onConfirm={onConfirm} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(8),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(7),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F4F4F4',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(4),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  searchBtn: {
    height: scaleSizeH(32),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    paddingHorizontal: scaleSizeW(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
  },
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
  },
});
