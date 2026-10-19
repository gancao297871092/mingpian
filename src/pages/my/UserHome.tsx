import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import Reanimated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore, type UserInfo, type WqUser } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BackArrowIcon, ChatBubbleIcon, CompanyIcon, PlusIcon, TabCommentIcon, TabFavIcon, TabLikeIcon } from './myIcons';
import WaterfallTab from './tabs/WaterfallTab';
import CommentTab from './tabs/CommentTab';
import LikeTab from './tabs/LikeTab';
import LikesDialog from './LikesDialog';
import type { TabHandle } from './tabs/common';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';
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

/** 66.预览主页：兼作他人主页（传 userId），相比「64.我的」去掉名片区与管理区 */
export default function UserHome() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'userHome'>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { userInfo: selfInfo, setUserInfo } = useUserStore();
  const myId = selfInfo?.wqUser?.id ?? 0;
  const targetUserId = route.params?.userId;
  const isSelf = !targetUserId || targetUserId === myId;
  /** 预览模式：仅从编辑资料「预览」进入，显示「退出预览」；其余（含自己主页）显示返回键 */
  const isPreview = isSelf && route.params?.preview === true;

  const [otherInfo, setOtherInfo] = useState<UserInfo | null>(null);
  const [followed, setFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const profile: UserInfo | null = isSelf ? selfInfo : otherInfo;
  const wqUser: WqUser | undefined = profile?.wqUser;
  const listUserId = isSelf ? undefined : targetUserId;

  const [pageIndex, setPageIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [likesVisible, setLikesVisible] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<{ x: number; w: number }[]>([]);
  const [listHeights, setListHeights] = useState<Record<TabKey, number>>({
    post: 0,
    comment: 0,
    fav: 0,
    like: 0,
  });
  /** 垂直滚动：Reanimated 共享值，吸顶动画全程 UI 线程（对齐「我的」主页，避免 JS 线程布局抖动） */
  const scrollY = useSharedValue(0);
  /** headerH 的 UI 线程副本（吸顶插值区间依赖它） */
  const headerHSV = useSharedValue(0);
  const barDarkSV = useSharedValue(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollXJS = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  const barDarkRef = useRef(false);
  const [barDark, setBarDark] = useState(false);
  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const tabRefs = useRef<Record<TabKey, TabHandle | null>>({
    post: null,
    comment: null,
    fav: null,
    like: null,
  }).current;

  const activeTab = TAB_KEYS[pageIndex];
  const settledTab = TAB_KEYS[settledIndex];
  const scrollOffsetsRef = useRef<Record<TabKey, number>>({ post: 0, comment: 0, fav: 0, like: 0 }).current;
  const outerRef = useRef<any>(null);

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

  const fetchProfile = useCallback(() => {
    if (isSelf) {
      API.user.info()
        .then(res => res.data && setUserInfo(res.data))
        .catch(() => {});
    } else if (targetUserId) {
      API.user
        .homeInfo({ targetUserId })
        .then(res => {
          if (!res.data) return;
          const d = res.data;
          const ui = d.userInfo ?? {};
          setOtherInfo({
            ...ui,
            wqUser: ui.wqUser ? { ...ui.wqUser, cpName: ui.cpName } : undefined,
            followCount: ui.followCount ?? d.followCount,
            fansCount: ui.fansCount ?? d.fansCount,
            bbsCount: ui.bbsCount ?? d.bbsCount,
          });
          setFollowed(!!(d.isFollowed ?? ui.wqUser?.currentUserIsFollow));
        })
        .catch(() => {});
    }
  }, [isSelf, targetUserId, setUserInfo]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  useFocusEffect(
    useCallback(() => {
      barDarkRef.current = false;
      barDarkSV.value = false;
      setBarDark(false);
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [barDarkSV]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const tasks: Promise<unknown>[] = [];
    const handle = tabRefs[TAB_KEYS[pageIndexRef.current]];
    if (handle) tasks.push(handle.onRefresh());
    fetchProfile();
    Promise.all(tasks).finally(() => setRefreshing(false));
  }, [tabRefs, fetchProfile]);

  /** 记录各 tab 滚动位置（UI 线程每帧回调到 JS，仅写 ref） */
  const recordOffset = useCallback(
    (y: number) => {
      scrollOffsetsRef[TAB_KEYS[pageIndexRef.current]] = y;
    },
    [scrollOffsetsRef],
  );
  /** 吸顶状态切换：状态栏图标 + 返回按钮配色 */
  const onStickyChange = useCallback((dark: boolean) => {
    setBarDark(dark);
    StatusBar.setBarStyle(dark ? 'dark-content' : 'light-content');
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      runOnJS(recordOffset)(y);
      const dark = headerHSV.value > 0 && y >= headerHSV.value - STICKY_NICK_H;
      if (dark !== barDarkSV.value) {
        barDarkSV.value = dark;
        runOnJS(onStickyChange)(dark);
      }
    },
  });

  // headerH 同步给 UI 线程（吸顶插值区间依赖它）
  useEffect(() => {
    headerHSV.value = headerH;
  }, [headerH, headerHSV]);

  const onToggleFollow = useCallback(() => {
    if (!targetUserId || followBusy) return;
    const next = !followed;
    setFollowed(next);
    setFollowBusy(true);
    API.user
      .followOperate({ targetUserId, isFollow: next ? 1 : 0 })
      .catch(() => {
        setFollowed(!next);
        Toast.show({ type: 'error', text1: '操作失败，请重试' });
      })
      .finally(() => setFollowBusy(false));
  }, [targetUserId, followed, followBusy]);

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const stats: { num: string | number; label: string; tab?: 'mutual' | 'follow' | 'fans'; onPress?: () => void }[] = [
    { num: profile?.likeCount ?? 0, label: '获赞', ...(isSelf ? { onPress: () => setLikesVisible(true) } : {}) },
    // { num: profile?.mutualCount ?? '-', label: '互关', ...(isSelf ? { tab: 'mutual' as const } : {}) },
    { num: profile?.followCount ?? 0, label: '关注', ...(isSelf ? { tab: 'follow' as const } : {}) },
    { num: profile?.fansCount ?? 0, label: '粉丝', ...(isSelf ? { tab: 'fans' as const } : {}) },
  ];

  const ipText = wqUser?.city || wqUser?.province || '';

  // ---- 吸顶动画：滚动经过头部时昵称栏展开（figma 101），全程 UI 线程 ----
  /** 昵称栏高度 0→46 跟随滚动（Reanimated height 动画在 UI 线程布局，不抖） */
  const nickStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
      [0, STICKY_NICK_H],
      Extrapolation.CLAMP,
    ),
  }));
  /** 吸顶途中背景由透明渐变为白色（状态栏占位 + 昵称栏共用） */
  const topBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollY.value,
      [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
      ['rgba(255,255,255,0)', '#FFFFFF'],
    ),
  }));

  const position = Animated.divide(scrollX, windowWidth);
  const onTabPress = (i: number) => {
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

  /** 内层列表不滚动，需保证内容够长让外层可滚动（吸顶才能触发）；
   *  减去 bottomPad，使短内容时外层滚动正好停在头部完全收起处，避免吸顶后还有一截空白滚动区 */
  const minPagerHeight = Math.max(contentH - insets.top - tabBarH - scaleSizeH(100), 0);
  const pagerHeightFor = useCallback(
    (tab: TabKey) => Math.max(listHeights[tab] || 0, tab === 'like' ? scaleSizeH(500) : minPagerHeight),
    [listHeights, minPagerHeight],
  );
  const pagerHeight = pagerHeightFor(settledTab);

  const onSwiperMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (i < 0 || i >= TAB_KEYS.length) return;
      const tab = TAB_KEYS[i];
      tabRefs[tab]?.ensureLoaded?.();
      const saved = scrollOffsetsRef[tab] || 0;
      const viewportH = contentH - insets.top;
      const nextPagerH = pagerHeightFor(tab);
      const totalH = headerH + STICKY_NICK_H + tabBarH + nextPagerH + scaleSizeH(100);
      const maxOffset = Math.max(totalH - viewportH, 0);
      setSettledIndex(i);
      outerRef.current?.scrollToOffset({ offset: Math.min(saved, maxOffset), animated: false });
    },
    [windowWidth, tabRefs, scrollOffsetsRef, contentH, insets.top, pagerHeightFor, headerH, tabBarH],
  );

  const headerBtnsMT = isPreview
    ? Math.max(scaleSizeH(61) - insets.top, scaleSizeH(8))
    : Math.max(scaleSizeH(64) - insets.top, scaleSizeH(8));
  const profileRowMT = Math.max(scaleSizeH(107) - insets.top - headerBtnsMT - scaleSizeH(44), scaleSizeH(2));
  /** 吸顶过程中，覆盖层导航按钮平移到吸顶栏内（不跟随下拉） */
  const navStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
          [0, 1 - headerBtnsMT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const renderTabPage = (tab: TabKey) => (
    <View style={{ width: windowWidth, height: pagerHeight, backgroundColor: '#F6F7FB' }}>
      {tab === 'comment' ? (
        <CommentTab
          ref={h => { tabRefs.comment = h; }}
          targetUserId={listUserId}
          active={activeTab === 'comment'}
          onHeight={onListHeight('comment')}
        />
      ) : tab === 'like' ? (
        <LikeTab
          ref={h => { tabRefs.like = h; }}
          myId={myId}
          targetUserId={listUserId}
          active={activeTab === 'like'}
          onHeight={onListHeight('like')}
        />
      ) : (
        <WaterfallTab
          ref={h => { tabRefs[tab] = h; }}
          tab={tab}
          myId={myId}
          targetUserId={listUserId}
          active={activeTab === tab}
          draftCount={0}
          draftCover=""
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
        <Reanimated.View style={[{ height: insets.top }, topBarStyle]} />
        <Reanimated.FlatList
          ref={outerRef}
          style={styles.flex1}
          data={[0, 1, 2]}
          keyExtractor={(i: number) => String(i)}
          stickyHeaderIndices={[1]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => tabRefs[TAB_KEYS[pageIndexRef.current]]?.onEndReached()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<View style={styles.bottomPad} />}
          renderItem={({ index }: { index: number }) => index === 0 ? (
            <View onLayout={e => setHeaderH(e.nativeEvent.layout.height)}>
              <View style={[styles.headerBtns, { marginTop: headerBtnsMT }]} />
              <View style={[styles.profileRow, { marginTop: profileRowMT }]}>
                <ExpoImage
                  source={{ uri: wqUser?.avatar || '' }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.profileText}>
                  <Text style={styles.nickname}>{wqUser?.username || wqUser?.nickname || ''}</Text>
                  {!!wqUser?.cpName && (
                    <View style={styles.companyRow}>
                      <Text style={styles.companyText} numberOfLines={1}>{wqUser.cpName}</Text>
                      <CompanyIcon />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.profileCard}>
                <View style={styles.statsRow}>
                  {stats.map(s => (
                    <TouchableOpacity
                      key={s.label}
                      activeOpacity={s.tab || s.onPress ? 0.7 : 1}
                      style={styles.statItem}
                      disabled={!s.tab && !s.onPress}
                      onPress={() => (s.tab ? navigation.navigate('follows', { tab: s.tab }) : s.onPress?.())}
                    >
                      <Text style={styles.statNum}>{s.num}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!!wqUser?.des && <Text style={styles.signature}>{wqUser.des}</Text>}
                <View style={styles.chipsRow}>
                  {!!ipText && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>IP: {ipText}</Text>
                    </View>
                  )}
                  {wqUser?.authRealCard && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>已实名</Text>
                    </View>
                  )}
                </View>
                {!isSelf && (
                  <View style={styles.followRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.followBtn, followed && styles.followBtnDone]}
                      disabled={followBusy}
                      onPress={onToggleFollow}
                    >
                      {!followed && <PlusIcon size={14} />}
                      <Text style={[styles.followBtnText, followed && styles.followBtnTextDone]}>
                        {followed ? '已关注' : '关注'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} style={styles.msgBtn} onPress={todo}>
                      <ChatBubbleIcon size={18} color="#000000" />
                      <Text style={styles.msgBtnText}>发私信</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ) : index === 1 ? (
            <Animated.View>
              <Reanimated.View style={[styles.stickyNick, nickStyle]}>
                <View style={styles.stickyNickInner}>
                  <Text style={styles.stickyName} numberOfLines={1}>
                    {wqUser?.username || wqUser?.nickname || ''}
                  </Text>
                </View>
              </Reanimated.View>
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
        <Reanimated.View
          pointerEvents="box-none"
          style={[
            styles.navOverlay,
            {
              paddingTop: insets.top,
              marginTop: headerBtnsMT,
            },
            navStyle,
          ]}
        >
          <View style={styles.navOverlayRow} pointerEvents="box-none">
            {!isPreview && (
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={8}
                style={[styles.backCircle, barDark && styles.backCircleOnSticky]}
                onPress={() => navigation.goBack()}
              >
                <BackArrowIcon size={20} color={barDark ? '#000000' : '#FFFFFF'} />
              </TouchableOpacity>
            )}
            {isPreview && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.exitBtn, barDark && styles.exitBtnOnSticky]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.exitBtnText}>退出预览</Text>
              </TouchableOpacity>
            )}
          </View>
        </Reanimated.View>
      </View>
      <LikesDialog
        visible={likesVisible}
        nickname={wqUser?.username || wqUser?.nickname || ''}
        likeCount={profile?.likeCount ?? 0}
        bbsCount={profile?.bbsCount ?? 0}
        favoriteCount={profile?.favoriteCount ?? 0}
        onClose={() => setLikesVisible(false)}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: scaleSizeH(44),
    paddingHorizontal: scaleSizeW(15),
  },
  exitBtn: {
    width: scaleSizeW(85),
    height: scaleSizeH(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  exitBtnOnSticky: {
    backgroundColor: '#F3F3F1',
  },
  exitBtnText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: '#000000',
  },
  navOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scaleSizeW(15),
  },
  navOverlayRow: {
    height: scaleSizeH(44),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backCircle: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
    borderRadius: scaleSizeW(16.5),
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCircleOnSticky: {
    backgroundColor: 'transparent',
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
    color: '#42E27E',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    marginTop: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(18),
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
  signature: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(24),
    marginTop: scaleSizeH(10),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(6),
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
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  followBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  followBtnDone: {
    backgroundColor: '#F3F3F1',
  },
  followBtnText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  followBtnTextDone: {
    color: '#000000',
  },
  msgBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: '#F3F3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  msgBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  stickyNick: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  stickyNickInner: {
    height: STICKY_NICK_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(85),
  },
  stickyName: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
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
