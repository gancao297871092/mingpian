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
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import { API } from '@/api';
import { useUserStore, type UserInfo, type WqUser } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CompanyIcon, MessageIcon, TabCommentIcon, TabFavIcon, TabLikeIcon } from './myIcons';
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollXJS = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  const barDarkRef = useRef(false);
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
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const tasks: Promise<unknown>[] = [];
    const handle = tabRefs[TAB_KEYS[pageIndexRef.current]];
    if (handle) tasks.push(handle.onRefresh());
    fetchProfile();
    Promise.all(tasks).finally(() => setRefreshing(false));
  }, [tabRefs, fetchProfile]);

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
    { num: profile?.mutualCount ?? '-', label: '互关', ...(isSelf ? { tab: 'mutual' as const } : {}) },
    { num: profile?.followCount ?? 0, label: '关注', ...(isSelf ? { tab: 'follow' as const } : {}) },
    { num: profile?.fansCount ?? 0, label: '粉丝', ...(isSelf ? { tab: 'fans' as const } : {}) },
  ];

  const ipText = wqUser?.city || wqUser?.province || '';

  const stickRange: [number, number] = [Math.max(headerH - STICKY_NICK_H, 0), Math.max(headerH, 1)];
  const nickHeight = scrollY.interpolate({
    inputRange: stickRange,
    outputRange: [0, STICKY_NICK_H],
    extrapolate: 'clamp',
  });
  const topBarBg = scrollY.interpolate({
    inputRange: stickRange,
    outputRange: ['rgba(255,255,255,0)', '#FFFFFF'],
    extrapolate: 'clamp',
  });

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

  const minPagerHeight = Math.max(contentH - insets.top - tabBarH, 0);
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
        <Animated.View style={{ height: insets.top, backgroundColor: topBarBg }} />
        <Animated.FlatList
          ref={outerRef}
          style={styles.flex1}
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
            <View onLayout={e => setHeaderH(e.nativeEvent.layout.height)}>
              <View style={[styles.headerBtns, { marginTop: Math.max(scaleSizeH(61) - insets.top, scaleSizeH(8)) }]}>
                {!isSelf && <NavBackButton color="#FFFFFF" onPress={() => navigation.goBack()} />}
                {isSelf && (
                  <TouchableOpacity activeOpacity={0.8} style={styles.exitBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.exitBtnText}>退出预览</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.profileRow}>
                <ExpoImage
                  source={{ uri: wqUser?.avatar || 'https://i.pravatar.cc/100?img=8' }}
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
                      <Text style={[styles.followBtnText, followed && styles.followBtnTextDone]}>
                        {followed ? '已关注' : '关注'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} style={styles.msgBtn} onPress={todo}>
                      <MessageIcon size={22} color="#333333" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ) : index === 1 ? (
            <Animated.View>
              <Animated.View style={[styles.stickyNick, { height: nickHeight, backgroundColor: '#fff' }]}>
                <View style={styles.stickyNickInner}>
                  <Text style={styles.stickyName} numberOfLines={1}>
                    {wqUser?.username || wqUser?.nickname || ''}
                  </Text>
                  {!isSelf && (
                    <View style={styles.stickyLeft}>
                      <NavBackButton color="#000000" onPress={() => navigation.goBack()} />
                    </View>
                  )}
                  {isSelf && (
                    <TouchableOpacity activeOpacity={0.8} style={styles.exitBtnSticky} onPress={() => navigation.goBack()}>
                      <Text style={styles.exitBtnText}>退出预览</Text>
                    </TouchableOpacity>
                  )}
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
  exitBtnSticky: {
    position: 'absolute',
    right: scaleSizeW(15),
    height: scaleSizeH(32),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeW(16),
    backgroundColor: '#F3F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: '#000000',
  },
  stickyLeft: {
    position: 'absolute',
    left: scaleSizeW(16),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(2),
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
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(20),
  },
  followBtn: {
    flex: 1,
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnDone: {
    backgroundColor: '#F3F3F1',
  },
  followBtnText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  followBtnTextDone: {
    color: '#6C6C6C',
  },
  msgBtn: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: '#F3F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyNick: {
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
