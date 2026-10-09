import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import WaterfallCard, { type WaterfallItem } from '@/components/WaterfallCard';
import { API } from '@/api';
import { setDetailCache } from '@/utils/detailCache';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { mapPost } from './tabs/common';
import { CheckMarkIcon, HistorySearchIcon, HistoryTrashIcon } from './myIcons';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';
const PAGE_SIZE = 20;
const IMAGE_H = 130;

type HistoryItem = API.history.HistoryItem;
type LikeMap = ReturnType<typeof useBbsInteractionStore.getState>['likeMap'];

/** 转为广场公用瀑布流卡片数据（bbs 卡片优先，快照兜底；点赞状态以 likeMap 为准） */
function toWaterfallItem(item: HistoryItem, likeMap: LikeMap): WaterfallItem {
  const id = String(item.targetId);
  const like = likeMap[id];
  const info = item.bbs?.userInfoVo ?? {};
  if (item.bbs) {
    const post = mapPost(item.bbs);
    return {
      id,
      imageUrl: post.imageUrl,
      imageHeight: post.imageHeight,
      title: post.title,
      avatarUrl: info.avatar || item.authorAvatar || '',
      userName: info.nickname || info.username || item.authorName || '',
      companyName: info.cpName || '',
      likeCount: like?.likeCount ?? post.likeCount,
      isLiked: like?.isLiked ?? item.bbs.userIsZan === 1,
      hasVideo: item.bbs.mediaLinkList?.[0]?.media?.fileType === 'video',
      raw: item.bbs,
    };
  }
  return {
    id,
    imageUrl: item.targetAvatar || '',
    imageHeight: IMAGE_H,
    title: item.targetTitle || '',
    avatarUrl: item.authorAvatar || '',
    userName: item.authorName || '',
    companyName: '',
    likeCount: like?.likeCount ?? item.countLike ?? 0,
    isLiked: like?.isLiked ?? false,
    hasVideo: false,
  };
}

/** 98/99.浏览记录（点右上角垃圾桶进入删除管理模式；放大镜跳转搜索页；卡片复用广场 WaterfallCard） */
export default function BrowseHistory() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [list, setList] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);
  const likeMap = useBbsInteractionStore(s => s.likeMap);
  const setLike = useBbsInteractionStore(s => s.setLike);

  /** 列表卡片直接点赞（仅动态/文章类；乐观更新，失败回滚） */
  const onToggleLike = useCallback(
    (id: string) => {
      const item = list.find(i => String(i.targetId) === id);
      if (!item?.bbs) return;
      const cur = likeMap[id];
      const isLiked = cur?.isLiked ?? item.bbs.userIsZan === 1;
      const likeCount = cur?.likeCount ?? item.bbs.countLike ?? 0;
      const next = !isLiked;
      const nextCount = likeCount + (next ? 1 : -1);
      setLike(id, { isLiked: next, likeCount: nextCount });
      API.bbs.like({ bbsId: Number(id), status: next ? 1 : 0 }).catch(() => {
        setLike(id, { isLiked, likeCount });
      });
    },
    [list, likeMap, setLike],
  );

  const fetchList = useCallback(async (pageNum: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await API.history.list({ pageNum, pageSize: PAGE_SIZE });
      if (res.code !== '200') return;
      const { list: arr = [], pages: p = 1 } = res.data ?? {};
      setList(prev => (append ? [...prev, ...arr] : arr));
      setPage(pageNum);
      setPages(p);
    } catch {
      // 拦截器已提示
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const refresh = useCallback(() => fetchList(1, false), [fetchList]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) {
      fetchList(page + 1, true);
    }
  }, [fetchList, page, pages]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerPill}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('browseHistorySearch')}>
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

  const toggleSelect = useCallback((id: number) => {
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
        onPress: async () => {
          try {
            const res = await API.history.del([...selected]);
            if (res.code !== '200') return;
            setList(prev => prev.filter(i => !selected.has(i.id)));
            setSelected(new Set());
            Toast.show({ type: 'success', text1: '已删除' });
          } catch {
            // 拦截器已提示
          }
        },
      },
    ]);
  }, [selected]);

  const onClear = useCallback(() => {
    Alert.alert('清空浏览记录', '确认清空全部浏览记录？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.history.clear();
            if (res.code !== '200') return;
            setList([]);
            setSelected(new Set());
            setManaging(false);
            Toast.show({ type: 'success', text1: '已清空' });
          } catch {
            // 拦截器已提示
          }
        },
      },
    ]);
  }, []);

  const onPressCard = useCallback(
    (id: string) => {
      const item = list.find(i => String(i.targetId) === id);
      if (!item) return;
      // 1动态 5技术文章 → 动态详情（其余类型详情页待实现）
      if (item.targetType === 1 || item.targetType === 5) {
        if (item.bbs) setDetailCache(id, item.bbs);
        navigation.navigate('bbsDetail', { id });
      }
    },
    [list, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      const checked = selected.has(item.id);
      return (
        <View>
          <WaterfallCard item={toWaterfallItem(item, likeMap)} onToggleLike={onToggleLike} onPress={onPressCard} />
          {managing && (
            <TouchableOpacity activeOpacity={1} style={styles.manageMask} onPress={() => toggleSelect(item.id)}>
              <View style={[styles.checkCircle, checked && styles.checkCircleOn]}>
                {checked && <CheckMarkIcon />}
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [managing, selected, toggleSelect, likeMap, onToggleLike, onPressCard],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <FlashList
        data={list}
        keyExtractor={item => String(item.id)}
        masonry
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, managing && styles.listContentManaging]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : loaded ? (
            <EmptyState variant="content" title="暂无浏览记录" style={styles.emptyBox} />
          ) : null
        }
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
      {managing && (
        <View style={styles.manageBar}>
          <Text style={styles.manageCount}>
            已选 <Text style={styles.manageCountNum}>{selected.size}</Text> 条
          </Text>
          <TouchableOpacity style={styles.manageClearBtn} onPress={onClear}>
            <Text style={styles.manageClear}>清空</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manageCancelBtn}
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
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
  },
  manageMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  manageClearBtn: {
    marginLeft: 'auto',
    marginRight: scaleSizeW(24),
  },
  manageClear: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: DANGER,
  },
  manageCancelBtn: {
    marginRight: scaleSizeW(24),
  },
  manageCancel: {
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
});
