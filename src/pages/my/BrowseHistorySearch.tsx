import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { setDetailCache } from '@/utils/detailCache';
import { storageUtils } from '@/utils/storage';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { mapPost } from './tabs/common';
import { CardLikeIcon, HistorySearchIcon } from './myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const LIKE_RED = '#FE2955';
const PAGE_SIZE = 20;
const CARD_W = scaleSizeW(194);
const IMAGE_H = 130;
const HISTORY_KEY = 'browseHistorySearchKeywords';
const HISTORY_MAX = 10;

type HistoryItem = API.history.HistoryItem;

interface CardDisplay {
  imageUrl: string;
  imageHeight: number;
  title: string;
  avatar: string;
  name: string;
  likeCount: number | null;
  isVideo: boolean;
}

/** 优先使用回填的完整动态卡片（与广场 feed 同构），否则用快照兜底 */
function displayOf(item: HistoryItem): CardDisplay {
  if (item.bbs) {
    const post = mapPost(item.bbs);
    const info = item.bbs.userInfoVo ?? {};
    return {
      imageUrl: post.imageUrl,
      imageHeight: post.imageHeight,
      title: post.title,
      avatar: info.avatar || item.authorAvatar || '',
      name: info.nickname || info.username || item.authorName || '',
      likeCount: post.likeCount,
      isVideo: item.bbs.mediaLinkList?.[0]?.media?.fileType === 'video',
    };
  }
  return {
    imageUrl: item.targetAvatar || '',
    imageHeight: IMAGE_H,
    title: item.targetTitle || '',
    avatar: item.authorAvatar || '',
    name: item.authorName || '',
    likeCount: item.countLike ?? null,
    isVideo: false,
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

function CloseXIcon({ size = 8, color = '#999999' }: { size?: number; color?: string }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path d="M1 1l8 8M9 1l-8 8" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function loadKeywords(): string[] {
  try {
    const raw = storageUtils.getString(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** 搜索浏览记录（figma 搜索浏览记录 双状态：初始=历史记录 chips，搜索后=结果/暂无搜索结果） */
export default function BrowseHistorySearch() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  const [searched, setSearched] = useState(false);
  const [chips, setChips] = useState<string[]>(loadKeywords);
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const keywordRef = useRef('');
  const likeMap = useBbsInteractionStore(s => s.likeMap);
  const setLike = useBbsInteractionStore(s => s.setLike);

  /** 列表卡片直接点赞（仅动态/文章类；乐观更新，失败回滚） */
  const onToggleLike = useCallback(
    (item: HistoryItem) => {
      if (!item.bbs) return;
      const id = String(item.targetId);
      const cur = likeMap[id];
      const isLiked = cur?.isLiked ?? item.bbs.userIsZan === 1;
      const likeCount = cur?.likeCount ?? item.bbs.countLike ?? 0;
      const next = !isLiked;
      const nextCount = likeCount + (next ? 1 : -1);
      setLike(id, { isLiked: next, likeCount: nextCount });
      API.bbs.like({ bbsId: item.targetId, status: next ? 1 : 0 }).catch(() => {
        setLike(id, { isLiked, likeCount });
      });
    },
    [likeMap, setLike],
  );

  const saveChips = useCallback((next: string[]) => {
    setChips(next);
    storageUtils.set(HISTORY_KEY, JSON.stringify(next));
  }, []);

  const fetchList = useCallback(async (pageNum: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await API.history.list({ pageNum, pageSize: PAGE_SIZE, keyword: keywordRef.current.trim() });
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
    }
  }, []);

  const doSearch = useCallback(
    (kw: string) => {
      const word = kw.trim();
      if (!word) return;
      keywordRef.current = word;
      setKeyword(word);
      setSearched(true);
      setEditing(false);
      saveChips([word, ...chips.filter(c => c !== word)].slice(0, HISTORY_MAX));
      fetchList(1, false);
    },
    [chips, fetchList, saveChips],
  );

  const onEndReached = useCallback(() => {
    if (searched && !loadingRef.current && page < pages) {
      fetchList(page + 1, true);
    }
  }, [searched, fetchList, page, pages]);

  const onClearAll = useCallback(() => {
    AppAlert.alert('全部删除', '确认删除全部搜索历史？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => saveChips([]) },
    ]);
  }, [saveChips]);

  const onPressCard = useCallback(
    (item: HistoryItem) => {
      if (item.targetType === 1 || item.targetType === 5) {
        if (item.bbs) setDetailCache(String(item.targetId), item.bbs);
        navigation.navigate('bbsDetail', { id: String(item.targetId) });
      }
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      const d = displayOf(item);
      const like = likeMap[String(item.targetId)];
      const isLiked = like?.isLiked ?? item.bbs?.userIsZan === 1;
      const likeCount = like?.likeCount ?? d.likeCount;
      return (
        <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => onPressCard(item)}>
          <View>
            {d.imageUrl ? (
              <ExpoImage
                source={{ uri: d.imageUrl }}
                style={[styles.cardImage, { height: scaleSizeH(d.imageHeight) }]}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={d.imageUrl}
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder, { height: scaleSizeH(IMAGE_H) }]} />
            )}
            {d.isVideo && <VideoBadge />}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{d.title}</Text>
            <View style={styles.cardFoot}>
              {d.avatar ? (
                <ExpoImage source={{ uri: d.avatar }} style={styles.footAvatar} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.footAvatar, styles.footAvatarPlaceholder]} />
              )}
              <View style={styles.footText}>
                <Text style={styles.footName} numberOfLines={1}>{d.name}</Text>
              </View>
              {likeCount != null && (
                <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.footLike} onPress={() => onToggleLike(item)}>
                  <CardLikeIcon color={isLiked ? LIKE_RED : '#666666'} />
                  <Text style={[styles.footLikeText, isLiked && styles.footLikeTextOn]}>{likeCount}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [onPressCard, likeMap, onToggleLike],
  );

  return (
    <SafeView backgroundColor="#F6F7FB" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <HistorySearchIcon size={16} color="#AFB1BB" />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={t => {
              setKeyword(t);
              if (searched) setSearched(false);
            }}
            placeholder="搜浏览记录"
            placeholderTextColor="#AFB1BB"
            returnKeyType="search"
            autoFocus
            onSubmitEditing={() => doSearch(keyword)}
          />
          {!!keyword && (
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.clearBtn} onPress={() => setKeyword('')}>
              <CloseXIcon />
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={() => doSearch(keyword)}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!searched ? (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>历史记录</Text>
            {chips.length > 0 && (
              <View style={styles.historyActions}>
                <TouchableOpacity activeOpacity={0.7} onPress={onClearAll}>
                  <Text style={styles.historyActionText}>全部删除</Text>
                </TouchableOpacity>
                <Text style={styles.historyActionText}>|</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setEditing(e => !e)}>
                  <Text style={styles.historyActionText}>{editing ? '完成' : '编辑'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.chipsWrap}>
            {chips.map(c => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.7}
                style={styles.chip}
                onPress={() => (editing ? saveChips(chips.filter(x => x !== c)) : doSearch(c))}
              >
                <Text style={styles.chipText}>{c}</Text>
                {editing && (
                  <View style={styles.chipClose}>
                    <CloseXIcon size={7} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlashList
          data={list}
          keyExtractor={item => String(item.id)}
          masonry
          numColumns={2}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
            ) : (
              <EmptyState variant="search" title="暂无搜索结果" style={styles.emptyBox} />
            )
          }
          ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
        />
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(16),
    paddingTop: scaleSizeH(2),
    paddingBottom: scaleSizeH(7),
    gap: scaleSizeW(17),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(44),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(6),
    gap: scaleSizeW(7),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  searchBtn: {
    paddingHorizontal: scaleSizeW(13),
    paddingVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(16),
    color: '#FFFFFF',
  },
  clearBtn: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#E9EBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSizeW(6),
  },
  historySection: {
    paddingHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(18),
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(16),
    color: '#000000',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  historyActionText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: GRAY,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(14),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(90),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  chipText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: GRAY,
  },
  chipClose: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
    borderRadius: scaleSizeW(7),
    backgroundColor: '#E9EBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(10),
  },
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(60),
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
  footLikeTextOn: {
    color: LIKE_RED,
  },
});
