import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import CompanyPostList from '@/pages/my/company/CompanyPostList';
import ContactSheet from './ContactSheet';
import { ChevronDownIcon } from './icons';
import {
  AlbumItem,
  BackCircle,
  ContactPill,
  GoldBadge,
  mediaUrl,
  ModuleHtml,
  NavPill,
  openNavigation,
  SectionLabel,
  ShareCircle,
  stripHtml,
  useCompanyMain,
  websiteCard,
  WebsiteTabs,
  isVideoMedia,
  type WebsiteTab,
} from './common';

const VERIFIED_BADGE = require('@/assets/company-website/verified-badge.png');

/** 企业简介收起时展示 5 行（与富文本基础行高 setSpText(24) 对齐） */
const INTRO_MAX_LINES = 5;
const INTRO_COLLAPSED_H = INTRO_MAX_LINES * setSpText(24);

interface WebsiteFreeProps {
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
      {/* 白色内容体（figma 10 官网：tab 内容白卡），flexGrow 撑满 minHeight，头部区域露出页面灰底 */}
      <View style={styles.pageBody}>{children}</View>
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

/**
 * 企业官网普通版（figma 10/企业官网普通版 2932:6801，浅色官网，对齐小程序 freeView）
 * 交互对齐快手/企业主页：各 tab 内容独立滚动并记住位置；头部+tab 栏为悬浮层，随当前 tab 滚动 1:1 平移；
 * 切 tab 时若已吸顶，目标页补滚到吸顶点（头部状态共享、不跳），否则保持各自位置
 */
export default function WebsiteFree({ cpId }: WebsiteFreeProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { data } = useCompanyMain(cpId);
  const contactRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<number | string>(-2);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);
  /** 预览器起步定位完成后再显示，避免打开瞬间露出第 0 张/复用旧图闪帧 */
  const [previewShown, setPreviewShown] = useState(false);
  useEffect(() => {
    if (!preview) {
      setPreviewShown(false);
      return undefined;
    }
    const t = setTimeout(() => setPreviewShown(true), 120);
    return () => clearTimeout(t);
  }, [preview]);
  const [contentH, setContentH] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);
  /** 企业简介展开/收起；纯文本实测行数（0 = 未测量），超过 5 行才显示展开按钮 */
  const [introExpanded, setIntroExpanded] = useState(false);
  const [introLines, setIntroLines] = useState(0);

  const tabs: WebsiteTab[] = useMemo(() => {
    if (!data) return [{ id: -2, name: '企业信息' }];
    return [
      { id: -2, name: '企业信息' },
      ...(data.moduleList || []).map((o: any) => ({ id: o.id, name: o.mdName, content: o.content })),
      { id: -1, name: '最新动态' },
    ];
  }, [data]);

  const auths: string[] = (data?.authTypeList || []).map((o: any) => o.authTypeCode);
  const contacts = data?.contactList || [];
  const introHtml = data?.des || (data?.desTxt ? `<p>${data.desTxt}</p>` : '');
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

  /** 头部卡片与内容白卡间距（figma 10 官网：20）；吸顶偏移需包含该间距，否则吸顶后 tab 栏与名称栏之间透出内容 */
  const cardGap = scaleSizeH(20);
  /** 吸顶偏移量：头部滚出到 tab 栏钉在「状态栏+名称栏」下方时的滚动距离 */
  const stickyY = Math.max(headerH + cardGap - insets.top - STICKY_NICK_H, 0);
  /** 内层页顶部留白 = 头部 + 间距 + tab 栏；minHeight 保证短内容也能滚到吸顶点 */
  const padTop = headerH + cardGap + tabBarH;
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

  /** tab 白卡顶部圆角：随滚动从 20 渐变到 0，吸顶后与名称栏连成一体、消除两侧灰缺口（缩放值须提前算好，worklet 内不能调 scaleSizeW） */
  const tabRadius = scaleSizeW(20);
  const tabsWrapStyle = useAnimatedStyle(() => {
    const sy = Math.max(stickyY, 1);
    return {
      borderTopLeftRadius: interpolate(
        scrollY.value,
        [sy - tabRadius, sy],
        [tabRadius, 0],
        Extrapolation.CLAMP,
      ),
      borderTopRightRadius: interpolate(
        scrollY.value,
        [sy - tabRadius, sy],
        [tabRadius, 0],
        Extrapolation.CLAMP,
      ),
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
          {tab.id === -2 ? (
            <View style={styles.infoContent}>
              {!!stripHtml(introHtml) && (
                <>
                  <View style={styles.infoHeadRow}>
                    <Text style={[styles.infoTitle, styles.infoTitleFlat]}>企业简介</Text>
                    {introLines > INTRO_MAX_LINES && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.expandBtn}
                        onPress={() => setIntroExpanded((v) => !v)}
                      >
                        <Text style={styles.expandText}>{introExpanded ? '收起' : '展开'}</Text>
                        <View style={introExpanded && styles.expandIconUp}>
                          <ChevronDownIcon size={10} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* 收起时按 5 行高度裁剪（行高与富文本基础样式对齐）；行数测出前隐藏正文，避免先看到全文再收起 */}
                  <View
                    style={[
                      !introExpanded && introLines > INTRO_MAX_LINES ? styles.introClamp : undefined,
                      introLines === 0 && styles.introMeasuring,
                    ]}
                  >
                    <ModuleHtml html={introHtml} />
                  </View>
                  {/* 隐藏纯文本测行数：与富文本同宽同字号，>5 行才显示展开按钮；Text 布局稳定，只触发一次 setState */}
                  {introLines === 0 && (
                    <Text
                      pointerEvents="none"
                      style={styles.introMeasureText}
                      onTextLayout={(e) => setIntroLines(e.nativeEvent.lines.length)}
                    >
                      {stripHtml(introHtml)}
                    </Text>
                  )}
                </>
              )}
              {medias.length > 0 && (
                <>
                  <Text style={[styles.infoTitle, styles.albumTitle]}>企业相册</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumScroll}>
                    <View style={styles.albumRow}>
                      {medias.map((item, ix) => (
                        <AlbumItem
                          key={ix}
                          item={item}
                          width={scaleSizeW(290)}
                          height={scaleSizeW(175)}
                          radius={scaleSizeW(10)}
                          onPreview={() => onPreviewImage(item)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}
              {!!data && !stripHtml(introHtml) && medias.length === 0 && (
                <Text style={styles.emptyText}>暂无内容</Text>
              )}
              {!data && <ActivityIndicator style={styles.contentLoading} color="#2962D4" />}
            </View>
          ) : (
            <View style={styles.infoContent}>
              <ModuleHtml html={tab.content?.content || ''} />
            </View>
          )}
        </HtmlScrollPage>
      );
    },
    [activeIndexSV, scrollY, onScrollJS, windowWidth, padTop, pageMinHeight, registerRef, cpId, data, introHtml, introExpanded, introLines, medias, onPreviewImage],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <StatusBar barStyle="dark-content" />
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
            style={[styles.content, { paddingTop: insets.top + scaleSizeH(76) }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
            {...headerPan.panHandlers}
          >
            {/* 头像 + 企业名称/认证角标（静态区 pointerEvents none：触摸由 content 的 PanResponder 统一接管） */}
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
                {/* 认证徽章：贴在头像 62x62 右下角（figma 10 官网：18x18 蓝底徽章） */}
                <ExpoImage
                  source={VERIFIED_BADGE}
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

            {/* 公司地址卡片：蓝条标签 + 地址 + 导航/查看联系方式 */}
            <View style={[websiteCard.card, styles.addrCard]}>
              <SectionLabel title="公司地址" />
              {data ? (
                <Text style={[websiteCard.text, styles.addrText]} pointerEvents="none">
                  {data.address || ''}
                </Text>
              ) : (
                <View style={styles.skeletonAddress} pointerEvents="none" />
              )}
              <View style={styles.btnRow}>
                <NavPill onPress={() => openNavigation(data)} />
                {/* 常显（figma 10 官网）：无联系方式时点击 toast 提示 */}
                <ContactPill onPress={onShowContact} />
              </View>
            </View>
          </View>
          <Reanimated.View
            style={[styles.tabsWrap, { marginTop: cardGap }, tabsWrapStyle]}
            onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}
            {...headerPan.panHandlers}
          >
            <WebsiteTabs
              tabs={tabs}
              activeId={currentTab?.id}
              onChange={onTabPress}
              scrollX={scrollX}
              pageWidth={windowWidth}
            />
          </Reanimated.View>
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
        {/* 右上角分享按钮：figma 10 官网新增，当前仅 UI 占位，点击行为待接 */}
        <ShareCircle />
      </View>

      <ContactSheet ref={contactRef} contacts={contacts} onClose={() => contactRef.current?.dismiss()} />

      <Modal transparent visible={!!preview} onRequestClose={() => setPreview(null)}>
        {!!preview && (
          <View style={!previewShown && styles.previewHidden}>
            {/* FlatList 模式用 initialScrollIndex 直接定位，避免 ScrollView 模式先渲染第 0 张再跳变（闪上一张图） */}
            <GestureViewer
              data={preview.urls}
              initialIndex={preview.index}
              renderItem={(uri: string) => (
                // recyclingKey：cell 复用时先清空旧图再加载新图，防止短暂显示上一张
                <ExpoImage
                  source={{ uri }}
                  style={styles.previewImage}
                  contentFit="contain"
                  transition={100}
                  recyclingKey={uri}
                />
              )}
              ListComponent={FlatList}
              onDismiss={() => setPreview(null)}
              onSingleTap={() => setPreview(null)}
            />
          </View>
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
  /** 模块 tab 内容白卡（figma 10 官网：tab 栏以下为白色内容体） */
  pageBody: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#F6F7FB',
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
  },
  nameCol: {
    flex: 1,
    marginLeft: scaleSizeW(20),
    gap: scaleSizeH(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#000000',
  },
  addrCard: {
    marginTop: scaleSizeH(20),
  },
  addrText: {
    marginTop: scaleSizeH(13),
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(9),
    marginTop: scaleSizeH(14),
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    overflow: 'hidden',
  },
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
  infoContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(24),
  },
  infoTitle: {
    fontSize: setSpText(14),
    fontWeight: '700',
    color: '#000000',
    marginBottom: scaleSizeH(8),
  },
  infoHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(8),
  },
  /** 标题在 infoHeadRow 内时，外边距由行容器承担 */
  infoTitleFlat: {
    marginBottom: 0,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  expandText: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
  },
  expandIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  /** 企业简介高度测量期间隐藏，避免先看到全文再收起 */
  introMeasuring: {
    opacity: 0,
  },
  /** 隐藏测行数文本：与富文本同宽（内容区 padding 16）、同字号行高 */
  introMeasureText: {
    position: 'absolute',
    left: scaleSizeW(16),
    right: scaleSizeW(16),
    top: 0,
    opacity: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
  },
  /** 企业简介收起时按 5 行高度裁剪 */
  introClamp: {
    height: INTRO_COLLAPSED_H,
    overflow: 'hidden',
  },
  albumTitle: {
    marginTop: scaleSizeH(22),
  },
  albumScroll: {
    marginHorizontal: -scaleSizeW(16),
  },
  albumRow: {
    flexDirection: 'row',
    gap: scaleSizeW(15),
    paddingHorizontal: scaleSizeW(16),
  },
  emptyText: {
    marginTop: scaleSizeH(40),
    fontSize: setSpText(13),
    color: '#999999',
    textAlign: 'center',
  },
  skeletonName: {
    width: scaleSizeW(180),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#F5F5F5',
  },
  skeletonAddress: {
    width: scaleSizeW(240),
    height: scaleSizeW(14),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#F5F5F5',
    marginTop: scaleSizeH(13),
  },
  contentLoading: {
    marginTop: scaleSizeH(40),
    alignSelf: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  /** 预览器起步定位期间隐藏（配合 previewShown 延迟显示） */
  previewHidden: {
    opacity: 0,
  },
});
