import React, { useCallback, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import type { LinkBasisItem } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { splitAnalysis } from './linkFormat';
import { openBasis } from './linkNavigation';
import { AnalysisIcon, ChevronLeftIcon, ChevronRightIcon, VerifiedBadgeIcon } from './icons';

const TEXT_SUB = '#6C6C6C';

interface DirectionCompanyItem {
  id: string;
  companyId?: number;
  name: string;
  sub: string;
  logo?: string;
}

interface DirectionData {
  title: string;
  stage: string;
  analysis: string;
  evidences: LinkBasisItem[];
  companies: DirectionCompanyItem[];
  canConfirm: boolean;
}

const EMPTY: DirectionData = {
  title: '',
  stage: '',
  analysis: '',
  evidences: [],
  companies: [],
  canConfirm: false,
};

/** 49.潜在合作方向-方向详情（figma 295:2760）：深色渐变头 + 自定义玻璃返回钮 */
export default function DirectionDetail() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'directionDetail'>>();
  const opportunityId = route.params?.opportunityId;
  const [data, setData] = useState<DirectionData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!opportunityId) {
      setLoaded(true);
      return;
    }
    try {
      const res = await API.aiDiscovery.directions({ opportunityId, offset: 0, size: 3 });
      const direction = (res.data.direction ?? {}) as {
        directionName?: string;
        directionDesc?: string;
        stage?: string;
        basisList?: LinkBasisItem[];
        canConfirm?: boolean;
      };
      setData({
        title: direction.directionName ?? '',
        stage: direction.stage ?? '',
        analysis: direction.directionDesc ?? '',
        evidences: direction.basisList ?? [],
        companies: (res.data.companies ?? []).map((c, i) => ({
          id: String(c.companyId ?? c.matchId ?? i),
          companyId: c.companyId ?? undefined,
          name: c.companyName ?? '',
          sub: c.companyTypes || c.matchReason || '',
          logo: c.companyLogo || undefined,
        })),
        canConfirm: direction.canConfirm !== false,
      });
    } catch {
      // 拦截器已提示错误，保留当前内容
    } finally {
      setLoaded(true);
    }
  }, [opportunityId]);

  const onConfirm = useCallback(async () => {
    if (!opportunityId || submitting) return;
    const action = data.stage === '明确表达' ? 'withdraw' : 'confirm';
    setSubmitting(true);
    try {
      await API.aiDiscovery.confirm({ opportunityId, action });
      await load();
    } catch {
      // 拦截器已提示错误
    } finally {
      setSubmitting(false);
    }
  }, [data.stage, load, opportunityId, submitting]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      load();
      return () => StatusBar.setBarStyle('dark-content');
    }, [load]),
  );

  const { width } = useWindowDimensions();
  const analysis = splitAnalysis(data.analysis);

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
        <View style={{ borderRadius: scaleSizeH(10), overflow: 'hidden', marginHorizontal: scaleSizeW(16) }}>
          {/* 方向标题卡 */}
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>{data.title}</Text>
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>{data.stage}</Text>
            </View>
          </View>
          {/* 明确方向卡（非本人 / 不可流转时隐藏，避免无效操作） */}
          {(!loaded || data.canConfirm) && (
            <LinearGradient
              colors={['#FEF4E9', '#FFE4C1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmCard}
            >
              <View style={{
                marginTop: scaleSizeH(10),
                paddingHorizontal: scaleSizeW(14),
                paddingTop: scaleSizeH(16),
                paddingBottom: scaleSizeH(14),
              }}>
                <Text style={styles.confirmTip}>明确后，该方向将作为明确合作方向展示，并用于匹配相关企业</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  disabled={submitting}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmBtnText}>{data.stage === '明确表达' ? '撤回' : '明确该方向'}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}
        </View>

        <View style={{
          paddingHorizontal: scaleSizeH(16), marginTop: scaleSizeH(16),
          borderBottomLeftRadius: scaleSizeH(10), borderBottomRightRadius: scaleSizeH(10),
          position: 'relative',
        }}>
          <ExpoImage style={{
            width: width - scaleSizeH(32),
            height: (width - scaleSizeH(32)) * 0.181,
          }}
            source={require('@/assets/link/link.png')}
          />
          <View style={[styles.analysisHeader, { position: "absolute", top: scaleSizeH(17), left: scaleSizeH(30) }]}>
            <AnalysisIcon />
            <Text style={styles.analysisTitle}>方向分析</Text>
            <Text style={styles.analysisHint}>AI智能解读，仅供参考</Text>
          </View>
          <ExpoImage
            source={require('@/assets/link/hero-mascot.png')}
            style={styles.analysisMascot}
            contentFit="cover"
          />
          <View style={[styles.analysisCard, { borderTopLeftRadius: scaleSizeH(0), borderTopRightRadius: scaleSizeH(0) }]}>
            {!!analysis.lead && <Text style={styles.analysisLead}>{analysis.lead}</Text>}
            {!!analysis.body && <Text style={styles.analysisBody}>{analysis.body}</Text>}
          </View>
        </View>

        {/* 判断依据 */}
        <View style={styles.plainCard}>
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

        {/* 相关企业 */}
        <View style={styles.plainCard}>
          <Text style={styles.cardLabel}>相关企业</Text>
          {data.companies.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.companyRow}
              onPress={() => {
                if (item.companyId) navigation.navigate('companyPage', { id: item.companyId });
              }}
            >
              <ExpoImage
                source={item.logo ? { uri: item.logo } : require('@/assets/link/mock-avatar.png')}
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    paddingBottom: scaleSizeH(20),
  },
  analysisFold: {
    position: 'absolute',
    top: scaleSizeH(2),
    right: scaleSizeH(16),
    width: scaleSizeW(109),
    height: scaleSizeH(46),
    borderTopRightRadius: scaleSizeW(16),
    zIndex: -1,
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
