import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import CompanyPostList from '@/pages/my/company/CompanyPostList';
import ContactSheet from './ContactSheet';
import {
  AlbumItem,
  BackCircle,
  ContactPill,
  GoldBadge,
  mediaUrl,
  ModuleHtml,
  NavPill,
  openNavigation,
  stripHtml,
  useCompanyMain,
  WebsiteTabs,
  isVideoMedia,
  type WebsiteTab,
} from './common';
import { ChevronDownIcon } from './icons';

const CERT_BG = require('@/assets/company-website/cert-bg.png');
const VERIFIED_BADGE_DARK = require('@/assets/company-website/verified-badge-dark.png');

interface WebsiteProProps {
  cpId: number | string;
  fromShare?: number | string;
}

/** 吸顶名称栏高度（对齐企业主页 UserHome/CompanyPage） */
const STICKY_NICK_H = 46;

interface PageScrollCtx {
  index: number;
  tabKey: string;
  activeIndexSV: SharedValue<number>;
  scrollY: SharedValue<number>;
  onScrollJS: (key: string, y: number) => void;
}

/** 单个 tab 页的滚动监听：仅当前页驱动头部共享值；各页偏移记到 JS 镜像（切 tab 用） */
function usePageScrollHandler(ctx: PageScrollCtx) {
  const { index, tabKey, activeIndexSV, scrollY, onScrollJS } = ctx;
  return useAnimatedScrollHandler({
    onScroll: (e) => {
      if (activeIndexSV.value === index) scrollY.value = e.contentOffset.y;
      runOnJS(onScrollJS)(tabKey, e.contentOffset.y);
    },
  });
}

/** 富文本 tab 页：内层自滚动，paddingTop 让出头部+tab 栏，minHeight 保证短内容也能滚到吸顶点 */
function HtmlScrollPage({
  ctx,
  width,
  padTop,
  minHeight,
  registerRef,
  children,
}: {
  ctx: PageScrollCtx;
  width: number;
  padTop: number;
  minHeight: number;
  registerRef: (key: string, ref: any) => void;
  children: React.ReactNode;
}) {
  const handler = usePageScrollHandler(ctx);
  return (
    <Reanimated.ScrollView
      ref={(r: any) => registerRef(ctx.tabKey, r)}
      style={{ width }}
      contentContainerStyle={{ paddingTop: padTop, paddingBottom: scaleSizeH(20), minHeight }}
      onScroll={handler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Reanimated.ScrollView>
  );
}

/** 最新动态 tab 页：瀑布流自滚动（内部分页），滚动监听接入头部联动 */
function DynamicsScrollPage({
  ctx,
  width,
  padTop,
  minHeight,
  registerRef,
  cpId,
  active,
}: {
  ctx: PageScrollCtx;
  width: number;
  padTop: number;
  minHeight: number;
  registerRef: (key: string, ref: any) => void;
  cpId: number | string;
  active: boolean;
}) {
  const handler = usePageScrollHandler(ctx);
  const listRef = useRef<any>(null);
  return (
    <View style={[styles.pageBox, { width }]}>
      <CompanyPostList
        ref={(h) => {
          listRef.current = h;
          registerRef(ctx.tabKey, { scrollTo: (opts: { y: number }) => h?.scrollTo?.(opts.y) });
        }}
        cpId={cpId}
        active={active}
        selfScroll
        contentPadTop={padTop + scaleSizeH(10)}
        contentMinHeight={minHeight}
        onScroll={handler}
      />
    </View>
  );
}

/** 菜单树拍平为 tab 列表（menuType 1 叶子直接展示；父菜单取其 menuType 1 子项；对齐小程序 feeView treeVOList，SelectTree 层级选择暂不实现） */
function flattenTree(tree: any[]): WebsiteTab[] {
  const tabs: WebsiteTab[] = [];
  (tree || []).forEach((node: any) => {
    if (node.menuType === 1) {
      tabs.push({ id: node.id, name: node.menuName, content: node.menuContent });
    } else if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        if (child.menuType === 1) {
          tabs.push({ id: child.id, name: child.menuName, content: child.menuContent });
        }
      });
    }
  });
  return tabs;
}

