import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AppImage from '@/components/AppImage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import {
  ChevronLeftIcon,
  GuideQ1Icon,
  GuideQ2Icon,
  GuideQ3Icon,
  GuideQ4Icon,
  GuideSparkleIcon,
  InfoIcon,
} from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const ORANGE = '#F2722C';
const RED = '#FE2955';
const WARN = '#EF4444';
const TEXT_SUB = '#6C6C6C';
/** 一句话公式：深蓝灰步骤圆（设计稿取样 #4E5C7E） */
const FORMULA_CIRCLE = '#4E5C7E';

/**
 * 页面静态文案（无需接口）。
 * 图标与设计稿位置一一对应（卡片1 蓝=人群 329:2522、卡片2 绿=企业 329:2546、
 * 卡片3 橙=定位 329:2549、卡片4 红=合作网络 329:2552，白色 glyph 压在彩色圆上）。
 */
const MOCK_QUESTIONS = [
  { key: 'q1', title: '你想找谁？', desc: '采购商、供应商、渠道商、服务商，或其他合作伙伴', Icon: GuideQ4Icon, color: PRIMARY },
  { key: 'q2', title: '希望对方是什么企业？', desc: '例如：编织袋生产企业、汽车零部件厂、食品加工企业', Icon: GuideQ1Icon, color: GREEN },
  { key: 'q3', title: '有没有地区要求？', desc: '例如：重庆、川渝地区、华东地区、全国均可', Icon: GuideQ2Icon, color: ORANGE },
  { key: 'q4', title: '想合作什么？', desc: '说清楚产品、服务，以及希望达成的合作方式', Icon: GuideQ3Icon, color: RED },
];

/** 一句话公式四步（图标同问题卡，深蓝灰圆 + 白色 glyph） */
const FORMULA_STEPS = [
  { key: 'f1', label: '找谁合作', Icon: GuideQ4Icon },
  { key: 'f2', label: '什么企业', Icon: GuideQ1Icon },
  { key: 'f3', label: '什么地区', Icon: GuideQ2Icon },
  { key: 'f4', label: '合作什么', Icon: GuideQ3Icon },
];

const MOCK_EXAMPLES = [
  { key: 'e1', title: '找采购商', desc: '寻找华东地区的编织袋生产企业，希望向其供应 PVC 颗粒，建立长期采购合作。' },
  { key: 'e2', title: '找供应商', desc: '寻找重庆及周边的 PVC 颗粒生产企业，希望采购稳定货源，建立长期供应合作。' },
  { key: 'e3', title: '找渠道合作', desc: '寻找西南地区有工业客户资源的经销商，共同推广我们的工业设备。' },
];

const MOCK_BAD = ['想找一些客户合作', '看看有没有需要 PVC 的企业', '寻找合作伙伴'];

/** 公式步骤间的虚线连接（Svg strokeDasharray，Android 上 View dashed border 不可靠） */
function DashedConnector() {
  return (
    <View style={styles.formulaDashWrap}>
      <Svg width="100%" height={2}>
        <Line x1={0} y1={1} x2="100%" y2={1} stroke="#999999" strokeWidth={1} strokeDasharray="2 2" />
      </Svg>
    </View>
  );
}

