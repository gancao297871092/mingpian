import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { useSelectBbsStore } from '@/store/selectBbs';
import { setSelectBbsResult } from '@/utils/selectBbsBridge';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { mapPost, type PostCardData } from '@/pages/my/tabs/common';
import { SelectablePostCard, SelectBottomBar } from './selectBbsCommon';
import { SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const PAGE_SIZE = 20;

type Props = NativeStackScreenProps<RootStackParamList, 'selectBbs'>;

/** 选择动态（figma 1291:4985）：企业主页动态瀑布流多选（最多3条），搜索跳转搜索动态页 */
export default function SelectBbs({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const myCpId = useUserStore(s => s.userInfo?.cpId ?? s.userInfo?.wqUser?.cpId);
  const cpId = route.params?.cpId ?? myCpId;
  const [list, setList] = useState<PostCardData[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(
    async (pageNum: number, append: boolean) => {
      if (loadingRef.current || !cpId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await API.company.bbsMain({ cpId, pageNum, pageSize: PAGE_SIZE });
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
        setLoaded(true);
      }
    },
    [cpId],
  );

  useEffect(() => {
    fetchList(1, false);
  }, [fetchList]);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) {
      fetchList(page + 1, true);
    }
  }, [fetchList, page, pages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('selectBbsSearch', { cpId })}
        >
          <SearchIcon size={20} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, cpId]);

  const onConfirm = useCallback(() => {
    setSelectBbsResult(useSelectBbsStore.getState().selected);
    useSelectBbsStore.getState().clear();
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        masonry
        numColumns={2}
        renderItem={({ item }) => <SelectablePostCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: scaleSizeH(160) + insets.bottom }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : loaded ? (
            <EmptyState variant="content" title="暂无动态" style={styles.emptyBox} />
          ) : null
        }
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
      <SelectBottomBar onConfirm={onConfirm} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(100),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
