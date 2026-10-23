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
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
import ContactSheet from './ContactSheet';
import {
  AlbumItem,
  BackCircle,
  ContactPill,
  DynamicsTab,
  type DynamicsTabHandle,
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

/** 企业官网2（figma 2134:6575，免费版浅色官网，对齐小程序 freeView） */
export default function WebsiteFree({ cpId, fromShare }: WebsiteFreeProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { data } = useCompanyMain(cpId);
  const userInfo = useUserStore((s) => s.userInfo);
  const contactRef = useRef<BottomSheetModal>(null);
  const dynamicsRef = useRef<DynamicsTabHandle>(null);
  const [activeTab, setActiveTab] = useState<number | string>(-2);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);
  // 各 tab 内容高度（pager 固定高度，内容自上报；对齐个人主页 UserHome/CompanyPage）
  const [contentH, setContentH] = useState(0);
  const [tabBarH, setTabBarH] = useState(0);
  const [tabHeights, setTabHeights] = useState<Record<string, number>>({});

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

  // ---- 左右滑动 pager（横向 Animated.FlatList，对齐企业主页 CompanyPage） ----
  const scrollX = useRef(new Animated.Value(0)).current;
  const swiperRef = useRef<any>(null);
  /** 内层内容不滚动：内容长时撑开 pager 让外层的滚动量足够触发吸顶；内容短时按内容高度，不留大段空白 */
  const minPagerHeight = Math.max(contentH - tabBarH - scaleSizeH(40), scaleSizeH(200));
  const measuredPagerH = tabHeights[String(currentTab?.id)];
  const naturalPagerH = measuredPagerH != null ? Math.max(measuredPagerH, 1) : minPagerHeight;
  /** pager 高度只立即放大、延迟收缩：切 tab 时若立即收缩会触发原生 clamp 把内容顶上去（先恢复滚动位置再收缩） */
  const [pagerHeight, setPagerHeight] = useState(naturalPagerH);
  useEffect(() => {
    setPagerHeight((prev) => Math.max(prev, naturalPagerH));
    const t = setTimeout(() => setPagerHeight(naturalPagerH), 150);
    return () => clearTimeout(t);
  }, [naturalPagerH]);

  // 布局度量同步镜像（切 tab 恢复滚动位置时用，避免等 state）
  const outerRef = useAnimatedRef<Reanimated.ScrollView>();
  const metricsRef = useRef({ headerH: 0, contentH: 0, tabBarH: 0, minPagerHeight: 0 });
  metricsRef.current = { ...metricsRef.current, contentH, tabBarH, minPagerHeight };
  const pagerHRef = useRef<Record<string, number>>({});
  /** 各 tab 滚动位置记忆（对齐企业主页 scrollOffsetsRef） */
  const scrollOffsetsRef = useRef<Record<string, number>>({});
  /** 切换过渡期间暂停记录：pager 高度收缩触发 clamp 的 onScroll 不是用户滚动，不能写入记忆 */
  const switchingRef = useRef(false);

  const onTabHeight = useCallback((key: string, h: number) => {
    pagerHRef.current[key] = h;
    setTabHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
  }, []);

  /** 切换 tab：恢复该 tab 记忆的滚动位置（无动画）；位置在切换前快照，避免被 clamp 污染。
   *  原生 clamp 回弹动画是异步的，会覆盖立即执行的 scrollTo——立即恢复一次 + 100ms 后再恢复一次 */
  const switchTab = useCallback(
    (id: number | string) => {
      const saved = scrollOffsetsRef.current[String(id)] || 0;
      switchingRef.current = true;
      setActiveTab(id);
      const restore = () => {
        const m = metricsRef.current;
        const measured = pagerHRef.current[String(id)];
        const ph = measured != null ? Math.max(measured, 1) : m.minPagerHeight;
        const maxOffset = Math.max(m.headerH + m.tabBarH + ph + scaleSizeH(20) - m.contentH, 0);
        const stickyY = Math.max(m.headerH - insets.top - STICKY_NICK_H, 0);
        // 短内容吸顶不可达时直接回页顶，避免停在半截位置
        const target = maxOffset < stickyY ? 0 : Math.min(saved, maxOffset);
        scrollTo(outerRef, 0, target, false);
        (outerRef.current as any)?.scrollTo?.({ y: target, animated: false });
      };
      requestAnimationFrame(restore);
      setTimeout(() => {
        restore();
        switchingRef.current = false;
      }, 100);
    },
    [outerRef, insets.top],
  );

  const lastEndRef = useRef(0);
  const onOuterScrollJS = useCallback(
    (y: number, ch: number, lh: number) => {
      if (!switchingRef.current) {
        scrollOffsetsRef.current[String(activeTabRef.current)] = y;
      }
      if (activeTabRef.current !== -1) return;
      if (y + lh < ch - 300) return;
      const now = Date.now();
      if (now - lastEndRef.current < 800) return;
      lastEndRef.current = now;
      dynamicsRef.current?.onEndReached();
    },
    [],
  );

  /** 点 tab：pager 滚动到目标页 + 恢复目标 tab 记忆位置（momentumEnd 里按 activeTabRef 去重） */
  const onTabPress = useCallback(
    (tab: WebsiteTab, index: number) => {
      swiperRef.current?.scrollToOffset({ offset: index * windowWidth, animated: true });
      switchTab(tab.id);
    },
    [switchTab, windowWidth],
  );

  /** 横滑结束：落到整页后切换 tab（对齐企业主页 onSwiperMomentumEnd） */
  const onSwipeEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      const t = tabs[i];
      if (t && t.id !== activeTabRef.current) switchTab(t.id);
    },
    [tabs, windowWidth, switchTab],
  );

  const renderPage = useCallback(
    ({ item: tab }: { item: WebsiteTab }) => (
      <View style={{ width: windowWidth, height: pagerHeight }}>
        {tab.id === -1 ? (
          <DynamicsTab
            ref={dynamicsRef}
            cpId={cpId}
            active={activeTabRef.current === -1}
            onHeight={(h) => onTabHeight('-1', h)}
          />
        ) : (
          <View onLayout={(e) => onTabHeight(String(tab.id), e.nativeEvent.layout.height)}>
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
          </View>
        )}
      </View>
    ),
    [windowWidth, pagerHeight, cpId, introHtml, medias, onTabHeight, onPreviewImage],
  );

  // tab 吸顶（对齐企业主页）：吸顶栏高度 0→(状态栏+46) 跟随滚动展开，中间显示企业名称；全程 UI 线程不抖
  const scrollY = useSharedValue(0);
  const headerHSV = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(onOuterScrollJS)(e.contentOffset.y, e.contentSize.height, e.layoutMeasurement.height);
    },
  });
  // 吸顶（自定义悬浮层方案，替代 RN stickyHeaderIndices——后者在 pager 高度变化 + clamp 时状态错乱）：
  // 内联 tab 栏随内容滚走；切换点 = headerH - 状态栏 - 名称栏高，此时内联栏与悬浮层（含状态栏+名称栏）的 tab 位置
  // 正好重合，1px 阈值完成无跳动切换（全程 UI 线程）
  const overlayH = insets.top + STICKY_NICK_H + tabBarH;
  const stickyOverlayStyle = useAnimatedStyle(() => {
    const stickyY = Math.max(headerHSV.value - insets.top - STICKY_NICK_H, 1);
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [stickyY - 1, stickyY], [-overlayH, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });
  /** 吸顶切换时返回键上移 5px 收进名称栏（与悬浮层同一切换点） */
  const navStyle = useAnimatedStyle(() => {
    const stickyY = Math.max(headerHSV.value - insets.top - STICKY_NICK_H, 1);
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [stickyY - 1, stickyY], [0, -5], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <SafeView backgroundColor="#FFFFFF">
      <StatusBar barStyle="dark-content" />
      <Reanimated.ScrollView
        ref={outerRef}
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
      >
        <View
          style={[styles.content, { paddingTop: insets.top + scaleSizeH(81) }]}
          onLayout={(e) => {
            headerHSV.value = e.nativeEvent.layout.height;
            metricsRef.current.headerH = e.nativeEvent.layout.height;
          }}
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

        {/* 模块 tab（内联随内容滚动；吸顶由底部悬浮层接管，见 stickyOverlay） */}
        <View style={styles.tabsWrap}>
          <View onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}>
            <WebsiteTabs
              tabs={tabs}
              activeId={currentTab?.id}
              onChange={onTabPress}
              scrollX={scrollX}
              pageWidth={windowWidth}
            />
          </View>
        </View>

        {/* tab 内容：左右滑动切换（横向 FlatList pager，对齐企业主页），高度按当前 tab 内容撑开 */}
        <Animated.FlatList
          ref={swiperRef}
          style={{ height: pagerHeight }}
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
        />
        <View style={styles.bottomPad} />
      </Reanimated.ScrollView>

      <BackCircle onPress={() => navigation.goBack()} animatedStyle={navStyle} />

      {/* 吸顶悬浮栏：状态栏占位 + 企业名称 + tab 栏复制（与内联共享状态） */}
      <Reanimated.View style={[styles.stickyOverlay, stickyOverlayStyle]} pointerEvents="box-none">
        <View style={{ height: insets.top }} />
        <View style={styles.stickyNickInner}>
          <Text style={styles.stickyName} numberOfLines={1}>
            {data?.name || ''}
          </Text>
        </View>
        <WebsiteTabs
          tabs={tabs}
          activeId={currentTab?.id}
          onChange={onTabPress}
          scrollX={scrollX}
          pageWidth={windowWidth}
        />
      </Reanimated.View>

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
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(18),
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
  tabsWrap: {
    backgroundColor: '#FFFFFF',
  },
  stickyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 5,
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
  bottomPad: {
    height: scaleSizeH(20),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