/** 55.填写说明（figma 329:2395）：头图 + 建议信息卡 + 一句话公式 + 示例/反例 + 底部 CTA */
export default function FillGuide() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 头图（在 ScrollView 内，橙色提示带负 margin 才能叠上来；返回/标题固定在外层） */}
        <View>
          <AppImage
            source={require('@/assets/link/guide-hero.png')}
            style={{ width, height: (width * 315) / 402 }}
            contentFit="cover"
          />
          {/* 头图上的内容 */}
          <View style={[styles.heroContent, { top: insets.top + scaleSizeH(74) }]}>
            <View style={styles.heroPill}>
              <GuideSparkleIcon />
              <Text style={styles.heroPillText}>AI 匹配更准</Text>
            </View>
            <Text style={styles.heroTitle}>写清你想找谁，{'\n'}以及想和对方做什么</Text>
          </View>
          <AppImage
            source={require('@/assets/link/guide-mascot.png')}
            style={[styles.heroMascot, { top: insets.top + scaleSizeH(39) }]}
            contentFit="cover"
          />
        </View>

        {/* 橙色提示带（下沿被白色内容卡叠住 40） */}
        <LinearGradient
          colors={['#FEF4E8', '#FFE4C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.introBand}
        >
          <Text style={styles.introText}>信息越具体，系统越容易帮你连到合适的企业与合作机会。</Text>
        </LinearGradient>

        {/* 白色内容卡（圆角 20 上沿，叠在提示带上） */}
        <View style={styles.sheet}>
          {/* 建议包含这些信息 */}
          <View style={[styles.sectionHeader, styles.sectionHeaderFirst]}>
            <Text style={styles.sectionTitle}>建议包含这些信息</Text>
            <Text style={styles.sectionSub}>4 项</Text>
          </View>
          {MOCK_QUESTIONS.map(item => (
            <View key={item.key} style={styles.qaCard}>
              <View style={[styles.qaIcon, { backgroundColor: item.color }]}>
                <item.Icon color="#FFFFFF" />
              </View>
              <View style={styles.qaTextCol}>
                <Text style={styles.qaTitle}>{item.title}</Text>
                <Text style={styles.qaDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          {/* 一句话公式 */}
          <View style={[styles.sectionHeader, { marginTop: scaleSizeH(22), marginBottom: scaleSizeH(26) }]}>
            <Text style={styles.sectionTitle}>一句话公式</Text>
            <Text style={styles.sectionSub}>记住这个结构再写</Text>
          </View>
          <View style={styles.formulaRow}>
            {FORMULA_STEPS.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && <DashedConnector />}
                <View style={styles.formulaItem}>
                  <View style={styles.formulaCircle}>
                    <item.Icon color="#FFFFFF" />
                  </View>
                  <Text style={styles.formulaLabel}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* 可以这样写 */}
          <View style={[styles.sectionHeader, { marginTop: scaleSizeH(30), marginBottom: scaleSizeH(18) }]}>
            <Text style={styles.sectionTitle}>可以这样写</Text>
            <Text style={styles.sectionSub}>示例</Text>
          </View>
          {MOCK_EXAMPLES.map(item => (
            <View key={item.key} style={styles.exampleCard}>
              <Text style={styles.qaTitle}>{item.title}</Text>
              <Text style={styles.qaDesc}>{item.desc}</Text>
            </View>
          ))}

          {/* 不推荐这样写 */}
          <View style={[styles.sectionHeader, { marginTop: scaleSizeH(30), marginBottom: scaleSizeH(10) }]}>
            <Text style={styles.sectionTitle}>不推荐这样写</Text>
          </View>
          <View style={styles.warnBar}>
            <InfoIcon size={16} color={WARN} />
            <Text style={styles.warnText}>范围太宽，AI 很难判断你真正想连接哪类企业。</Text>
          </View>
          <View style={styles.badPills}>
            {MOCK_BAD.map(text => (
              <View key={text} style={styles.badPill}>
                <Text style={styles.badPillText}>{text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.ctaBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.ctaBtnText}>知道了，去填写</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 固定头部：返回 + 标题（不随内容滚动，压在头图上） */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.glassBtn, { top: insets.top + scaleSizeH(10) }]}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeftIcon size={18} />
      </TouchableOpacity>
      <Text style={[styles.navTitle, { top: insets.top + scaleSizeH(21) }]} pointerEvents="none">填写说明</Text>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  glassBtn: {
    position: 'absolute',
    left: scaleSizeW(16),
    zIndex: 10,
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
  navTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    textAlign: 'center',
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroContent: {
    position: 'absolute',
    left: scaleSizeW(30),
    zIndex: 5,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(2),
  },
  heroPillText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: PRIMARY,
  },
  heroTitle: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(22),
    fontWeight: '600',
    lineHeight: setSpText(29),
    color: '#FFFFFF',
  },
  heroMascot: {
    position: 'absolute',
    right: scaleSizeW(0),
    width: scaleSizeW(138),
    height: scaleSizeW(186),
  },
  content: {},
  introBand: {
    // 头图高 315，提示带起自 255 → 上叠 60
    marginTop: scaleSizeH(-60),
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(12),
    // 带高 86：12 + 文案 24 + 50（其中 40 被白色内容卡叠住）
    paddingBottom: scaleSizeH(50),
  },
  introText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(24),
    color: '#674518',
  },
  sheet: {
    marginTop: scaleSizeH(-40),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(38),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(24),
    marginBottom: scaleSizeH(14),
  },
  sectionHeaderFirst: {
    marginTop: 0,
    marginBottom: scaleSizeH(16),
  },
  sectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  sectionSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  qaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(17),
  },
  qaIcon: {
    width: scaleSizeW(35),
    height: scaleSizeW(35),
    borderRadius: scaleSizeW(17.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaTextCol: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  qaTitle: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  qaDesc: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: scaleSizeW(16),
  },
  formulaItem: {
    width: scaleSizeW(68),
    alignItems: 'center',
  },
  formulaCircle: {
    width: scaleSizeW(35),
    height: scaleSizeW(35),
    borderRadius: scaleSizeW(17.5),
    backgroundColor: FORMULA_CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaLabel: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  formulaDashWrap: {
    flex: 1,
    // 对齐圆心（圆高 35，中心 17.5）
    marginTop: scaleSizeW(16),
  },
  exampleCard: {
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
    gap: scaleSizeH(5),
  },
  warnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    marginHorizontal: scaleSizeW(16),
    backgroundColor: '#FFEEEE',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
  },
  warnText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: WARN,
  },
  badPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
  },
  badPill: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(10),
  },
  badPillText: {
    fontSize: setSpText(14),
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  ctaBtn: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(22),
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
