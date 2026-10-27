import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronRightIcon, NoteDotIcon } from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const ORANGE = '#F2722C';
const TEXT_SUB = '#6C6C6C';

type PreviewTab = 'customer' | 'reach';

/** 静态 mock（接口待联调）：触达摘要 */
const MOCK_SUMMARY = [
  { label: '目标客户', value: '华东地区的编织袋生产企业' },
  { label: '合作目的', value: '拓展下游客户' },
  { label: '能力内容', value: '2 篇真实动态 + 能力阐述' },
  { label: '触达身份', value: '王磊 · 智能制造解决方案顾问' },
];

/** 静态 mock（接口待联调）：「客户看到的」tab 无 figma 当前稿，按原型 signal-preview-settings 结构还原 */
const MOCK_CUSTOMER = {
  desc: '针对贵司煤矿智能化升级场景，希望就综采设备改造、系统集成及调试交付开展进一步合作。',
  company: { name: '鄂尔多斯市巨鼎煤机制造有限公司', tag: '煤矿装备制造 · 鄂尔多斯' },
  abilities: [
    { title: '1.能提供什么', content: '提供从方案设计、设备选型、系统集成到调试交付的一站式服务，帮助企业提升设备智能化水平与运维效率。' },
    { title: '2.适用企业或场景', content: '煤矿生产企业、智能化升级、老旧设备改造' },
    { title: '3.产品/服务范围或交付能力', content: '方案设计、综采设备改造、系统集成、调试交付' },
    { title: '4.案例或实力证明', content: '综采工作面智能化改造案例、液压支架电液控系统优化方案等项目经验与实施成果。' },
    { title: '5.其他补充', content: '可根据煤矿现场工况提供分阶段实施方案与驻场技术支持。' },
  ],
  feeds: [
    { id: '1', title: '综采工作面智能化改造案例分享', desc: '详细介绍某大型煤矿综采工作面智能化升级项目的实施过程与效果' },
    { id: '2', title: '液压支架电液控系统优化方案', desc: '分享液压支架电液控改造的技术要点与实施经验' },
  ],
  contact: { name: '王磊', title: '智能制造解决方案顾问' },
};

/** 标题圆点：彩色圆 + 便签 glyph */
function SectionDot({ color }: { color: string }) {
  return (
    <View style={[styles.dot, { backgroundColor: color }]}>
      <NoteDotIcon />
    </View>
  );
}

/** 触达设置 tab（figma 53.合作信号预览2 2793:7116 当前稿） */
function ReachContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={PRIMARY} />
          <Text style={styles.cardTitle}>触达摘要</Text>
        </View>
        <View style={styles.summaryRows}>
          {MOCK_SUMMARY.map(row => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.editSummaryBtn}
          onPress={() => navigation.navigate('editTouchSummary')}
        >
          <Text style={styles.editSummaryText}>修改摘要</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={GREEN} />
          <Text style={styles.cardTitle}>平台如何触达</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>广场定向曝光</Text>
          <Text style={styles.reachItemDesc}>提高已有优质内容在目标客户的曝光率</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>合作能力卡触达</Text>
          <Text style={styles.reachItemDesc}>
            {'提高平台用户与被精准触达到的匹配客户\n频次：同一目标企业每周最多 2 次，不重复推送已回复的'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={ORANGE} />
          <Text style={styles.cardTitle}>先使用，有效后计费</Text>
        </View>
        <View style={styles.tipPill}>
          <Text style={styles.tipPillText}>赠送额度内免费，经验证企业通过「愿聊」才计为有效触达。</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>预付金额</Text>
          <Text style={styles.reachItemDesc}>有效触达后，按触达企业数量扣费</Text>
        </View>
      </View>
    </>
  );
}

