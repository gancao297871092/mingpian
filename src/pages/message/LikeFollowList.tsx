import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Rect } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import AppImage from '@/components/AppImage';
import { useMessageUnreadStore } from '@/store/message';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  ChevronRight,
  DIVIDER,
  MsgAvatar,
  PRIMARY,
  TEXT_DESC,
  TEXT_MAIN,
  TEXT_SUB,
  formatListTime,
} from './common';

/** 右侧缩略图占位图标（动态无封面时的灰色占位，对齐设计稿） */
function ThumbPlaceholderIcon() {
  return (
    <Svg width={scaleSizeW(22)} height={scaleSizeW(22)} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={4} width={19} height={16} rx={2} stroke="#C0C4CC" strokeWidth={1.4} />
      <Path d="M2.5 16.5 8 11.5l4 4 3.5-3.5 6 5.5" stroke="#C0C4CC" strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M15.5 9.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" fill="#C0C4CC" />
    </Svg>
  );
}

/** 互动类型：1 赞了动态 / 2 赞了评论（kind=3 关注了你 已拆出到「新增关注」页 /interaction/follow/list） */
const KIND_BBS_LIKE = 1;
const KIND_COMMENT_LIKE = 2;

/**
 * 39.点赞与收藏（互动消息详情）
 * 数据：GET /v1/interaction/like/list（kind=1 赞动态 / kind=2 赞评论，时间倒序分页）。
 * 关注项已拆出到 FollowList（/interaction/follow/list），本页不再接收 kind=3。
 */
export default function LikeFollowList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [list, setList] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pages, setPages] = useState(1);
  /** 整组已读是否已完成：已完成后到的分页数据本地同步清红点 */
  const readDoneRef = useRef(false);

  const fetchList = useCallback(async (pn: number, append: boolean) => {
    try {
      const res = await API.interaction.likeList({ pageNum: pn, pageSize: 20 });
      const records = res.data?.list ?? [];
      const normalized = readDoneRef.current ? records.map(it => ({ ...it, isRead: 1 })) : records;
      setList(prev => (append ? [...prev, ...normalized] : normalized));
      setPageNum(res.data?.pageNum ?? pn);
      setPages(res.data?.pages ?? 1);
    } catch {
      // 拦截器已提示
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchList(1, false);
    // 进入页面即把「点赞与收藏」组通知置已读（清红点），并同步清掉列表项红点
    API.message
      .interactionRead({ group: 'like' })
      .then(() => {
        readDoneRef.current = true;
        useMessageUnreadStore.getState().fetchUnread();
        setList(prev => prev.map(it => (it.isRead === 0 ? { ...it, isRead: 1 } : it)));
      })
      .catch(() => {});
  }, [fetchList]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const kind = item.kind ?? KIND_BBS_LIKE;
      const name = item.userInfoVo?.nickname || item.userInfoVo?.username || '访客';
      const onPress = () => {
        if (item.bbsId != null) {
          navigation.navigate('bbsDetail', { id: String(item.bbsId) });
        }
      };
      return (
        <View>
          <TouchableOpacity activeOpacity={0.75} style={styles.itemRow} onPress={onPress}>
            <MsgAvatar uri={item.userInfoVo?.avatar} name={name} showDot={item.isRead === 0} />
            <View style={styles.itemBody}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.content} numberOfLines={2}>
                {kind === KIND_COMMENT_LIKE ? (
                  '赞了你的评论'
                ) : (
                  <>
                    {'赞了你的'}
                    <Text style={styles.contentQuote}>{item.bbsTitle ? `“${item.bbsTitle}”` : ''}</Text>
                    {'动态'}
                  </>
                )}
              </Text>
              <Text style={styles.time}>{formatListTime(item.createTime)}</Text>
            </View>
            {/* 右侧动态封面缩略图（bbsCover：视频封面→首张图片→海报；无封面时灰色占位） */}
            {item.bbsCover ? (
              <AppImage source={{ uri: item.bbsCover }} style={styles.thumb} contentFit="cover" transition={100} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <ThumbPlaceholderIcon />
              </View>
            )}
            <ChevronRight />
          </TouchableOpacity>
          {index < list.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      );
    },
    [navigation, list.length],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <FlatList
        data={list}
        keyExtractor={(item, i) => `${item.kind ?? 1}-${item.id ?? i}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (loaded && pageNum < pages) fetchList(pageNum + 1, true);
        }}
        ListEmptyComponent={
          loaded ? (
            <EmptyState variant="content" title="暂无点赞" style={styles.emptyBox} />
          ) : (
            <ActivityIndicator style={styles.loading} color={PRIMARY} />
          )
        }
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: scaleSizeH(24),
    paddingBottom: scaleSizeH(24),
    flexGrow: 1,
  },
  loading: {
    marginTop: scaleSizeH(60),
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: scaleSizeH(80),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    gap: scaleSizeW(13),
  },
  itemBody: {
    flex: 1,
  },
  name: {
    fontSize: setSpText(15),
    color: TEXT_MAIN,
  },
  content: {
    marginTop: scaleSizeH(5),
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: TEXT_MAIN,
  },
  contentQuote: {
    color: TEXT_DESC,
  },
  time: {
    marginTop: scaleSizeH(6),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  /** 右侧动态封面缩略图：3:4 竖版圆角（对齐设计稿红框列） */
  thumb: {
    width: scaleSizeW(48),
    height: scaleSizeW(64),
    borderRadius: scaleSizeW(6),
    backgroundColor: '#F4F5F7',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: scaleSizeW(77),
    marginRight: scaleSizeW(16),
    marginVertical: scaleSizeH(20),
  },
});
