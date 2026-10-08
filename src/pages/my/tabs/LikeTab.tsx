import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import WaterfallTab from './WaterfallTab';
import {
  LikedCommentCard,
  type LikedCommentData,
  type TabHandle,
} from './common';

type SubTab = 'bbs' | 'comment';

/** 静态 mock（接口待联调） */
const MOCK_LIKED_COMMENTS: LikedCommentData[] = [
  {
    id: 'mock-1',
    bbsId: 0,
    avatar: '',
    name: 'WQ_26703882',
    content: '首件前建议把夹具基准与刀具补偿做成检查清单。',
    bbsTitle: '自动化产线调试中最容易忽略的五个问题',
    likeCount: 157,
  },
  {
    id: 'mock-2',
    bbsId: 0,
    avatar: '',
    name: 'WQ_26703882',
    content: '批量交付前建议先做一轮小批试产，确认规格稳定性。',
    bbsTitle: '新增自动化产线投入使用，交付效率提升60%',
    likeCount: 32,
  },
];

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

  // 评论点赞列表：静态 mock（接口待联调）
  const [commentList] = useState<LikedCommentData[]>(MOCK_LIKED_COMMENTS);
  const commentLoadedRef = useRef(false);

  const ensureCommentsLoaded = useCallback(() => {
    commentLoadedRef.current = true;
  }, []);

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
      },
      onEndReached: () => {
        if (subTab === 'bbs') return waterfallRef.current?.onEndReached();
      },
      ensureLoaded: () => {
        waterfallRef.current?.ensureLoaded?.();
        if (subTab === 'comment') ensureCommentsLoaded();
      },
    }),
    [subTab, ensureCommentsLoaded],
  );

  const subTabs: { key: SubTab; label: string; total?: number }[] = [
    { key: 'bbs', label: '动态', total: bbsTotal },
    { key: 'comment', label: '评论', total: MOCK_LIKED_COMMENTS.length },
  ];

  return (
    <View style={styles.flex1}>
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
      {subTab === 'bbs' ? (
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
            data={commentList}
            keyExtractor={(item: LikedCommentData) => item.id}
            renderItem={({ item }: { item: LikedCommentData }) => (
              <LikedCommentCard item={item} onPress={() => item.bbsId && navigation.navigate('bbsDetail', { id: String(item.bbsId) })} />
            )}
            showsVerticalScrollIndicator={false}
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
