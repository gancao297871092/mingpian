import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { listDrafts } from '@/utils/draftStore';
import {
  CardBoxIcon,
  CompanyIcon,
  EntryCertIcon,
  EntryChanceIcon,
  EntryCompanyIcon,
  EntryHistoryIcon,
  EntryWorkbenchIcon,
  MessageIcon,
  MyCardIcon,
  ServiceIcon,
  SettingsIcon,
  TabCommentIcon,
  TabFavIcon,
  TabLikeIcon,
} from './myIcons';
import WaterfallTab from './tabs/WaterfallTab';
import CommentTab from './tabs/CommentTab';
import type { TabHandle } from './tabs/common';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';
/** 吸顶后顶部昵称栏高度（figma 101） */
const STICKY_NICK_H = 46;

type TabKey = 'post' | 'comment' | 'fav' | 'like';

const TAB_KEYS: TabKey[] = ['post', 'comment', 'fav', 'like'];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'post', label: '发布' },
  { key: 'comment', label: '评论' },
  { key: 'fav', label: '收藏' },
  { key: 'like', label: '点赞' },
];

const TAB_ICONS: Record<TabKey, (color: string) => React.ReactNode> = {
  post: () => null,
  comment: color => <TabCommentIcon color={color} />,
  fav: color => <TabFavIcon color={color} />,
  like: color => <TabLikeIcon color={color} />,
};

