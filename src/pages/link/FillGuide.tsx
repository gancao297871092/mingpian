import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
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
const ORANGE = '#F2722C';
const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调） */
const MOCK_QUESTIONS = [
  { key: 'q1', title: '你想找谁？', desc: '采购商、供应商、渠道商、服务商，或其他合作伙伴', Icon: GuideQ1Icon },
  { key: 'q2', title: '希望对方是什么企业？', desc: '例如：编织袋生产企业、汽车零部件厂、食品加工企业', Icon: GuideQ2Icon },
  { key: 'q3', title: '有没有地区要求？', desc: '例如：重庆、川渝地区、华东地区、全国均可', Icon: GuideQ3Icon },
  { key: 'q4', title: '想合作什么？', desc: '说清楚产品、服务，以及希望达成的合作方式', Icon: GuideQ4Icon },
];

const MOCK_EXAMPLES = [
  { key: 'e1', title: '找采购商', desc: '寻找华东地区的编织袋生产企业，希望向其供应 PVC 颗粒，建立长期采购合作。' },
  { key: 'e2', title: '找供应商', desc: '寻找重庆及周边的 PVC 颗粒生产企业，希望采购稳定货源，建立长期供应合作。' },
  { key: 'e3', title: '找渠道合作', desc: '寻找西南地区有工业客户资源的经销商，共同推广我们的工业设备。' },
];

const MOCK_BAD = ['想找一些客户合作', '寻找合作伙伴', '看看有没有需要 PVC 的企业'];

/** 55.填写说明（figma 329:2395）：深色头图 + 公式/示例/反例 + 底部 CTA */
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
      {/* 头图 + 返回 */}
      <View>
        <ExpoImage
          source={require('@/assets/link/guide-hero.png')}
          style={{ width, height: (width * 315) / 402 }}
          contentFit="cover"
        />
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.glassBtn, { top: insets.top + scaleSizeH(10) }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { top: insets.top + scaleSizeH(21) }]}>填写说明</Text>

        {/* 头图上的内容 */}
        <View style={[styles.heroContent, { top: insets.top + scaleSizeH(74) }]}>
          <View style={styles.heroPill}>
            <GuideSparkleIcon />
            <Text style={styles.heroPillText}>AI 匹配更准</Text>
          </View>
          <Text style={styles.heroTitle}>写清你想找谁，{'\n'}以及想和对方做什么</Text>
        </View>
        <ExpoImage
          source={require('@/assets/link/guide-mascot.png')}
          style={[styles.heroMascot, { top: insets.top + scaleSizeH(39) }]}
          contentFit="cover"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 橙色提示带 */}
        <LinearGradient
          colors={['#FEF4E8', '#FFE4C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.introBand}
        >
          <Text style={styles.introText}>信息越具体，系统越容易帮你连到合适的企业与合作机会。</Text>
        </LinearGradient>

        {/* 一句话公式 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>一句话公式</Text>
          <Text style={styles.sectionSub}>记住这个结构再写</Text>
        </View>
        {MOCK_QUESTIONS.map(item => (
          <View key={item.key} style={styles.qaCard}>
            <View style={styles.qaIcon}>
              <item.Icon />
            </View>
            <View style={styles.qaTextCol}>
              <Text style={styles.qaTitle}>{item.title}</Text>
              <Text style={styles.qaDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* 可以这样写 */}
        <View style={styles.sectionHeader}>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>不推荐这样写</Text>
        </View>
        <View style={styles.badCard}>
          {MOCK_BAD.map(text => (
            <Text key={text} style={styles.badText}>{text}</Text>
          ))}
          <View style={styles.warnRow}>
            <InfoIcon size={14} color={ORANGE} />
            <Text style={styles.warnText}>范围太宽，AI 很难判断你真正想连接哪类企业。</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ctaBtnText}>知道了，去填写</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(2),
  },
  heroPillText: {
    fontSize: setSpText(12),
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
    paddingBottom: scaleSizeH(40),
  },
  introBand: {
    marginTop: scaleSizeH(-56),
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(16),
  },
  introText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#674518',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(24),
    marginBottom: scaleSizeH(12),
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
    backgroundColor: '#FFFFFF',
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
  exampleCard: {
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
    gap: scaleSizeH(5),
  },
  badCard: {
    marginHorizontal: scaleSizeW(16),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
    gap: scaleSizeH(10),
  },
  badText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: '#999999',
  },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#FFF4ED',
    borderRadius: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(8),
  },
  warnText: {
    flex: 1,
    fontSize: setSpText(12),
    color: ORANGE,
  },
  ctaBtn: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(30),
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
