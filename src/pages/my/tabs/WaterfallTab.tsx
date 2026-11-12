import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import type { RootStackParamList } from '@/route/map';
import { DraftIcon } from '../myIcons';
import {
  DRAFT_ITEM_ID,
  initialTabState,
  ListLoading,
  mapPost,
  PostCard,
  tabStyles,
  type PostCardData,
  type TabHandle,
  type TabState,
} from './common';

const PAGE_SIZE = 10;

interface Props {
  /** post=发布 fav=收藏 like=点赞 */
  tab: 'post' | 'fav' | 'like';
  myId: number;
  /** 他人主页场景传目标用户 id（此时不展示草稿卡） */
  targetUserId?: number;
  /** 是否为当前展示页（懒加载触发） */
  active: boolean;
  draftCount: number;
  /** 最新草稿封面（草稿卡背景图，figma 64） */
  draftCover: string;
  /** 列表内容高度变化（外层 FlatList 统一滚动，需要撑开高度） */
  onHeight: (h: number) => void;
  /** 列表总数变化（figma 88 点赞子 tab 展示数量） */
  onTotal?: (n: number) => void;
}

export default forwardRef<TabHandle, Props>(function WaterfallTab({ tab, myId, targetUserId, active, draftCount, draftCover, onHeight, onTotal }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const token = useUserStore(s => s.token);
  const likeMap = useBbsInteractionStore(s => s.likeMap);
  const [state, setState] = useState<TabState<PostCardData>>(initialTabState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const listUserId = targetUserId ?? myId;
  /** 「我的发布」依赖登录态（/my/bbs/list 未登录不调用），记录是否因未登录跳过 */
  const skippedByGuestRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (stateRef.current.loading) return;
      if (tab === 'post' && !targetUserId && !token) {
        skippedByGuestRef.current = true;
        setState(prev => ({ ...prev, loading: false, loaded: true }));
        return;
      }
      setState(prev => ({ ...prev, loading: true }));
      try {
        const res =
          tab === 'post'
            ? targetUserId
              ? await API.bbs.userMain({ targetUserId, pageNum, pageSize: PAGE_SIZE })
              : await API.my.bbsList({ pageNum, pageSize: PAGE_SIZE })
            : await API.my.likeFavoritesList({ targetUserId: listUserId, type: tab === 'fav' ? 2 : 1, pageNum, pageSize: PAGE_SIZE });
        const list = (res.data?.list ?? []).map(mapPost);
        const pages = res.data?.pages ?? 1;
        onTotal?.(res.data?.total ?? 0);
        setState(prev => ({
          list: pageNum === 1 ? list : [...prev.list, ...list],
          page: pageNum,
          pages,
          loading: false,
          loaded: true,
        }));
      } catch {
        setState(prev => ({ ...prev, loading: false, loaded: true }));
      }
    },
    [tab, targetUserId, listUserId, onTotal, token],
  );

  useEffect(() => {
    if (active && !state.loaded) fetchPage(1);
  }, [active, state.loaded, fetchPage]);

  // 未登录跳过过，登录后补拉第一页
  useEffect(() => {
    if (active && token && skippedByGuestRef.current) {
      skippedByGuestRef.current = false;
      fetchPage(1);
    }
  }, [active, token, fetchPage]);

  useImperativeHandle(
    ref,
    () => ({
      onRefresh: () => fetchPage(1),
      onEndReached: () => {
        const s = stateRef.current;
        if (!s.loading && s.loaded && s.page < s.pages) {
          return fetchPage(s.page + 1);
        }
      },
      ensureLoaded: () => {
        if (!stateRef.current.loaded) fetchPage(1);
      },
    }),
    [fetchPage],
  );

  // 广场/详情页点赞后，用户主页列表同步最新状态
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

  // 草稿卡片作为瀑布流的第一个伪 item，保证吸顶/布局稳定
  const data: PostCardData[] =
    tab === 'post' && !targetUserId && draftCount > 0
      ? [{ id: DRAFT_ITEM_ID, imageUrl: '', imageHeight: 0, title: '', date: '', likeCount: 0 }, ...state.list]
      : state.list;

  return (
    <FlashList
      scrollEnabled={false}
      onContentSizeChange={(_w, h) => onHeight(h)}
      data={data}
      keyExtractor={(item: PostCardData) => item.id}
      masonry
      numColumns={2}
      renderItem={({ item }: { item: PostCardData }) =>
        item.id === DRAFT_ITEM_ID ? (
          <TouchableOpacity activeOpacity={0.9} style={tabStyles.draftCard} onPress={() => navigation.navigate('draftBox')}>
            {!!draftCover && (
              <ExpoImage source={{ uri: draftCover }} style={tabStyles.draftCover} contentFit="cover" transition={150} />
            )}
            <View style={tabStyles.draftBadge}>
              <DraftIcon />
              <Text style={tabStyles.draftBadgeText}>草稿箱 · {draftCount}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <PostCard item={item} onPress={() => openDetail(item)} onToggleLike={() => onToggleLike(item.id)} />
        )
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tabStyles.masonryContent}
      ListEmptyComponent={
        !state.loaded && state.loading ? (
          <ListLoading />
        ) : state.loaded ? (
          <EmptyState variant="content" title="暂无内容" style={tabStyles.emptyBox} />
        ) : null
      }
      ListFooterComponent={<ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />}
    />
  );
});
