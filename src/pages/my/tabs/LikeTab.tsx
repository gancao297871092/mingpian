import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import type { RootStackParamList } from '@/route/map';
import WaterfallTab from './WaterfallTab';
import {
  LikedCommentCard,
  initialTabState,
  mapLikedComment,
  tabStyles,
  type LikedCommentData,
  type TabHandle,
  type TabState,
} from './common';

const PAGE_SIZE = 20;

type SubTab = 'bbs' | 'comment';

interface Props {
  myId: number;
  /** 他人主页场景传目标用户 id */
  targetUserId?: number;
  /** 是否为当前展示页（懒加载触发） */
  active: boolean;
  /** 列表内容高度变化（含子 tab 栏高度，外层 FlatList 统一滚动） */
  onHeight: (h: number) => void;
}

/** figma 88：我的-点赞（动态/评论 两个子列表） */
export default forwardRef<TabHandle, Props>(function LikeTab({ myId, targetUserId, active, onHeight }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [subTab, setSubTab] = useState<SubTab>('bbs');
  const [subBarH, setSubBarH] = useState(0);
  const [bbsTotal, setBbsTotal] = useState<number | undefined>(undefined);
  /** 各子列表内容高度 */
  const heightsRef = useRef<Record<SubTab, number>>({ bbs: 0, comment: 0 });
  const waterfallRef = useRef<TabHandle | null>(null);

  // 评论点赞列表
  const [commentState, setCommentState] = useState<TabState<LikedCommentData>>(initialTabState);
  const commentStateRef = useRef(commentState);
  commentStateRef.current = commentState;
  const [commentTotal, setCommentTotal] = useState<number | undefined>(undefined);

  const fetchComments = useCallback(async (pageNum: number) => {
    if (commentStateRef.current.loading) return;
    setCommentState(prev => ({ ...prev, loading: true }));
    try {
      const res = await API.interaction.likeCommentList({ pageNum, pageSize: PAGE_SIZE });
      const list = (res.data?.list ?? []).map(mapLikedComment);
      const pages = res.data?.pages ?? 1;
      setCommentTotal(res.data?.total ?? 0);
      setCommentState(prev => ({
        list: pageNum === 1 ? list : [...prev.list, ...list],
        page: pageNum,
        pages,
        loading: false,
        loaded: true,
      }));
    } catch {
      setCommentState(prev => ({ ...prev, loading: false, loaded: true }));
    }
  }, []);

  const ensureCommentsLoaded = useCallback(() => {
    if (!commentStateRef.current.loaded) fetchComments(1);
  }, [fetchComments]);

  const forwardHeight = useCallback(
    (sub: SubTab, h: number) => {
      heightsRef.current[sub] = h;
      if (sub === subTab) onHeight(subBarH + h);
    },
    [subTab, subBarH, onHeight],
  );

  const onSubBarLayout = (h: number) => {
    setSubBarH(h);
    onHeight(h + heightsRef.current[subTab]);
  };

  const onSwitchSubTab = (sub: SubTab) => {
    setSubTab(sub);
    if (sub === 'comment') ensureCommentsLoaded();
    onHeight(subBarH + heightsRef.current[sub]);
  };

  useImperativeHandle(
    ref,
    () => ({
      onRefresh: async () => {
        if (subTab === 'bbs') return waterfallRef.current?.onRefresh();
        return fetchComments(1);
      },
      onEndReached: () => {
        if (subTab === 'bbs') return waterfallRef.current?.onEndReached();
        const s = commentStateRef.current;
        if (!s.loading && s.loaded && s.page < s.pages) {
          return fetchComments(s.page + 1);
        }
      },
      ensureLoaded: () => {
        waterfallRef.current?.ensureLoaded?.();
        if (subTab === 'comment') ensureCommentsLoaded();
      },
    }),
    [subTab, ensureCommentsLoaded, fetchComments],
  );

  const subTabs: { key: SubTab; label: string; total?: number }[] = [
    { key: 'bbs', label: '动态', total: bbsTotal },
    { key: 'comment', label: '评论', total: commentTotal },
  ];

  /** 他人主页：评论点赞列表接口仅支持查自己，隐藏子 tab 栏 */
  const showSubBar = targetUserId == null;
  const curSubTab: SubTab = showSubBar ? subTab : 'bbs';

  return (
    <View style={styles.flex1}>
      {showSubBar && (
        <View style={styles.subBar} onLayout={e => onSubBarLayout(e.nativeEvent.layout.height)}>
          {subTabs.map(t => (
            <TouchableOpacity key={t.key} activeOpacity={0.7} onPress={() => onSwitchSubTab(t.key)}>
              <Text style={[styles.subTabText, subTab === t.key && styles.subTabTextActive]}>
                {t.label}
                {t.total != null ? ` ${t.total}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {curSubTab === 'bbs' ? (
        <WaterfallTab
          ref={h => { waterfallRef.current = h; }}
          tab="like"
          myId={myId}
          targetUserId={targetUserId}
          active={active}
          draftCount={0}
          draftCover=""
          onHeight={h => forwardHeight('bbs', h)}
          onTotal={setBbsTotal}
        />
      ) : (
        <View style={styles.commentWrap}>
          <FlashList
            scrollEnabled={false}
            onContentSizeChange={(_w, h) => forwardHeight('comment', h)}
            data={commentState.list}
            keyExtractor={(item: LikedCommentData) => item.id}
            renderItem={({ item }: { item: LikedCommentData }) => (
              <LikedCommentCard
                item={item}
                onPress={() => item.bbsStatus === 1 && item.bbsId && navigation.navigate('bbsDetail', { id: String(item.bbsId) })}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !commentState.loaded && commentState.loading ? (
                <View style={tabStyles.loadingPad} />
              ) : commentState.loaded ? (
                <EmptyState variant="content" title="暂无内容" style={tabStyles.emptyBox} />
              ) : null
            }
            ListFooterComponent={
              <ListFooter fetching={commentState.loading} isLastPage={commentState.page >= commentState.pages} listLength={commentState.list.length} />
            }
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  commentWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(30),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(10),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  subTabText: {
    fontSize: setSpText(13),
    color: '#6C6C6C',
  },
  subTabTextActive: {
    color: '#000000',
  },
});
