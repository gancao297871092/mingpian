import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { PrivateLockIcon } from './myIcons';
import {
  initialTabState,
  ListLoading,
  mapPost,
  PostCard,
  tabStyles,
  type PostCardData,
  type TabState,
} from './tabs/common';

const PAGE_SIZE = 10;

/**
 * 私密动态（我的-发布 tab 顶部「私密动态」入口进入）
 * 数据：POST /my/bbs/list { visibility: 2 }（仅自己可见的动态；仅本人可见，其他用户无法查看）。
 */
export default function PrivateBbsList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const token = useUserStore(s => s.token);
  const likeMap = useBbsInteractionStore(s => s.likeMap);
  const [state, setState] = useState<TabState<PostCardData>>(initialTabState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [refreshing, setRefreshing] = useState(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    if (stateRef.current.loading) return;
    setState(prev => ({ ...prev, loading: true }));
    try {
      const res = await API.my.bbsList({ visibility: 2, pageNum, pageSize: PAGE_SIZE });
      const list = (res.data?.list ?? []).map(mapPost);
      setState(prev => ({
        list: pageNum === 1 ? list : [...prev.list, ...list],
        page: pageNum,
        pages: res.data?.pages ?? 1,
        loading: false,
        loaded: true,
      }));
    } catch {
      setState(prev => ({ ...prev, loading: false, loaded: true }));
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1);
    setRefreshing(false);
  }, [fetchPage]);

  // 详情页删除动态后，列表同步移除（详情页删除时走 markDeleted 通知）
  const deletedMap = useBbsInteractionStore(s => s.deletedMap);
  useEffect(() => {
    setState(prev => {
      if (!prev.list.length) return prev;
      const list = prev.list.filter(item => !deletedMap[item.id]);
      return list.length === prev.list.length ? prev : { ...prev, list };
    });
  }, [deletedMap]);

  // 详情页点赞后，列表同步最新状态
  useEffect(() => {
    setState(prev => {
      if (!prev.list.length) return prev;
      let changed = false;
      const list = prev.list.map(item => {
        const like = likeMap[item.id];
        if (!like) return item;
        if (item.isLiked === like.isLiked && item.likeCount === like.likeCount) return item;
        changed = true;
        return { ...item, isLiked: like.isLiked, likeCount: like.likeCount };
      });
      return changed ? { ...prev, list } : prev;
    });
  }, [likeMap]);

  const onToggleLike = useCallback(
    (id: string) => {
      if (!token) {
        navigation.navigate('login');
        return;
      }
      const target = stateRef.current.list.find(item => item.id === id);
      if (!target) return;
      const next = !target.isLiked;
      const likeCount = target.likeCount + (next ? 1 : -1);
      setState(prev => ({
        ...prev,
        list: prev.list.map(item => (item.id === id ? { ...item, isLiked: next, likeCount } : item)),
      }));
      API.bbs
        .like({ bbsId: Number(id), status: next ? 1 : 0 })
        .then(() => {
          useBbsInteractionStore.getState().setLike(id, { isLiked: next, likeCount });
        })
        .catch(() => {
          setState(prev => ({
            ...prev,
            list: prev.list.map(item =>
              item.id === id ? { ...item, isLiked: !next, likeCount: item.likeCount + (next ? -1 : 1) } : item,
            ),
          }));
        });
    },
    [token, navigation],
  );

  const openDetail = useCallback(
    (item: PostCardData) => {
      if (item.raw) setDetailCache(item.id, item.raw);
      // 待审核/未通过的动态不在广场详情接口里，走 /my/bbs/detail
      const fromMy = item.status === 3 || item.status === 4;
      navigation.navigate('bbsDetail', { id: item.id, ...(fromMy ? { fromMy: true } : {}) });
    },
    [navigation],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <FlashList
        data={state.list}
        keyExtractor={(item: PostCardData) => item.id}
        masonry
        numColumns={2}
        renderItem={({ item }: { item: PostCardData }) => (
          <PostCard item={item} showAuthor={false} onPress={() => openDetail(item)} onToggleLike={() => onToggleLike(item.id)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tabStyles.masonryContent}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          const s = stateRef.current;
          if (!s.loading && s.loaded && s.page < s.pages) fetchPage(s.page + 1);
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2962D4" colors={['#2962D4']} />}
        ListHeaderComponent={
          /* 提示条：私密动态仅自己可见，其他用户无法查看 */
          <View style={styles.tipBar}>
            <PrivateLockIcon size={13} color="#2962D4" />
            <Text style={styles.tipText}>私密动态仅自己可见，其他用户无法查看</Text>
          </View>
        }
        ListEmptyComponent={
          !state.loaded && state.loading ? (
            <ListLoading />
          ) : state.loaded ? (
            <EmptyState variant="content" title="暂无私密动态" style={tabStyles.emptyBox} />
          ) : null
        }
        ListFooterComponent={<ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    backgroundColor: '#EFF4FF',
    borderRadius: scaleSizeW(6),
    marginHorizontal: scaleSizeW(11),
    marginTop: scaleSizeH(8),
    marginBottom: scaleSizeH(8),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(9),
  },
  tipText: {
    fontSize: setSpText(12),
    color: '#2962D4',
  },
});
