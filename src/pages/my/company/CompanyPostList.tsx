import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Reanimated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API } from '@/api';
import WaterfallCard, { WaterfallItem } from '@/components/WaterfallCard';
import GoSquareCard from '@/components/GoSquareCard';
import ListFooter from '@/components/ListFooter';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import { ossVideoSnapshot } from '@/pages/square/bbsDetail/detailTransform';
import { scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import type { TabHandle } from '../tabs/common';

interface CompanyPostListProps {
  cpId: number | string;
  /** 是否为当前展示页（懒加载触发） */
  active: boolean;
  /** 列表内容高度变化（外层 FlatList 统一滚动，需要撑开高度）；自滚动模式下可不传 */
  onHeight?: (h: number) => void;
  /** 自滚动模式（企业官网 inner-scroll）：列表自身可滚动、内部分页 onEndReached 生效 */
  selfScroll?: boolean;
  /** 自滚动模式：内容顶部留白（头部+tab 栏高度） */
  contentPadTop?: number;
  /** 自滚动模式：内容最小高度（吸顶位置 + 容器高，保证可滚到吸顶点） */
  contentMinHeight?: number;
  /** 自滚动模式：滚动回调（可传 reanimated worklet handler） */
  onScroll?: any;
}

const PAGE_SIZE = 10;
const GO_SQUARE_ID = '__go_square__';

/** 支持 reanimated worklet onScroll（UI 线程）的 FlashList */
const ReanimatedFlashList = Reanimated.createAnimatedComponent(FlashList as any);

type FeedItem = WaterfallItem & { isPlazaCard?: boolean };

interface PostState {
  list: WaterfallItem[];
  page: number;
  pages: number;
  loading: boolean;
  loaded: boolean;
}

function transformBbsToItem(bbs: any, cardWidth: number): WaterfallItem {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || '')
    : media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '';
  const originalWidth = media?.width ? parseInt(media.width, 10) : 194;
  const originalHeight = media?.height ? parseInt(media.height, 10) : 200;
  // 瀑布流按自身尺寸显示：高度按原始宽高比折算到实际列宽（设备 px，不再走 scaleSizeH），最大高度对齐原 320 逻辑值
  const imageHeight = Math.min(Math.round((cardWidth * originalHeight) / originalWidth), scaleSizeW(320));
  return {
    id: String(bbs.id),
    imageUrl,
    imageHeight,
    title: bbs.title || '',
    avatarUrl: bbs.userInfoVo?.avatar || '',
    userName: bbs.userInfoVo?.nickname || bbs.userInfoVo?.username || '',
    companyName: bbs.userInfoVo?.cpName || '',
    likeCount: bbs.countLike || 0,
    isLiked: bbs.userIsZan === 1,
    hasVideo: isVideo,
    isFollowed: Number(bbs.isFollow ?? bbs.currentUserIsFollow) === 1,
    isFaved: bbs.userIsFavorites === 1,
    favCount: bbs.countFavorite || 0,
    raw: bbs,
  };
}

/** 穿插「去广场」卡片（对齐 PlazaList：动态≥4 作为第5个元素，1-3 放最后，0 由空态铺满展示） */
function withPlazaCard(list: WaterfallItem[]): FeedItem[] {
  const card: FeedItem = { isPlazaCard: true, id: GO_SQUARE_ID } as FeedItem;
  const items: FeedItem[] = [...list];
  if (items.length >= 4) {
    items.splice(4, 0, card);
  } else if (items.length > 0) {
    items.push(card);
  }
  return items;
}

/** 最新动态 tab（figma 企业主页）：企业员工动态 FlashList masonry 双列瀑布流 + 穿插「去广场发现更多」；
 *  外层统一滚动，自身 scrollEnabled=false，高度通过 onHeight 上报（对齐 UserHome 的 WaterfallTab） */
