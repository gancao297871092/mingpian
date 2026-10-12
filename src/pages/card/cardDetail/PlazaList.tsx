import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API } from '@/api';
import WaterfallCard, { WaterfallItem } from '@/components/WaterfallCard';
import ListFooter from '@/components/ListFooter';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { SparklesIcon } from './icons';

interface PlazaListProps {
  userId?: number;
}

export interface PlazaListHandle {
  loadMore: () => void;
}

const PAGE_SIZE = 10;
const PLAZA_CARD_ID = '__plaza_card__';

type FeedItem = WaterfallItem & { isPlazaCard?: boolean };

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

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

/** 穿插「去广场」卡片（对齐小程序 plazaList）：动态≥4 作为第5个元素，1-3 放最后，0 由 ListEmptyComponent 铺满展示 */
function withPlazaCard(list: WaterfallItem[]): FeedItem[] {
  const card: FeedItem = { isPlazaCard: true, id: PLAZA_CARD_ID } as FeedItem;
  const items: FeedItem[] = [...list];
  if (items.length >= 4) {
    items.splice(4, 0, card);
  } else if (items.length > 0) {
    items.push(card);
  }
  return items;
}

/** 广场动态 tab（figma 预览3）：TA 的动态 FlashList masonry 双列瀑布流 + 穿插「去广场发现更多」 */
const PlazaList = forwardRef<PlazaListHandle, PlazaListProps>(function PlazaListFeed({ userId }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [list, setList] = useState<WaterfallItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getList = useCallback(
    async (pageNum: number) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await API.bbs.userMain({ targetUserId: userId, pageNum, pageSize: PAGE_SIZE });
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
    [userId],
  );

  useEffect(() => {
    getList(1);
  }, [getList]);

  const loadMore = useCallback(() => {
    if (loading || page >= pages) return;
    getList(page + 1);
  }, [loading, page, pages, getList]);

  useImperativeHandle(ref, () => ({ loadMore }), [loadMore]);

  const squareCard = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.squareCard}
      onPress={() => navigation.navigate('MainTabs' as never)}
    >
      <LinearGradient
        colors={['#2962D4', '#224FA8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.squareCardBody}>
        <SparklesIcon />
        <Text style={styles.squareTitle}>去广场发现更多</Text>
        <Text style={styles.squareSub}>查看更多同行动态与合作机会</Text>
        <View style={styles.squareBtn}>
          <Text style={styles.squareBtnText}>去广场逛逛</Text>
          <ChevronRightIcon color="#000000" />
        </View>
      </View>
    </TouchableOpacity>
  );

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
        onPress={(id) => {
          setDetailCache(id, item.raw);
          navigation.navigate('bbsDetail', { id, isFollowed: item.isFollowed });
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

export default PlazaList;

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: '#F6F7FB',
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeW(5),
  },
  emptyWrap: {
    paddingVertical: scaleSizeW(5),
  },
  squareCard: {
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    marginTop: scaleSizeW(6),
    marginHorizontal: scaleSizeW(2),
  },
  squareCardBody: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeW(14),
    paddingBottom: scaleSizeW(14),
    gap: scaleSizeW(10),
  },
  squareTitle: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: scaleSizeW(24),
    letterSpacing: -0.4,
  },
  squareSub: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: scaleSizeW(24),
    letterSpacing: -0.4,
  },
  squareBtn: {
    marginTop: scaleSizeW(32),
    height: scaleSizeW(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  squareBtnText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
});
