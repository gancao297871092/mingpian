import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import type { LinkBasisItem, LinkOpportunityDetail } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { splitAnalysis } from './linkFormat';
import { openBasis } from './linkNavigation';
import { AnalysisIcon, ChevronLeftIcon, ChevronRightIcon, ShareNodesIcon, VerifiedBadgeIcon } from './icons';

const TEXT_SUB = '#6C6C6C';

interface OpportunityView {
  title: string;
  stage: string;
  analysis: string;
  evidences: LinkBasisItem[];
  companyName: string;
  companyLogo?: string;
  companyId?: number;
  authorUserId?: number;
}

const EMPTY: OpportunityView = {
  title: '',
  stage: '',
  analysis: '',
  evidences: [],
  companyName: '',
};

/** 62.商机详情（figma 402:2051）：深色渐变头 + 自定义玻璃返回/分享按钮 */
export default function OpportunityDetail() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'opportunityDetail'>>();
  const opportunityId = route.params?.opportunityId;
  const { width } = useWindowDimensions();
  const [data, setData] = useState<OpportunityView>(EMPTY);

  const load = useCallback(async () => {
    if (!opportunityId) return;
    try {
      const res = await API.aiDiscovery.detail({ opportunityId });
      const detail: LinkOpportunityDetail = res.data;
      const opp = detail.opportunity ?? ({} as LinkOpportunityDetail['opportunity']);
      setData({
        title: opp.title ?? '',
        stage: detail.stage ?? '',
        analysis: opp.aiAnalysis ?? '',
        evidences: detail.basisList ?? [],
        companyName: detail.company?.name ?? '',
        companyLogo: detail.company?.avatar || undefined,
        companyId: detail.company?.id ?? opp.cpId ?? undefined,
        authorUserId: detail.author?.userId ?? opp.userId ?? undefined,
      });
    } catch {
      // 拦截器已提示错误，保留当前内容
    }
  }, [opportunityId]);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: data.title });
    } catch {
      // 用户取消或系统不支持，静默
    }
  }, [data.title]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      load();
      return () => StatusBar.setBarStyle('dark-content');
    }, [load]),
  );

  const analysis = splitAnalysis(data.analysis);

  return (
    <SafeView backgroundColor="#E8EFFF">
      <LinearGradient colors={['#2962D4', '#E8EFFF']} style={styles.headerBg} pointerEvents="none" />

      {/* 自定义头部 */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>机会详情</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={onShare}>
          <ShareNodesIcon />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 标题卡 + 平台服务横幅（对齐方向详情：同一张卡裁切圆角，渐变不承载圆角/内边距） */}
        <View style={styles.topCard}>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>{data.title}</Text>
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>{data.stage}</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#FEF4E9', '#FFE4C1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.serviceBanner}
          >
            <View style={styles.serviceInner}>
              <View style={styles.serviceTextCol}>
                <Text style={styles.serviceTitle}>需要平台协助推进合作？</Text>
                <Text style={styles.serviceSub}>发布、撮合、对接服务，帮助更高效达成合作</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.serviceBtn}
                onPress={() => navigation.navigate('platformAssist', { opportunityId })}
              >
                <Text style={styles.serviceBtnText}>了解服务</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* 商机分析（对齐方向详情「方向分析」：白色横幅 + 蓝色角标 + 吉祥物） */}
        <View style={styles.analysisWrap}>
          <ExpoImage
            style={{ width: width - scaleSizeH(32), height: (width - scaleSizeH(32)) * 0.181 }}
            source={require('@/assets/link/link.png')}
          />
          <View style={styles.analysisHeader}>
            <AnalysisIcon />
            <Text style={styles.analysisTitle}>商机分析</Text>
            <Text style={styles.analysisHint}>AI智能解读，仅供参考</Text>
          </View>
          <ExpoImage
            source={require('@/assets/link/hero-mascot.png')}
            style={styles.analysisMascot}
            contentFit="cover"
          />
          <View style={styles.analysisCard}>
            {!!analysis.lead && <Text style={styles.analysisLead}>{analysis.lead}</Text>}
            {!!analysis.body && <Text style={styles.analysisBody}>{analysis.body}</Text>}
          </View>
        </View>

        {/* 发布企业 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.companyCard}
          onPress={() => {
            if (data.companyId) {
              navigation.navigate('companyPage', { id: data.companyId, userId: data.authorUserId });
            }
          }}
        >
          <Text style={styles.cardLabel}>发布企业</Text>
          <View style={styles.companyRow}>
            <ExpoImage
              source={data.companyLogo ? { uri: data.companyLogo } : require('@/assets/link/mock-avatar.png')}
              style={styles.companyAvatar}
              contentFit="cover"
            />
            <View style={styles.companyInfo}>
              <View style={styles.companyNameRow}>
                <Text style={styles.companyName}>{data.companyName}</Text>
                <VerifiedBadgeIcon size={14} />
              </View>
              <Text style={styles.companySub}>企业认证 · 信息已核验</Text>
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
            {data.evidences.map((item, i) => (
              <TouchableOpacity
                key={`${item.type}-${item.refId ?? i}`}
                activeOpacity={0.7}
                style={styles.evidencePill}
                onPress={() => openBasis(navigation, item)}
              >
                <Text style={styles.evidenceText}>{item.label}</Text>
                {i === data.evidences.length - 1 && <ChevronRightIcon size={10} />}
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
  topCard: {
    marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeH(10),
    overflow: 'hidden',
  },
  titleCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(10),
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
  },
  serviceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(14),
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
    position: 'relative',
    marginTop: scaleSizeH(16),
    paddingHorizontal: scaleSizeH(16),
  },
  analysisCard: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: scaleSizeW(10),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: scaleSizeW(14),
    paddingBottom: scaleSizeH(20),
  },
  analysisHeader: {
    position: 'absolute',
    top: scaleSizeH(17),
    left: scaleSizeH(30),
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
    right: scaleSizeW(16),
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
    paddingBottom: scaleSizeH(20),
  },
  cardLabel: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(18),
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
    paddingBottom: scaleSizeH(19),
  },
  evidenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(12),
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
