import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { useMessageUnreadStore } from '@/store/message';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  ChevronRight,
  DIVIDER,
  MsgAvatar,
  PRIMARY,
  TEXT_MAIN,
  TEXT_SUB,
  formatListTime,
} from './common';

/**
 * 新增关注（互动消息详情，由「点赞与关注」拆出）
 * 数据：GET /v1/interaction/follow/list（每项 {id, kind:3, userId, userInfoVo, followedBack, isRead, createTime}，关注时间倒序分页）；
 * 进页即整组已读：POST /message/interaction/read {group:'follow'}。
 */
export default function FollowList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [list, setList] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pages, setPages] = useState(1);
  /** 本地回关状态覆盖（记录 id → followedBack） */
  const [followOverride, setFollowOverride] = useState<Record<string, number>>({});
  /** 整组已读是否已完成：已完成后到的分页数据本地同步清红点 */
  const readDoneRef = useRef(false);

  const fetchList = useCallback(async (pn: number, append: boolean) => {
    try {
      const res = await API.interaction.followList({ pageNum: pn, pageSize: 20 });
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
    // 进入页面即把「关注」组通知置已读（清红点），并同步清掉列表项红点
    API.message
      .interactionRead({ group: 'follow' })
      .then(() => {
        readDoneRef.current = true;
        useMessageUnreadStore.getState().fetchUnread();
        setList(prev => prev.map(it => (it.isRead === 0 ? { ...it, isRead: 1 } : it)));
      })
      .catch(() => {});
  }, [fetchList]);

  /** 回关（右侧「回关」按钮；followedBack=1 已回关置灰禁用） */
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
      const name = item.userInfoVo?.nickname || item.userInfoVo?.username || '访客';
      const targetUserId = item.userInfoVo?.userId ?? item.userId;
      const followedBack = followOverride[String(item.id)] ?? item.followedBack ?? 0;
      return (
        <View>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.itemRow}
            onPress={() => targetUserId && navigation.navigate('userHome', { userId: targetUserId })}
          >
            <MsgAvatar uri={item.userInfoVo?.avatar} name={name} showDot={item.isRead === 0} />
            <View style={styles.itemBody}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.content} numberOfLines={2}>
                关注了你
              </Text>
              <Text style={styles.time}>{formatListTime(item.createTime)}</Text>
            </View>
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
        keyExtractor={(item, i) => `follow-${item.id ?? i}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (loaded && pageNum < pages) fetchList(pageNum + 1, true);
        }}
        ListEmptyComponent={
          loaded ? (
            <EmptyState variant="content" title="暂无新增关注" style={styles.emptyBox} />
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
