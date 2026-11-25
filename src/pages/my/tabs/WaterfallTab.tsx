import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Svg, { Path } from 'react-native-svg';
import AppImage from '@/components/AppImage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import { storageUtils } from '@/utils/storage';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { DraftIcon, PrivateLockIcon } from '../myIcons';
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

/** 私密动态入口行右侧箭头（灰色小 chevron） */
function EntryChevron() {
  return (
    <Svg width={scaleSizeW(6)} height={scaleSizeH(10)} viewBox="0 0 6 10" fill="none">
      <Path d="M1 1l4 4-4 4" stroke="#C4C9D4" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
  /** 私密动态数（my/bbs/list 未筛选 visibility 时响应附带；发布 tab 入口行右侧数量） */
  const [privateCount, setPrivateCount] = useState<number | null>(null);
  /** privateCount 降级拉取标记：响应未附带该字段时（后端补丁未上线）仅兜底拉一次 */
  const privateFallbackRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const listUserId = targetUserId ?? myId;
  /** 未登录跳过拉取的标记（我的发布 / 收藏 / 点赞依赖登录态），登录后补拉 */
  const skippedByGuestRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (stateRef.current.loading) return;
      // 未登录（含 401 后 storage 已清而 store 未同步）不发请求，直接空态：
      // - 我的发布（post 且无 targetUserId）：/my/bbs/list 需登录
      // - 收藏/点赞（fav/like）：外层点击 tab 已拦截去登录；滑动过来的按产品口径显示空数据，登录后补拉
      const isGuest = !token || !storageUtils.getString('token');
      if (isGuest && ((tab === 'post' && !targetUserId) || tab === 'fav' || tab === 'like')) {
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
        // 私密动态入口数量：仅「我的-发布」未筛选可见性的响应附带（res 为多接口联合类型，单独收窄）
        const privateCnt = (res.data as { privateCount?: number } | undefined)?.privateCount;
        if (tab === 'post' && !targetUserId && privateCnt != null) {
          setPrivateCount(privateCnt);
          privateFallbackRef.current = true;
        } else if (tab === 'post' && !targetUserId && !privateFallbackRef.current) {
          // 响应未附带 privateCount（后端补丁未上线）：降级轻量拉一次 visibility=2 取 total，
          // 补丁上线后响应自带字段，此兜底自动不再触发
          privateFallbackRef.current = true;
          API.my
            .bbsList({ visibility: 2, pageNum: 1, pageSize: 1 })
            .then(r => setPrivateCount(r.data?.total ?? 0))
            .catch(() => {});
        }
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

  // 详情页删除动态后，列表同步移除（详情页删除时走 markDeleted 通知）
  const deletedMap = useBbsInteractionStore(s => s.deletedMap);
  useEffect(() => {
    setState(prev => {
      if (!prev.list.length) return prev;
      const list = prev.list.filter(item => !deletedMap[item.id]);
      return list.length === prev.list.length ? prev : { ...prev, list };
    });
  }, [deletedMap]);

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
      ListHeaderComponent={
        // 「我的-发布」顶部私密动态入口（figma 64：锁图标 + 数量 + 箭头，点击进私密动态页）
        tab === 'post' && !targetUserId && privateCount != null ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={tabStyles.privateEntry}
            onPress={() => navigation.navigate('privateBbs')}
          >
            <PrivateLockIcon />
            <Text style={tabStyles.privateEntryText}>私密动态</Text>
            <Text style={tabStyles.privateEntryCount}>{privateCount}</Text>
            <EntryChevron />
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }: { item: PostCardData }) =>
        item.id === DRAFT_ITEM_ID ? (
          <TouchableOpacity activeOpacity={0.9} style={tabStyles.draftCard} onPress={() => navigation.navigate('draftBox')}>
            {!!draftCover && (
              <AppImage source={{ uri: draftCover }} style={tabStyles.draftCover} contentFit="cover" transition={150} />
            )}
            <View style={tabStyles.draftBadge}>
              <DraftIcon />
              <Text style={tabStyles.draftBadgeText}>草稿箱 · {draftCount}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          // 发布 tab 是自己的动态，保持现状不展示作者行；收藏/点赞是他人动态，展示广场同款作者行
          <PostCard item={item} showAuthor={tab !== 'post'} onPress={() => openDetail(item)} onToggleLike={() => onToggleLike(item.id)} />
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
