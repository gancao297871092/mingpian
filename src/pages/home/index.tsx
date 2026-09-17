import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import SafeView from '@/components/SafeView';
import ListFooter from '@/components/ListFooter';
import WaterfallCard, { WaterfallItem } from '@/components/WaterfallCard';
import WaterfallSkeleton from './WaterfallSkeleton';
import EmptyState from '@/components/EmptyState';
import { API } from '@/api';
import { usePageList } from '@/hooks/usePageList';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { PageList } from '@/utils/request';

interface FetchParams {
  pageNum: number;
  pageSize: number;
  tab?: string;
}

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

function transformBbsToItem(bbs: any): WaterfallItem {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? (bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || ''))
    : (media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '');
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
  };
}

function fetchWaterfallList(params: FetchParams): Promise<PageList<WaterfallItem>> {
  return API.square.feed(params).then((res) => {
    const data = res.data;
    return {
      code: res.code,
      msg: res.msg,
      data: {
        list: data.list.map(transformBbsToItem),
        total: data.total,
        pageNum: data.pageNum,
        pages: data.pages,
      },
    };
  });
}

type HomeTab = 'recommend' | 'follow';

export default function Home() {
  const [activeTab, setActiveTab] = useState<HomeTab>('recommend');
  const params = useMemo(() => ({ tab: activeTab }), [activeTab]);

  const {
    list,
    setList,
    fetching,
    refresh,
    loadMore,
    isLastPage,
  } = usePageList<WaterfallItem, FetchParams>(fetchWaterfallList, params, 8, true);

  const onToggleLike = (id: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
            }
          : item,
      ),
    );
  };

  const onEndReached = useCallback(() => {
    if (!fetching && !isLastPage) {
      loadMore();
    }
  }, [fetching, isLastPage, loadMore]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.tabRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('recommend')}>
            <View style={styles.tabItem}>
              <Text style={[styles.tabText, activeTab === 'recommend' && styles.tabTextActive]}>推荐</Text>
              {activeTab === 'recommend' && <View style={styles.tabIndicator} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('follow')}>
            <View style={styles.tabItem}>
              <Text style={[styles.tabText, activeTab === 'follow' && styles.tabTextActive]}>关注</Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>8</Text>
              </View>
              {activeTab === 'follow' && <View style={styles.tabIndicator} />}
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.msgBtn}>
          <Image source={require('@/assets/tab-icons/search-icon.png')} style={styles.msgIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </View>
  );

  const showSkeleton = fetching && list.length === 0;

  return (
    <SafeView backgroundColor="#fff" disableTop={false}>
      {renderHeader()}
      {showSkeleton ? (
        <View style={styles.skeletonWrap}>
          <WaterfallSkeleton />
        </View>
      ) : (
        <FlashList
          data={list}
          keyExtractor={(item: WaterfallItem) => item.id}
          masonry
          numColumns={2}
          renderItem={({ item }: { item: WaterfallItem }) => (
            <WaterfallCard item={item} onToggleLike={onToggleLike} />
          )}
          showsVerticalScrollIndicator={false}
          refreshing={fetching && list.length > 0}
          onRefresh={refresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={!fetching ? <EmptyState variant="content" title="暂无内容" /> : null}
          ListFooterComponent={<ListFooter fetching={fetching} isLastPage={isLastPage} listLength={list.length} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(48),
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(36),
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: setSpText(17),
    fontWeight: 'normal',
    color: '#6c6c6c',
    lineHeight: scaleSizeH(23),
  },
  tabTextActive: {
    fontWeight: '600',
    color: '#000000',
  },
  tabIndicator: {
    width: scaleSizeW(34),
    height: scaleSizeH(2),
    backgroundColor: '#2962D4',
    borderRadius: scaleSizeH(1),
    marginTop: scaleSizeH(2),
  },
  tabBadge: {
    position: 'absolute',
    right: -scaleSizeW(14),
    top: -scaleSizeH(3),
    height: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    lineHeight: scaleSizeH(12),
    color: '#FFFFFF',
  },
  msgBtn: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgIcon: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    tintColor: '#000000',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e6e6e6',
  },
  skeletonWrap: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 5,
  },
  listContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
    paddingBottom: scaleSizeH(100),
    backgroundColor: '#F5F5F5',
  },
});
