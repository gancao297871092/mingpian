import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AppImage from '@/components/AppImage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import {
  ChevronLeftIcon,
  GuideQ2Icon,
  GuideQ3Icon,
  GuideQ4Icon,
  GuideSparkleIcon,
  InfoIcon,
} from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const ORANGE = '#F2722C';
const WARN = '#EF4444';
const TEXT_SUB = '#6C6C6C';

/**
 * 页面静态文案（无需接口）。
 * 原型示意图三卡：想找谁（蓝/人群 329:2522）、地区要求（橙/定位 329:2549）、想做什么（绿/合作网络 329:2552）。
 */
const MOCK_QUESTIONS = [
  { key: 'q1', title: '想找谁？', desc: '采购商、供应商、渠道商、服务商，或其他合作伙伴。', Icon: GuideQ4Icon, color: PRIMARY },
  { key: 'q2', title: '有没有地区要求？', desc: '例如：重庆、川渝地区、华东地区、全国均可。', Icon: GuideQ2Icon, color: ORANGE },
  { key: 'q3', title: '想做什么？', desc: '说清产品或服务，以及合作方式，例如“供应 PVC 颗粒，建立长期合作”。', Icon: GuideQ3Icon, color: GREEN },
];

/** 55.填写说明（figma 329:2395；内容区按产品简化原型：三件事 + 一句话写法 + 反例警告 + 固定底部 CTA） */
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 头图（在 ScrollView 内，白色内容卡负 margin 叠上来；返回/标题固定在外层） */}
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
            <Text style={styles.heroTitle}>写清想找谁、{'\n'}地区要求，以及想做什么</Text>
          </View>
          <AppImage
            source={require('@/assets/link/guide-mascot.png')}
            style={[styles.heroMascot, { top: insets.top + scaleSizeH(39) }]}
            contentFit="cover"
          />
        </View>

        {/* 白色内容卡（圆角上沿叠头图） */}
        <View style={styles.sheet}>
          {/* 填写时说清三件事 */}
          <View style={[styles.sectionHeader, styles.sectionHeaderFirst]}>
            <Text style={styles.sectionTitle}>填写时说清三件事</Text>
            <Text style={styles.sectionSub}>3 步</Text>
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

          {/* 一句话写法 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>一句话写法</Text>
            <Text style={styles.sectionSub}>照着填就行</Text>
          </View>
          <View style={styles.formulaCard}>
            <Text style={styles.formulaText}>想找【地区 + 企业类型】，希望【产品 / 服务 + 合作方式】。</Text>
            <Text style={styles.formulaExample}>例如：想找华东地区的编织袋生产企业，希望供应 PVC 颗粒，建立长期采购合作。</Text>
          </View>

          {/* 反例警告 */}
          <View style={styles.warnBar}>
            <InfoIcon size={16} color={WARN} />
            <Text style={styles.warnText}>范围太宽，AI 很难判断你真正想连接哪类企业。</Text>
          </View>
        </View>
      </ScrollView>

      {/* 固定底部 CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(14)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ctaBtnText}>知道了，去填写</Text>
        </TouchableOpacity>
      </View>

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
  content: {
    paddingBottom: scaleSizeH(20),
  },
  sheet: {
    marginTop: scaleSizeH(-30),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(16),
    marginBottom: scaleSizeH(10),
  },
  sectionHeaderFirst: {
    marginTop: 0,
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
    marginBottom: scaleSizeH(8),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(12),
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
    gap: scaleSizeH(3),
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
  formulaCard: {
    marginHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
    gap: scaleSizeH(6),
  },
  formulaText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    fontWeight: '600',
    color: '#000000',
  },
  formulaExample: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  warnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(12),
    backgroundColor: '#FFEEEE',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(8),
  },
  warnText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: WARN,
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  ctaBtn: {
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
