import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { AnalysisIcon, ChevronLeftIcon, ChevronRightIcon, VerifiedBadgeIcon } from './icons';

const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调） */
const MOCK = {
  title: '华东化工客户吨袋集采对接',
  tag: 'AI研判',
  confirmTip: '明确后，该方向将作为明确合作方向展示，并用于匹配相关企业',
  analysisLead: '这是一条产线升级类采购机会：',
  analysis:
    '企业正在推进缝纫工位与整线自动化改造。核心诉求是缝纫设备或集成设备供应商，能够承接相关服务商。当前产线存在部分环节效率瓶颈，亟需改造升级。',
  evidences: ['企业信息 · 吨袋包装制造', '能力卡 · 华东区域交付', '企业动态 · 新增包装产能'],
  companies: [
    { id: '1', name: '鄂尔多斯市巨鼎煤机制造有限公司', sub: '煤矿装备制造 · 鄂尔多斯' },
    { id: '2', name: '重庆渝达精密制造', sub: '煤矿装备制造 · 重庆' },
  ],
};

/** 49.潜在合作方向-方向详情（figma 295:2760）：深色渐变头 + 自定义玻璃返回钮 */
export default function DirectionDetail() {
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
        <Text style={styles.navTitle}>方向详情</Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: scaleSizeH(20) }]}
      >
        {/* 方向标题卡 */}
        <View style={styles.titleCard}>
          <Text style={styles.titleText}>{MOCK.title}</Text>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{MOCK.tag}</Text>
          </View>
        </View>

        {/* 明确方向卡 */}
        <LinearGradient
          colors={['#FEF4E9', '#FFE4C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.confirmCard}
        >
          <Text style={styles.confirmTip}>{MOCK.confirmTip}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.confirmBtn}
            onPress={() => console.log('go: 明确该方向')}
          >
            <Text style={styles.confirmBtnText}>明确该方向</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* 方向分析 */}
        <View style={styles.analysisWrap}>
          <View style={styles.analysisCard}>
            <LinearGradient colors={['#2962D4', '#709FFF']} style={styles.analysisFold} pointerEvents="none" />
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisTitle}>方向分析</Text>
              <AnalysisIcon />
              <Text style={styles.analysisHint}>AI智能解读，仅供参考</Text>
            </View>
            <Text style={styles.analysisLead}>{MOCK.analysisLead}</Text>
            <Text style={styles.analysisBody}>{MOCK.analysis}</Text>
          </View>
          <ExpoImage
            source={require('@/assets/link/hero-mascot.png')}
            style={styles.analysisMascot}
            contentFit="cover"
          />
        </View>

        {/* 判断依据 */}
        <View style={styles.plainCard}>
          <Text style={styles.cardLabel}>判断依据</Text>
          <View style={styles.evidenceWrap}>
            {MOCK.evidences.map((text, i) => (
              <TouchableOpacity
                key={text}
                activeOpacity={0.7}
                style={styles.evidencePill}
                onPress={() => console.log('go: 判断依据', i)}
              >
                <Text style={styles.evidenceText}>{text}</Text>
                {i === MOCK.evidences.length - 1 && <ChevronRightIcon size={10} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 相关企业 */}
        <View style={styles.plainCard}>
          <Text style={styles.cardLabel}>相关企业</Text>
          {MOCK.companies.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.companyRow}
              onPress={() => console.log('go: 企业主页', item.id)}
            >
              <ExpoImage
                source={require('@/assets/link/mock-avatar.png')}
                style={styles.companyAvatar}
                contentFit="cover"
              />
              <View style={styles.companyInfo}>
                <View style={styles.companyNameRow}>
                  <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
                  <VerifiedBadgeIcon size={14} />
                </View>
                <Text style={styles.companySub}>{item.sub}</Text>
              </View>
              <ChevronRightIcon size={12} />
            </TouchableOpacity>
          ))}
        </View>
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
  navPlaceholder: {
    width: scaleSizeW(44),
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(13),
    paddingVertical: scaleSizeH(20),
  },
  titleText: {
    flex: 1,
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
  },
  aiPill: {
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
  confirmCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(14),
  },
  confirmTip: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#4C3416',
  },
  confirmBtn: {
    alignSelf: 'center',
    marginTop: scaleSizeH(12),
    backgroundColor: '#4C3416',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(55),
    paddingVertical: scaleSizeH(10),
  },
  confirmBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  analysisWrap: {
    zIndex: 2,
    marginTop: scaleSizeH(20),
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
    top: scaleSizeH(-20),
    right: scaleSizeW(8),
    width: scaleSizeW(76),
    height: scaleSizeW(76),
  },
  plainCard: {
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
  cardLabel: {
    fontSize: setSpText(14),
    color: '#000000',
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
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(15),
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
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
});