const CompanyPostList = forwardRef<TabHandle, CompanyPostListProps>(function CompanyPostFeed(
  { cpId, active, onHeight, selfScroll, contentPadTop, contentMinHeight, onScroll },
  ref,
) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width: windowWidth } = useWindowDimensions();
  /** 瀑布流卡片定宽：列表左右留白 5、卡片左右外边距 2（对齐 402 设计稿列宽 192），防止 masonry 下卡片收缩、图片变小 */
  const cardWidth = (windowWidth - scaleSizeW(10)) / 2 - scaleSizeW(4);
  const [state, setState] = useState<PostState>({ list: [], page: 1, pages: 1, loading: false, loaded: false });
  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (stateRef.current.loading) return;
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const res = await API.company.bbsMain({ cpId, pageNum, pageSize: PAGE_SIZE });
        if (res.code === '200') {
          const list = (res.data?.list ?? []).map((bbs: any) => transformBbsToItem(bbs, cardWidth));
          setState((prev) => ({
            list: pageNum === 1 ? list : [...prev.list, ...list],
            page: res.data?.pageNum || pageNum,
            pages: res.data?.pages ?? 1,
            loading: false,
            loaded: true,
          }));
        } else {
          setState((prev) => ({ ...prev, loading: false, loaded: true }));
        }
      } catch {
        setState((prev) => ({ ...prev, loading: false, loaded: true }));
      }
    },
    [cpId, cardWidth],
  );

  useEffect(() => {
    if (active && !state.loaded) fetchPage(1);
  }, [active, state.loaded, fetchPage]);

  const listRef = useRef<any>(null);

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
      /** 自滚动模式：外部调整列表滚动位置（切 tab 吸顶共享用） */
      scrollTo: (y: number) => listRef.current?.scrollToOffset?.({ offset: y, animated: false }),
    }),
    [fetchPage],
  );

  /** 自滚动模式下的内部分页 */
  const onEndReachedInternal = useCallback(() => {
    const s = stateRef.current;
    if (!s.loading && s.loaded && s.page < s.pages) fetchPage(s.page + 1);
  }, [fetchPage]);

  const squareCard = () => <GoSquareCard onPress={() => navigation.navigate('MainTabs' as never)} />;

  const onToggleLike = (id: string) => {
    const target = state.list.find((item) => item.id === id);
    if (!target) return;
    const next = !target.isLiked;
    const likeCount = target.likeCount + (next ? 1 : -1);
    setState((prev) => ({
      ...prev,
      list: prev.list.map((item) => (item.id === id ? { ...item, isLiked: next, likeCount } : item)),
    }));
    API.bbs
      .like({ bbsId: Number(id), status: next ? 1 : 0 })
      .then(() => {
        useBbsInteractionStore.getState().setLike(id, { isLiked: next, likeCount });
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          list: prev.list.map((item) =>
            item.id === id ? { ...item, isLiked: !next, likeCount: item.likeCount + (next ? -1 : 1) } : item,
          ),
        }));
      });
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.isPlazaCard) {
      return squareCard();
    }
    return (
      <WaterfallCard
        item={item}
        cardWidth={cardWidth}
        imageWidthPx={cardWidth}
        imageHeightPx={item.imageHeight}
        onToggleLike={onToggleLike}
        onPress={() => {
          setDetailCache(item.id, item.raw);
          navigation.navigate('bbsDetail', { id: item.id, isFollowed: item.isFollowed });
        }}
      />
    );
  };

  return (
    <ReanimatedFlashList
      ref={listRef}
      scrollEnabled={!!selfScroll}
      onScroll={onScroll}
      onEndReached={selfScroll ? onEndReachedInternal : undefined}
      onEndReachedThreshold={0.3}
      onContentSizeChange={(_w: number, h: number) => onHeight?.(h)}
      data={withPlazaCard(state.list)}
      keyExtractor={(item: FeedItem) => item.id}
      masonry
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.listContent,
        selfScroll && { paddingTop: contentPadTop ?? 0, minHeight: contentMinHeight },
      ]}
      ListEmptyComponent={state.loaded ? <View style={styles.emptyWrap}>{squareCard()}</View> : null}
      ListFooterComponent={<ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />}
    />
  );
});

export default CompanyPostList;

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: '#F6F7FB',
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeW(5),
  },
  emptyWrap: {
    paddingVertical: scaleSizeW(5),
  },
});
