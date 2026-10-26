import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import Reanimated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '@/api';
import LongHtmlView from '@/components/LongHtmlView';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import { ossVideoSnapshot } from '@/pages/square/bbsDetail/detailTransform';
import CompanyPostList from '@/pages/my/company/CompanyPostList';
import { BackArrowIcon } from '@/pages/my/myIcons';
import { NavIcon, PlayTriangleIcon } from './icons';

const BADGE_CHECK_ICON = require('@/assets/company-website/badge-check-icon.png');

export const PRIMARY = '#2962D4';

export interface WebsiteTab {
  id: number | string;
  name: string;
  content?: any;
}

/** 企业官网详情（/company/main，对齐小程序 freeView/feeView getDetails） */
export function useCompanyMain(cpId: number | string) {
  const [data, setData] = useState<any>(null);
  const load = useCallback(() => {
    return API.company
      .main({ cpId })
      .then((res) => {
        // console.log('company main', res);
        if (res.code === '200' && res.data) setData(res.data);
      })
      .catch(() => { });
  }, [cpId]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, reload: load };
}

export function stripHtml(html?: string): string {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export function isVideoMedia(item: any): boolean {
  const media = item?.media || item || {};
  if (media.fileType === 'video') return true;
  const url = media.mdUrl || '';
  return /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(url);
}

export function mediaUrl(item: any): string {
  return item?.media?.mdUrl || item?.mdUrl || '';
}

export function mediaThumb(item: any): string {
  const url = mediaUrl(item);
  return isVideoMedia(item) ? ossVideoSnapshot(url) : url;
}

/** 悬浮返回按钮（figma Button Group 1：44 白圆 + 阴影，对齐 CompanyPage；animatedStyle 用于吸顶时平移进名称栏） */
export function BackCircle({ onPress, animatedStyle }: { onPress: () => void; animatedStyle?: any }) {
  const insets = useSafeAreaInsets();
  return (
    <Reanimated.View
      style={[styles.backWrap, { top: insets.top + scaleSizeH(7) }, animatedStyle]}
      pointerEvents="box-none"
    >
      <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.backCircle} onPress={onPress}>
        <BackArrowIcon size={20} color="#1A1A1A" />
      </TouchableOpacity>
    </Reanimated.View>
  );
}

/** 企核·实地核查 金色渐变角标（figma 2134:6587）；渐变做绝对填充背景，布局走普通 View（LinearGradient 直接布局子元素会少算宽度） */
export function GoldBadge() {
  return (
    <View style={styles.goldBadge}>
      <LinearGradient
        colors={['#FEF4E9', '#FFE4C1']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.goldBadgeBg}
      />
      <ExpoImage source={BADGE_CHECK_ICON} style={styles.goldBadgeIcon} contentFit="contain" />
      <Text style={styles.goldBadgeText} numberOfLines={1}>
        企核·实地核查
      </Text>
    </View>
  );
}

/** 导航按钮（free: 描边#D9D9D9 蓝图标；pro: 描边半透明白 白图标） */
export function NavPill({ dark, onPress }: { dark?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.navPill, dark ? styles.navPillDark : styles.navPillLight]}
      onPress={onPress}
    >
      <NavIcon size={16} color={dark ? '#FFFFFF' : PRIMARY} />
      <Text style={[styles.navPillText, dark && styles.textWhite]}>导航</Text>
    </TouchableOpacity>
  );
}

/** 查看联系方式按钮（free: 蓝底白字；pro: 白底黑字） */
export function ContactPill({ dark, onPress }: { dark?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.contactPill, dark ? styles.contactPillDark : styles.contactPillLight]}
      onPress={onPress}
    >
      <Text style={[styles.contactPillText, dark && styles.contactPillTextDark]}>查看联系方式</Text>
    </TouchableOpacity>
  );
}

interface WebsiteTabsProps {
  tabs: WebsiteTab[];
  activeId: number | string;
  onChange: (tab: WebsiteTab, index: number) => void;
  dark?: boolean;
  /** 横向 pager 的 scrollX（传入后指示器/文字颜色随滑动联动，对齐企业主页） */
  scrollX?: Animated.Value;
  pageWidth?: number;
}

