import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { SCREEN_WIDTH, scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  ArrowCtaIcon,
  BuildingIcon,
  ChevronRightIcon,
  CompassIcon,
  DiamondIcon,
  OppIcon,
  SignalIcon,
} from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const ORANGE = '#F2722C';
const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调） */
const MOCK_ENTRY = { signalTouching: 15, oppPending: 3 };

interface Opportunity {
  id: string;
  title: string;
  tag: 'AI研判' | '明确表达';
  city: string;
}

/** 静态 mock（接口待联调） */
const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: '1', title: '苏州企业寻找自动化生产线集成商', tag: 'AI研判', city: '苏州' },
  { id: '2', title: '新增包装产能，开放代工与长期合作', tag: '明确表达', city: '苏州' },
];

/** 静态 mock（接口待联调） */
const MOCK_DISCOVERY = { expressCount: 3, aiCount: 5 };

/** 4.连接（figma 2793:6179，分组10最新稿）：链接 tab 入口页 */
export default function LinkPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ExpoImage
        source={require('@/assets/link/hero-bg.png')}
        style={[styles.heroBg, { height: (SCREEN_WIDTH * 218) / 402 }]}
        contentFit="cover"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(14) }]}
      >
        {/* 发合作信号 Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#C6D9FF', '#FFFFFF', '#FFFFFF']}
            locations={[0, 0.46, 1]}
            style={styles.heroCard}
          >
            <View style={{
              paddingTop: scaleSizeH(55),
            }}>
              <Text style={styles.heroTitle}>告诉平台，您想找到谁</Text>
              <Text style={styles.heroSub}>基于企业动态与企业画像，识别值得连接的合作线索</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.heroCta}
              onPress={() => navigation.navigate('createCooperationSignal')}
            >
              <Text style={styles.heroCtaText}>下达合作匹配指令</Text>
              <View style={styles.heroCtaArrow}>
                <ArrowCtaIcon />
              </View>
            </TouchableOpacity>

          </LinearGradient>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>发合作信号</Text>
          </View>
          <ExpoImage source={require('@/assets/link/hero-mascot.png')} style={styles.heroMascot} contentFit="cover" />
        </View>

        {/* 我的信号 / 合作中心 */}
        <View style={styles.entryRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.entryCard}
            onPress={() => navigation.navigate('mySignals')}
          >
            <View style={styles.entryTitleRow}>
              <SignalIcon />
              <Text style={styles.entryTitle}>我的信号</Text>
            </View>
            <Text style={styles.entryDesc}>查看匹配、触达与反馈</Text>
            <View style={[styles.entryPill, styles.pillSignal]}>
              <Text style={[styles.entryPillText, styles.pillSignalText]}>{MOCK_ENTRY.signalTouching}条触达中</Text>
            </View>
            <View style={styles.entryChevron}>
              <ChevronRightIcon size={14} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.entryCard}
            onPress={() => navigation.navigate('myOpportunities')}
          >
            <View style={styles.entryTitleRow}>
              <OppIcon />
              <Text style={styles.entryTitle}>合作中心</Text>
            </View>
            <Text style={styles.entryDesc}>管理已形成的合作跟进</Text>
            <View style={[styles.entryPill, styles.pillOpp]}>
              <Text style={[styles.entryPillText, styles.pillOppText]}>{MOCK_ENTRY.oppPending}条待我回应</Text>
            </View>
            <View style={styles.entryChevron}>
              <ChevronRightIcon size={14} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 产业正在发生 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>产业正在发生</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.sectionMore}
            onPress={() => navigation.navigate('industryHappening')}
          >
            <Text style={styles.sectionMoreText}>查看更多</Text>
            <ChevronRightIcon size={12} />
          </TouchableOpacity>
        </View>
        {MOCK_OPPORTUNITIES.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.oppCard}
            onPress={() => navigation.navigate('opportunityDetail')}
          >
            <View style={styles.oppMain}>
              <View style={styles.oppTitleRow}>
                <DiamondIcon />
                <Text style={styles.oppTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <View style={styles.oppTagsRow}>
                <View style={[styles.oppTag, item.tag === 'AI研判' ? styles.tagAi : styles.tagExpress]}>
                  <Text style={[styles.oppTagText, item.tag === 'AI研判' ? styles.tagAiText : styles.tagExpressText]}>
                    {item.tag}
                  </Text>
                </View>
                <View style={[styles.oppTag, styles.oppCityTag]}>
                  <Text style={[styles.oppTagText, styles.oppCityTagText]}>{item.city}</Text>
                </View>
              </View>
            </View>
            <ChevronRightIcon size={16} />
          </TouchableOpacity>
        ))}

        {/* 合作发现 */}
        <View style={styles.discoverCard}>
          <View style={styles.discoverHeader}>
            <Text style={styles.sectionTitle}>合作发现</Text>
            <Text style={styles.discoverSub}>发现方向 · 查找企业</Text>
          </View>
          <View style={styles.discoverRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.discoverItem}
              onPress={() => navigation.navigate('aiDiscoveries')}
            >
              <View style={styles.entryTitleRow}>
                <CompassIcon />
                <Text style={styles.entryTitle}>方向推荐</Text>
              </View>
              <Text style={styles.discoverDesc}>AI 从你的企业信息中，发现值得拓展的合作方向</Text>
              <View style={styles.discoverPills}>
                <View style={[styles.discoverPill, styles.discoverPillLeft, styles.tagExpress]}>
                  <Text style={[styles.entryPillText, styles.tagExpressText]}>明确表达 {MOCK_DISCOVERY.expressCount}</Text>
                </View>
                <View style={[styles.discoverPill, styles.discoverPillRight, styles.tagAi]}>
                  <Text style={[styles.entryPillText, styles.tagAiText]}>AI研判 {MOCK_DISCOVERY.aiCount}</Text>
                </View>
              </View>
              <View style={styles.entryChevron}>
                <ChevronRightIcon size={14} />
              </View>
            </TouchableOpacity>
            <View style={styles.discoverItem}>
              <View style={styles.entryTitleRow}>
                <BuildingIcon />
                <Text style={styles.entryTitle}>企业库</Text>
              </View>
              <Text style={styles.discoverDesc}>按行业、地区、产品与上下游关系，查找合作企业</Text>
              <View style={styles.discoverPills}>
                <View style={[styles.discoverPill, styles.pillSoon]}>
                  <Text style={[styles.entryPillText, styles.pillSoonText]}>即将上线</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    opacity: 0.3,
  },
  content: {
    paddingBottom: scaleSizeH(100),
  },
  heroWrap: {
    marginHorizontal: scaleSizeW(16),
    position: 'relative',
  },
  heroCard: {
    borderRadius: scaleSizeW(20),
    alignItems: 'center',
  },
  heroMascot: {
    position: 'absolute',
    left: -scaleSizeW(16),
    top: -scaleSizeH(26),
    width: scaleSizeW(101),
    height: scaleSizeW(101),
    transform: [{ scaleX: -1 }],
  },
  heroBadge: {
    position: 'absolute',
    left: scaleSizeW(37),
    top: scaleSizeH(15),
    width: scaleSizeW(98),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: GREEN,
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(8),
  },
  heroBadgeText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: setSpText(22),
    lineHeight: setSpText(26),
    fontWeight: '700',
    color: '#000000',
  },
  heroSub: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  heroCta: {
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(27),
    width: scaleSizeW(262),
    height: scaleSizeH(40),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CADBFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  heroCtaArrow: {
    position: 'absolute',
    right: scaleSizeW(10),
  },
  heroCtaText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  entryRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
  },
  entryCard: {
    flex: 1,
    height: scaleSizeH(100),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingLeft: scaleSizeW(14),
    paddingTop: scaleSizeH(11),
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  entryTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  entryDesc: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(12),
    color: 'rgba(108, 108, 108, 0.8)',
  },
  entryPill: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(16),
    width: scaleSizeW(90),
    alignItems: 'center',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  entryPillText: {
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  entryChevron: {
    position: 'absolute',
    right: scaleSizeW(12),
    top: scaleSizeH(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
  },
  sectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  sectionMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  sectionMoreText: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  oppCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(14),
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(12),
    paddingTop: scaleSizeH(15),
    paddingBottom: scaleSizeH(10),
    gap: scaleSizeW(8),
  },
  oppMain: {
    flex: 1,
    gap: scaleSizeH(10),
  },
  oppTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  oppTitle: {
    flex: 1,
    fontSize: setSpText(14),
    color: '#000000',
  },
  oppTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  oppTag: {
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  oppCityTag: {
    backgroundColor: '#F6F7FB',
  },
  oppCityTagText: {
    color: TEXT_SUB,
  },
  tagAi: {
    backgroundColor: '#EEE8FF',
  },
  tagAiText: {
    color: PURPLE,
  },
  tagExpress: {
    backgroundColor: '#E7FFF2',
  },
  tagExpressText: {
    color: GREEN,
  },
  pillSignal: {
    backgroundColor: '#D8E5FF',
  },
  pillSignalText: {
    color: PRIMARY,
  },
  pillOpp: {
    backgroundColor: '#FFE8DB',
  },
  pillOppText: {
    color: ORANGE,
  },
  pillSoon: {
    backgroundColor: '#EDEDED',
    borderRadius: 90,
  },
  pillSoonText: {
    color: TEXT_SUB,
  },
  oppTagText: {
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  discoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(13),
    paddingTop: scaleSizeH(18),
    paddingBottom: scaleSizeH(14),
  },
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  discoverSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  discoverRow: {
    flexDirection: 'row',
    gap: scaleSizeW(11),
    marginTop: scaleSizeH(10),
  },
  discoverItem: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingLeft: scaleSizeW(11),
    paddingRight: scaleSizeW(10),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(12),
  },
  discoverDesc: {
    marginTop: scaleSizeH(8),
    fontSize: setSpText(12),
    color: 'rgba(108, 108, 108, 0.8)',
  },
  discoverPills: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(12),
    alignSelf: 'flex-start',
  },
  discoverPill: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  discoverPillLeft: {
    borderTopLeftRadius: 90,
    borderBottomLeftRadius: 90,
  },
  discoverPillRight: {
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
  },
});
