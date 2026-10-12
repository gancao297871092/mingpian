import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API } from '@/api';
import WaterfallCard, { WaterfallItem } from '@/components/WaterfallCard';
import EmptyState from '@/components/EmptyState';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { setDetailCache } from '@/utils/detailCache';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';

interface PlazaListProps {
  userId?: number;
}

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

/** 广场动态 tab（figma 预览3）：TA 的动态双列瀑布流 + 去广场逛逛 */
export default function PlazaList({ userId }: PlazaListProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [list, setList] = useState<WaterfallItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await API.bbs.userMain({ targetUserId: userId, pageNum: 1, pageSize: 10 });
        if (res.code === '200') {
          setList((res.data?.list || []).map(transformBbsToItem));
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, [userId]);

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

  if (loaded && !list.length) {
    return <EmptyState variant="content" title="暂无内容" />;
  }

  const leftColumn = list.filter((_, ix) => ix % 2 === 0);
  const rightColumn = list.filter((_, ix) => ix % 2 === 1);

  const renderCard = (item: WaterfallItem) => (
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

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        <View style={styles.column}>
          {leftColumn.map(renderCard)}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MainTabs' as never)}
          >
            <LinearGradient colors={['#2962D4', '#224FA8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.squareCard}>
              <Text style={styles.squareTitle}>去广场发现更多</Text>
              <Text style={styles.squareSub}>查看更多同行动态与合作机会</Text>
              <View style={styles.squareBtn}>
                <Text style={styles.squareBtnText}>去广场逛逛</Text>
                <ChevronRightIcon />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.column}>{rightColumn.map(renderCard)}</View>
      </View>
    </View>
  );
}

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
  squareCard: {
    borderRadius: scaleSizeW(4),
    padding: scaleSizeW(11),
    marginTop: scaleSizeW(6),
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
    marginTop: scaleSizeW(10),
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
