import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import Reanimated, {
  Extrapolation,
  interpolate,
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
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import type { TabHandle } from '../tabs/common';
import { BackArrowIcon, BlueBadgeIcon, ChatBubbleIcon } from '../myIcons';
import CompanyPostList from './CompanyPostList';
import CompanyGallery from './CompanyGallery';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
/** 吸顶昵称栏高度（对齐 UserHome） */
const STICKY_NICK_H = 46;

type TabKey = 'post' | 'gallery';
const TAB_KEYS: TabKey[] = ['post', 'gallery'];
const TABS: { key: TabKey; label: string }[] = [
  { key: 'post', label: '最新动态' },
  { key: 'gallery', label: '可信档案' },
];

/** 地址定位小图标（figma 企业主页 2330:5993） */
function LocationIcon() {
  return (
    <Svg width={scaleSizeW(8)} height={scaleSizeW(10)} viewBox="0 0 8 10" fill="none">
      <Path
        d="M4 0C1.79 0 0 1.79 0 4c0 3 4 6 4 6s4-3 4-6c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 4 2.5a1.5 1.5 0 0 1 0 3z"
        fill="#999999"
      />
    </Svg>
  );
}

/** 企业主页（figma 2330:5857 / 企业主页2 1205:4838；吸顶交互对齐 UserHome：吸顶昵称栏 + 横向滑切换 tab + 各 tab 滚动位置记忆 + 下拉刷新） */
export default function CompanyPage() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyPage'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cpId = route.params.id;

  const [data, setData] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---- 吸顶/滑动交互状态（对齐 UserHome，动画全程 UI 线程） ----
  const [pageIndex, setPageIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<{ x: number; w: number }[]>([]);
  const [listHeights, setListHeights] = useState<Record<TabKey, number>>({ post: 0, gallery: 0 });
  const scrollY = useSharedValue(0);
  const headerHSV = useSharedValue(0);
  const barDarkSV = useSharedValue(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollXJS = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  const outerRef = useRef<any>(null);
  const barDarkRef = useRef(false);
  const [barDark, setBarDark] = useState(false);
  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const tabRefs = useRef<Record<TabKey, TabHandle | null>>({ post: null, gallery: null }).current;
  const scrollOffsetsRef = useRef<Record<TabKey, number>>({ post: 0, gallery: 0 }).current;

  const activeTab = TAB_KEYS[pageIndex];
  const settledTab = TAB_KEYS[settledIndex];

  const bannerH = scaleSizeW(302);

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

  // 状态栏：封面上白色图标，吸顶后恢复黑色（对齐 UserHome）
  useFocusEffect(
    useCallback(() => {
      barDarkRef.current = false;
      barDarkSV.value = false;
      setBarDark(false);
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [barDarkSV]),
  );

  const fetchBasicInfo = useCallback(() => {
    return API.company
      .infoBasic({ cpId })
      .then((res) => {
        if (res.code === '200' && res.data) setData(res.data);
      })
      .catch(() => {});
  }, [cpId]);

  const fetchGallery = useCallback(() => {
    // 可信档案图片分组随主页一并请求，切 tab 不再等待
    return API.company
      .gallery({ cpId })
      .then((res) => {
        if (res.code === '200') setGroups(res.data?.groups || []);
      })
      .catch(() => {})
      .finally(() => setGroupsLoaded(true));
  }, [cpId]);

  useEffect(() => {
    fetchBasicInfo();
    fetchGallery();
  }, [fetchBasicInfo, fetchGallery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const tasks: Promise<unknown>[] = [fetchBasicInfo(), fetchGallery()];
    const handle = tabRefs[TAB_KEYS[pageIndexRef.current]];
    if (handle) tasks.push(handle.onRefresh());
    Promise.all(tasks).finally(() => setRefreshing(false));
  }, [tabRefs, fetchBasicInfo, fetchGallery]);

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

  useEffect(() => {
    headerHSV.value = headerH;
  }, [headerH, headerHSV]);

  // banner 下拉回弹拉伸（原生驱动之外用 Reanimated 共享值）
  const bannerStretch = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [-bannerH, 0], [-bannerH / 2, 0], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [-bannerH, 0], [2, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  /** 吸顶昵称栏高度 0→(状态栏+46) 跟随滚动；状态栏占位含在容器内，未展开时不占空间（UI 线程布局，不抖） */
  const nickStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
      [0, insets.top + STICKY_NICK_H],
      Extrapolation.CLAMP,
    ),
  }));
  /** 吸顶过程中，覆盖层返回按钮平移到吸顶栏内（不跟随下拉） */
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

  const position = Animated.divide(scrollX, windowWidth);
  const onTabPress = (i: number) => {
    tabRefs[TAB_KEYS[i]]?.ensureLoaded?.();
    swiperRef.current?.scrollToOffset({ offset: i * windowWidth, animated: true });
  };
  const indicatorTranslate =
    tabLayouts.length === TAB_KEYS.length
      ? position.interpolate({
          inputRange: TAB_KEYS.map((_, i) => i),
          outputRange: tabLayouts.map((l) => l.x + (l.w - scaleSizeW(24)) / 2),
          extrapolate: 'clamp',
        })
      : 0;

  const onListHeight = useCallback(
    (tab: TabKey) => (h: number) => {
      setListHeights((prev) => (prev[tab] === h ? prev : { ...prev, [tab]: h }));
    },
    [],
  );

  /** 内层列表不滚动，需保证内容够长让外层可滚动（吸顶才能触发） */
  const minPagerHeight = Math.max(contentH - insets.top - tabBarH - scaleSizeH(100), 0);
  const pagerHeightFor = useCallback(
    (tab: TabKey) => Math.max(listHeights[tab] || 0, minPagerHeight),
    [listHeights, minPagerHeight],
  );
  const pagerHeight = pagerHeightFor(settledTab);

  const onSwiperMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (i < 0 || i >= TAB_KEYS.length) return;
      const tab = TAB_KEYS[i];
      tabRefs[tab]?.ensureLoaded?.();
      const saved = scrollOffsetsRef[tab] || 0;
      const viewportH = contentH - insets.top;
      const nextPagerH = pagerHeightFor(tab);
      const totalH = headerH + insets.top + STICKY_NICK_H + tabBarH + nextPagerH + scaleSizeH(100);
      const maxOffset = Math.max(totalH - viewportH, 0);
      setSettledIndex(i);
      outerRef.current?.scrollToOffset({ offset: Math.min(saved, maxOffset), animated: false });
    },
    [windowWidth, tabRefs, scrollOffsetsRef, contentH, insets.top, pagerHeightFor, headerH, tabBarH],
  );

  // ---- 业务数据派生 ----
  const medias: string[] = (data?.mediaLinkList || [])
    .map((o: any) => o?.media?.mdUrl || o?.mdUrl)
    .filter(Boolean);
  const tags: string[] = (data?.propertyTags || '').split(',').filter(Boolean);
  const browseCount = data?.countBrowse ?? data?.viewCount ?? 0;
  const intro = (data?.desTxt || (data?.des || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) ?? '';

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const [bannerPage, setBannerPage] = useState(0);

  const renderTabPage = (tab: TabKey) => (
    <View style={[styles.pagerPage, { width: windowWidth, height: pagerHeight }]}>
      {tab === 'post' ? (
        <CompanyPostList
          ref={(h) => { tabRefs.post = h; }}
          cpId={cpId}
          active={activeTab === 'post'}
          onHeight={onListHeight('post')}
        />
      ) : (
        <CompanyGallery
          main={data}
          groups={groups}
          groupsLoaded={groupsLoaded}
          onHeight={onListHeight('gallery')}
        />
      )}
    </View>
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.flex1} onLayout={(e) => setContentH(e.nativeEvent.layout.height)}>
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
          renderItem={({ index }: { index: number }) =>
            index === 0 ? (
              <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
                {/* 顶部 banner 轮播（mediaLinkList，上方由状态栏背景条衔接）；下拉回弹时向上拉伸 */}
                <View style={{ height: bannerH }}>
                  <Reanimated.View style={[StyleSheet.absoluteFill, bannerStretch]}>
                    {medias.length > 0 ? (
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) =>
                          setBannerPage(Math.round(e.nativeEvent.contentOffset.x / windowWidth))
                        }
                      >
                        {medias.map((url, ix) => (
                          <ExpoImage
                            key={ix}
                            source={{ uri: url }}
                            recyclingKey={url}
                            style={{ width: windowWidth, height: bannerH }}
                            contentFit="cover"
                            transition={150}
                            cachePolicy="memory-disk"
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={[styles.swiperEmpty, { width: windowWidth, height: bannerH }]} />
                    )}
                  </Reanimated.View>
                  {medias.length > 1 && (
                    <View style={styles.dots} pointerEvents="none">
                      {medias.map((_, ix) => (
                        <View key={ix} style={[styles.dot, ix === bannerPage && styles.dotActive]} />
                      ))}
                    </View>
                  )}
                </View>

                {/* 白色企业信息面板（上叠 banner） */}
                <View style={styles.panel}>
                  <View style={styles.logoRow}>
                    {data?.avatar ? (
                      <ExpoImage
                        source={{ uri: data.avatar }}
                        recyclingKey={data.avatar}
                        style={styles.logo}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={[styles.logo, styles.logoEmpty]} />
                    )}
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {data?.name || ''}
                      </Text>
                      <BlueBadgeIcon size={16} />
                    </View>
                  </View>
                  {!!intro && (
                    <Text style={styles.intro} numberOfLines={2}>
                      {intro}
                    </Text>
                  )}
                  {tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {tags.map((t) => (
                        <View key={t} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    {!!data?.address && (
                      <View style={styles.metaChip}>
                        <LocationIcon />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {data.address}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>
                        浏览 <Text style={styles.metaChipNum}>{Number(browseCount).toLocaleString()}</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity activeOpacity={0.8} style={styles.siteBtn} onPress={todo}>
                      <Text style={styles.siteBtnText}>企业官网</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} style={styles.chatBtn} onPress={todo}>
                      <ChatBubbleIcon size={18} color="#000000" />
                      <Text style={styles.chatBtnText}>发私信</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : index === 1 ? (
              <Animated.View>
                {/* 吸顶昵称栏：滚动接近吸顶点时展开，内部含状态栏占位，贴底滑出（全程 UI 线程） */}
                <Reanimated.View style={[styles.stickyNick, nickStyle]}>
                  <View style={styles.stickyNickInner}>
                    <Text style={styles.stickyName} numberOfLines={1}>
                      {data?.name || ''}
                    </Text>
                  </View>
                </Reanimated.View>
                <Animated.View style={styles.tabCard} onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}>
                  <View style={styles.tabBar}>
                    {TABS.map((t, i) => {
                      const textColor = scrollXJS.interpolate({
                        inputRange: [i - 1, i, i + 1],
                        outputRange: ['#6C6C6C', '#000000', '#6C6C6C'],
                        extrapolate: 'clamp',
                      });
                      return (
                        <TouchableOpacity
                          key={t.key}
                          activeOpacity={0.7}
                          style={styles.tabItem}
                          onLayout={(e) => {
                            const { x, width } = e.nativeEvent.layout;
                            setTabLayouts((prev) => {
                              if (prev[i] && prev[i].x === x && prev[i].w === width) return prev;
                              const next = [...prev];
                              next[i] = { x, w: width };
                              return next;
                            });
                          }}
                          onPress={() => onTabPress(i)}
                        >
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
                  <View style={styles.tabsDivider} />
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
            )
          }
        />
        {/* 悬浮返回按钮（吸顶后平移进昵称栏，白底转黑箭头去底色） */}
        <Reanimated.View
          pointerEvents="box-none"
          style={[styles.navOverlay, { paddingTop: insets.top }, navStyle]}
        >
          <View style={styles.navOverlayRow} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              style={[styles.backCircle, barDark && styles.backCircleOnSticky]}
              onPress={() => navigation.goBack()}
            >
              <BackArrowIcon size={20} color={barDark ? '#000000' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      </View>
    </SafeView>
  );
}

const headerBtnsMT = scaleSizeH(8);

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  swiperEmpty: {
    backgroundColor: '#E5E5E5',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  dots: {
    position: 'absolute',
    bottom: scaleSizeW(30),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  dot: {
    width: scaleSizeW(4),
    height: scaleSizeW(4),
    borderRadius: scaleSizeW(2),
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: scaleSizeW(15),
    backgroundColor: '#FFFFFF',
  },
  panel: {
    marginTop: scaleSizeW(-20),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(20),
    paddingBottom: scaleSizeH(20),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: scaleSizeW(70),
    height: scaleSizeW(70),
    borderRadius: scaleSizeW(35),
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginLeft: scaleSizeW(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  intro: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
    marginTop: scaleSizeH(10),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  tagChip: {
    backgroundColor: '#F2F6FF',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
    height: scaleSizeH(20),
    justifyContent: 'center',
  },
  tagChipText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: PRIMARY,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    backgroundColor: '#F3F3F1',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
    height: scaleSizeH(20),
  },
  metaChipText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  metaChipNum: {
    color: '#000000',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  siteBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteBtnText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  chatBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: '#F3F3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  chatBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  stickyNick: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  /** 昵称贴容器底滑出，上方留白即状态栏占位 */
  stickyNickInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingHorizontal: scaleSizeW(16),
  },
  tabItem: {
    paddingVertical: scaleSizeH(12),
  },
  tabText: {
    fontSize: setSpText(15),
    color: GRAY,
  },
  tabTextActive: {
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 1,
    left: 0,
    width: scaleSizeW(24),
    height: 2,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  pagerPage: {
    backgroundColor: '#F6F7FB',
  },
  bottomPad: {
    width: '100%',
    height: scaleSizeH(100),
    backgroundColor: '#F6F7FB',
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
    marginTop: headerBtnsMT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backCircle: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backCircleOnSticky: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
});
