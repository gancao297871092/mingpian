import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import { SCREEN_WIDTH, scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ChevronLeftIcon, ChevronRightIcon, ShareIntentIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const GREEN = '#36BE69';

/** 收起/展开箭头 */
function ChevronVerticalIcon({ up }: { up?: boolean }) {
  const s = scaleSizeW(10);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path
        d={up ? 'M1.5 6.5L5 3L8.5 6.5' : 'M1.5 3.5L5 7L8.5 3.5'}
        stroke="#999999"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 静态 mock（接口待联调） */
const MOCK = {
  quote: '针对贵司煤矿智能化升级场景，希望就综采设备改造、系统集成及调试交付开展进一步合作。',
  company: '鄂尔多斯市巨鼎煤机制造有限公司',
  companySub: '煤矿装备制造 · 鄂尔多斯',
  sections: [
    { title: '1.能提供什么', body: '提供食品级与工业级 PVC 颗粒原料，支持小批量试样、稳定供货与华东区域配送。' },
    { title: '2.适用企业或场景', body: '编织袋生产企业、食品包装、工业包装' },
    { title: '3.产品/服务范围或交付能力', body: '原料供应、寄样测试、区域配送、账期协同' },
    { title: '4.案例或实力证明', body: '综采工作面智能化改造案例、液压支架电液控系统优化方案等项目经验与实施成果。' },
    { title: '5.其他补充', body: '可根据煤矿现场工况提供分阶段实施方案与驻场技术支持。' },
  ],
  feeds: [
    { id: '1', title: '综采工作面智能化改造案例分享', sub: '详细介绍某大型煤矿综采工作面智能化升级项目的实施过程与效果' },
    { id: '2', title: '液压支架电液控系统优化方案', sub: '分享液压支架电液控改造的技术要点与实施经验' },
  ],
  contact: { name: '王磊', role: '原料销售经理' },
};

/** 37.合作意向书（figma 222:1542）：浅蓝底玻璃头 + 意向书正文 + 底部操作条 */
export default function CooperationIntentView() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const visibleSections = expanded ? MOCK.sections : MOCK.sections.slice(0, 2);

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ExpoImage
        source={require('@/assets/link/hero-bg.png')}
        style={styles.headerBg}
        contentFit="cover"
      />
      {/* 自定义头部 */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>合作意向书</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.glassBtn}
          onPress={() => console.log('go: 分享意向书')}
        >
          <ShareIntentIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + scaleSizeH(58), paddingBottom: scaleSizeH(90) + insets.bottom },
        ]}
      >

        {/* <View style={styles.heroWrap}>
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
        </View> */}
        {/* 吉祥物 + 气泡 */}
        <View style={styles.mascotRow}>
          <ExpoImage
            source={require('@/assets/link/intent-mascot.png')}
            style={[styles.mascot, { position: 'relative', zIndex: 1 }]}
            contentFit="cover"
          />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>本次合作说明</Text>
          </View>
        </View>

        {/* 合作说明（蓝渐变卡，顶部被吉祥物区压住） */}
        <LinearGradient colors={['#2962D4', '#5D8CE9']} style={styles.quoteCard}>
          <View style={{
            paddingHorizontal: scaleSizeW(14),
            paddingVertical: scaleSizeH(16),
          }}>
            <Text style={styles.quoteText}>{MOCK.quote}</Text>
          </View>
        </LinearGradient>

        {/* 发布企业 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.companyCard}
          onPress={() => console.log('go: 企业主页')}
        >
          <ExpoImage
            source={require('@/assets/link/mock-avatar.png')}
            style={styles.companyAvatar}
            contentFit="cover"
          />
          <View style={styles.companyInfo}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyName} numberOfLines={1}>{MOCK.company}</Text>
              <VerifiedBadgeIcon size={14} />
            </View>
            <Text style={styles.companySub}>{MOCK.companySub}</Text>
          </View>
          <ChevronRightIcon size={12} />
        </TouchableOpacity>

        {/* 企业能力正文（标题黑 + 内容灰整段排版，底部收起/展开） */}
        <View style={styles.letterCard}>
          <Text style={styles.sectionCardTitle}>企业能力</Text>
          <Text style={styles.letterText}>
            {visibleSections.map((sec, i) => (
              <Text key={sec.title}>
                {i > 0 && '\n\n'}
                {sec.title}
                {'\n'}
                <Text style={styles.letterTextBody}>{sec.body}</Text>
              </Text>
            ))}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.collapseBtn}
            onPress={() => setExpanded(e => !e)}
          >
            <Text style={styles.collapseText}>{expanded ? '收起' : '展开'}</Text>
            <ChevronVerticalIcon up={expanded} />
          </TouchableOpacity>
        </View>

        {/* 关联动态 */}
        <View style={styles.plainCard}>
          <Text style={styles.sectionCardTitle}>关联动态</Text>
          <View style={styles.feedList}>
            {MOCK.feeds.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.feedRow}
                onPress={() => console.log('go: feed-detail', item.id)}
              >
                <ExpoImage
                  source={require('@/assets/link/mock-avatar.png')}
                  style={styles.feedAvatar}
                  contentFit="cover"
                />
                <View style={styles.feedInfo}>
                  <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.feedSub} numberOfLines={1}>{item.sub}</Text>
                </View>
                <ChevronRightIcon size={12} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 本次对接人 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.plainCard}
          onPress={() => console.log('go: 对接人名片')}
        >
          <Text style={styles.sectionCardTitle}>本次对接人</Text>
          <View style={styles.contactRow}>
            <ExpoImage
              source={require('@/assets/link/mock-avatar.png')}
              style={styles.contactAvatar}
              contentFit="cover"
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{MOCK.contact.name}</Text>
              <Text style={styles.contactRole}>{MOCK.contact.role}</Text>
            </View>
            <ChevronRightIcon size={12} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 底部操作条 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + scaleSizeH(10) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btnDecline}
          onPress={() => console.log('go: 暂不考虑')}
        >
          <Text style={styles.btnDeclineText}>暂不考虑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btnAccept}
          onPress={() => console.log('go: 愿意进一步沟通')}
        >
          <Text style={styles.btnAcceptText}>愿意进一步沟通</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 218) / 402,
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
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  content: {},
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: scaleSizeW(46),
    marginLeft: scaleSizeW(12),
    zIndex: -1,
    transform: [{ translateY: scaleSizeH(17) }],
  },
  mascot: {
    width: scaleSizeW(63),
    height: scaleSizeW(63),
    marginTop: scaleSizeH(-17),
    transform: [{ scaleX: -1 }],
  },
  bubble: {
    marginLeft: scaleSizeW(-15),
    marginTop: scaleSizeH(9),
    backgroundColor: '#36BE69',
    borderTopLeftRadius: scaleSizeW(10),
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    paddingHorizontal: scaleSizeW(18),
    paddingVertical: scaleSizeH(3),
    transform: [{ translateY: scaleSizeH(-16) }],
  },
  bubbleText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(20),
    color: '#FFFFFF',
  },
  quoteCard: {
    // marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    // paddingVertical: scaleSizeH(14),
  },
  quoteText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(18),
  },
  companyAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  heroWrap: {
    marginHorizontal: scaleSizeW(16),
    position: 'relative',
  },
  heroCard: {
    borderRadius: scaleSizeW(20),
    alignItems: 'center',
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
  heroMascot: {
    position: 'absolute',
    left: -scaleSizeW(16),
    top: -scaleSizeH(26),
    width: scaleSizeW(101),
    height: scaleSizeW(101),
    transform: [{ scaleX: -1 }],
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
  heroCtaText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  heroSub: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  letterCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(20),
  },
  sectionCardTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterText: {
    marginTop: scaleSizeH(13),
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterTextBody: {
    fontWeight: '400',
    color: TEXT_SUB,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(14),
  },
  collapseText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  plainCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(18),
  },
  feedList: {
    marginTop: scaleSizeH(14),
    gap: scaleSizeH(26),
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  feedAvatar: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    borderRadius: scaleSizeW(17),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  feedInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  feedTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  feedSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  contactAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
  },
  contactInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  contactName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  contactRole: {
    fontSize: setSpText(12),
    color: 'rgba(108,108,108,0.8)',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
  },
  btnDecline: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeclineText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  btnAccept: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAcceptText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
