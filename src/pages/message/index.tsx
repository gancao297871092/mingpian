import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  ChevronRight,
  DIVIDER,
  LIKE_RED,
  MsgAvatar,
  PRIMARY,
  RED,
  TEXT_DESC,
  TEXT_MAIN,
  TEXT_SUB,
  UnreadBadge,
  formatListTime,
} from './common';

type TabKey = 'private' | 'interaction' | 'system';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'private', label: '私信' },
  { key: 'interaction', label: '互动' },
  { key: 'system', label: '系统' },
];

/** 系统消息来源图标（按 senderName/msgCode 映射颜色，figma 31：联诚助手蓝/企业认证中心绿/账号安全中心橙） */
function sysIconOf(item: API.message.SysMessage): { bg: string; icon: number } {
  const key = `${item.senderName ?? ''}${item.msgCode ?? ''}`;
  if (/认证|CERT/i.test(key)) return { bg: '#36BE69', icon: require('@/assets/message/icon_sys_cert.png') };
  if (/安全|SECURITY|ACCOUNT/i.test(key)) return { bg: '#F2722C', icon: require('@/assets/message/icon_sys_security.png') };
  return { bg: PRIMARY, icon: require('@/assets/message/icon_sys_assist.png') };
}

/** 29.消息（私信/互动/系统）：自定义头部压在渐变上，上滑时头部变白底（figma 29.页面上画效果） */
export default function MessagePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [tab, setTab] = useState<TabKey>('private');
  /** 列表上滑后头部变白底 + 底部细线 */
  const [scrolled, setScrolled] = useState(false);
  /** 推送通知横幅（可关闭，关闭后白色容器上移，figma 31 为关闭态） */
  const [bannerVisible, setBannerVisible] = useState(false);

  const [privateList, setPrivateList] = useState<any[]>([]);
  const [privateLoaded, setPrivateLoaded] = useState(false);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof API.message.interactionSummary>>['data'] | null>(null);
  const [sysList, setSysList] = useState<API.message.SysMessage[]>([]);
  const [sysCount, setSysCount] = useState(0);
  const [sysLoaded, setSysLoaded] = useState(false);
  const [sysPageNum, setSysPageNum] = useState(1);
  const [sysPages, setSysPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // ===== 数据加载 =====
  const loadPrivate = useCallback(async () => {
    try {
      const res = await API.message.list({ pageNum: 1, pageSize: 50 });
      setPrivateList(res.data?.list ?? []);
    } catch {
      // 拦截器已提示
    } finally {
      setPrivateLoaded(true);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await API.message.interactionSummary();
      setSummary(res.data ?? null);
    } catch {
      // 后端改造项未上线时静默降级：仅不显示角标/摘要
    }
  }, []);

  const loadSys = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const res = await API.message.sysPage({ pageNum, pageSize: 20 });
      const list = res.data?.list ?? [];
      setSysList(prev => (append ? [...prev, ...list] : list));
      setSysPageNum(res.data?.pageNum ?? pageNum);
      setSysPages(res.data?.pages ?? 1);
    } catch {
      // 拦截器已提示
    } finally {
      setSysLoaded(true);
    }
  }, []);

  const loadSysCount = useCallback(async () => {
    try {
      const res = await API.message.sys();
      setSysCount(Number(res.data?.sysCount ?? 0));
    } catch {
      // 静默
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.allSettled([loadPrivate(), loadSummary(), loadSys(1, false), loadSysCount()]);
  }, [loadPrivate, loadSummary, loadSys, loadSysCount]);

  /** 每次聚焦刷新（从 38/39/系统详情返回后角标需同步） */
  useEffect(() => {
    if (isFocused) loadAll();
  }, [isFocused, loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // 上滑白底头效果暂停用（listProps 中 onScroll 已注释），保留以便恢复
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolled(e.nativeEvent.contentOffset.y > 10);
  }, []);

  // ===== 未读角标 =====
  const privateUnread = useMemo(
    () => privateList.reduce((sum, it) => sum + (Number(it.noReadCount) || 0), 0),
    [privateList],
  );
  const interactionUnread = (summary?.commentUnread ?? 0) + (summary?.likeUnread ?? 0);

  // ===== 全部已读（按当前 tab 走对应接口） =====
  const onReadAll = useCallback(async () => {
    try {
      if (tab === 'private') {
        await API.message.readAllPrivate();
        setPrivateList(prev => prev.map(it => ({ ...it, noReadCount: 0 })));
      } else if (tab === 'interaction') {
        await Promise.allSettled([
          API.message.interactionRead({ group: 'comment' }),
          API.message.interactionRead({ group: 'like' }),
        ]);
        setSummary(prev => (prev ? { ...prev, commentUnread: 0, likeUnread: 0 } : prev));
      } else {
        await API.message.sysReadAll();
        setSysCount(0);
        setSysList(prev => prev.map(it => ({ ...it, readStatus: 1 })));
      }
      Toast.show({ type: 'success', text1: '已全部已读' });
    } catch {
      // 后端改造项未上线时静默
    }
  }, [tab]);

  // ===== 私信 tab（figma 29）=====
  const renderPrivateItem = useCallback(
    ({ item }: { item: any }) => {
      const name = item.cpName || item.sendUserNickname || item.sendUsername || '未知用户';
      const lastContent = (item.content || '').includes('<custom-card>') ? '[名片]' : item.content || '';
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.row}
          onPress={() =>
            navigation.navigate('messageDetail', { userId: item.jsUserId, msgNumber: item.msgNumber })
          }
        >
          <MsgAvatar uri={item.sendUserAvatar} name={name} />
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.rowDesc} numberOfLines={1}>
              {lastContent}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowTime}>{formatListTime(item.msgTime)}</Text>
            <UnreadBadge count={item.noReadCount} />
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  // ===== 互动 tab（figma 30）=====
  const interactionEntries = useMemo(
    () => [
      {
        key: 'comment',
        title: '评论与回复',
        desc: summary?.commentLastContent || '查看收到的评论与回复',
        time: summary?.commentLastTime,
        unread: summary?.commentUnread ?? 0,
        bg: PRIMARY,
        icon: require('@/assets/message/icon_comment_white.png'),
        onPress: () => navigation.navigate('interactionComment'),
      },
      {
        key: 'like',
        title: '点赞与关注',
        desc: summary?.likeLastContent || '查看收到的赞和新粉丝',
        time: summary?.likeLastTime,
        unread: summary?.likeUnread ?? 0,
        bg: LIKE_RED,
        icon: require('@/assets/message/icon_like_white.png'),
        onPress: () => navigation.navigate('interactionLike'),
      },
    ],
    [summary, navigation],
  );

  // ===== 系统 tab（figma 31）=====
  const renderSysItem = useCallback(
    ({ item }: { item: API.message.SysMessage }) => {
      const { bg, icon } = sysIconOf(item);
      return (
        <View style={styles.sysCard}>
          <View style={styles.sysHeadRow}>
            <View style={[styles.sysIconBox, { backgroundColor: bg }]}>
              <ExpoImage source={icon} style={styles.sysIcon} contentFit="contain" />
            </View>
            <Text style={styles.sysSender}>{item.senderName || '联诚助手'}</Text>
            {item.readStatus === 0 ? <View style={styles.sysDot} /> : null}
            <Text style={styles.sysTime}>{formatListTime(item.createTime || item.sendTime)}</Text>
          </View>
          <Text style={styles.sysTitle} numberOfLines={1}>
            {item.msgTitle || ''}
          </Text>
          <Text style={styles.sysContent} numberOfLines={2}>
            {item.msgContent || ''}
          </Text>
          <View style={styles.sysDivider} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.sysDetailRow}
            onPress={() => navigation.navigate('sysMessageDetail', { id: item.id, item })}
          >
            <Text style={styles.sysDetailText}>查看详情</Text>
            <ChevronRight />
          </TouchableOpacity>
        </View>
      );
    },
    [navigation],
  );

  const emptyNode = useCallback(
    (text: string) => <EmptyState variant="content" title={text} style={styles.emptyBox} />,
    [],
  );

  const listProps = {
    // onScroll,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false as const,
    refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      {/* 顶部渐变背景（figma 椭圆 1 拷贝 1，opacity 0.3） */}
      <ExpoImage
        source={require('@/assets/message/msg_top_bg-60d5a1.png')}
        style={styles.topBg}
        contentFit="cover"
      />
      {/* 自定义头部：tab + 全部已读；上滑后白底（figma 29.页面上画效果） */}
      <View style={[styles.header, { paddingTop: insets.top }, scrolled && styles.headerScrolled]}>
        <View style={styles.tabRow}>
          {TABS.map(t => {
            const active = tab === t.key;
            const badge =
              t.key === 'private' ? privateUnread : t.key === 'interaction' ? interactionUnread : sysCount;
            return (
              <TouchableOpacity key={t.key} activeOpacity={0.7} onPress={() => setTab(t.key)}>
                <View style={styles.tabItem}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  <UnreadBadge count={badge} style={styles.tabBadge} />
                </View>
                {active ? <View style={styles.tabIndicator} /> : <View style={styles.tabIndicatorHolder} />}
              </TouchableOpacity>
            );
          })}
          <View style={styles.headerFlex} />
          <TouchableOpacity activeOpacity={0.7} style={styles.readAllBtn} onPress={onReadAll}>
            <ExpoImage source={require('@/assets/message/icon_readall.png')} style={styles.readAllIcon} />
            <Text style={styles.readAllText}>全部已读</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 推送通知横幅（可关闭，figma 29/30；31 为关闭态容器上移） */}
      {bannerVisible ? (
        <View style={styles.banner}>
          <ExpoImage
            source={require('@/assets/message/msg_hi_mascot-693729.png')}
            style={styles.bannerMascot}
            contentFit="contain"
          />
          <Text style={styles.bannerText} numberOfLines={1}>
            开启推送通知，重要消息不错过
          </Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.bannerBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.bannerBtnText}>去开启</Text>
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setBannerVisible(false)}
          >
            <ExpoImage source={require('@/assets/message/icon_close_blue.png')} style={styles.bannerClose} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 白色圆角容器 */}
      <View style={[styles.panel, bannerVisible ? styles.panelWithBanner : styles.panelNoBanner]}>
        {tab === 'private' ? (
          <FlatList
            data={privateList}
            keyExtractor={(item, i) => String(item.msgNumber ?? i)}
            renderItem={renderPrivateItem}
            ListEmptyComponent={
              privateLoaded ? emptyNode('暂无私信') : <ActivityIndicator style={styles.loading} color={PRIMARY} />
            }
            contentContainerStyle={styles.listContent}
            {...listProps}
          />
        ) : tab === 'interaction' ? (
          <FlatList
            data={interactionEntries}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={item.onPress}>
                <View style={[styles.entryIcon, { backgroundColor: item.bg }]}>
                  <ExpoImage source={item.icon} style={styles.entryIconImg} contentFit="contain" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    {item.desc}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>{formatListTime(item.time)}</Text>
                  <UnreadBadge count={item.unread} />
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            {...listProps}
          />
        ) : (
          <FlatList
            data={sysList}
            keyExtractor={item => String(item.id)}
            renderItem={renderSysItem}
            ListEmptyComponent={
              sysLoaded ? emptyNode('暂无系统消息') : <ActivityIndicator style={styles.loading} color={PRIMARY} />
            }
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (sysLoaded && sysPageNum < sysPages) loadSys(sysPageNum + 1, true);
            }}
            {...listProps}
          />
        )}
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  topBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: scaleSizeH(218),
    opacity: 0.3,
  },
  header: {
    paddingHorizontal: scaleSizeW(16),
  },
  headerScrolled: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleSizeH(10),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: scaleSizeW(30),
  },
  tabText: {
    fontSize: setSpText(17),
    fontWeight: '400',
    color: TEXT_DESC,
  },
  tabTextActive: {
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  tabBadge: {
    marginLeft: scaleSizeW(2),
    marginTop: scaleSizeH(-4),
  },
  tabIndicator: {
    width: scaleSizeW(34),
    height: scaleSizeH(2),
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginTop: scaleSizeH(6),
  },
  tabIndicatorHolder: {
    height: scaleSizeH(2),
    marginTop: scaleSizeH(6),
  },
  headerFlex: {
    flex: 1,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    paddingBottom: scaleSizeH(2),
  },
  readAllIcon: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
  },
  readAllText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: TEXT_DESC,
  },
  // 推送横幅
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(48),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    paddingLeft: scaleSizeW(66),
    paddingRight: scaleSizeW(10),
    backgroundColor: '#E0EAFF',
    borderRadius: scaleSizeW(24),
  },
  bannerMascot: {
    position: 'absolute',
    left: scaleSizeW(2),
    top: scaleSizeH(6),
    width: scaleSizeW(62),
    height: scaleSizeH(36),
  },
  bannerText: {
    flex: 1,
    fontSize: setSpText(12),
    fontWeight: '500',
    color: PRIMARY,
  },
  bannerBtn: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    marginRight: scaleSizeW(12),
  },
  bannerBtnText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#FFFFFF',
  },
  bannerClose: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    opacity: 0.5,
  },
  // 白色容器
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    overflow: 'hidden',
  },
  panelWithBanner: {
    marginTop: scaleSizeH(15),
  },
  panelNoBanner: {
    marginTop: scaleSizeH(20),
  },
  listContent: {
    paddingTop: scaleSizeH(20),
    // 避开底部悬浮 tabbar（LiquidGlassTabBar 高 scaleSizeH(80)），再留 24 间距
    paddingBottom: scaleSizeH(104),
    flexGrow: 1,
  },
  loading: {
    marginTop: scaleSizeH(60),
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
  },
  // 会话/入口行（figma 29/30）
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(24),
    gap: scaleSizeW(13),
  },
  rowBody: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  rowTitle: {
    fontSize: setSpText(14),
    color: TEXT_MAIN,
  },
  rowDesc: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: TEXT_SUB,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: scaleSizeH(8),
  },
  rowTime: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  entryIcon: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIconImg: {
    width: scaleSizeW(23),
    height: scaleSizeW(23),
  },
  // 系统消息卡片（figma 31）
  sysCard: {
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(20),
    paddingTop: scaleSizeH(14),
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    borderRadius: scaleSizeW(10),
  },
  sysHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    gap: scaleSizeW(5),
  },
  sysIconBox: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sysIcon: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
  },
  sysSender: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_MAIN,
  },
  sysDot: {
    width: scaleSizeW(7),
    height: scaleSizeW(7),
    borderRadius: scaleSizeW(4),
    backgroundColor: RED,
  },
  sysTime: {
    marginLeft: 'auto',
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  sysTitle: {
    marginTop: scaleSizeH(16),
    paddingHorizontal: scaleSizeW(14),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_MAIN,
  },
  sysContent: {
    paddingHorizontal: scaleSizeW(14),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_DESC,
  },
  sysDivider: {
    height: 1,
    marginTop: scaleSizeH(14),
    marginHorizontal: scaleSizeW(14),
    backgroundColor: '#F6F7FB',
  },
  sysDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
  },
  sysDetailText: {
    fontSize: setSpText(14),
    color: TEXT_MAIN,
  },
});
