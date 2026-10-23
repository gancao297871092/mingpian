import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import { VerifiedBadgeIcon } from './icons';

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
        contentPadTop={padTop}
        contentMinHeight={minHeight}
        onScroll={handler}
      />
    </View>
  );
}

/**
 * 企业官网2（figma 2134:6575，免费版浅色官网，对齐小程序 freeView）
 * 交互对齐快手/企业主页：各 tab 内容独立滚动并记住位置；头部+tab 栏为悬浮层，随当前 tab 滚动 1:1 平移；
 * 切 tab 时若已吸顶，目标页补滚到吸顶点（头部状态共享、不跳），否则保持各自位置
 */
export default function WebsiteFree({ cpId, fromShare }: WebsiteFreeProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { data } = useCompanyMain(cpId);
  const userInfo = useUserStore((s) => s.userInfo);
  const contactRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<number | string>(-2);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);
  const [contentH, setContentH] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);

  const tabs: WebsiteTab[] = useMemo(() => {
    if (!data) return [{ id: -2, name: '企业信息' }];
    return [
      { id: -2, name: '企业信息' },
      ...(data.moduleList || []).map((o: any) => ({ id: o.id, name: o.mdName, content: o.content })),
      { id: -1, name: '最新动态' },
    ];
  }, [data]);

  const auths: string[] = (data?.authTypeList || []).map((o: any) => o.authTypeCode);
  const isMyCompany = !!(userInfo?.cpId && String(userInfo.cpId) === String(cpId));
  const showContact = String(fromShare || 0) === '1' && !isMyCompany;
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
            active={activeTabRef.current === -1}
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
                  <Text style={styles.infoTitle}>企业简介</Text>
                  <ModuleHtml html={introHtml} />
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
              {!stripHtml(introHtml) && medias.length === 0 && (
                <Text style={styles.emptyText}>暂无内容</Text>
              )}
            </View>
          ) : (
            <View style={styles.infoContent}>
              <ModuleHtml html={tab.content?.content || ''} />
            </View>
          )}
        </HtmlScrollPage>
      );
    },
    [activeIndexSV, scrollY, onScrollJS, windowWidth, padTop, pageMinHeight, registerRef, cpId, introHtml, medias, onPreviewImage],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
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
            style={[styles.content, { paddingTop: insets.top + scaleSizeH(81) }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
          >
            {/* 头像 + 企业名称/认证角标 */}
            <View style={styles.headerRow}>
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
                <View style={styles.logoBadge}>
                  <VerifiedBadgeIcon size={13} />
                </View>
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.name}>{data?.name || ''}</Text>
                {auths.includes('LOCATION') && <GoldBadge />}
              </View>
            </View>

            {/* 公司地址 */}
            <Text style={styles.sectionLabel}>公司地址</Text>
            <Text style={styles.address}>{data?.address || ''}</Text>

            {/* 导航 / 查看联系方式 */}
            <View style={styles.btnRow}>
              <NavPill onPress={() => openNavigation(data)} />
              {showContact && <ContactPill onPress={onShowContact} />}
            </View>
          </View>
          <View style={styles.tabsWrap} onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}>
            <WebsiteTabs
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
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
  },
  logo: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  logoBadge: {
    position: 'absolute',
    right: -scaleSizeW(1),
    bottom: -scaleSizeW(1),
  },
  nameCol: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#000000',
  },
  sectionLabel: {
    marginTop: scaleSizeH(40),
    fontSize: setSpText(14),
    fontWeight: '500',
    letterSpacing: -0.4,
    color: '#000000',
  },
  address: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#000000',
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(19),
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
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
