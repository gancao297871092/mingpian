import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import type { RootStackParamList } from '@/route/map';
import {
  CommentCard,
  initialTabState,
  mapComment,
  tabStyles,
  type CommentCardData,
  type TabHandle,
  type TabState,
} from './common';

const PAGE_SIZE = 20;

interface Props {
  /** 是否为当前展示页（懒加载触发） */
  active: boolean;
  /** 列表内容高度变化（外层 FlatList 统一滚动，需要撑开高度） */
  onHeight: (h: number) => void;
}

export default forwardRef<TabHandle, Props>(function CommentTab({ active, onHeight }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [state, setState] = useState<TabState<CommentCardData>>(initialTabState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchPage = useCallback(async (pageNum: number) => {
    if (stateRef.current.loading) return;
    setState(prev => ({ ...prev, loading: true }));
    try {
      const res = await API.interaction.commentList({ pageNum, pageSize: PAGE_SIZE });
      const list = (res.data?.list ?? []).map(mapComment);
      const pages = res.data?.pages ?? 1;
      setState(prev => ({
        list: pageNum === 1 ? list : [...prev.list, ...list],
        page: pageNum,
        pages,
        loading: false,
        loaded: true,
      }));
    } catch {
      setState(prev => ({ ...prev, loading: false, loaded: true }));
    }
  }, []);

  useEffect(() => {
    if (active && !state.loaded) fetchPage(1);
  }, [active, state.loaded, fetchPage]);

  useImperativeHandle(
    ref,
    () => ({
      onRefresh: () => fetchPage(1),
      onEndReached: () => {
        const s = stateRef.current;
        if (!s.loading && s.loaded && s.page < s.pages) {
          return fetchPage(s.page + 1);
        }
      },
    }),
    [fetchPage],
  );

  return (
    <FlashList
      scrollEnabled={false}
      onContentSizeChange={(_w, h) => onHeight(h)}
      data={state.list}
      keyExtractor={(item: CommentCardData) => item.id}
      renderItem={({ item }: { item: CommentCardData }) => (
        <CommentCard item={item} onPress={() => navigation.navigate('bbsDetail', { id: String(item.bbsId) })} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tabStyles.commentList}
      ListEmptyComponent={
        !state.loaded && state.loading ? (
          <View style={tabStyles.loadingPad} />
        ) : state.loaded ? (
          <EmptyState variant="content" title="暂无内容" style={tabStyles.emptyBox} />
        ) : null
      }
      ListFooterComponent={<ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />}
    />
  );
});
