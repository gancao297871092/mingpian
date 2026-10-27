import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { setSelectBbsResult } from '@/utils/selectBbsBridge';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { mapPost, PostCard, type PostCardData } from '@/pages/my/tabs/common';
import { SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const PAGE_SIZE = 20;
const MAX_SELECT = 3;

type Props = NativeStackScreenProps<RootStackParamList, 'selectBbs'>;

/** 缩略图右上角移除角标 */
function RemoveBadge({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.removeBadge} onPress={onPress} hitSlop={6}>
      <Svg width={scaleSizeW(7)} height={scaleSizeW(7)} viewBox="0 0 8 8">
        <Path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      </Svg>
    </TouchableOpacity>
  );
}

/** 选择动态（figma 1291:4985）：他人主页动态瀑布流多选（最多3条），搜索为当前页内联搜索 */
export default function SelectBbs({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const myId = useUserStore(s => s.userInfo?.wqUser?.id);
  const targetUserId = route.params?.targetUserId ?? myId;
  const [list, setList] = useState<PostCardData[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);
  const [selected, setSelected] = useState<PostCardData[]>([]);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef<TextInput>(null);

  const fetchList = useCallback(
    async (pageNum: number, append: boolean) => {
      if (loadingRef.current || !targetUserId) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await API.bbs.userMain({ targetUserId, pageNum, pageSize: PAGE_SIZE });
        if (res.code !== '200') return;
        const arr = (res.data?.list ?? []).map(mapPost);
        setList(prev => (append ? [...prev, ...arr] : arr));
        setPage(pageNum);
        setPages(res.data?.pages ?? 1);
      } catch {
        // 拦截器已提示
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setLoaded(true);
      }
    },
    [targetUserId],
  );

  useEffect(() => {
    fetchList(1, false);
  }, [fetchList]);

  // 回显：进入页面时按传入的 selectedIds 预勾已加载项
  const preselectedRef = useRef(false);
  useEffect(() => {
    if (!loaded || preselectedRef.current) return;
    preselectedRef.current = true;
    const ids = route.params?.selectedIds;
    if (ids?.length) {
      setSelected(list.filter(i => ids.includes(i.id)).slice(0, MAX_SELECT));
    }
  }, [loaded, list, route.params?.selectedIds]);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) {
      fetchList(page + 1, true);
    }
  }, [fetchList, page, pages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            setSearching(s => {
              if (!s) setTimeout(() => inputRef.current?.focus(), 100);
              return !s;
            });
            setKeyword('');
          }}
        >
          <SearchIcon size={20} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const toggleSelect = useCallback((item: PostCardData) => {
    setSelected(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) return prev.filter(i => i.id !== item.id);
      if (prev.length >= MAX_SELECT) {
        Toast.show({ type: 'info', text1: `最多选择 ${MAX_SELECT} 条动态` });
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeSelect = useCallback((id: string) => {
    setSelected(prev => prev.filter(i => i.id !== id));
  }, []);

  const onConfirm = useCallback(() => {
    setSelectBbsResult(selected.map(i => ({ id: i.id, title: i.title, imageUrl: i.imageUrl })));
    navigation.goBack();
  }, [navigation, selected]);

  const kw = keyword.trim();
  const data = kw ? list.filter(i => i.title.includes(kw)) : list;

  const renderItem = useCallback(
    ({ item }: { item: PostCardData }) => {
      const order = selected.findIndex(i => i.id === item.id);
      const checked = order >= 0;
      return (
        <View>
          <PostCard item={item} onPress={() => toggleSelect(item)} />
          <View pointerEvents="none" style={[styles.checkCircle, checked && styles.checkCircleOn]}>
            {checked && <Text style={styles.checkOrder}>{order + 1}</Text>}
          </View>
        </View>
      );
    },
    [selected, toggleSelect],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      {searching && (
        <View style={styles.searchBar}>
          <View style={styles.searchInputBox}>
            <SearchIcon size={16} color="#999999" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="搜索动态"
              placeholderTextColor="#999999"
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setSearching(false);
              setKeyword('');
            }}
          >
            <Text style={styles.searchCancel}>取消</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlashList
        data={data}
        keyExtractor={item => item.id}
        masonry
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: scaleSizeH(160) + insets.bottom }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : loaded ? (
            <EmptyState
              variant={kw ? 'search' : 'content'}
              title={kw ? '暂无搜索结果' : '暂无动态'}
              style={styles.emptyBox}
            />
          ) : null
        }
        ListFooterComponent={
          kw ? null : <ListFooter fetching={loading} isLastPage={page >= pages} listLength={data.length} />
        }
      />
      {/* 底部已选栏 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + scaleSizeH(12) }]}>
        <View style={styles.thumbRow}>
          {selected.map(item => (
            <View key={item.id} style={styles.thumbBox}>
              {!!item.imageUrl && (
                <ExpoImage source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
              )}
              <RemoveBadge onPress={() => removeSelect(item.id)} />
            </View>
          ))}
        </View>
        <View style={styles.confirmRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={selected.length === 0}
            style={[styles.confirmBtn, selected.length === 0 && styles.confirmBtnDisabled]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>
              确定 {selected.length}/{MAX_SELECT}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(100),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(12),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(8),
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    height: scaleSizeH(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(12),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  searchCancel: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
  },
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
  },
  checkCircle: {
    position: 'absolute',
    top: scaleSizeH(5),
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
  checkOrder: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: scaleSizeW(10),
    borderTopRightRadius: scaleSizeW(10),
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(20),
  },
  thumbRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    minHeight: scaleSizeW(49),
  },
  thumbBox: {
    width: scaleSizeW(49),
    height: scaleSizeW(49),
  },
  thumb: {
    width: scaleSizeW(49),
    height: scaleSizeW(49),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F5F5F5',
  },
  removeBadge: {
    position: 'absolute',
    top: -scaleSizeH(5),
    right: -scaleSizeW(5),
    width: scaleSizeW(15),
    height: scaleSizeW(15),
    borderRadius: scaleSizeW(7.5),
    backgroundColor: '#303032',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scaleSizeH(20),
  },
  confirmBtn: {
    width: scaleSizeW(100),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.3,
  },
  confirmText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