/**
 * 企业官网升级版（figma 2136:6665，收费版深色官网，对齐小程序 feeView）
 * 交互与免费版 WebsiteFree 统一：各 tab 内容独立滚动并记住位置；头部+tab 栏为悬浮层，随当前 tab 滚动 1:1 平移；
 * 切 tab 时若已吸顶，目标页补滚到吸顶点（头部状态共享、不跳），否则保持各自位置
 */
export default function WebsitePro({ cpId, fromShare }: WebsiteProProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { data } = useCompanyMain(cpId);
  const userInfo = useUserStore((s) => s.userInfo);
  const contactRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<number | string>(-2);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);
  const [contentH, setContentH] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);

  const tabs: WebsiteTab[] = useMemo(() => {
    if (!data) return [{ id: -2, name: '企业信息' }];
    return [
      ...flattenTree(data.treeVOList),
      ...(data.moduleList || []).map((o: any) => ({ id: o.id, name: o.mdName, content: o.content })),
      { id: -1, name: '最新动态' },
    ];
  }, [data]);

  const auths: string[] = (data?.authTypeList || []).map((o: any) => o.authTypeCode);
  const isMyCompany = !!(userInfo?.cpId && String(userInfo.cpId) === String(cpId));
  const showContact = String(fromShare || 0) === '1' && !isMyCompany;
  const contacts = data?.contactList || [];
  const intro = stripHtml(data?.desTxt) || stripHtml(data?.des);
  const medias: any[] = useMemo(() => data?.mediaLinkList || [], [data]);
  const previewUrls = useMemo(() => medias.filter((m) => !isVideoMedia(m)).map(mediaUrl), [medias]);

  const onShowContact = () => {
    if (!contacts.length) {
      Toast.show({ type: 'info', text1: '该企业未留下联系方式' });
      return;
    }
    contactRef.current?.present();
  };

  const onPreviewImage = useCallback(
    (item: any) => {
      const url = mediaUrl(item);
      const index = previewUrls.indexOf(url);
      setPreview({ urls: previewUrls, index: Math.max(index, 0) });
    },
    [previewUrls],
  );

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  // 数据加载后首个 tab id 从占位 -2 变为真实 id：同步激活态，否则头部拖动/切 tab 定位会打到已卸载的占位页
  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.id === activeTabRef.current)) {
      activeTabRef.current = tabs[0].id;
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  // ---- 头部跟随滚动（快手同款）：scrollY 为当前 tab 的滚动偏移，头部悬浮层 1:1 平移 ----
  const scrollX = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  const scrollY = useSharedValue(0);
  const activeIndexSV = useSharedValue(0);
  const activeIndexRef = useRef(0);
  /** 各 tab 内容滚动偏移镜像（JS 侧，切 tab 时读取；内层列表常驻不卸载，位置天然保留） */
  const pageYsRef = useRef<Record<string, number>>({});
  /** 各 tab 内层滚动容器引用（切 tab 补滚到吸顶点用） */
  const pageRefs = useRef<Record<string, any>>({});
  const registerRef = useCallback((key: string, ref: any) => {
    if (ref) pageRefs.current[key] = ref;
  }, []);
  const onScrollJS = useCallback((key: string, y: number) => {
    pageYsRef.current[key] = y;
  }, []);

  /** 吸顶偏移量：头部滚出到 tab 栏钉在「状态栏+名称栏」下方时的滚动距离 */
  const stickyY = Math.max(headerH - insets.top - STICKY_NICK_H, 0);
  /** 内层页顶部留白 = 头部 + tab 栏；minHeight 保证短内容也能滚到吸顶点 */
  const padTop = headerH + tabBarH;
  const pageMinHeight = contentH > 0 ? contentH + stickyY : 0;

  /** 头部+tab 栏悬浮层：随当前 tab 滚动 1:1 平移，吸顶后停住 */
  const collapseStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(scrollY.value, Math.max(stickyY, 0)) }],
  }));
  /** 吸顶名称栏：到达吸顶点瞬间从顶部滑入（1px 阈值） */
  const nickStyle = useAnimatedStyle(() => {
    const sy = Math.max(stickyY, 1);
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [sy - 1, sy],
            [-(insets.top + STICKY_NICK_H), 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  /**
   * 目标页应滚到的位置：头部位置完全共享（h = min(当前y, 吸顶点)，当前在顶部时目标页也在顶部），
   * 各 tab 内容只记忆「吸顶之后多滚的部分」（extra = max(记忆y − 吸顶点, 0)）
   */
  const resolveTargetY = useCallback(
    (savedY: number, curY: number) => {
      const h = Math.min(Math.max(curY, 0), stickyY);
      const extra = Math.max(savedY - stickyY, 0);
      return h + extra;
    },
    [stickyY],
  );

  /** 切 tab：按共享头部语义调整目标页滚动位置；头部随目标位置平滑过渡（瞬时赋值会像「跳到吸顶」） */
  const switchTab = useCallback(
    (id: number | string, index: number) => {
      const oldY = pageYsRef.current[String(activeTabRef.current)] || 0;
      const key = String(id);
      const saved = pageYsRef.current[key] || 0;
      const y = resolveTargetY(saved, oldY);
      if (Math.abs(y - saved) > 0.5) {
        pageYsRef.current[key] = y;
        pageRefs.current[key]?.scrollTo?.({ y, animated: false });
      }
      activeIndexSV.value = index;
      activeIndexRef.current = index;
      scrollY.value = Math.abs(y - oldY) > 0.5 ? withTiming(y, { duration: 180 }) : y;
      setActiveTab(id);
    },
    [resolveTargetY, activeIndexSV, scrollY],
  );

  /** 横滑一开始就预先把目标页调整到共享位置，避免新页滑入时露出头部留白再跳上去 */
  const preparedRef = useRef(-1);
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const cur = activeIndexRef.current;
      const dx = value - cur * windowWidth;
      if (Math.abs(dx) < 1) {
        preparedRef.current = -1;
        return;
      }
      const target = cur + (dx > 0 ? 1 : -1);
      if (target < 0 || target >= tabs.length || preparedRef.current === target) return;
      preparedRef.current = target;
      const curY = pageYsRef.current[String(tabs[cur]?.id)] || 0;
      const tKey = String(tabs[target].id);
      const saved = pageYsRef.current[tKey] || 0;
      const y = resolveTargetY(saved, curY);
      if (Math.abs(y - saved) > 0.5) {
        pageYsRef.current[tKey] = y;
        pageRefs.current[tKey]?.scrollTo?.({ y, animated: false });
      }
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, windowWidth, tabs, resolveTargetY]);

  /** 头部拖动手势：纵向拖动转发给当前 tab 页滚动（带动头部收起）；横向拖动吞掉，避免穿透到底层 pager 误切 tab */
  const dragStartY = useRef(0);
  const headerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 5 || Math.abs(g.dx) > 10,
      onPanResponderGrant: () => {
        dragStartY.current = pageYsRef.current[String(activeTabRef.current)] || 0;
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dy) <= Math.abs(g.dx)) return;
        const key = String(activeTabRef.current);
        pageRefs.current[key]?.scrollTo?.({ y: Math.max(dragStartY.current - g.dy, 0), animated: false });
      },
    }),
  ).current;

  /** 点 tab：pager 滚动到目标页 + 切换（momentumEnd 里按 activeTabRef 去重） */
  const onTabPress = useCallback(
    (tab: WebsiteTab, index: number) => {
      swiperRef.current?.scrollToOffset({ offset: index * windowWidth, animated: true });
      switchTab(tab.id, index);
    },
    [switchTab, windowWidth],
  );

  /** 横滑结束：落到整页后切换 tab（对齐企业主页 onSwiperMomentumEnd） */
  const onSwipeEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      const t = tabs[i];
      if (t && t.id !== activeTabRef.current) switchTab(t.id, i);
    },
    [tabs, windowWidth, switchTab],
  );

  const renderPage = useCallback(
    ({ item: tab, index }: { item: WebsiteTab; index: number }) => {
      const ctx: PageScrollCtx = {
        index,
        tabKey: String(tab.id),
        activeIndexSV,
        scrollY,
        onScrollJS,
      };
      if (tab.id === -1) {
        return (
          <DynamicsScrollPage
            ctx={ctx}
            width={windowWidth}
            padTop={padTop}
            minHeight={pageMinHeight}
            registerRef={registerRef}
            cpId={cpId}
            // 提前加载第一页，切到「最新动态」即可直接看到数据
            active
          />
        );
      }
      return (
        <HtmlScrollPage
          ctx={ctx}
          width={windowWidth}
          padTop={padTop}
          minHeight={pageMinHeight}
          registerRef={registerRef}
        >
          <View style={styles.infoContent}>
            {tab.id === -2 ? (
              !data && <ActivityIndicator style={styles.contentLoading} color="#FFFFFF" />
            ) : (
              <ModuleHtml
                dark
                html={typeof tab.content === 'string' ? tab.content : tab.content?.content || ''}
              />
            )}
          </View>
        </HtmlScrollPage>
      );
    },
    [activeIndexSV, scrollY, onScrollJS, windowWidth, padTop, pageMinHeight, registerRef, cpId, data],
  );

  return (
    <SafeView backgroundColor="#2F2F2F">
      <StatusBar barStyle="light-content" />
      <View style={styles.flex1} onLayout={(e) => setContentH(e.nativeEvent.layout.height)}>
        {/* tab 内容：左右滑动切换（横向 FlatList pager，对齐企业主页），各页内层自滚动 */}
        <Animated.FlatList
          ref={swiperRef}
          style={styles.flex1}
          horizontal
          pagingEnabled
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(t: WebsiteTab) => String(t.id)}
          getItemLayout={(_data, i) => ({ length: windowWidth, offset: windowWidth * i, index: i })}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          onMomentumScrollEnd={onSwipeEnd}
          scrollEventThrottle={16}
          renderItem={renderPage}
          windowSize={Math.max(tabs.length + 1, 3)}
        />

        {/* 头部 + tab 栏悬浮层：随当前 tab 滚动 1:1 平移，吸顶后 tab 栏钉住 */}
        <Reanimated.View style={[styles.headerOverlay, collapseStyle]} pointerEvents="box-none">
          <View
            style={[styles.content, { paddingTop: insets.top + scaleSizeH(81) }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
            {...headerPan.panHandlers}
          >
            {/* 右上角认证图标底纹（figma 2184:5723，256 图左对齐、167 宽裁切、10% 透明度），随头部一起收起 */}
            <View style={styles.certBg} pointerEvents="none">
              <ExpoImage source={CERT_BG} style={styles.certBgImg} contentFit="contain" />
            </View>

            {/* 头像 + 企业名称/认证角标（静态区 pointerEvents none：触摸穿透到底层 pager，可直接拖动滚动） */}
            <View style={styles.headerRow} pointerEvents="none">
              <View style={styles.logoWrap}>
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
                {/* 认证徽章：贴在头像 62x62 外框右下角（figma group 内 rel 44,44），浮在头像上方 */}
                <ExpoImage
                  source={VERIFIED_BADGE_DARK}
                  style={styles.logoBadgeImg}
                  contentFit="contain"
                  pointerEvents="none"
                />
              </View>
              <View style={styles.nameCol}>
                {data ? (
                  <Text style={styles.name}>{data.name || ''}</Text>
                ) : (
                  <View style={styles.skeletonName} />
                )}
                {auths.includes('LOCATION') && <GoldBadge />}
              </View>
            </View>

            {/* 公司地址 */}
            <Text style={styles.sectionLabel} pointerEvents="none">
              公司地址
            </Text>
            {data ? (
              <Text style={styles.address} pointerEvents="none">
                {data.address || ''}
              </Text>
            ) : (
              <View style={styles.skeletonAddress} pointerEvents="none" />
            )}

            {/* 导航 / 查看联系方式 */}
            <View style={styles.btnRow}>
              <NavPill dark onPress={() => openNavigation(data)} />
              {showContact && <ContactPill dark onPress={onShowContact} />}
            </View>

            {/* 关于企业 */}
            {!!intro && (
              <>
                <View style={styles.aboutRow} pointerEvents="box-none">
                  <Text style={[styles.sectionLabel, styles.aboutLabel]} pointerEvents="none">
                    关于企业
                  </Text>
                  {showToggle && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.expandBtn}
                      onPress={() => setExpanded((v) => !v)}
                    >
                      <Text style={styles.expandText}>{expanded ? '收起' : '展开'}</Text>
                      <View style={expanded && styles.expandIconUp}>
                        <ChevronDownIcon size={10} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={styles.aboutDesc}
                  numberOfLines={expanded ? undefined : 4}
                  pointerEvents="none"
                  onTextLayout={(e) => {
                    if (!showToggle && e.nativeEvent.lines.length > 4) setShowToggle(true);
                  }}
                >
                  {intro}
                </Text>
              </>
            )}

            {/* 企业相册 */}
            {medias.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, styles.albumLabel]} pointerEvents="none">
                  企业相册
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.albumScroll}
                  contentContainerStyle={styles.albumRow}
                >
                  {medias.map((item, ix) => (
                    <AlbumItem
                      key={ix}
                      item={item}
                      width={scaleSizeW(150)}
                      height={scaleSizeW(84)}
                      radius={scaleSizeW(10)}
                      onPreview={() => onPreviewImage(item)}
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
          <View style={styles.tabsWrap} onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}>
            <WebsiteTabs
              dark
              tabs={tabs}
              activeId={currentTab?.id}
              onChange={onTabPress}
              scrollX={scrollX}
              pageWidth={windowWidth}
            />
          </View>
        </Reanimated.View>

        {/* 吸顶名称栏：状态栏占位 + 企业名称，吸顶瞬间滑入 */}
        <Reanimated.View style={[styles.nickOverlay, nickStyle]} pointerEvents="none">
          <View style={{ height: insets.top }} />
          <View style={styles.stickyNickInner}>
            <Text style={styles.stickyName} numberOfLines={1}>
              {data?.name || ''}
            </Text>
          </View>
        </Reanimated.View>

        <BackCircle onPress={() => navigation.goBack()} />
      </View>

      <ContactSheet ref={contactRef} contacts={contacts} onClose={() => contactRef.current?.dismiss()} />

      <Modal transparent visible={!!preview} onRequestClose={() => setPreview(null)}>
        {!!preview && (
          <GestureViewer
            data={preview.urls}
            initialIndex={preview.index}
            renderItem={(uri: string) => (
              <ExpoImage source={{ uri }} style={styles.previewImage} contentFit="contain" transition={100} />
            )}
            ListComponent={ScrollView}
            onDismiss={() => setPreview(null)}
            onSingleTap={() => setPreview(null)}
          />
        )}
      </Modal>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  pageBox: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(18),
    backgroundColor: '#2F2F2F',
  },
  certBg: {
    position: 'absolute',
    top: scaleSizeH(33),
    right: 0,
    width: scaleSizeW(167),
    height: scaleSizeW(256),
    overflow: 'hidden',
  },
  certBgImg: {
    width: scaleSizeW(256),
    height: scaleSizeW(256),
    opacity: 0.1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: scaleSizeW(62),
    height: scaleSizeW(62),
  },
  logo: {
    width: scaleSizeW(62),
    height: scaleSizeW(62),
    borderRadius: scaleSizeW(31),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  logoBadgeImg: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    zIndex: 2,
    elevation: 2,
  },
  nameCol: {
    flex: 1,
    marginLeft: scaleSizeW(20),
    gap: scaleSizeH(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionLabel: {
    marginTop: scaleSizeH(30),
    fontSize: setSpText(14),
    fontWeight: '500',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  address: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(19),
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutLabel: {
    marginTop: scaleSizeH(30),
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(30),
  },
  expandText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  expandIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  aboutDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#FFFFFF',
  },
  albumLabel: {
    marginTop: scaleSizeH(30),
  },
  albumScroll: {
    marginTop: scaleSizeH(10),
    marginHorizontal: -scaleSizeW(16),
  },
  albumRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  tabsWrap: {
    backgroundColor: '#2F2F2F',
  },
  nickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2F2F2F',
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
  },
  contentLoading: {
    marginTop: scaleSizeH(40),
    alignSelf: 'center',
  },
  skeletonName: {
    width: scaleSizeW(180),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#3D3D3D',
  },
  skeletonAddress: {
    width: scaleSizeW(240),
    height: scaleSizeW(14),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#3D3D3D',
    marginTop: scaleSizeH(10),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
