import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ChevronLeftIcon, ChevronRightIcon, ShareIntentIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

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
        {/* 吉祥物 + 气泡 */}
        <View style={styles.mascotRow}>
          <ExpoImage
            source={require('@/assets/link/intent-mascot.png')}
            style={styles.mascot}
            contentFit="cover"
          />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>本次合作说明</Text>
          </View>
        </View>

        {/* 合作说明（蓝渐变卡，顶部被吉祥物区压住） */}
        <LinearGradient colors={['#2962D4', '#5D8CE9']} style={styles.quoteCard}>
          <Text style={styles.quoteText}>{MOCK.quote}</Text>
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

        {/* 企业能力正文 */}
        <View style={styles.letterCard}>
          <Text style={styles.sectionCardTitle}>企业能力</Text>
          <View style={styles.letterBody}>
            {MOCK.sections.map(sec => (
              <View key={sec.title} style={styles.letterSection}>
                <Text style={styles.letterSecTitle}>{sec.title}</Text>
                <Text style={styles.letterSecBody}>{sec.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 关联动态 */}
        <View style={styles.plainCard}>
          <Text style={styles.sectionCardTitle}>关联动态</Text>
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
    zIndex: 2,
  },
  mascot: {
    width: scaleSizeW(63),
    height: scaleSizeW(63),
    marginTop: scaleSizeH(-17),
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
  },
  bubbleText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(20),
    color: '#FFFFFF',
  },
  quoteCard: {
    marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
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
  letterBody: {
    marginTop: scaleSizeH(13),
    gap: scaleSizeH(14),
  },
  letterSection: {},
  letterSecTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterSecBody: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
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
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(17),
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
