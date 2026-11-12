import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { Image as ExpoImage } from 'expo-image';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import PermissionButton from '@/components/PermissionButton';
import { useUserStore } from '@/store/user';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import BusinessInfoSheet from './BusinessInfoSheet';
import DisclaimerSheet from './DisclaimerSheet';
import { AddressIcon, CallIcon, ChevronRightIcon } from './companyIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const LIGHT_BLUE = '#F2F6FF';

const SECTIONS = [
  { key: 'address', label: '经营地址' },
  { key: 'poster', label: '门头照片' },
  { key: 'posterMore', label: '其他照片' },
  { key: 'category', label: '分类信息' },
  { key: 'contact', label: '联系人&电话' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

/** 工商信息左列宽度（figma 1954:6281 位于 x=16，1954:6288 位于 x=206） */
const COLUMN_WIDTH = scaleSizeW(174);
/** 分组导航在 ScrollView 子节点中的索引（用于 stickyHeaderIndices 吸顶） */
const TAB_BAR_INDEX = 4;
/** 分组导航高度（figma 1964:6341 高 25） */
const TAB_BAR_HEIGHT = scaleSizeH(25);

export interface CompanyDetailModel {
  id: string;
  companyName: string;
  logo: string;
  honors: string[];
  juridicalPerson: string;
  registeredCapital: string;
  contributedCapital: string;
  companyType: string;
  establishTime: string;
  regitAddress: string;
  creditNumber: string;
  businessScope: string;
  staffNumber: string;
  businessStatus: string;
  issuingAuthority: string;
  companyProfile: string;
  address: string;
  poster: string;
  posterMore: string[];
  companyIndustry: string;
  tags: string[];
  links: { name: string; detail: string }[];
  remark: string;
  raw: any;
}

const toText = (v: any): string => (v === undefined || v === null ? '' : String(v));

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 建立日期兼容 "2015-07-16" / "2015/07/16 00:00:00" / 时间戳 */
function formatDate(v: any): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'number') {
    const d = new Date(v > 1e12 ? v : v * 1000);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  const m = String(v).match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;
  return String(v);
}

/** 注册资本去掉「人民币」等后缀 */
function formatCapital(v: any): string {
  const s = toText(v).trim();
  return s.replace(/人民币/g, '').trim();
}

/** 解析后端可能返回的 JSON 字符串 / 数组 / {records:[]} 结构 */
function parseRecords(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return parseRecords(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (typeof raw === 'object') {
    const list = raw.records || raw.list || raw.rows;
    return Array.isArray(list) ? list : [];
  }
  return [];
}

function mapDetail(raw: any): CompanyDetailModel {
  const d = raw || {};
  const honors = (Array.isArray(d.honorsList) && d.honorsList.length
    ? d.honorsList
    : parseRecords(d.honorsListStr)
  ).map((it: any) => toText(it?.honorName || it?.name)).filter(Boolean);

  const links = (Array.isArray(d.linksList) && d.linksList.length
    ? d.linksList
    : parseRecords(d.linksListStr)
  ).map((it: any) => ({
    name: toText(it?.contactPerson) || '无',
    detail: toText(it?.contactDetail),
  }));

  const posterMore = Array.isArray(d.posterMore)
    ? d.posterMore.map(toText).filter(Boolean)
    : toText(d.posterMore)
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

  const tags = Array.isArray(d.tags)
    ? d.tags.map(toText).filter(Boolean)
    : toText(d.tags)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: toText(d.id),
    companyName: toText(d.companyName),
    logo: toText(d.logo),
    honors,
    juridicalPerson: toText(d.juridicalPerson),
    registeredCapital: formatCapital(d.registeredCapital),
    contributedCapital: formatCapital(d.contributedCapital),
    companyType: toText(d.companyType),
    establishTime: formatDate(d.establishTime),
    regitAddress: toText(d.regitAddress),
    creditNumber: toText(d.creditNumber),
    businessScope: toText(d.businessScope),
    staffNumber: toText(d.staffNumber),
    businessStatus: toText(d.businessStatus),
    issuingAuthority: toText(d.issuingAuthority),
    companyProfile: toText(d.companyProfile),
    address: toText(d.address),
    poster: toText(d.poster),
    posterMore,
    companyIndustry: toText(d.companyIndustry),
    tags,
    links,
    remark: toText(d.remark),
    raw: d,
  };
}

function InfoItem({ label, value, width }: { label: string; value: string; width?: number }) {
  return (
    <View style={[styles.infoItem, width ? { width } : undefined]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

function Section({
  title,
  right,
  style,
  onLayout,
  children,
}: {
  title: string;
  right?: string;
  style?: any;
  onLayout?: (e: LayoutChangeEvent) => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.section, style]} onLayout={onLayout}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!right && <Text style={styles.sectionRight}>{right}</Text>}
      </View>
      {children}
    </View>
  );
}

/** 未入驻企业信息（figma 1954:6162；数据来源快启API） */
export default function UnjoinedCompanyInfo() {
  const route = useRoute<RouteProp<RootStackParamList, 'unjoinedCompanyInfo'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token } = useUserStore();
  /** api=快启API企业id（企业查询入口）；collect=采集记录id（搜索结果入口） */
  const source = route.params?.source ?? 'collect';
  const id = route.params?.id;

  const [detail, setDetail] = useState<CompanyDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [collectId, setCollectId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<SectionKey>('address');
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const bizSheetRef = useRef<BottomSheetModal>(null);
  const disclaimerSheetRef = useRef<BottomSheetModal>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const tabOffsets = useRef<Record<string, number>>({});
  const tabWidths = useRef<Record<string, number>>({});
  const tabScrollX = useRef(0);
  const tabViewportW = useRef(0);
  /** 程序化滚动期间锁定，避免滚动回调反写 activeTab 造成指示器来回跳 */
  const scrollLock = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTabRef = useRef<SectionKey>('address');
  const indicatorX = useRef(new Animated.Value(0)).current;

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setError('缺少企业参数');
      setLoading(false);
      return;
    }
    if (source === 'api' && !token) {
      setError('请先登录后查看企业信息');
      setNeedLogin(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setNeedLogin(false);
    try {
      const res =
        source === 'collect'
          ? await API.business.collectInfo({ id })
          : await API.business.collectDetail({ id });
      if (res.code !== '200' || !res.data) {
        setError('未查询到企业信息');
        return;
      }
      const raw = Array.isArray(res.data)
        ? res.data[0]
        : res.data.records?.[0] ?? res.data;
      setDetail(mapDetail(raw));
      if (source === 'collect') setCollectId(Number(id));
    } catch (e: any) {
      const code = String(e?.code ?? '');
      if (code === '10001' || code === '401' || code === '10002' || code === '10003') {
        setError('请先登录后查看企业信息');
        setNeedLogin(true);
      } else {
        setError(e?.msg || '加载失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [id, source, token]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /** 指示器平滑滑动到激活 tab 下方 */
  const animateIndicator = useCallback(
    (key: SectionKey) => {
      const x = tabOffsets.current[key];
      const w = tabWidths.current[key];
      if (x === undefined || w === undefined) return;
      const target = x + (w - scaleSizeW(24)) / 2;
      Animated.timing(indicatorX, {
        toValue: target,
        duration: 180,
        useNativeDriver: false,
      }).start();
    },
    [indicatorX],
  );

  /** 激活 tab 若不在可视区域则滚动到可视区域（不做居中，避免多余位移） */
  const ensureTabVisible = useCallback((key: SectionKey) => {
    const x = tabOffsets.current[key];
    const w = tabWidths.current[key];
    const vw = tabViewportW.current;
    if (x === undefined || w === undefined || vw <= 0) return;
    const sx = tabScrollX.current;
    if (x >= sx && x + w <= sx + vw) return;
    const maxX = Math.max(0, (tabOffsets.current[SECTIONS[SECTIONS.length - 1].key] ?? 0) + (tabWidths.current[SECTIONS[SECTIONS.length - 1].key] ?? 0) - vw);
    tabScrollRef.current?.scrollTo({ x: Math.min(Math.max(0, x - 8), maxX), animated: true });
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (scrollLock.current) return;
      const y = e.nativeEvent.contentOffset.y;
      const threshold = y + scaleSizeH(70);
      let current: SectionKey = 'address';
      for (const s of SECTIONS) {
        const offset = sectionOffsets.current[s.key];
        if (offset !== undefined && offset <= threshold) current = s.key;
      }
      if (current === activeTabRef.current) return;
      activeTabRef.current = current;
      setActiveTab(current);
      ensureTabVisible(current);
    },
    [ensureTabVisible],
  );

  const onTabPress = useCallback(
    (key: SectionKey) => {
      if (key !== activeTabRef.current) {
        activeTabRef.current = key;
        setActiveTab(key);
        animateIndicator(key);
      }
      const offset = sectionOffsets.current[key];
      if (offset !== undefined) {
        // 程序化滚动期间锁定滚动回调，防止 activeTab 被回写导致指示器抖动
        scrollLock.current = true;
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => {
          scrollLock.current = false;
        }, 600);
        scrollRef.current?.scrollTo({ y: Math.max(0, offset - TAB_BAR_HEIGHT - scaleSizeH(8)), animated: true });
      }
    },
    [animateIndicator],
  );

  const onTabScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    tabScrollX.current = e.nativeEvent.contentOffset.x;
  }, []);

  useEffect(() => {
    animateIndicator(activeTab);
  }, [activeTab, animateIndicator]);

  useEffect(() => {
    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, []);

  const onClaim = useCallback(() => {
    if (!detail) return;
    /** 已是平台采集记录（搜索入口）：走企业认证流程（对齐小程序 enterprise.vue） */
    if (source === 'collect') {
      navigation.navigate('companyCert');
      return;
    }
    AppAlert.alert('认领企业', '确认认领该企业并录入到平台？', [
      { text: '取消', style: 'cancel' },
      {
        text: '认领',
        onPress: async () => {
          setClaiming(true);
          try {
            const res = await API.business.collectAdd(detail.raw);
            if (res.code !== '200') return;
            Toast.show({ type: 'success', text1: '认领成功' });
            // 认领后企业进入展客列表，取采集记录id用于纠错
            try {
              const listRes = await API.business.collectList({
                pageNum: 1,
                pageSize: 20,
                name: detail.companyName,
              });
              const list = listRes.data?.list || [];
              const found = list.find(
                (o: any) => (o.creditNumber && o.creditNumber === detail.creditNumber) || o.companyName === detail.companyName,
              );
              if (found?.id) setCollectId(Number(found.id));
            } catch {
              // ignore
            }
          } catch {
            Toast.show({ type: 'error', text1: '认领失败' });
          } finally {
            setClaiming(false);
          }
        },
      },
    ]);
  }, [detail, navigation, source]);

  const onCall = useCallback((phone: string) => {
    const num = (phone || '').trim();
    const digits = num.replace(/\D/g, '');
    if (!num || digits.length < 3) {
      Toast.show({ type: 'error', text1: '联系电话无效' });
      return;
    }
    Linking.openURL(`tel:${num}`).catch(() => {
      Toast.show({ type: 'error', text1: '拨号失败，请稍后重试' });
    });
  }, []);

  /** 到这里去：调起系统地图（坐标来自企业详情 lat/lng） */
  const onNavigate = useCallback(() => {
    const lat = Number(detail?.raw?.lat ?? detail?.raw?.latitude);
    const lng = Number(detail?.raw?.lng ?? detail?.raw?.longitude);
    if (!detail?.address) {
      Toast.show({ type: 'error', text1: '暂无经营地址' });
      return;
    }
    if (!lat || !lng) {
      Toast.show({ type: 'error', text1: '暂无该企业坐标信息' });
      return;
    }
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(detail.companyName || '企业')})`).catch(() => {
      Toast.show({ type: 'error', text1: '无法打开地图' });
    });
  }, [detail]);

  const posterList = useMemo(() => {
    if (!detail) return [];
    return [detail.poster, ...detail.posterMore].filter(Boolean);
  }, [detail]);

  const renderPreviewItem = useCallback(
    (uri: string) => <ExpoImage source={{ uri }} style={styles.previewImage} contentFit="contain" transition={100} />,
    [],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : !detail ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.emptyText}>{error || '未查询到企业信息'}</Text>
            {needLogin ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.retryBtn}
                onPress={() => navigation.navigate('login')}
              >
                <Text style={styles.retryBtnText}>去登录</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.8} style={styles.retryBtn} onPress={fetchDetail}>
                <Text style={styles.retryBtnText}>重新加载</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            onMomentumScrollEnd={() => {
              scrollLock.current = false;
            }}
            stickyHeaderIndices={[TAB_BAR_INDEX]}
            contentContainerStyle={styles.content}
          >
            {/* 企业主体（figma 1954:6251 / 1954:6252） */}
            <View style={styles.companyBlock}>
              {detail.logo ? (
                <ExpoImage source={{ uri: detail.logo }} style={styles.logo} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.logo, styles.logoEmpty]} />
              )}
              <View style={styles.companyMain}>
                <Text style={styles.companyName} numberOfLines={2}>
                  {detail.companyName || '-'}
                </Text>
                {detail.honors.length > 0 && (
                  <View style={styles.honorList}>
                    {detail.honors.map((h, i) => (
                      <View key={`${h}-${i}`} style={styles.honorItem}>
                        <Text style={styles.honorText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 工商信息（figma 1954:6278 / 1954:6282） */}
            <View style={styles.bizTitleRow}>
              <Text style={styles.bizTitle}>工商信息</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.bizMore}
                onPress={() => bizSheetRef.current?.present()}
              >
                <Text style={styles.bizMoreText}>全部</Text>
                <ChevronRightIcon />
              </TouchableOpacity>
            </View>

            {/* 工商信息两列（figma 1954:6281 / 1954:6288） */}
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <InfoItem label="企业法人" value={detail.juridicalPerson} width={COLUMN_WIDTH} />
                <View style={styles.infoColRight}>
                  <InfoItem label="注册资本" value={detail.registeredCapital} />
                </View>
              </View>
              <View style={styles.infoRow}>
                <InfoItem label="企业类型" value={detail.companyType} width={COLUMN_WIDTH} />
                <View style={styles.infoColRight}>
                  <InfoItem label="成立日期" value={detail.establishTime} />
                </View>
              </View>
              <View style={styles.infoRowLast}>
                <InfoItem label="登记地址" value={detail.regitAddress} width={scaleSizeW(370)} />
              </View>
            </View>

            {/* 来源（figma 1954:6309） */}
            <View style={styles.sourceBanner}>
              <ExpoImage
                source={require('@/assets/company/source_icon.png')}
                style={styles.sourceIcon}
                contentFit="cover"
              />
              <Text style={styles.sourceText}>来源·快启API</Text>
            </View>

            {/* 分组导航（figma 1964:6341，滚动时吸顶） */}
            <View style={styles.tabBar}>
              <ScrollView
                ref={tabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={onTabScroll}
                scrollEventThrottle={16}
                onLayout={(e) => {
                  tabViewportW.current = e.nativeEvent.layout.width;
                }}
                contentContainerStyle={styles.tabBarContent}
              >
                {SECTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    activeOpacity={0.8}
                    style={styles.tabItem}
                    onLayout={(e) => {
                      tabOffsets.current[s.key] = e.nativeEvent.layout.x;
                      tabWidths.current[s.key] = e.nativeEvent.layout.width;
                      if (activeTabRef.current === s.key) animateIndicator(s.key);
                    }}
                    onPress={() => onTabPress(s.key)}
                  >
                    <Text style={[styles.tabText, activeTab === s.key && styles.tabTextOn]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
                <Animated.View style={[styles.tabIndicator, { left: indicatorX }]} />
              </ScrollView>
            </View>

            {/* 经营地址（figma 1964:6343 / 1954:6272 / 1964:6342） */}
            <Section
              title="经营地址"
              style={styles.sectionFirst}
              onLayout={(e) => {
                sectionOffsets.current.address = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.addressRow}>
                <AddressIcon />
                <Text style={styles.addressText}>{detail.address || '-'}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.9} style={styles.navigateBtn} onPress={onNavigate}>
                <Text style={styles.navigateText}>到这里去</Text>
              </TouchableOpacity>
            </Section>

            {/* 门头照片（figma 1964:6345 / 1964:6346） */}
            <Section
              title="门头照片"
              onLayout={(e) => {
                sectionOffsets.current.poster = e.nativeEvent.layout.y;
              }}
            >
              {detail.poster ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setPreview({ urls: posterList, index: 0 })}
                >
                  <ExpoImage source={{ uri: detail.poster }} style={styles.posterImage} contentFit="cover" transition={150} />
                </TouchableOpacity>
              ) : (
                <View style={styles.posterImage} />
              )}
            </Section>

            {/* 其他照片（figma 1964:6347 / 1964:6350） */}
            {detail.posterMore.length > 0 && (
              <Section
                title="其他照片"
                onLayout={(e) => {
                  sectionOffsets.current.posterMore = e.nativeEvent.layout.y;
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.posterMoreScroll}
                  contentContainerStyle={styles.posterMoreRow}
                >
                  {detail.posterMore.map((url, i) => (
                    <TouchableOpacity
                      key={`${url}-${i}`}
                      activeOpacity={0.9}
                      onPress={() => setPreview({ urls: posterList, index: i + 1 })}
                    >
                      <ExpoImage source={{ uri: url }} style={styles.posterMoreImage} contentFit="cover" transition={150} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* 分类信息（figma 1964:6359 / 1964:6360 / 1964:6355 / 1964:6364） */}
            <Section
              title="分类信息"
              right="当前企业国标分类"
              onLayout={(e) => {
                sectionOffsets.current.category = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.industryText}>{detail.companyIndustry || '-'}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tagItem}>
                  <Text style={styles.tagText}>标签：{detail.tags.length > 0 ? detail.tags.join('、') : '无'}</Text>
                </View>
              </View>
            </Section>

            {/* 联系人&电话（figma 1964:6371 / 1964:6366 / 1964:6367 / 1964:6386） */}
            <Section
              title="联系人&电话"
              onLayout={(e) => {
                sectionOffsets.current.contact = e.nativeEvent.layout.y;
              }}
            >
              {detail.links.length > 0 ? (
                <View style={styles.contactList}>
                  {detail.links.map((l, i) => (
                    <TouchableOpacity
                      key={`c-${i}`}
                      activeOpacity={0.8}
                      style={styles.contactRow}
                      onPress={() => onCall(l.detail)}
                    >
                      <Text style={styles.contactName} numberOfLines={1}>
                        {l.name}
                      </Text>
                      <Text style={styles.contactPhone} numberOfLines={1}>
                        {l.detail || '-'}
                      </Text>
                      <View style={styles.callBtn}>
                        <CallIcon />
                        <Text style={styles.callText}>拨号</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.industryText}>暂无联系人信息</Text>
              )}
            </Section>
          </ScrollView>
        )}

        {/* 底部操作（figma 1970:6387 / 1970:6401） */}
        {!loading && !!detail && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + scaleSizeH(28) }]}>
            <PermissionButton
              activeOpacity={0.8}
              style={styles.footerBtn}
              onPress={onClaim}
              disabled={claiming}
            >
              <Text style={styles.footerBtnText}>{claiming ? '认领中...' : '认领企业'}</Text>
            </PermissionButton>
            <PermissionButton
              activeOpacity={0.8}
              style={styles.footerBtn}
              onPress={() => navigation.navigate('companyErrorCorrection', { collectId })}
            >
              <Text style={styles.footerBtnText}>我要纠错</Text>
            </PermissionButton>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.footerBtn}
              onPress={() => disclaimerSheetRef.current?.present()}
            >
              <Text style={styles.footerBtnText}>免责声明</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!!detail && (
        <BusinessInfoSheet
          ref={bizSheetRef}
          detail={detail}
          onClose={() => bizSheetRef.current?.dismiss()}
        />
      )}
      <DisclaimerSheet ref={disclaimerSheetRef} onClose={() => disclaimerSheetRef.current?.dismiss()} />

      <Modal transparent visible={!!preview} onRequestClose={() => setPreview(null)}>
        {!!preview && (
          <GestureViewer
            data={preview.urls}
            initialIndex={preview.index}
            renderItem={renderPreviewItem}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(24),
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: setSpText(14),
    color: GRAY,
  },
  retryBtn: {
    marginTop: scaleSizeH(16),
    height: scaleSizeH(36),
    paddingHorizontal: scaleSizeW(24),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: setSpText(13),
    color: PRIMARY,
  },
  /** 企业主体 */
  companyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSizeW(12),
  },
  logo: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  logoEmpty: {
    backgroundColor: '#F0F0F0',
  },
  companyMain: {
    flex: 1,
    gap: scaleSizeH(10),
  },
  companyName: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: '#000000',
  },
  honorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(5),
  },
  honorItem: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
  },
  honorText: {
    fontSize: setSpText(10),
    lineHeight: setSpText(19),
    color: PRIMARY,
  },
  /** 工商信息标题行 */
  bizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(30),
  },
  bizTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: '#000000',
  },
  bizMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  bizMoreText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  /** 两列工商信息 */
  infoGrid: {
    marginTop: scaleSizeH(20),
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: scaleSizeH(20),
  },
  infoRowLast: {
    flexDirection: 'row',
  },
  infoColRight: {
    flex: 1,
    paddingLeft: scaleSizeW(16),
  },
  infoItem: {
    gap: scaleSizeH(3),
  },
  infoLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  infoValue: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  /** 来源 */
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginTop: scaleSizeH(10),
  },
  sourceIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
    borderRadius: scaleSizeW(2),
  },
  sourceText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: PRIMARY,
  },
  /** 分组导航 */
  tabBar: {
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: scaleSizeH(19),
    marginRight: -scaleSizeW(16),
  },
  tabBarContent: {
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    gap: scaleSizeW(34),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
  },
  tabText: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  tabTextOn: {
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: scaleSizeW(24),
    height: scaleSizeH(2),
    borderRadius: scaleSizeW(1),
    backgroundColor: PRIMARY,
  },
  /** 通用分区 */
  section: {
    marginTop: scaleSizeH(30),
  },
  sectionFirst: {
    marginTop: scaleSizeH(20),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(19),
    color: '#000000',
  },
  sectionRight: {
    fontSize: setSpText(12),
    lineHeight: setSpText(21),
    color: GRAY,
  },
  /** 经营地址 */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
    marginTop: scaleSizeH(10),
  },
  addressText: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#000000',
  },
  navigateBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_BLUE,
    borderRadius: scaleSizeW(90),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
    marginTop: scaleSizeH(10),
  },
  navigateText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: PRIMARY,
  },
  /** 照片 */
  posterImage: {
    width: scaleSizeW(370),
    height: scaleSizeH(208),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
    marginTop: scaleSizeH(10),
  },
  posterMoreScroll: {
    height: scaleSizeH(84),
    marginTop: scaleSizeH(10),
  },
  posterMoreRow: {
    gap: scaleSizeW(10),
    paddingRight: scaleSizeW(16),
  },
  posterMoreImage: {
    width: scaleSizeW(150),
    height: scaleSizeH(84),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
  },
  /** 分类信息 */
  industryText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#000000',
    marginTop: scaleSizeH(10),
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: scaleSizeW(8),
    marginTop: scaleSizeH(30),
  },
  tagItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  tagText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(21),
    color: GRAY,
  },
  /** 联系人 */
  contactList: {
    marginTop: scaleSizeH(10),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(40),
  },
  contactName: {
    width: scaleSizeW(26),
    fontSize: setSpText(14),
    lineHeight: setSpText(40),
    color: GRAY,
  },
  contactPhone: {
    width: scaleSizeW(94),
    marginLeft: scaleSizeW(15),
    fontSize: setSpText(14),
    lineHeight: setSpText(40),
    color: '#000000',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scaleSizeW(5),
  },
  callText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  /** 底部操作 */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  footerBtn: {
    width: scaleSizeW(116),
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  footerBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  previewImage: {
    width: 300,
    height: 300,
  },
});