/** 模块 tab 栏（横向滚动，gap 34；激活 15 Medium，未激活 15 Regular；下划线 24×3 圆角；底部分隔线；激活项自动滚入可视区域） */
export function WebsiteTabs({ tabs, activeId, onChange, dark, scrollX, pageWidth }: WebsiteTabsProps) {
  const [layouts, setLayouts] = useState<Record<string, { x: number; w: number }>>({});
  const scrollRef = useRef<ScrollView>(null);
  const active = tabs.find((t) => t.id === activeId) || tabs[0];
  const activeLayout = active ? layouts[String(active.id)] : undefined;
  const orderedLayouts = tabs.map((t) => layouts[String(t.id)]);
  const layoutsReady = orderedLayouts.every(Boolean) && orderedLayouts.length > 0;
  const position = scrollX && pageWidth ? Animated.divide(scrollX, pageWidth) : null;
  // 插值至少 2 个元素：仅 1 个 tab 时退回静态指示器
  const animatedIndicator = position && layoutsReady && tabs.length >= 2;

  // 激活 tab 不在可视区域时，横向滚动使其居中可见
  useEffect(() => {
    if (!active || !activeLayout) return;
    const target = Math.max(activeLayout.x + activeLayout.w / 2 - SCREEN_WIDTH / 2, 0);
    scrollRef.current?.scrollTo({ x: target, animated: true });
  }, [active, activeLayout]);

  return (
    <View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tabsRow}>
            {tabs.map((t, i) => {
              const isActive = active && t.id === active.id;

              return (
                <TouchableOpacity
                  key={String(t.id)}
                  activeOpacity={0.7}
                  onPress={() => onChange(t, i)}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setLayouts((prev) => {
                      const cur = prev[String(t.id)];
                      if (cur && cur.x === x && cur.w === width) return prev;
                      return { ...prev, [String(t.id)]: { x, w: width } };
                    });
                  }}
                >
                  <Animated.Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                      dark
                        ? isActive
                          ? styles.tabTextDarkActive
                          : styles.tabTextDark
                        : isActive
                          ? styles.tabTextLightActive
                          : styles.tabTextLight,
                    ]}
                  >
                    {t.name}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {layoutsReady &&
            (animatedIndicator ? (
              <Animated.View
                style={[
                  styles.tabsIndicator,
                  dark && styles.tabsIndicatorDark,
                  styles.tabsIndicatorAnimated,
                  {
                    transform: [
                      {
                        translateX: position.interpolate({
                          inputRange: tabs.map((_, i) => i),
                          outputRange: orderedLayouts.map((l) => l.x + (l.w - scaleSizeW(24)) / 2),
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : (
              activeLayout && (
                <View
                  style={[
                    styles.tabsIndicator,
                    dark && styles.tabsIndicatorDark,
                    { left: activeLayout.x + (activeLayout.w - scaleSizeW(24)) / 2 },
                  ]}
                />
              )
            ))}
        </View>
      </ScrollView>
      <View style={[styles.tabsDivider]} />
    </View>
  );
}

/** 模块富文本内容（对齐小程序 mp-html） */
export function ModuleHtml({ html, dark }: { html: string; dark?: boolean }) {
  return (
    <LongHtmlView
      html={html}
      contentWidth={SCREEN_WIDTH - scaleSizeW(32)}
      baseStyle={{ ...styles.moduleHtmlBase, ...(dark ? styles.moduleHtmlDark : styles.moduleHtmlLight) }}
    />
  );
}

/** 最新动态 tab（复用企业主页瀑布流；自身不滚动，内容高度经 onHeight 上报给外层 pager） */
export interface DynamicsTabHandle {
  onEndReached: () => void;
  ensureLoaded: () => void;
}

export const DynamicsTab = forwardRef<
  DynamicsTabHandle,
  { cpId: number | string; active: boolean; onHeight: (h: number) => void }
>(function DynamicsTabInner({ cpId, active, onHeight }, ref) {
  const listRef = useRef<any>(null);
  useImperativeHandle(
    ref,
    () => ({
      onEndReached: () => listRef.current?.onEndReached?.(),
      ensureLoaded: () => listRef.current?.ensureLoaded?.(),
    }),
    [],
  );
  return <CompanyPostList ref={listRef} cpId={cpId} active={active} onHeight={onHeight} />;
});

/** 地图导航（对齐小程序 daohang：优先经纬度，退化地址搜索） */
export function openNavigation(data: any) {
  const lat = Number(data?.latitude);
  const lng = Number(data?.longitude);
  const label = encodeURIComponent(data?.name || data?.address || '公司地址');
  let url = '';
  if (lat && lng) {
    url = Platform.OS === 'ios' ? `maps://?q=${label}&ll=${lat},${lng}` : `geo:${lat},${lng}?q=${label}`;
  } else if (data?.address) {
    const q = encodeURIComponent(data.address);
    url = Platform.OS === 'ios' ? `maps://?q=${q}` : `geo:0,0?q=${q}`;
  }
  if (!url) {
    Toast.show({ type: 'info', text1: '暂无地址信息' });
    return;
  }
  Linking.openURL(url).catch(() => Toast.show({ type: 'info', text1: '未安装可用的地图应用' }));
}

/** 相册项：图片点击预览；视频点击原位播放（对齐 LongHtmlView RichVideoBox） */
export function AlbumItem({
  item,
  width,
  height,
  radius,
  onPreview,
}: {
  item: any;
  width: number;
  height: number;
  radius: number;
  onPreview: () => void;
}) {
  const video = isVideoMedia(item);
  const [playing, setPlaying] = useState(false);
  const boxStyle = { width, height, borderRadius: radius };
  if (video && playing) {
    return (
      <Video
        source={{ uri: mediaUrl(item) }}
        style={[styles.albumBox, boxStyle]}
        controls
        paused={false}
        resizeMode="contain"
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={video ? () => setPlaying(true) : onPreview}>
      <ExpoImage
        source={{ uri: mediaThumb(item) }}
        recyclingKey={mediaThumb(item)}
        style={[styles.albumBox, boxStyle]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
      {video && (
        <View style={styles.albumPlayPill} pointerEvents="none">
          <PlayTriangleIcon size={10} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backWrap: {
    position: 'absolute',
    left: scaleSizeW(16),
    zIndex: 10,
  },
  backCircle: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(7),
    paddingVertical: scaleSizeH(3),
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: scaleSizeW(5),
  },
  goldBadgeBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scaleSizeW(5),
  },
  goldBadgeText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: '#4C3416',
  },
  goldBadgeIcon: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
  },
  navPill: {
    width: scaleSizeW(80),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(20),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(2),
  },
  navPillLight: {
    borderColor: '#D9D9D9',
  },
  navPillDark: {
    borderColor: 'rgba(217,217,217,0.5)',
  },
  navPillText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#000000',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  contactPill: {
    width: scaleSizeW(280),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactPillLight: {
    backgroundColor: PRIMARY,
  },
  contactPillDark: {
    backgroundColor: '#FFFFFF',
  },
  contactPillText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  contactPillTextDark: {
    color: '#000000',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
  },
  tabText: {
    fontSize: setSpText(15),
    letterSpacing: -0.4,
  },
  tabTextLight: {
    color: '#6C6C6C',
  },
  tabTextDark: {
    color: '#999999',
  },
  tabTextActive: {
    fontWeight: '500',
  },
  tabTextLightActive: {
    color: '#000000',
  },
  tabTextDarkActive: {
    color: '#FFFFFF',
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#EDECEC',
  },
  tabsDividerDark: {
    backgroundColor: '#424242',
  },
  tabsIndicator: {
    position: 'absolute',
    bottom: 0,
    width: scaleSizeW(24),
    height: 3,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  tabsIndicatorAnimated: {
    left: 0,
  },
  tabsIndicatorDark: {
    backgroundColor: '#FFFFFF',
  },
  albumBox: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  moduleHtmlBase: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
  },
  moduleHtmlLight: {
    color: '#000000',
  },
  moduleHtmlDark: {
    color: '#FFFFFF',
  },
  albumPlayPill: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scaleSizeW(17) }, { translateY: -scaleSizeH(12) }],
    padding: scaleSizeW(7),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