/** 客户看到的 tab（按原型结构还原，mock 数据） */
function CustomerContent() {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>本次合作说明</Text>
        <Text style={styles.customerDesc}>{MOCK_CUSTOMER.desc}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>发送企业</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.customerRow}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>JD</Text>
          </View>
          <View style={styles.customerRowInfo}>
            <Text style={styles.customerRowTitle} numberOfLines={1}>{MOCK_CUSTOMER.company.name}</Text>
            <Text style={styles.customerRowSub} numberOfLines={1}>{MOCK_CUSTOMER.company.tag}</Text>
          </View>
          <ChevronRightIcon size={14} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>企业能力</Text>
        <View style={styles.abilityList}>
          {MOCK_CUSTOMER.abilities.map(item => (
            <View key={item.title} style={styles.abilityItem}>
              <Text style={styles.abilityTitle}>{item.title}</Text>
              <Text style={styles.abilityContent}>{item.content}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.expandRow}
          onPress={() => console.log('go: 展开全部能力')}
        >
          <Text style={styles.expandText}>展开全部</Text>
          <ChevronRightIcon size={12} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>关联动态</Text>
        {MOCK_CUSTOMER.feeds.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={[styles.feedRow, index > 0 && styles.feedRowGap]}
            onPress={() => console.log('go: feed-detail', item.id)}
          >
            <View style={styles.feedCover} />
            <View style={styles.customerRowInfo}>
              <Text style={styles.customerRowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.customerRowSub} numberOfLines={2}>{item.desc}</Text>
            </View>
            <ChevronRightIcon size={14} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本次对接人</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.customerRow}>
          <ExpoImage source={require('@/assets/link/mock-avatar.png')} style={styles.contactAvatar} contentFit="cover" />
          <View style={styles.customerRowInfo}>
            <Text style={styles.customerRowTitle}>{MOCK_CUSTOMER.contact.name}</Text>
            <Text style={styles.customerRowSub}>{MOCK_CUSTOMER.contact.title}</Text>
          </View>
          <ChevronRightIcon size={14} />
        </TouchableOpacity>
      </View>
    </>
  );
}

/** 53.合作信号预览2（figma 2793:7116，分组10最新稿） */
export default function CooperationSignalPreview() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<PreviewTab>('reach');

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 分段切换：客户看到的 / 触达设置 */}
        <View style={styles.segment}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segmentBtn, tab === 'customer' && styles.segmentBtnActive]}
            onPress={() => setTab('customer')}
          >
            <Text style={[styles.segmentText, tab === 'customer' && styles.segmentTextActive]}>客户看到的</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segmentBtn, tab === 'reach' && styles.segmentBtnActive]}
            onPress={() => setTab('reach')}
          >
            <Text style={[styles.segmentText, tab === 'reach' && styles.segmentTextActive]}>触达设置</Text>
          </TouchableOpacity>
        </View>

        {tab === 'reach' ? <ReachContent /> : <CustomerContent />}
      </ScrollView>

      {/* 底部操作条 */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(14)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.footerBtnBack]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerBtnBackText}>返回修改</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.footerBtnConfirm]}
          onPress={() => console.log('submit: 确认创建信号')}
        >
          <Text style={styles.footerBtnConfirmText}>确认创建信号</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(20),
  },
  segment: {
    flexDirection: 'row',
    height: scaleSizeH(32),
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    padding: 2,
    gap: scaleSizeW(4),
    marginBottom: scaleSizeH(20),
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#000000',
  },
  segmentText: {
    fontSize: setSpText(13),
    lineHeight: setSpText(18),
    fontWeight: '500',
    color: '#000000',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  dot: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    fontWeight: '500',
    color: '#000000',
  },
  summaryRows: {
    marginTop: scaleSizeH(20),
    gap: scaleSizeH(10),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: scaleSizeW(35),
  },
  summaryLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  summaryValue: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  editSummaryBtn: {
    marginTop: scaleSizeH(20),
    height: scaleSizeH(35),
    borderRadius: 90,
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSummaryText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  reachItem: {
    marginTop: scaleSizeH(10),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    gap: scaleSizeH(5),
  },
  reachItemTitle: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  reachItemDesc: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  tipPill: {
    marginTop: scaleSizeH(10),
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EF',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  tipPillText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: ORANGE,
  },
  customerDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#000000',
  },
  customerRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  companyLogo: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontSize: setSpText(13),
    fontWeight: '600',
    color: PRIMARY,
  },
  customerRowInfo: {
    flex: 1,
    gap: scaleSizeH(3),
  },
  customerRowTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  customerRowSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  abilityList: {
    marginTop: scaleSizeH(10),
    gap: scaleSizeH(12),
  },
  abilityItem: {
    gap: scaleSizeH(4),
  },
  abilityTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  abilityContent: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  expandRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  expandText: {
    fontSize: setSpText(13),
    color: PRIMARY,
  },
  feedRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  feedRowGap: {
    marginTop: scaleSizeH(10),
  },
  feedCover: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F6F7FB',
  },
  contactAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
  },
  footer: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  footerBtn: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnBack: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  footerBtnBackText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#000000',
  },
  footerBtnConfirm: {
    backgroundColor: PRIMARY,
  },
  footerBtnConfirmText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
