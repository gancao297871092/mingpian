import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { usePageList } from '@/hooks/usePageList';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { CardLikeIcon, CheckMarkIcon, HistorySearchIcon, HistoryTrashIcon } from './myIcons';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';

const CARD_W = scaleSizeW(194);

interface HistoryItem {
  id: string;
  bbsId: string;
  imageUrl: string;
  imageHeight: number;
  title: string;
  avatar: string;
  name: string;
  company: string;
  likeCount: number;
  isVideo: boolean;
}

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

function mapHistory(h: any): HistoryItem {
  const bbs = h?.bbs ?? h ?? {};
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || '')
    : media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '';
  const w = media?.width ? parseInt(media.width, 10) : 194;
  const hh = media?.height ? parseInt(media.height, 10) : 237;
  const info = bbs.userInfoVo ?? {};
  return {
    id: String(h?.id ?? bbs.id ?? Math.random()),
    bbsId: String(bbs.id ?? ''),
    imageUrl,
    imageHeight: Math.min(Math.round((194 * hh) / w), 320),
    title: bbs.title || (bbs.content || '').replace(/<[^>]*>/g, '').slice(0, 50),
    avatar: info.avatar || '',
    name: info.nickname || info.username || '',
    company: info.cpName || '',
    likeCount: bbs.countLike || 0,
    isVideo,
  };
}

function VideoBadge() {
  return (
    <View style={styles.videoBadge}>
      <Svg width={scaleSizeW(10)} height={scaleSizeW(10)} viewBox="0 0 24 24">
        <Path d="M7 4l13 8-13 8z" fill="#FFFFFF" />
      </Svg>
      <Text style={styles.videoBadgeText}>含视频</Text>
    </View>
  );
}

/** 98/99.浏览记录（点右上角垃圾桶进入删除管理模式） */
export default function BrowseHistory() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetcher = useCallback(
    (params: { pageNum?: number; pageSize?: number }) =>
      API.history.list(params).then(res => ({
        ...res,
        data: { ...res.data, list: (res.data?.list ?? []).map(mapHistory) },
      })),
    [],
  );
  const { list, setList, fetching, refresh, loadMore, isLastPage } = usePageList(fetcher, {});

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerPill}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('search')}>
            <HistorySearchIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              setManaging(m => !m);
              setSelected(new Set());
            }}
          >
            <HistoryTrashIcon />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onDelete = useCallback(() => {
    if (selected.size === 0) return;
    Alert.alert('删除浏览记录', `确认删除已选 ${selected.size} 条记录？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          const ids = [...selected];
          const snapshot = list;
          setList(prev => prev.filter(i => !selected.has(i.id)));
          setSelected(new Set());
          API.history.del({ ids }).catch(() => setList(snapshot));
        },
      },
    ]);
  }, [selected, list, setList]);

  const onPressCard = useCallback(
    (item: HistoryItem) => {
      if (managing) {
        toggleSelect(item.id);
      } else if (item.bbsId) {
        navigation.navigate('bbsDetail', { id: item.bbsId });
      }
    },
    [managing, toggleSelect, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      const checked = selected.has(item.id);
      return (
        <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => onPressCard(item)}>
          <View>
            {item.imageUrl ? (
              <ExpoImage
                source={{ uri: item.imageUrl }}
                style={[styles.cardImage, { height: scaleSizeH(item.imageHeight) }]}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={item.imageUrl}
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder, { height: scaleSizeH(130) }]} />
            )}
            {item.isVideo && !managing && <VideoBadge />}
            {managing && (
              <View style={[styles.checkCircle, checked && styles.checkCircleOn]}>
                {checked && <CheckMarkIcon />}
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.cardFoot}>
              {item.avatar ? (
                <ExpoImage source={{ uri: item.avatar }} style={styles.footAvatar} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.footAvatar, styles.footAvatarPlaceholder]} />
              )}
              <View style={styles.footText}>
                <Text style={styles.footName} numberOfLines={1}>{item.name}</Text>
                {!!item.company && <Text style={styles.footCompany} numberOfLines={1}>{item.company}</Text>}
              </View>
              <View style={styles.footLike}>
                <CardLikeIcon />
                <Text style={styles.footLikeText}>{item.likeCount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [managing, selected, onPressCard],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        masonry
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, managing && styles.listContentManaging]}
        refreshControl={<RefreshControl refreshing={fetching && list.length > 0} onRefresh={refresh} tintColor={PRIMARY} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !fetching ? <EmptyState variant="content" title="暂无浏览记录" style={styles.emptyBox} /> : <View style={styles.loadingPad} />
        }
        ListFooterComponent={<ListFooter fetching={fetching} isLastPage={isLastPage} listLength={list.length} />}
      />
      {managing && (
        <View style={styles.manageBar}>
          <Text style={styles.manageCount}>
            已选 <Text style={styles.manageCountNum}>{selected.size}</Text> 条
          </Text>
          <TouchableOpacity
            onPress={() => {
              setManaging(false);
              setSelected(new Set());
            }}
          >
            <Text style={styles.manageCancel}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.manageDelete} onPress={onDelete}>
            <Text style={styles.manageDeleteText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(296),
    paddingHorizontal: scaleSizeW(4),
    height: scaleSizeH(44),
  },
  headerIcon: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
  },
  listContentManaging: {
    paddingBottom: scaleSizeH(90),
  },
  card: {
    width: CARD_W,
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginHorizontal: scaleSizeW(2),
    marginBottom: scaleSizeH(5),
  },
  cardImage: {
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  cardImagePlaceholder: {
    backgroundColor: '#E6E6E6',
  },
  videoBadge: {
    position: 'absolute',
    top: scaleSizeH(10),
    right: scaleSizeW(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    lineHeight: scaleSizeH(10),
    color: '#FFFFFF',
  },
  checkCircle: {
    position: 'absolute',
    top: scaleSizeH(10),
    right: scaleSizeW(10),
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  cardBody: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(12),
  },
  cardTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(21),
    color: '#333333',
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(12),
  },
  footAvatar: {
    width: scaleSizeW(27),
    height: scaleSizeW(27),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#F5F5F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5F5F5',
  },
  footAvatarPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  footText: {
    flex: 1,
    marginLeft: scaleSizeW(5),
    gap: scaleSizeH(3),
  },
  footName: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: '#333333',
  },
  footCompany: {
    fontSize: setSpText(10),
    lineHeight: setSpText(12),
    color: '#6C6C6C',
  },
  footLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  footLikeText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(21),
    color: '#616161',
  },
  manageBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: scaleSizeH(90),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(28),
  },
  manageCount: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#6C6C6C',
  },
  manageCountNum: {
    color: '#000000',
  },
  manageCancel: {
    marginLeft: 'auto',
    marginRight: scaleSizeW(24),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  manageDelete: {
    width: scaleSizeW(100),
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageDeleteText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  loadingPad: {
    height: scaleSizeH(200),
  },
  emptyBox: {
    marginTop: scaleSizeH(60),
  },
});
