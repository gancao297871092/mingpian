import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API } from '@/api';
import WaterfallCard, { WaterfallItem } from '@/components/WaterfallCard';
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
/** 「去广场」卡片高度（figma 预览3 175px），瀑布分栏估算用 */
const PLAZA_CARD_HEIGHT = scaleSizeW(175);
/** 动态卡片底部信息区高度估算（标题+作者行） */
const CARD_INFO_HEIGHT = scaleSizeW(100);

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

/** 穿插「去广场」卡片（对齐小程序 plazaList）：动态≥4 作为第5个元素，1-3 放最后，0 由外层铺满展示 */
function withPlazaCard(list: WaterfallItem[]): FeedItem[] {
  const card: FeedItem = { isPlazaCard: true, id: '__plaza_card__' } as FeedItem;
  const items: FeedItem[] = [...list];
  if (items.length >= 4) {
    items.splice(4, 0, card);
  } else if (items.length > 0) {
    items.push(card);
  }
  return items;
}

/** 瀑布分栏：按累计高度分配到较矮的一列（对齐小程序 waterfall 工具） */
function distribute(items: FeedItem[]): [FeedItem[], FeedItem[]] {
  const columns: [FeedItem[], FeedItem[]] = [[], []];
  const heights = [0, 0];
  for (const item of items) {
    const h = item.isPlazaCard ? PLAZA_CARD_HEIGHT : (item.imageHeight || 0) + CARD_INFO_HEIGHT;
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(item);
    heights[target] += h;
  }
  return columns;
}

/** 广场动态 tab（figma 预览3）：TA 的动态双列瀑布流 + 穿插「去广场发现更多」 */
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

  const squareCard = (fullWidth?: boolean) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('MainTabs' as never)}>
      <LinearGradient
        colors={['#2962D4', '#224FA8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.squareCard, fullWidth && styles.squareCardFull]}
      >
        <SparklesIcon />
        <Text style={styles.squareTitle}>去广场发现更多</Text>
        <Text style={styles.squareSub}>查看更多同行动态与合作机会</Text>
        <View style={styles.squareBtn}>
          <Text style={styles.squareBtnText}>去广场逛逛</Text>
          <ChevronRightIcon color="#000000" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // 无动态时「去广场发现更多」占满两列展示（对齐小程序 PlazaCard free）
  if (loaded && !list.length) {
    return <View style={styles.container}>{squareCard(true)}</View>;
  }

  const [leftColumn, rightColumn] = distribute(withPlazaCard(list));

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

  const renderItem = (item: FeedItem) => {
    if (item.isPlazaCard) {
      return <React.Fragment key={item.id}>{squareCard()}</React.Fragment>;
    }
    return (
      <WaterfallCard
        key={item.id}
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
    <View style={styles.container}>
      {list.length === 0 && loading ? null : null}
      <View style={styles.columns}>
        <View style={styles.column}>{leftColumn.map(renderItem)}</View>
        <View style={styles.column}>{rightColumn.map(renderItem)}</View>
      </View>
      {!loading && page >= pages && list.length > 0 && <Text style={styles.noMore}>没有更多了</Text>}
    </View>
  );
});

export default PlazaList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    marginHorizontal: scaleSizeW(-16),
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeW(5),
  },
  columns: {
    flexDirection: 'row',
    gap: scaleSizeW(4),
  },
  column: {
    flex: 1,
    gap: scaleSizeW(4),
  },
  noMore: {
    textAlign: 'center',
    fontSize: setSpText(12),
    color: '#999999',
    marginTop: scaleSizeW(16),
  },
  squareCard: {
    borderRadius: scaleSizeW(4),
    padding: scaleSizeW(11),
    marginTop: scaleSizeW(6),
    gap: scaleSizeW(10),
  },
  squareCardFull: {
    marginTop: 0,
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
