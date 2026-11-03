import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { useMessageUnreadStore } from '@/store/message';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  BORDER,
  DIVIDER,
  MsgAvatar,
  PRIMARY,
  TEXT_DESC,
  TEXT_MAIN,
  TEXT_SUB,
  formatListTime,
} from './common';

/**
 * 38.评论与回复（互动消息详情）
 * 数据：GET /v1/interaction/comment/list（我的动态下他人评论，含楼中楼）；
 * bbsCover/isRead 为后端改造项（wanq-app MESSAGE-CENTER-CHANGES.md 3.5），未上线时降级。
 */
export default function CommentReplyList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const myId = useUserStore(s => s.userInfo?.wqUser?.id);

  const [list, setList] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pages, setPages] = useState(1);
  /** 本地点赞状态覆盖（commentId → {liked, count}） */
  const [likeOverride, setLikeOverride] = useState<Record<string, { liked: boolean; count: number }>>({});

  const fetchList = useCallback(async (pn: number, append: boolean) => {
    try {
      const res = await API.interaction.commentList({ pageNum: pn, pageSize: 20 });
      const records = res.data?.list ?? [];
      setList(prev => (append ? [...prev, ...records] : records));
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
    // 进入页面即把「评论与回复」组通知置已读（后端改造项 3.3，未上线静默）
    API.message
      .interactionRead({ group: 'comment' })
      .then(() => useMessageUnreadStore.getState().fetchUnread())
      .catch(() => {});
  }, [fetchList]);

  /** 点赞/取消点赞该条评论（figma 38 行内「点赞」） */
  const onToggleLike = useCallback(async (item: any) => {
    const key = String(item.id);
    const current = likeOverride[key] ?? { liked: false, count: item.likeCount ?? 0 };
    const nextLiked = !current.liked;
    // 乐观更新
    setLikeOverride(prev => ({
      ...prev,
      [key]: { liked: nextLiked, count: Math.max(0, current.count + (nextLiked ? 1 : -1)) },
    }));
    try {
      await API.bbsComment.like({ commentId: item.id, status: nextLiked ? 1 : 0 });
    } catch {
      setLikeOverride(prev => ({ ...prev, [key]: current }));
    }
  }, [likeOverride]);

  const goBbs = useCallback(
    (bbsId: number | string | undefined) => {
      if (bbsId == null) return;
      navigation.navigate('bbsDetail', { id: String(bbsId) });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const name = item.userInfoVo?.nickname || item.userInfoVo?.username || '访客';
      // 楼中楼且回复对象是我 → 「回复:」，否则 → 「评论了你:」（figma 38，前缀灰、正文黑）
      const isReply = !!item.parentId && Number(item.replyToUserId) === Number(myId);
      const likeState = likeOverride[String(item.id)] ?? { liked: false, count: item.likeCount ?? 0 };
      return (
        <View>
          <TouchableOpacity activeOpacity={0.75} style={styles.itemRow} onPress={() => goBbs(item.bbsId)}>
            <MsgAvatar uri={item.userInfoVo?.avatar} name={name} showDot={item.isRead === 0} />
            <View style={styles.itemBody}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.content} numberOfLines={2}>
                <Text style={styles.contentPrefix}>{isReply ? '回复: ' : '评论了你: '}</Text>
                {item.content || ''}
              </Text>
              <View style={styles.actionRow}>
                <Text style={styles.time}>{formatListTime(item.createTime)}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionBtn}
                  onPress={() => goBbs(item.bbsId)}
                >
                  <ExpoImage source={require('@/assets/message/icon_reply.png')} style={styles.actionIcon} />
                  <Text style={styles.actionText}>回复</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionBtn}
                  onPress={() => onToggleLike(item)}
                >
                  <ExpoImage
                    source={require('@/assets/message/icon_thumb.png')}
                    style={[styles.actionIcon, likeState.liked && styles.actionIconLiked]}
                  />
                  <Text style={[styles.actionText, likeState.liked && styles.actionTextLiked]}>
                    {likeState.count > 0 ? likeState.count : '点赞'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {item.bbsCover ? (
              <ExpoImage
                source={{ uri: item.bbsCover }}
                recyclingKey={item.bbsCover}
                style={styles.bbsCover}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={[styles.bbsCover, styles.bbsCoverEmpty]} />
            )}
          </TouchableOpacity>
          {index < list.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      );
    },
    [myId, likeOverride, list.length, goBbs, onToggleLike],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <FlatList
        data={list}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (loaded && pageNum < pages) fetchList(pageNum + 1, true);
        }}
        ListEmptyComponent={
          loaded ? (
            <EmptyState variant="comment" title="暂无评论与回复" style={styles.emptyBox} />
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
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: scaleSizeW(16),
    paddingRight: scaleSizeW(16),
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
    marginTop: scaleSizeH(6),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_MAIN,
  },
  contentPrefix: {
    color: TEXT_DESC,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(8),
    gap: scaleSizeW(20),
  },
  time: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  actionIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  actionIconLiked: {
    tintColor: '#FE2955',
  },
  actionText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    fontWeight: '500',
    color: TEXT_DESC,
  },
  actionTextLiked: {
    color: '#FE2955',
  },
  bbsCover: {
    width: scaleSizeW(67),
    height: scaleSizeH(90),
    borderRadius: scaleSizeW(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: '#F5F5F5',
  },
  bbsCoverEmpty: {},
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: scaleSizeW(77),
    marginRight: scaleSizeW(16),
    marginVertical: scaleSizeH(20),
  },
});
