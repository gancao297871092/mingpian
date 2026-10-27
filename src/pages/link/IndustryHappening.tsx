import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronLeftIcon, ChevronRightIcon, DiamondIcon, HiBubbleIcon, SearchIcon } from './icons';

const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';

interface HappeningItem {
  id: string;
  title: string;
  desc: string;
  evidence: string;
}

/** 静态 mock（接口待联调） */
const MOCK_LIST: HappeningItem[] = [
  {
    id: '1',
    title: '产线升级，寻找锻造设备与集成服务商',
    desc: '通海优耐特推进锻造工位与整线自动化升级，希望对接可落地的设备与集成服务商。',
    evidence: '依据：企业动态 · 新产线已投用 等2条依据',
  },
  {
    id: '2',
    title: '可提供吨袋包装产能，承接代工与长期合作',
    desc: '华兴包装具备稳定产能与交付能力，可承接代工与长期供货合作。',
    evidence: '依据：企业信息 · 吨袋包装制造 等2条依据',
  },
  {
    id: '3',
    title: '寻找 MES / 数采系统服务商',
    desc: '企业计划梳理产线数据与数字化管理流程，希望引入可落地的 MES / 数采方案。',
    evidence: '依据：企业信息 · 数字化改造 等2条依据',
  },
];

/** 61.产业正在发生（figma 387:2375）：浅蓝底 + 吉祥物头 + 机会卡片流 */
export default function IndustryHappening() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
          onPress={() => console.log('go: 搜索机会')}
        >
          <SearchIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
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

        {MOCK_LIST.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <DiamondIcon size={11.5} />
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            </View>
            <Text style={styles.cardDesc}>{item.desc}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>AI研判</Text>
              </View>
              <View style={styles.evidencePill}>
                <Text style={styles.evidenceText} numberOfLines={1}>{item.evidence}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.detailRow}
              onPress={() => navigation.navigate('opportunityDetail')}
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
    paddingHorizontal: scaleSizeW(13),
    marginBottom: scaleSizeH(12),
  },
  pageTitle: {
    fontSize: setSpText(22),
    fontWeight: '600',
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
  },
  pageSub: {
    marginTop: scaleSizeH(10),
    width: scaleSizeW(235),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  mascot: {
    position: 'absolute',
    right: scaleSizeW(0),
    top: scaleSizeH(-7),
    width: scaleSizeW(108),
    height: scaleSizeW(108),
  },
  hiBubble: {
    position: 'absolute',
    right: scaleSizeW(100),
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
    paddingTop: scaleSizeH(22),
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
    marginTop: scaleSizeH(15),
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
    marginTop: scaleSizeH(13),
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
