import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronLeftIcon, ChevronRightIcon, DiamondIcon, SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';

type Tone = 'express' | 'ai';

interface DiscoveryItem {
  id: string;
  title: string;
  tone: Tone;
  /** 弱化展示（灰色标题/图标） */
  dim?: boolean;
  desc: string;
  evidence: string;
  found: number;
}

/** 静态 mock（接口待联调） */
const MOCK_LIST: DiscoveryItem[] = [
  {
    id: '1',
    title: '华东化工客户吨袋集采对接',
    tone: 'ai',
    desc: '企业画像显示具备吨袋产能与稳定交付能力，适合对接区域集采需求。',
    evidence: '依据：企业信息 · 吨袋包装制造 等3条依据',
    found: 12,
  },
  {
    id: '2',
    title: '包装产线节拍优化服务合作',
    tone: 'express',
    desc: '画像中的产线规模与交付节奏，适合引入节拍评估与联线优化服务',
    evidence: '依据：企业信息 · 产线规模、交付节奏 等3条依据',
    found: 12,
  },
  {
    id: '3',
    title: '寻找可靠的 MES / 数采方案服务商',
    tone: 'express',
    dim: true,
    desc: '对接可落地的 MES / 数采方案服务商。',
    evidence: '来源：企业动态 · 采购了一批新的自动化设备',
    found: 12,
  },
];

type Filter = 'all' | Tone;

/** 5.AI发现-方向推荐（figma 53:911）：自定义玻璃头 + 筛选 pill + 方向卡片流 */
export default function AiDiscoveries() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(
    () => (filter === 'all' ? MOCK_LIST : MOCK_LIST.filter(item => item.tone === filter)),
    [filter],
  );
  const counts = useMemo(
    () => ({
      all: MOCK_LIST.length,
      express: MOCK_LIST.filter(i => i.tone === 'express').length,
      ai: MOCK_LIST.filter(i => i.tone === 'ai').length,
    }),
    [],
  );

  const filters: { key: Filter; label: string; dot?: string }[] = [
    { key: 'all', label: `全部 ${counts.all}` },
    { key: 'express', label: `明确表达 ${counts.express}`, dot: GREEN },
    { key: 'ai', label: `AI研判 ${counts.ai}`, dot: PURPLE },
  ];

  return (
    <SafeView backgroundColor="#F6F7FB">
      {/* 自定义头部（半透明压内容） */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <ExpoImage
            source={require('@/assets/link/ai-mascot-small.png')}
            style={styles.navMascot}
            contentFit="cover"
          />
          <Text style={styles.navTitle}>方向推荐</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.glassBtn}
          onPress={() => console.log('go: 搜索方向')}
        >
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
      >
        {/* 筛选 */}
        <View style={styles.filterRow}>
          {filters.map(item => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillIdle]}
                onPress={() => setFilter(item.key)}
              >
                {!!item.dot && <View style={[styles.filterDot, { backgroundColor: item.dot }]} />}
                <Text style={active ? styles.filterTextActive : styles.filterTextIdle}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {list.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => navigation.navigate('directionDetail')}
          >
            <View style={styles.cardTitleRow}>
              <DiamondIcon size={11.5} color={item.dim ? '#B9BDCF' : PRIMARY} />
              <Text style={[styles.cardTitle, item.dim && styles.cardTitleDim]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.cardDesc}>{item.desc}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.tagPill, item.tone === 'ai' ? styles.tagPillAi : styles.tagPillExpress]}>
                <Text style={item.tone === 'ai' ? styles.tagTextAi : styles.tagTextExpress}>
                  {item.tone === 'ai' ? 'AI研判' : '明确表达'}
                </Text>
              </View>
              <View style={styles.evidencePill}>
                <Text style={styles.evidenceText} numberOfLines={1}>{item.evidence}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.foundRow}>
              <Text style={styles.foundText}>
                已发现 <Text style={styles.foundNum}>{item.found}家</Text> 可能相关企业
              </Text>
              <ChevronRightIcon size={10} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(246,247,251,0.7)',
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
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  navMascot: {
    width: scaleSizeW(30),
    height: scaleSizeW(30),
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(12),
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  filterPillActive: {
    backgroundColor: '#000000',
  },
  filterPillIdle: {
    backgroundColor: '#FFFFFF',
  },
  filterDot: {
    width: scaleSizeW(5),
    height: scaleSizeW(5),
    borderRadius: scaleSizeW(2.5),
  },
  filterTextActive: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterTextIdle: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(15),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  cardTitleDim: {
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(12),
  },
  cardDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(13),
  },
  tagPill: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  tagPillAi: {
    backgroundColor: '#EFE9FF',
  },
  tagPillExpress: {
    backgroundColor: '#E7FFF2',
  },
  tagTextAi: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: PURPLE,
  },
  tagTextExpress: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: GREEN,
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
  foundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeH(13),
  },
  foundText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  foundNum: {
    color: '#000000',
  },
});
