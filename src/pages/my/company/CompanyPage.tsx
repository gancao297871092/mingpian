import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
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
  /** 横滑涉及的 tab 对 [起点, 目标]：期间 pager 高度撑到两者最大值，防止恢复滚动被旧高度钳制跳变 */
  const [swipePair, setSwipePair] = useState<[number, number] | null>(null);
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
  /** 已落定的 tab 索引（横滑开始时作为锚点；pageIndex 过半程即翻转，不适合做预调整锚点） */
  const settledIndexRef = useRef(settledIndex);
  settledIndexRef.current = settledIndex;
  const tabRefs = useRef<Record<TabKey, TabHandle | null>>({ post: null, gallery: null }).current;
  const scrollOffsetsRef = useRef<Record<TabKey, number>>({ post: 0, gallery: 0 }).current;
  /** 用户驱动的滚动才计入各 tab 位置记忆（程序化恢复滚动不写记忆，避免切 tab 把中间态/钳制值写进去） */
  const userScrollingRef = useRef(false);
  /** 横滑预调整记录（idx=目标 tab，prevY=调整前位置，savedY=目标页被覆盖前的记忆；滑动取消时回退） */
  const preparedRef = useRef<{ idx: number; prevY: number; savedY: number } | null>(null);
  /** 待补滚的恢复目标（内容高度落定导致偏移被钳制时，由 effect 再滚一次） */
  const pendingRestoreRef = useRef<{ tab: TabKey; target: number } | null>(null);

  const activeTab = TAB_KEYS[pageIndex];
  const settledTab = TAB_KEYS[settledIndex];

  const bannerH = scaleSizeW(302);
  /** 吸顶名称栏总高（状态栏占位 + 46 名称行） */
  const nickTotal = insets.top + STICKY_NICK_H;

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

  /** 记录各 tab 滚动位置（UI 线程每帧回调到 JS，仅写 ref）；只记用户驱动滚动，程序化恢复滚动不写记忆（避免切 tab 把钳制中间值写进去） */
  const recordOffset = useCallback(
    (y: number) => {
      if (!userScrollingRef.current) return;
      pendingRestoreRef.current = null;
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
      // 吸顶点 = 头部滚出到 tab 栏钉在名称栏下方（对齐官网 stickyY）
      const dark = headerHSV.value > 0 && y >= Math.max(headerHSV.value - nickTotal, 0);
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

  /**
   * tab 栏悬浮层（对齐官网 collapseStyle）：随滚动 1:1 平移，到达「状态栏+名称栏」下方停住吸顶。
   * 列表流内用同高 spacer 占位，悬浮层静止时正好压在 spacer 上。
   */
  const tabBarFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(headerHSV.value - scrollY.value, nickTotal) }],
  }));
  /** 吸顶名称栏：到达吸顶点瞬间从顶部滑入（1px 阈值，对齐官网 nickStyle） */
  const nickOverlayStyle = useAnimatedStyle(() => {
    const sy = Math.max(headerHSV.value - nickTotal, 1);
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [sy - 1, sy], [-nickTotal, 0], Extrapolation.CLAMP),
        },
      ],
    };
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

  /** 内层列表不滚动，需保证内容够长让外层可滚动到吸顶点（吸顶点 = headerH - nickTotal） */
  const minPagerHeight = Math.max(contentH - nickTotal - tabBarH - scaleSizeH(100), 0);
  const pagerHeightFor = useCallback(
    (tab: TabKey) => Math.max(listHeights[tab] || 0, minPagerHeight),
    [listHeights, minPagerHeight],
  );
  /** 横滑/落定恢复期间把 pager 高度撑到相关 tab 的最大值（撑高只向下延伸空白，视觉上无感），避免高度变化钳制滚动偏移造成跳变 */
  const swipePairMax = swipePair
    ? Math.max(pagerHeightFor(TAB_KEYS[swipePair[0]]), pagerHeightFor(TAB_KEYS[swipePair[1]]))
    : 0;
  const pagerHeight = Math.max(pagerHeightFor(settledTab), swipePairMax);

  /** 吸顶点：tab 栏钉在「状态栏+名称栏」下方时的滚动距离（对齐官网 stickyY） */
  const stickY = Math.max(headerH - nickTotal, 0);
  /**
   * 目标 tab 应滚到的位置（共享头部语义，对齐企业官网 WebsiteFree）：
   * 头部位置完全共享（h = min(当前y, 吸顶点)），各 tab 只记忆「吸顶之后多滚的部分」（extra = max(记忆y − 吸顶点, 0)）
   */
  const resolveTargetY = useCallback(
    (saved: number, curY: number) => {
      const h = Math.min(Math.max(curY, 0), stickY);
      return h + Math.max(saved - stickY, 0);
    },
    [stickY],
  );
  /** 某 tab 内容高度下外层列表的最大滚动偏移（名称栏/tab 栏均为悬浮层，不占流内高度；流内 = 头部 + spacer + pager + 底部留白） */
  const maxOffsetFor = useCallback(
    (tab: TabKey) => {
      const totalH = headerH + tabBarH + pagerHeightFor(tab) + scaleSizeH(100);
      return Math.max(totalH - contentH, 0);
    },
    [contentH, headerH, tabBarH, pagerHeightFor],
  );
  /** 程序化恢复目标 tab 的滚动位置（写记忆 + 动画滚动平滑过渡；高度未落定被钳制时由下方 effect 补滚） */
  const restoreTo = useCallback(
    (tab: TabKey, target: number, animated: boolean) => {
      const t = Math.max(0, target);
      scrollOffsetsRef[tab] = t;
      pendingRestoreRef.current = { tab, target: t };
      outerRef.current?.scrollToOffset({ offset: Math.min(t, maxOffsetFor(tab)), animated });
    },
    [scrollOffsetsRef, maxOffsetFor],
  );

  /** 切 tab 后内容高度落定（或分页加载变高）时，补齐之前被钳制的恢复滚动；用户接管滚动即取消（recordOffset 里清除） */
  useEffect(() => {
    const pending = pendingRestoreRef.current;
    if (!pending || pending.tab !== settledTab) return;
    const max = maxOffsetFor(settledTab);
    outerRef.current?.scrollToOffset({ offset: Math.min(pending.target, max), animated: true });
    if (max >= pending.target - 0.5) pendingRestoreRef.current = null;
  }, [settledIndex, pagerHeight, settledTab, maxOffsetFor]);

  /** 撑高收回的延迟定时器（落定后等恢复滑动画走完再收回，避免中途钳制） */
  const shrinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearShrinkTimer = useCallback(() => {
    if (shrinkTimerRef.current) {
      clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }
  }, []);
  const scheduleClearSwipePair = useCallback(
    (delay: number) => {
      clearShrinkTimer();
      shrinkTimerRef.current = setTimeout(() => setSwipePair(null), delay);
    },
    [clearShrinkTimer],
  );
  useEffect(() => clearShrinkTimer, [clearShrinkTimer]);

  /** 横滑一开始就预先把共享滚动位置平滑调整到目标 tab 的位置，避免新页滑入后落定时高度变化 + 位置恢复叠加「跳两下」 */
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const settled = settledIndexRef.current;
      const dx = value - settled * windowWidth;
      if (Math.abs(dx) <= 30) return;
      const target = settled + (dx > 0 ? 1 : -1);
      if (target < 0 || target >= TAB_KEYS.length || preparedRef.current?.idx === target) return;
      const prevY = scrollOffsetsRef[TAB_KEYS[settled]] || 0;
      const savedY = scrollOffsetsRef[TAB_KEYS[target]] || 0;
      preparedRef.current = { idx: target, prevY, savedY };
      clearShrinkTimer();
      setSwipePair([settled, target]);
      restoreTo(TAB_KEYS[target], resolveTargetY(savedY, prevY), true);
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, windowWidth, restoreTo, resolveTargetY, scrollOffsetsRef, clearShrinkTimer]);

  /** 横滑落定：落回原 tab 撤销预调整；落到新 tab 确保数据加载并切换内容高度 */
  const onSwiperMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (i < 0 || i >= TAB_KEYS.length) return;
      const prepared = preparedRef.current;
      preparedRef.current = null;
      if (i === settledIndexRef.current) {
        // 横滑取消：立即回退到调整前位置、还原目标页记忆并收回撑高
        if (prepared && prepared.idx !== i) {
          scrollOffsetsRef[TAB_KEYS[prepared.idx]] = prepared.savedY;
          pendingRestoreRef.current = null;
          outerRef.current?.scrollToOffset({ offset: prepared.prevY, animated: false });
        }
        clearShrinkTimer();
        setSwipePair(null);
        return;
      }
      const tab = TAB_KEYS[i];
      tabRefs[tab]?.ensureLoaded?.();
      if (!prepared || prepared.idx !== i) {
        // 未发生预调整（快速翻过等）：落定这一刻再平滑恢复目标位置
        clearShrinkTimer();
        setSwipePair([settledIndexRef.current, i]);
        const prevY = scrollOffsetsRef[TAB_KEYS[settledIndexRef.current]] || 0;
        restoreTo(tab, resolveTargetY(scrollOffsetsRef[tab] || 0, prevY), true);
      }
      setSettledIndex(i);
      // 延迟收回撑高，等恢复滑动画走完，避免高度收缩钳制偏移
      scheduleClearSwipePair(300);
    },
    [windowWidth, tabRefs, scrollOffsetsRef, restoreTo, resolveTargetY, clearShrinkTimer, scheduleClearSwipePair],
  );

  /** 外层列表用户滚动标记：拖动开始置位，滚动完全停止后清除（velocity≈0 表示不会接惯性滚动） */
  const onOuterDragBegin = useCallback(() => {
    userScrollingRef.current = true;
  }, []);
  const onOuterDragEnd = useCallback(
    (e: { nativeEvent: { velocity?: { y: number } } }) => {
      if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.1) userScrollingRef.current = false;
    },
    [],
  );
  const onOuterMomentumEnd = useCallback(() => {
    userScrollingRef.current = false;
  }, []);

  /** tab 栏悬浮层手势（对齐官网 headerPan）：纵向拖动转发给外层列表滚动并直接写位置记忆；横向吞掉避免误触 */
  const tabBarDragY = useRef(0);
  const tabBarPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 5 || Math.abs(g.dx) > 10,
      onPanResponderGrant: () => {
        tabBarDragY.current = scrollOffsetsRef[TAB_KEYS[pageIndexRef.current]] || 0;
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dy) <= Math.abs(g.dx)) return;
        const tab = TAB_KEYS[pageIndexRef.current];
        const y = Math.min(Math.max(tabBarDragY.current - g.dy, 0), maxOffsetFor(tab));
        scrollOffsetsRef[tab] = y;
        outerRef.current?.scrollToOffset({ offset: y, animated: false });
      },
    }),
  ).current;

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
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onScrollBeginDrag={onOuterDragBegin}
          onScrollEndDrag={onOuterDragEnd}
          onMomentumScrollEnd={onOuterMomentumEnd}
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
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.siteBtn}
                      onPress={() => navigation.navigate('companyWebsite', { id: cpId })}
                    >
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
              // tab 栏悬浮层的流内占位（真实 tab 栏在列表后的悬浮层，悬浮吸顶对齐官网）
              <View style={{ height: tabBarH }} />
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
        {/* tab 栏悬浮层：随滚动 1:1 平移，吸顶后钉在「状态栏+名称栏」下方（对齐官网 headerOverlay；纵向拖动转发外层列表） */}
        <Reanimated.View style={[styles.tabBarFloat, tabBarFloatStyle]} pointerEvents="box-none">
          <Animated.View
            style={styles.tabCard}
            onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}
            {...tabBarPan.panHandlers}
          >
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
        </Reanimated.View>
        {/* 吸顶名称栏：状态栏占位 + 企业名称，吸顶瞬间从顶部滑入（对齐官网 nickOverlay） */}
        <Reanimated.View style={[styles.nickOverlay, nickOverlayStyle]} pointerEvents="none">
          <View style={{ height: insets.top }} />
          <View style={styles.stickyNickInner}>
            <Text style={styles.stickyName} numberOfLines={1}>
              {data?.name || ''}
            </Text>
          </View>
        </Reanimated.View>
        {/* 悬浮返回按钮（固定不动，名称栏吸顶滑入到其下方；吸顶后白底转黑箭头去底色，对齐官网 BackCircle） */}
        <View pointerEvents="box-none" style={[styles.navOverlay, { paddingTop: insets.top }]}>
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
        </View>
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
  /** tab 栏悬浮层（对齐官网 headerOverlay） */
  tabBarFloat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  /** 吸顶名称栏悬浮层（对齐官网 nickOverlay）：白底盖住状态栏区域 */
  nickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 6,
  },
  /** 吸顶栏企业名称行（左右留白避开返回键） */
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
    // 高于名称栏悬浮层（zIndex 6），否则吸顶时被白底名称栏盖住（对齐官网 BackCircle zIndex 10）
    zIndex: 10,
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
