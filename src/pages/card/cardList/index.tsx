import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SwipeRow } from 'react-native-swipe-list-view';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import CardShareSheet from '@/components/cards/CardShareSheet';
import type { CardData } from '@/components/cards/types';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { HistorySearchIcon } from '@/pages/my/myIcons';
import { ChatIcon, ClearIcon } from './icons';

type Props = NativeStackScreenProps<RootStackParamList, 'cardList'>;

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const PAGE_SIZE = 20;
const ACTION_W = scaleSizeW(77);

interface CardFavItem {
  cardId: number;
  userId?: number;
  cardName?: string;
  avatar?: string;
  cpName?: string;
  position?: string;
  /** 0=对方已删除 */
  status?: number;
}

interface SwipeRowHandle {
  closeRow: () => void;
}

const SwipeableRow = SwipeRow as unknown as React.ForwardRefExoticComponent<
  React.PropsWithChildren<{
    rightOpenValue?: number;
    disableRightSwipe?: boolean;
    friction?: number;
    onRowOpen?: () => void;
    onRowClose?: () => void;
  }> &
    React.RefAttributes<SwipeRowHandle>
>;

/** 名片夹（figma 名片夹 1146:4826，对齐小程序 card/card/cardList）：搜索 + 收藏名片列表，左滑分享/删除 */
export default function CardList({ navigation }: Props) {
  const [list, setList] = useState<CardFavItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [shareCard, setShareCard] = useState<CardData | null>(null);
  /** 打开中的行数：>0 时禁用页面右滑返回手势，避免与行的右滑关闭冲突 */
  const openRowsRef = React.useRef(0);

  const setRowGestures = useCallback(
    (delta: number) => {
      openRowsRef.current = Math.max(0, openRowsRef.current + delta);
      navigation.setOptions({ gestureEnabled: openRowsRef.current === 0 });
    },
    [navigation],
  );

  const fetchPage = useCallback(
    async (pageNum: number, nickname: string) => {
      setLoading(true);
      try {
        const res = await API.card.favoriteCards({ nickname: nickname || undefined, pageNum, pageSize: PAGE_SIZE });
        if (res.code === '200') {
          const newList: CardFavItem[] = res.data?.list || [];
          setList((prev) => (pageNum === 1 ? newList : [...prev, ...newList]));
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
    [],
  );

  useEffect(() => {
    fetchPage(1, '');
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (loading || page >= pages) return;
    fetchPage(page + 1, keyword);
  }, [loading, page, pages, keyword, fetchPage]);

  const onDelete = async (item: CardFavItem, closeRow: () => void) => {
    closeRow();
    try {
      const res = await API.card.favoriteDo({ cardId: item.cardId, type: 0 });
      if (res.code === '200') {
        setList((prev) => prev.filter((c) => c.cardId !== item.cardId));
        Toast.show({ type: 'success', text1: '已删除' });
      }
    } catch {
      Toast.show({ type: 'error', text1: '删除失败' });
    }
  };

  const onShare = async (item: CardFavItem, closeRow: () => void) => {
    closeRow();
    try {
      // 对齐名片详情分享：取 aggregate 的 userCard（含海报所需的 styleCode/cardPoster/mediaLinkList）
      const res = await API.card.aggregate({ cardId: item.cardId });
      const userCard = res.data?.userCard;
      if (res.code === '200' && userCard) {
        setShareCard({ ...userCard, id: userCard.id ?? item.cardId });
      }
    } catch {
      Toast.show({ type: 'error', text1: '分享失败' });
    }
  };

  const renderItem = ({ item }: { item: CardFavItem }) => {
    let rowRef: SwipeRowHandle | null = null;
    const closeRow = () => rowRef?.closeRow();
    const deleted = !item.status;
    return (
      <SwipeableRow
        ref={(ref) => {
          rowRef = ref;
        }}
        rightOpenValue={-ACTION_W * (deleted ? 1 : 2)}
        disableRightSwipe
        friction={8}
        onRowOpen={() => setRowGestures(1)}
        onRowClose={() => setRowGestures(-1)}
      >
        <View style={styles.hiddenRow}>
          {!deleted && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.actionBtn, { backgroundColor: PRIMARY }]}
              onPress={() => onShare(item, closeRow)}
            >
              <Text style={styles.actionText}>分享</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => onDelete(item, closeRow)}
          >
            <Text style={styles.actionText}>删除</Text>
          </TouchableOpacity>
        </View>
        {/* 可见层：外层不透明白底，内层按压变暗，避免按下去透出底下的操作按钮 */}
        <View style={styles.rowWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.row}
            onPress={() => navigation.navigate('cardDetail', { id: item.cardId, userId: item.userId })}
          >
            <ExpoImage
              source={{ uri: item.avatar }}
              style={[styles.avatar, deleted && styles.avatarDeleted]}
              contentFit="cover"
              transition={150}
              recyclingKey={item.avatar}
            />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.cardName || ''}
                {deleted && <Text style={styles.rowNameDeleted}>（对方已删除）</Text>}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.cpName || ''}
                {item.position ? ` · ${item.position}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.chatBtn}
              hitSlop={6}
              onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}
            >
              <ChatIcon />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </SwipeableRow>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <HistorySearchIcon size={16} color="#AFB1BB" />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="输入名称搜索"
            placeholderTextColor="#AFB1BB"
            returnKeyType="search"
            onSubmitEditing={() => fetchPage(1, keyword)}
          />
          {!!keyword && (
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => {
                setKeyword('');
                fetchPage(1, '');
              }}
            >
              <ClearIcon />
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={() => fetchPage(1, keyword)}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.hint}>左滑进行更多操作</Text>
      <FlashList
        data={list}
        keyExtractor={(item: CardFavItem) => String(item.cardId)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={loaded && !loading ? <EmptyState variant="content" title="暂无内容" /> : null}
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
      <CardShareSheet
        visible={!!shareCard}
        onClose={() => setShareCard(null)}
        card={shareCard ?? undefined}
      />
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
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F4F4F4',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(4),
    gap: scaleSizeW(6),
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
    fontWeight: '600',
    lineHeight: setSpText(16),
    color: '#FFFFFF',
  },
  hint: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: GRAY,
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(8),
    marginBottom: scaleSizeH(10),
  },
  rowWrap: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(78),
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  avatarDeleted: {
    opacity: 0.3,
  },
  rowText: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  rowName: {
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
  },
  rowNameDeleted: {
    color: '#999999',
  },
  rowSub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  chatBtn: {
    width: scaleSizeW(38),
    height: scaleSizeW(38),
    borderRadius: scaleSizeW(19),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSizeW(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginLeft: scaleSizeW(77),
  },
  hiddenRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: ACTION_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: '#FFFFFF',
  },
});
