import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import type { LinkOpportunityItem } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { formatBasis } from './linkFormat';
import { ChevronLeftIcon, ChevronRightIcon, DiamondIcon, HiBubbleIcon, SearchIcon } from './icons';

const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';
const PAGE_SIZE = 10;

interface HappeningItem {
  id: string;
  opportunityId: number;
  title: string;
  desc: string;
  evidence: string;
  stage: string;
}

/** 接口 → 卡片模型（描述为空时用商机类型兜底，避免卡片留白） */
function toHappeningItem(item: LinkOpportunityItem): HappeningItem {
  const opp = item.opportunity ?? ({} as LinkOpportunityItem['opportunity']);
  return {
    id: String(opp.id),
    opportunityId: opp.id,
    title: opp.title || '未命名商机',
    desc: opp.aiAnalysis || [opp.region, opp.scale].filter(Boolean).join(' · ') || 'AI 正在解读该商机',
    evidence: formatBasis((item.basisList ?? []).map(b => b.label)),
    stage: item.stage || 'AI研判',
  };
}

/** 61.产业正在发生（figma 387:2375）：浅蓝底 + 吉祥物头 + 机会卡片流 */
export default function IndustryHappening() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [list, setList] = useState<HappeningItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(async (pageNum: number, append: boolean, isRefresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isRefresh) setRefreshing(true);
    try {
      const res = await API.aiDiscovery.happening({ pageNum, pageSize: PAGE_SIZE });
      const items = (res.data.list ?? []).map(toHappeningItem);
      setList(prev => (append ? [...prev, ...items] : items));
      setPage(res.data.pageNum || pageNum);
      setPages(Math.max(res.data.pages || 1, 1));
    } catch {
      // 拦截器已提示错误
    } finally {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1, false);
  }, [fetchList]);

  const loadMore = useCallback(() => {
    if (page < pages) fetchList(page + 1, true);
  }, [fetchList, page, pages]);

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ExpoImage
        source={require('@/assets/link/hero-bg.png')}
        style={styles.headerBg}
        contentFit="cover"
      />
      {/* 自定义头部：玻璃返回 + 搜索 */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.glassBtn}
          onPress={() => navigation.navigate('happeningSearch', {})}
        >
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
            loadMore();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchList(1, false, true)}
            tintColor={PURPLE}
          />
        }
      >
        {/* 标题区 */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>产业正在发生</Text>
          <Text style={styles.pageSub}>基于产业动态与企业信息，AI识别值得关注的合作机会。</Text>
          <ExpoImage
            source={require('@/assets/link/happening-mascot.png')}
            style={styles.mascot}
            contentFit="cover"
          />
          <View style={styles.hiBubble}>
            <HiBubbleIcon size={38} />
            <Text style={styles.hiText}>Hi~</Text>
          </View>
        </View>

        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <DiamondIcon size={11.5} />
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            </View>
            <Text style={styles.cardDesc}>{item.desc}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.stage}</Text>
              </View>
              <View style={styles.evidencePill}>
                <Text style={styles.evidenceText} numberOfLines={1}>{item.evidence}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.detailRow}
              onPress={() => navigation.navigate('opportunityDetail', { opportunityId: item.opportunityId })}
            >
              <Text style={styles.detailText}>查看详情</Text>
              <ChevronRightIcon size={10} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(218),
    opacity: 0.3,
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(10),
  },
  glassBtn: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  titleBlock: {
    marginBottom: scaleSizeH(12),
  },
  pageTitle: {
    marginLeft: scaleSizeW(29),
    fontSize: setSpText(22),
    fontWeight: '600',
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
  },
  pageSub: {
    marginTop: scaleSizeH(10),
    marginLeft: scaleSizeW(29),
    width: scaleSizeW(235),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  mascot: {
    position: 'absolute',
    right: scaleSizeW(15),
    top: scaleSizeH(-7),
    width: scaleSizeW(108),
    height: scaleSizeW(108),
    transform: [{ scaleX: -1 }],
  },
  hiBubble: {
    position: 'absolute',
    right: scaleSizeW(113),
    top: scaleSizeH(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiText: {
    position: 'absolute',
    top: scaleSizeH(5),
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(18),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  cardDesc: {
    marginTop: scaleSizeH(14),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginTop: scaleSizeH(11),
  },
  tagPill: {
    borderRadius: scaleSizeW(10),
    backgroundColor: '#EFE9FF',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: PURPLE,
  },
  evidencePill: {
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F6F7FB',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  evidenceText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: scaleSizeH(20),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeH(11),
  },
  detailText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
});
