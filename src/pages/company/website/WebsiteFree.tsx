import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import { TabView } from 'react-native-tab-view';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
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

  // ---- 左右滑动 pager（react-native-tab-view，隐藏默认 TabBar，tab 栏用自定义 WebsiteTabs） ----
  const routes = useMemo(() => tabs.map((t) => ({ key: String(t.id), title: t.name })), [tabs]);
  const activeIndex = Math.max(tabs.findIndex((t) => t.id === activeTab), 0);
  /** 内层内容不滚动，需保证 pager 足够高让外层可滚动（吸顶才能触发） */
  const minPagerHeight = Math.max(contentH - tabBarH - scaleSizeH(40), scaleSizeH(200));
  const pagerHeight = Math.max(tabHeights[String(currentTab?.id)] || 0, minPagerHeight);

  const onTabHeight = useCallback((key: string, h: number) => {
    setTabHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
  }, []);

  const lastEndRef = useRef(0);
  const maybeLoadMore = useCallback((y: number, ch: number, lh: number) => {
    if (activeTabRef.current !== -1) return;
    if (y + lh < ch - 300) return;
    const now = Date.now();
    if (now - lastEndRef.current < 800) return;
    lastEndRef.current = now;
    dynamicsRef.current?.onEndReached();
  }, []);

  const renderScene = useCallback(
    ({ route }: { route: { key: string } }) => {
      const tab = tabs.find((t) => String(t.id) === route.key);
      if (!tab) return null;
      if (tab.id === -1) {
        return (
          <View style={{ width: windowWidth, height: pagerHeight }}>
            <DynamicsTab
              ref={dynamicsRef}
              cpId={cpId}
              active={activeTabRef.current === -1}
              onHeight={(h) => onTabHeight('-1', h)}
            />
          </View>
        );
      }
      return (
        <View
          style={{ width: windowWidth }}
          onLayout={(e) => onTabHeight(route.key, e.nativeEvent.layout.height)}
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
        </View>
      );
    },
    [tabs, windowWidth, pagerHeight, cpId, introHtml, medias, onTabHeight, onPreviewImage],
  );

  // tab 吸顶（对齐企业主页）：吸顶栏高度 0→(状态栏+46) 跟随滚动展开，中间显示企业名称；全程 UI 线程不抖
  const scrollY = useSharedValue(0);
  const headerHSV = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(maybeLoadMore)(e.contentOffset.y, e.contentSize.height, e.layoutMeasurement.height);
    },
  });
  const nickStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
      [0, insets.top + STICKY_NICK_H],
      Extrapolation.CLAMP,
    ),
  }));
  /** 吸顶过程中返回键上移 5px 进入名称栏（对齐企业主页） */
  const navStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [Math.max(headerHSV.value - STICKY_NICK_H, 0), Math.max(headerHSV.value, 1)],
          [0, -5],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <SafeView backgroundColor="#FFFFFF">
      <StatusBar barStyle="dark-content" />
      <Reanimated.ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
      >
        <View
          style={[styles.content, { paddingTop: insets.top + scaleSizeH(81) }]}
          onLayout={(e) => {
            headerHSV.value = e.nativeEvent.layout.height;
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

        {/* 模块 tab（吸顶，对齐企业主页 stickyHeaderIndices；吸顶栏中间显示企业名称） */}
        <View style={styles.tabsWrap}>
          <Reanimated.View style={[styles.stickyNick, nickStyle]}>
            <View style={styles.stickyNickInner}>
              <Text style={styles.stickyName} numberOfLines={1}>
                {data?.name || ''}
              </Text>
            </View>
          </Reanimated.View>
          <View onLayout={(e) => setTabBarH(e.nativeEvent.layout.height)}>
            <WebsiteTabs tabs={tabs} activeId={currentTab?.id} onChange={(t) => setActiveTab(t.id)} />
          </View>
        </View>

        {/* tab 内容：左右滑动切换（react-native-tab-view），高度按当前 tab 内容撑开 */}
        <TabView
          navigationState={{ index: activeIndex, routes }}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={(i) => {
            const t = tabs[i];
            if (t) setActiveTab(t.id);
          }}
          initialLayout={{ width: windowWidth }}
          style={{ height: pagerHeight }}
        />
        <View style={styles.bottomPad} />
      </Reanimated.ScrollView>

      <BackCircle onPress={() => navigation.goBack()} animatedStyle={navStyle} />
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
  stickyNick: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  /** 名称贴容器底滑出，上方留白即状态栏占位（对齐企业主页） */
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
  infoContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
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
    height: scaleSizeH(40),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
