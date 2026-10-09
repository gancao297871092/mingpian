import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { CardLikeIcon, CheckMarkIcon, HistorySearchIcon, HistoryTrashIcon } from './myIcons';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';
const PAGE_SIZE = 20;
const CARD_W = scaleSizeW(194);
const IMAGE_H = 130;

type HistoryItem = API.history.HistoryItem;

/** 98/99.浏览记录（点右上角垃圾桶进入删除管理模式；动态/文章可跳转详情） */
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
    (item: HistoryItem) => {
      if (managing) {
        toggleSelect(item.id);
        return;
      }
      // 1动态 5技术文章 → 动态详情（其余类型详情页待实现）
      if (item.targetType === 1 || item.targetType === 5) {
        navigation.navigate('bbsDetail', { id: String(item.targetId) });
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
            {item.targetAvatar ? (
              <ExpoImage
                source={{ uri: item.targetAvatar }}
                style={[styles.cardImage, { height: scaleSizeH(IMAGE_H) }]}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={item.targetAvatar}
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder, { height: scaleSizeH(IMAGE_H) }]} />
            )}
            {managing && (
              <View style={[styles.checkCircle, checked && styles.checkCircleOn]}>
                {checked && <CheckMarkIcon />}
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.targetTitle || ''}</Text>
            <View style={styles.cardFoot}>
              {item.authorAvatar ? (
                <ExpoImage source={{ uri: item.authorAvatar }} style={styles.footAvatar} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.footAvatar, styles.footAvatarPlaceholder]} />
              )}
              <View style={styles.footText}>
                <Text style={styles.footName} numberOfLines={1}>{item.authorName || ''}</Text>
              </View>
              {item.countLike != null && (
                <View style={styles.footLike}>
                  <CardLikeIcon />
                  <Text style={styles.footLikeText}>{item.countLike}</Text>
                </View>
              )}
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
