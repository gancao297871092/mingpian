import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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

interface CompanyPostListProps {
  cpId: number | string;
}

export interface CompanyPostListHandle {
  loadMore: () => void;
}

const PAGE_SIZE = 10;
const GO_SQUARE_ID = '__go_square__';

type FeedItem = WaterfallItem & { isPlazaCard?: boolean };

function transformBbsToItem(bbs: any): WaterfallItem {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || '')
    : media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '';
  const originalWidth = media?.width ? parseInt(media.width, 10) : 194;
  const originalHeight = media?.height ? parseInt(media.height, 10) : 200;
  const imageHeight = Math.min(Math.round((194 * originalHeight) / originalWidth), 320);
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

/** 最新动态 tab（figma 企业主页）：企业员工动态 FlashList masonry 双列瀑布流 + 穿插「去广场发现更多」 */
const CompanyPostList = forwardRef<CompanyPostListHandle, CompanyPostListProps>(function CompanyPostFeed({ cpId }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [list, setList] = useState<WaterfallItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getList = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const res = await API.company.bbsMain({ cpId, pageNum, pageSize: PAGE_SIZE });
        if (res.code === '200') {
          const newItems = (res.data?.list || []).map(transformBbsToItem);
          setList((prev) => (pageNum === 1 ? newItems : [...prev, ...newItems]));
          setPage(res.data?.pageNum || pageNum);
          setPages(res.data?.pages || 1);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [cpId],
  );

  useEffect(() => {
    getList(1);
  }, [getList]);

  const loadMore = useCallback(() => {
    if (loading || page >= pages) return;
    getList(page + 1);
  }, [loading, page, pages, getList]);

  useImperativeHandle(ref, () => ({ loadMore }), [loadMore]);

  const squareCard = () => <GoSquareCard onPress={() => navigation.navigate('MainTabs' as never)} />;

  const onToggleLike = (id: string) => {
    const target = list.find((item) => item.id === id);
    if (!target) return;
    const next = !target.isLiked;
    const likeCount = target.likeCount + (next ? 1 : -1);
    setList((prev) => prev.map((item) => (item.id === id ? { ...item, isLiked: next, likeCount } : item)));
    API.bbs
      .like({ bbsId: Number(id), status: next ? 1 : 0 })
      .then(() => {
        useBbsInteractionStore.getState().setLike(id, { isLiked: next, likeCount });
      })
      .catch(() => {
        setList((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isLiked: !next, likeCount: item.likeCount + (next ? -1 : 1) } : item,
          ),
        );
      });
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.isPlazaCard) {
      return squareCard();
    }
    return (
      <WaterfallCard
        item={item}
        onToggleLike={onToggleLike}
        onPress={() => {
          setDetailCache(item.id, item.raw);
          navigation.navigate('bbsDetail', { id: item.id, isFollowed: item.isFollowed });
        }}
      />
    );
  };

  if (!loaded) {
    return null;
  }

  return (
    <FlashList
      scrollEnabled={false}
      data={withPlazaCard(list)}
      keyExtractor={(item: FeedItem) => item.id}
      masonry
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<View style={styles.emptyWrap}>{squareCard()}</View>}
      ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
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
