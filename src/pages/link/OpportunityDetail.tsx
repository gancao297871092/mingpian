import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { AnalysisIcon, ChevronLeftIcon, ChevronRightIcon, ShareNodesIcon, VerifiedBadgeIcon } from './icons';

const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调） */
const MOCK_DETAIL = {
  title: '哎塔产线升级，寻找缝纫设备与集成服务商',
  tag: 'AI研判',
  analysisLead: '这是一条产线升级类采购机会：',
  analysis:
    '企业正在推进缝纫工位与整线自动化改造。核心诉求是缝纫设备或集成设备供应商，能够承接相关服务商。当前产线存在部分环节效率瓶颈，亟需改造升级。',
  company: '通海优耐特智能科技',
  companySub: '企业认证 · 信息已核验',
  evidences: ['企业信息 · 吨袋包装制造', '能力卡 · 华东区域交付', '企业动态 · 新增包装产能'],
};

/** 62.商机详情（figma 402:2051）：深色渐变头 + 自定义玻璃返回/分享按钮 */
export default function OpportunityDetail() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  return (
    <SafeView backgroundColor="#E8EFFF">
      <LinearGradient colors={['#2962D4', '#E8EFFF']} style={styles.headerBg} pointerEvents="none" />

      {/* 自定义头部 */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>机会详情</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.glassBtn}
          onPress={() => console.log('go: share opportunity')}
        >
          <ShareNodesIcon />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 标题卡 */}
        <View style={styles.titleCard}>
          <Text style={styles.titleText}>{MOCK_DETAIL.title}</Text>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{MOCK_DETAIL.tag}</Text>
          </View>
        </View>

        {/* 平台服务横幅（顶部被标题卡压住 20） */}
        <LinearGradient
          colors={['#FEF4E9', '#FFE4C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.serviceBanner}
        >
          <View style={styles.serviceTextCol}>
            <Text style={styles.serviceTitle}>需要平台协助推进合作？</Text>
            <Text style={styles.serviceSub}>发布、撮合、对接服务，帮助更高效达成合作</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.serviceBtn}
            onPress={() => console.log('go: 了解服务')}
          >
            <Text style={styles.serviceBtnText}>了解服务</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* 商机分析 */}
        <View style={styles.analysisWrap}>
          <View style={styles.analysisCard}>
            <LinearGradient colors={['#2962D4', '#709FFF']} style={styles.analysisFold} pointerEvents="none" />
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisTitle}>商机分析</Text>
              <AnalysisIcon />
              <Text style={styles.analysisHint}>AI智能解读，仅供参考</Text>
            </View>
            <Text style={styles.analysisLead}>{MOCK_DETAIL.analysisLead}</Text>
            <Text style={styles.analysisBody}>{MOCK_DETAIL.analysis}</Text>
          </View>
          <ExpoImage
            source={require('@/assets/link/hero-mascot.png')}
            style={styles.analysisMascot}
            contentFit="cover"
          />
        </View>

        {/* 发布企业 */}
        <TouchableOpacity activeOpacity={0.85} style={styles.companyCard} onPress={() => console.log('go: 企业主页')}>
          <Text style={styles.cardLabel}>发布企业</Text>
          <View style={styles.companyRow}>
            <ExpoImage
              source={require('@/assets/link/mock-avatar.png')}
              style={styles.companyAvatar}
              contentFit="cover"
            />
            <View style={styles.companyInfo}>
              <View style={styles.companyNameRow}>
                <Text style={styles.companyName}>{MOCK_DETAIL.company}</Text>
                <VerifiedBadgeIcon size={14} />
              </View>
              <Text style={styles.companySub}>{MOCK_DETAIL.companySub}</Text>
            </View>
          </View>
          <View style={styles.companyChevron}>
            <ChevronRightIcon size={12} />
          </View>
        </TouchableOpacity>

        {/* 判断依据 */}
        <View style={styles.evidenceCard}>
          <Text style={styles.cardLabel}>判断依据</Text>
          <View style={styles.evidenceWrap}>
            {MOCK_DETAIL.evidences.map((text, i) => (
              <TouchableOpacity
                key={text}
                activeOpacity={0.7}
                style={styles.evidencePill}
                onPress={() => console.log('go: 判断依据', i)}
              >
                <Text style={styles.evidenceText}>{text}</Text>
                {i === MOCK_DETAIL.evidences.length - 1 && <ChevronRightIcon size={10} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
}

/** 返回箭头（玻璃钮内黑色 chevron） */
const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(520),
  },
  navbar: {
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
    color: '#FFFFFF',
  },
  content: {
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(30),
  },
  titleCard: {
    zIndex: 2,
    marginHorizontal: scaleSizeW(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(14),
  },
  titleText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  aiPill: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(10),
    backgroundColor: '#EEE8FF',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  aiPillText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#7B5BD6',
  },
  serviceBanner: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(-20),
    borderRadius: scaleSizeW(10),
    paddingTop: scaleSizeH(32),
    paddingBottom: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(14),
  },
  serviceTextCol: {
    flex: 1,
    gap: scaleSizeH(5),
    marginRight: scaleSizeW(10),
  },
  serviceTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#4C3416',
  },
  serviceSub: {
    fontSize: setSpText(12),
    color: '#4C3416',
  },
  serviceBtn: {
    backgroundColor: '#4C3416',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  serviceBtnText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  analysisWrap: {
    zIndex: 2,
    marginTop: scaleSizeH(19),
    marginHorizontal: scaleSizeW(16),
  },
  analysisCard: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(30),
  },
  analysisFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: scaleSizeW(109),
    height: scaleSizeH(46),
    borderTopLeftRadius: scaleSizeW(16),
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  analysisTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  analysisHint: {
    marginLeft: scaleSizeW(4),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  analysisLead: {
    marginTop: scaleSizeH(19),
    fontSize: setSpText(14),
    color: '#000000',
  },
  analysisBody: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: TEXT_SUB,
  },
  analysisMascot: {
    position: 'absolute',
    top: scaleSizeH(-19),
    right: scaleSizeW(3),
    width: scaleSizeW(92),
    height: scaleSizeW(92),
  },
  companyCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(15),
  },
  cardLabel: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(16),
  },
  companyAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  companyName: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  companyChevron: {
    position: 'absolute',
    right: scaleSizeW(14),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  evidenceCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(15),
    paddingBottom: scaleSizeH(15),
  },
  evidenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(15),
  },
  evidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#E8EFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  evidenceText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
});
