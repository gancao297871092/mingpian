import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
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

/** 互动类型：1 赞了动态 / 2 赞了评论 / 3 关注了你（后端改造项 3.6） */
const KIND_BBS_LIKE = 1;
const KIND_COMMENT_LIKE = 2;
const KIND_FOLLOW = 3;

/**
 * 39.点赞与关注（互动消息详情）
 * 数据：GET /v1/interaction/like/list（动态赞+评论赞+关注合并分页，后端改造项 3.6）。
 * 后端未合并前仅返回动态被赞（无 kind 字段），前端按缺省 kind=1 兼容渲染。
 */
export default function LikeFollowList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [list, setList] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pages, setPages] = useState(1);
  /** 本地回关状态覆盖（记录 id → followedBack） */
  const [followOverride, setFollowOverride] = useState<Record<string, number>>({});

  const fetchList = useCallback(async (pn: number, append: boolean) => {
    try {
      const res = await API.interaction.likeList({ pageNum: pn, pageSize: 20 });
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
    // 进入页面即把「点赞与关注」组通知置已读（后端改造项 3.3，未上线静默）
    API.message.interactionRead({ group: 'like' }).catch(() => {});
  }, [fetchList]);

  /** 回关（figma 39 关注项右侧「回关」按钮） */
  const onFollowBack = useCallback(async (item: any) => {
    const key = String(item.id);
    const targetUserId = item.userInfoVo?.userId ?? item.userId;
    if (!targetUserId) return;
    setFollowOverride(prev => ({ ...prev, [key]: 1 }));
    try {
      await API.user.followOperate({ targetUserId, isFollow: 1 });
    } catch {
      setFollowOverride(prev => ({ ...prev, [key]: 0 }));
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const kind = item.kind ?? KIND_BBS_LIKE;
      const name = item.userInfoVo?.nickname || item.userInfoVo?.username || '访客';
      const targetUserId = item.userInfoVo?.userId ?? item.userId;
      const followedBack = followOverride[String(item.id)] ?? item.followedBack ?? 0;
      const onPress = () => {
        if (kind === KIND_FOLLOW) {
          if (targetUserId) navigation.navigate('userHome', { userId: targetUserId });
        } else if (item.bbsId != null) {
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
                {kind === KIND_FOLLOW ? (
                  '关注了你'
                ) : kind === KIND_COMMENT_LIKE ? (
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
            {kind === KIND_FOLLOW ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.followBtn, followedBack === 1 && styles.followBtnDone]}
                onPress={() => onFollowBack(item)}
                disabled={followedBack === 1}
              >
                <Text style={[styles.followBtnText, followedBack === 1 && styles.followBtnTextDone]}>
                  {followedBack === 1 ? '已关注' : '回关'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <ChevronRight />
          </TouchableOpacity>
          {index < list.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      );
    },
    [navigation, followOverride, list.length, onFollowBack],
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
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>暂无点赞与关注</Text>
            </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: setSpText(14),
    color: TEXT_SUB,
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
  followBtn: {
    width: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(14),
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnDone: {
    borderColor: DIVIDER,
  },
  followBtnText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: PRIMARY,
  },
  followBtnTextDone: {
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: scaleSizeW(77),
    marginRight: scaleSizeW(16),
    marginVertical: scaleSizeH(20),
  },
});