export default function My() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { token, userInfo, setUserInfo, logout } = useUserStore();
  const wqUser = userInfo?.wqUser;
  const myId = wqUser?.id ?? 0;

  const [pageIndex, setPageIndex] = useState(0);
  /** 横向滑动已停稳的页码：高度切换/位置恢复以它为准（滑动途中不动，避免跳变） */
  const [settledIndex, setSettledIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [draftCover, setDraftCover] = useState('');
  const [headerH, setHeaderH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<{ x: number; w: number }[]>([]);
  /** 各 tab 列表内容高度（内层列表不滚动，由最外层 FlatList 统一滚动） */
  const [listHeights, setListHeights] = useState<Record<TabKey, number>>({
    post: 0,
    comment: 0,
    fav: 0,
    like: 0,
  });
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  /** JS 侧副本，驱动标签颜色/图标跟手渐变（原生驱动只用于下指示器位移） */
  const scrollXJS = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  const barDarkRef = useRef(false);
  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  /** 各 tab 列表的刷新/加载句柄（guideHome 同款 ref 转发） */
  const tabRefs = useRef<Record<TabKey, TabHandle | null>>({
    post: null,
    comment: null,
    fav: null,
    like: null,
  }).current;

  const activeTab = TAB_KEYS[pageIndex];
  const settledTab = TAB_KEYS[settledIndex];

  /** 各 tab 记住自己的垂直滚动位置 */
  const scrollOffsetsRef = useRef<Record<TabKey, number>>({ post: 0, comment: 0, fav: 0, like: 0 }).current;
  const outerRef = useRef<any>(null);

  // 左右滑动 -> 页码（驱动对应列表懒加载）
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      scrollXJS.setValue(value);
      const i = Math.round(value / windowWidth);
      if (i >= 0 && i < TAB_KEYS.length && i !== pageIndexRef.current) {
        setPageIndex(i);
      }
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, scrollXJS, windowWidth]);

  // 每次进入页面刷新资料与草稿数
  useFocusEffect(
    useCallback(() => {
      const drafts = listDrafts();
      setDraftCount(drafts.length);
      const latest = drafts[0];
      setDraftCover(latest ? latest.videoCover || latest.cover || latest.images[0] || '' : '');
      if (token) {
        API.user.info()
          .then(res => res.data && setUserInfo(res.data))
          .catch(() => { });
      }
    }, [token, setUserInfo]),
  );

  // 无系统头：状态栏直接压在背景图上，需白色图标；吸顶后背景变白切回深色
  useFocusEffect(
    useCallback(() => {
      barDarkRef.current = false;
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const tasks: Promise<unknown>[] = [];
    const handle = tabRefs[TAB_KEYS[pageIndexRef.current]];
    if (handle) tasks.push(handle.onRefresh());
    if (token) {
      tasks.push(
        API.user.info()
          .then(res => res.data && setUserInfo(res.data))
          .catch(() => { }),
      );
    }
    Promise.all(tasks).finally(() => setRefreshing(false));
  }, [token, setUserInfo, tabRefs]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      scrollY.setValue(y);
      scrollOffsetsRef[TAB_KEYS[pageIndexRef.current]] = y;
      const dark = headerH > 0 && y >= headerH - STICKY_NICK_H;
      if (dark !== barDarkRef.current) {
        barDarkRef.current = dark;
        StatusBar.setBarStyle(dark ? 'dark-content' : 'light-content');
      }
    },
    [scrollY, headerH, scrollOffsetsRef],
  );

  const onSettings = () => {
    Alert.alert('设置', '', [
      { text: '取消', style: 'cancel' },
      { text: '退出登录', style: 'destructive', onPress: logout },
    ]);
  };

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const stats: { num: string | number; label: string }[] = [
    { num: userInfo?.likeCount ?? 0, label: '获赞' },
    { num: '-', label: '互关' },
    { num: userInfo?.followCount ?? 0, label: '关注' },
    { num: userInfo?.fansCount ?? 0, label: '粉丝' },
  ];

  const entries: { label: string; icon: React.ReactNode; badge?: number; onPress: () => void }[] = [
    { label: '企业管理', icon: <EntryCompanyIcon />, onPress: todo },
    { label: '我的商机', icon: <EntryChanceIcon />, badge: 2, onPress: todo },
    { label: '业务员工作台', icon: <EntryWorkbenchIcon />, badge: 2, onPress: todo },
    { label: '认证中心', icon: <EntryCertIcon />, onPress: todo },
    { label: '浏览记录', icon: <EntryHistoryIcon />, onPress: todo },
  ];

  const regionText = [wqUser?.province, wqUser?.city].filter(Boolean).join('·');

  // ---- 吸顶动画：滚动经过头部时展开昵称栏（figma 101） ----
  const stickRange: [number, number] = [Math.max(headerH - STICKY_NICK_H, 0), Math.max(headerH, 1)];
  const nickHeight = scrollY.interpolate({
    inputRange: stickRange,
    outputRange: [0, STICKY_NICK_H],
    extrapolate: 'clamp',
  });
  /** 吸顶途中背景由透明渐变为白色（状态栏占位 + 昵称栏共用） */
  const topBarBg = scrollY.interpolate({
    inputRange: stickRange,
    outputRange: ['rgba(255,255,255,0)', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  // ---- 下指示器与标签颜色：跟随横向滚动（跟手） ----
  const position = Animated.divide(scrollX, windowWidth);
  const onTabPress = (i: number) => {
    // 点击即开始加载目标页数据，不等滑动结束
    tabRefs[TAB_KEYS[i]]?.ensureLoaded?.();
    swiperRef.current?.scrollToOffset({ offset: i * windowWidth, animated: true });
  };
  const indicatorTranslate =
    tabLayouts.length === TAB_KEYS.length
      ? position.interpolate({
        inputRange: TAB_KEYS.map((_, i) => i),
        outputRange: tabLayouts.map(l => l.x + (l.w - scaleSizeW(24)) / 2),
        extrapolate: 'clamp',
      })
      : 0;

  const onListHeight = useCallback(
    (tab: TabKey) => (h: number) => {
      setListHeights(prev => (prev[tab] === h ? prev : { ...prev, [tab]: h }));
    },
    [],
  );

  /** 内层列表不滚动，需保证内容够长让外层可滚动（吸顶才能触发） */
  const minPagerHeight = Math.max(contentH - insets.top - tabBarH, 0);
  /** 分页器高度跟随已停稳 tab 的内容高度（自己是自己的高度） */
  const pagerHeight = Math.max(listHeights[settledTab], minPagerHeight);

  // 横向滑动停稳：切高度、恢复该 tab 自己的滚动位置（夹紧到当前内容最大滚动范围，避免空白）
  const onSwiperMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (i < 0 || i >= TAB_KEYS.length) return;
      const tab = TAB_KEYS[i];
      tabRefs[tab]?.ensureLoaded?.();
      const saved = scrollOffsetsRef[tab] || 0;
      const viewportH = contentH - insets.top;
      const nextPagerH = Math.max(listHeights[tab], minPagerHeight);
      const totalH = headerH + STICKY_NICK_H + tabBarH + nextPagerH + scaleSizeH(100);
      const maxOffset = Math.max(totalH - viewportH, 0);
      setSettledIndex(i);
      outerRef.current?.scrollToOffset({ offset: Math.min(saved, maxOffset), animated: false });
    },
    [windowWidth, tabRefs, scrollOffsetsRef, contentH, insets.top, listHeights, minPagerHeight, headerH, tabBarH],
  );

  const renderTabPage = (tab: TabKey) => (
    <View style={{ width: windowWidth, height: pagerHeight, backgroundColor: '#F6F7FB' }}>
      {tab === 'comment' ? (
        <CommentTab
          ref={h => { tabRefs.comment = h; }}
          active={activeTab === 'comment'}
          onHeight={onListHeight('comment')}
        />
      ) : (
        <WaterfallTab
          ref={h => { tabRefs[tab] = h; }}
          tab={tab}
          myId={myId}
          active={activeTab === tab}
          draftCount={draftCount}
          draftCover={draftCover}
          onHeight={onListHeight(tab)}
        />
      )}
    </View>
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.flex1} onLayout={e => setContentH(e.nativeEvent.layout.height)}>
        <View style={[StyleSheet.absoluteFill, { paddingBottom: scaleSizeH(80) }]}>
          <View style={{ height: '75%', overflow: 'hidden', width: '100%', }}>
            <ExpoImage
              source={require('@/assets/my/my/header_bg.png')}
              style={{
                height: scaleSizeH(800),
                width: '100%',
              }}
            />
          </View>
        </View>
        <Animated.View style={{
          height: insets.top,
          backgroundColor: topBarBg,
        }} />
        <Animated.FlatList
          ref={outerRef}
          style={[styles.flex1]}
          data={[0, 1, 2]}
          keyExtractor={(i: number) => String(i)}
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => tabRefs[TAB_KEYS[pageIndexRef.current]]?.onEndReached()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<View style={styles.bottomPad} />}
          renderItem={({ index }: { index: number }) => index === 0 ? (
            <View style={{ position: 'relative' }} onLayout={e => setHeaderH(e.nativeEvent.layout.height)}>
              <View style={styles.headerIcons}>
                {/* <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={onSettings}>
                  <SettingsIcon />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={todo}>
                  <MessageIcon />
                </TouchableOpacity> */}
                <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={todo}>
                  <ServiceIcon />
                </TouchableOpacity>
              </View>
              <View style={styles.profileRow}>
                <ExpoImage
                  source={{ uri: wqUser?.avatar || 'https://i.pravatar.cc/100?img=8' }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.profileText}>
                  <Text style={styles.nickname}>{wqUser?.nickname || wqUser?.username || '未登录'}</Text>
                  {!!wqUser?.cpName && (
                    <View style={styles.companyRow}>
                      <Text style={styles.companyText} numberOfLines={1}>{wqUser.cpName}</Text>
                      <CompanyIcon />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.entryCards}>
                <TouchableOpacity activeOpacity={0.8} style={styles.entryCard} onPress={() => navigation.navigate('editCard', {})}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MyCardIcon />
                      <Text style={styles.entryCardTitle}>我的名片</Text>
                    </View>
                    <Text style={styles.entryCardSub}>个人名片3/5 · 企业名片</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={styles.entryCard} onPress={todo}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <CardBoxIcon />
                      <Text style={styles.entryCardTitle}>名片夹</Text>
                    </View>
                    <Text style={styles.entryCardSub}>已存3张名片</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.statsRow}>
                  {stats.map(s => (
                    <View key={s.label} style={styles.statItem}>
                      <Text style={styles.statNum}>{s.num}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                  <TouchableOpacity activeOpacity={0.7} style={styles.editBtn} onPress={() => navigation.navigate('editProfile')}>
                    <Text style={styles.editBtnText}>编辑主页</Text>
                  </TouchableOpacity>
                </View>
                {!!wqUser?.des && <Text style={styles.signature}>{wqUser.des}</Text>}
                <View style={styles.chipsRow}>
                  {!!regionText && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{regionText}</Text>
                    </View>
                  )}
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{regionText}</Text>
                  </View>
                  {wqUser?.authRealCard && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>已实名</Text>
                    </View>
                  )}
                </View>
                <View style={styles.entriesRow}>
                  {entries.map(e => (
                    <TouchableOpacity key={e.label} activeOpacity={0.7} style={styles.entryItem} onPress={e.onPress}>
                      <View style={{ position: 'relative' }}>
                        {e.icon}
                        {!!e.badge && (
                          <View style={styles.entryBadge}>
                            <Text style={styles.entryBadgeText}>{e.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.entryText}>{e.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : index === 1 ? (
            /* 吸顶单元：昵称栏（吸顶后展开，figma 101）+ tab 行 */
            <Animated.View>
              <Animated.View style={[styles.stickyNick, { height: nickHeight, backgroundColor: '#fff' }]}>
                <View style={styles.stickyNickInner}>
                  <Text style={styles.stickyName} numberOfLines={1}>
                    {wqUser?.nickname || wqUser?.username || ''}
                  </Text>
                  <View style={styles.stickyIcons}>
                    {/* <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={onSettings}>
                      <SettingsIcon color="#000000" />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={todo}>
                      <MessageIcon color="#000000" />
                    </TouchableOpacity> */}
                    <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={todo}>
                      <ServiceIcon color="#000000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
              <Animated.View
                style={[styles.tabCard, { backgroundColor: '#fff' }]}
                onLayout={e => setTabBarH(e.nativeEvent.layout.height)}
              >
                <View style={styles.tabBar}>
                  {TABS.map((t, i) => {
                    const textColor = scrollXJS.interpolate({
                      inputRange: [i - 1, i, i + 1],
                      outputRange: ['#6C6C6C', '#000000', '#6C6C6C'],
                      extrapolate: 'clamp',
                    });
                    const iconBlack = scrollXJS.interpolate({
                      inputRange: [i - 1, i, i + 1],
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp',
                    });
                    return (
                      <TouchableOpacity
                        key={t.key}
                        activeOpacity={0.7}
                        style={styles.tabItem}
                        onLayout={e => {
                          const { x, width } = e.nativeEvent.layout;
                          setTabLayouts(prev => {
                            if (prev[i] && prev[i].x === x && prev[i].w === width) return prev;
                            const next = [...prev];
                            next[i] = { x, w: width };
                            return next;
                          });
                        }}
                        onPress={() => onTabPress(i)}
                      >
                        <View style={styles.tabIconWrap}>
                          <Animated.View style={{ opacity: Animated.subtract(1, iconBlack) }}>
                            {TAB_ICONS[t.key]('#6C6C6C')}
                          </Animated.View>
                          <Animated.View style={[styles.tabIconActive, { opacity: iconBlack }]}>
                            {TAB_ICONS[t.key]('#000000')}
                          </Animated.View>
                        </View>
                        <Animated.Text style={[styles.tabText, { color: textColor }, pageIndex === i && styles.tabTextActive]}>
                          {t.label}
                        </Animated.Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {tabLayouts.length === TAB_KEYS.length && (
                  <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: indicatorTranslate }] }]} />
                )}
              </Animated.View>
            </Animated.View>
          ) : (
            /* 横向翻页：发布 / 评论 / 收藏 / 点赞 */
            <Animated.FlatList
              ref={swiperRef}
              style={{ height: pagerHeight }}
              horizontal
              pagingEnabled
              bounces={false}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              data={TAB_KEYS}
              keyExtractor={(t: TabKey) => t}
              getItemLayout={(_data, i) => ({ length: windowWidth, offset: windowWidth * i, index: i })}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
              onMomentumScrollEnd={onSwiperMomentumEnd}
              scrollEventThrottle={16}
              renderItem={({ item }: { item: TabKey }) => renderTabPage(item)}
            />
          )}
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(6),
  },
  headerIconBtn: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
    borderRadius: scaleSizeW(16.5),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
  },
  avatar: {
    width: scaleSizeW(80),
    height: scaleSizeW(80),
    borderRadius: scaleSizeW(40),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  profileText: {
    marginLeft: scaleSizeW(10),
    flex: 1,
  },
  nickname: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: scaleSizeH(24),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    marginTop: scaleSizeH(8),
  },
  companyText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#5CE991',
  },
  entryCards: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(24),
  },
  entryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    height: scaleSizeH(53),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: scaleSizeW(13),
  },
  entryCardTitle: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: scaleSizeW(4),
  },
  entryCardSub: {
    fontSize: setSpText(10),
    color: 'rgba(255,255,255,0.7)',
    marginTop: scaleSizeH(2),
  },
  profileCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    marginTop: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(16),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(27),
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
    lineHeight: scaleSizeH(24),
  },
  statLabel: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginTop: scaleSizeH(2),
  },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeH(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F3F3F1',
  },
  editBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  signature: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(24),
    marginTop: scaleSizeH(10),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  chip: {
    backgroundColor: '#F3F3F1',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
  },
  chipText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
  },
  entriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  entryItem: {
    alignItems: 'center',
    gap: scaleSizeH(2),
  },
  entryText: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  entryBadge: {
    position: 'absolute',
    top: -scaleSizeH(3),
    right: -scaleSizeW(8),
    height: scaleSizeH(14),
    minWidth: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(4),
    borderRadius: scaleSizeW(7),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  stickyNick: {
    overflow: 'hidden',
  },
  stickyNickInner: {
    height: STICKY_NICK_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
  },
  stickyName: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    marginRight: scaleSizeW(12),
  },
  stickyIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(20),
  },
  tabCard: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingHorizontal: scaleSizeW(16),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingVertical: scaleSizeH(12),
  },
  tabIconWrap: {
    justifyContent: 'center',
  },
  tabIconActive: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tabText: {
    fontSize: setSpText(15),
    color: '#6C6C6C',
  },
  tabTextActive: {
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: scaleSizeW(24),
    height: 2,
    borderRadius: 2,
    backgroundColor: BLUE,
  },
  bottomPad: {
    width: '100%',
    height: scaleSizeH(100),
    backgroundColor: '#F6F7FB',
  },
});
