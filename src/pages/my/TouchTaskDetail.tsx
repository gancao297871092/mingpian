import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { Image as ExpoImage } from 'expo-image';
import { useRoute, type RouteProp } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import LongHtmlView from '@/components/LongHtmlView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon, CapPuzzleIcon } from './myIcons';

const PRIMARY = '#2962D4';
const GREEN = '#0CC160';
const TEXT_SUB = '#6C6C6C';
const CARD_BG = 'rgba(255, 255, 255, 0.8)';

interface TaskDetail {
  avatar: string;
  company: string;
  verified: boolean;
  companyTags: string;
  analysis: string;
  capCompany: string;
  capBbsCount: number;
  capContent: string;
  script: string;
}

const EMPTY_DETAIL: TaskDetail = {
  avatar: '',
  company: '',
  verified: true,
  companyTags: '',
  analysis: '',
  capCompany: '',
  capBbsCount: 0,
  capContent: '',
  script: '',
};

/** 96.任务详情（数据来源 /sales/task/detail；接口未下发企业 Logo/行业标签，待后端补） */
export default function TouchTaskDetail() {
  const route = useRoute<RouteProp<RootStackParamList, 'touchTaskDetail'>>();
  const taskId = route.params?.id;
  const [detail, setDetail] = useState<TaskDetail>(EMPTY_DETAIL);
  const [cardId, setCardId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.salesTask.detail({ taskId });
        const t = res.data.task ?? {};
        const card = res.data.card;
        setCardId(card?.id);
        const next: TaskDetail = {
          avatar: '',
          company: t.targetName || '目标客户',
          verified: true,
          companyTags: res.data.opportunity?.region || '',
          analysis: t.matchAnalysis || t.aiJudgement || '',
          capCompany: card?.cardName || '',
          // 接口未下发关联动态数，0 时隐藏该行（防御）
          capBbsCount: card?.bbsCount ?? 0,
          capContent: card?.content || card?.summary || '',
          script: t.pitchScript || '',
        };
        setDetail(next);
        // 话术为空时调 T4 生成（AI 耗时，先展示页面再回填）
        if (!t.pitchScript) {
          try {
            const pitchRes = await API.salesTask.pitch({ taskId });
            const pitch = pitchRes.data?.pitch ?? '';
            if (pitch) setDetail(prev => ({ ...prev, script: pitch }));
          } catch {
            // 生成失败静默，话术区留空
          }
        }
      } catch {
        // 拦截器已提示错误
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId]);

  const onCopy = () => {
    if (!detail.script) return;
    Clipboard.setString(detail.script);
    Toast.show({ type: 'success', text1: '已复制' });
  };

  /** 微信转发：标记已发送 + 能力卡分享计数（幂等，后端不重复计） */
  const onShare = useCallback(async () => {
    try {
      await API.salesTask.markSent({ taskId });
      if (cardId) await API.salesTask.share({ cardId });
      Toast.show({ type: 'success', text1: '已标记发送，请前往微信转发话术' });
    } catch {
      // 拦截器已提示错误
    }
  }, [taskId, cardId]);

  if (loading) {
    return (
      <SafeView backgroundColor="#E8EFFF">
        <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
      </SafeView>
    );
  }

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={require('@/assets/my/workbench/detail-bg.png')} style={styles.bgDeco} resizeMode="cover" />
        <Image source={require('@/assets/my/settings/cert-glow.png')} style={styles.glow} resizeMode="contain" />

        <View style={styles.companyCard}>
          {detail?.avatar ? (
            <ExpoImage source={{ uri: detail.avatar }} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={styles.companyText}>
            <View style={styles.companyRow}>
              <Text style={styles.company} numberOfLines={1}>{detail?.company || ''}</Text>
              {detail?.verified && <BlueBadgeIcon />}
            </View>
            {!!detail?.companyTags && <Text style={styles.companyTags} numberOfLines={1}>{detail.companyTags}</Text>}
          </View>
        </View>

        <View style={styles.analysisSection}>
          <Image source={require('@/assets/my/workbench/exec.png')} style={styles.execImg} resizeMode="contain" />
          <View style={styles.analysisBanner}>
            <Text style={styles.analysisBannerText}>匹配分析 · 为什么找他</Text>
          </View>
          <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>{detail?.analysis || ''}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionBar, styles.sectionBarBlue]} />
            <Text style={styles.sectionTitle}>推荐给客户的合作内容</Text>
          </View>
          <View style={styles.capCard}>
            <LinearGradient
              colors={['#2962D4', '#8EB4FF']}
              start={{ x: 0.13, y: 0.77 }}
              end={{ x: 1, y: 0 }}
              style={styles.capHead}
            >
              <View style={{
                paddingHorizontal: scaleSizeW(16),
              }}>
                <View style={styles.capHeadRow}>
                  <CapPuzzleIcon />
                  <Text style={styles.capLabel}>能力卡</Text>
                </View>
                <Text style={styles.capCompany} numberOfLines={1}>{detail?.capCompany || ''}</Text>
              </View>

            </LinearGradient>
            <View style={styles.capBody}>
              {detail.capBbsCount > 0 && (
                <Text style={styles.capBbsCount}>关联动态 {detail.capBbsCount} 条</Text>
              )}
              {!!detail?.capContent && (
                <View style={styles.capContentBox}>
                  <LongHtmlView
                    html={detail.capContent}
                    contentWidth={SCREEN_WIDTH - scaleSizeW(92)}
                    baseStyle={styles.capContent}
                  />
                </View>
              )}
              <View style={styles.capBtns}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.capBtn}
                  onPress={() => Toast.show({ type: 'info', text1: '能力卡详情页建设中' })}
                >
                  <Text style={styles.capBtnText}>能力卡详情</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={styles.capBtn} onPress={onShare}>
                  <Text style={[styles.capBtnText, { color: PRIMARY }]}>微信转发</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionBar, styles.sectionBarGreen]} />
            <Text style={styles.sectionTitle}>微信推荐话术</Text>
          </View>
          <View style={styles.scriptBox}>
            <Text style={styles.scriptText}>{detail?.script || ''}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.copyBtn} onPress={onCopy}>
              <Text style={styles.copyBtnText}>点击复制</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  loadingPad: {
    paddingVertical: scaleSizeH(120),
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  bgDeco: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleSizeW(402),
    height: scaleSizeH(208),
    opacity: 0.2,
  },
  glow: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: scaleSizeW(302),
    height: scaleSizeW(302),
    opacity: 0.3,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(15),
    gap: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  companyText: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  company: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  companyTags: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  analysisSection: {
    marginTop: scaleSizeH(10),
  },
  execImg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: scaleSizeW(75),
    height: scaleSizeW(75),
    zIndex: 2,
  },
  analysisBanner: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(20),
    marginLeft: scaleSizeW(38),
    backgroundColor: GREEN,
    borderTopRightRadius: scaleSizeW(90),
    borderBottomRightRadius: scaleSizeW(90),
    paddingLeft: scaleSizeW(30),
    paddingRight: scaleSizeW(10),
    zIndex: 1,
  },
  analysisBannerText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  analysisCard: {
    marginTop: scaleSizeH(10),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(18),
  },
  analysisText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  card: {
    marginTop: scaleSizeH(20),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(18),
    paddingBottom: scaleSizeH(18),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  sectionBar: {
    width: scaleSizeW(2),
    height: scaleSizeH(16),
    borderRadius: scaleSizeW(90),
  },
  sectionBarGreen: {
    backgroundColor: '#36BE69',
  },
  sectionBarBlue: {
    backgroundColor: PRIMARY,
  },
  sectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  capCard: {
    marginTop: scaleSizeH(14),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  capHead: {
    height: scaleSizeH(58),
    justifyContent: 'center',
    gap: scaleSizeH(5),
  },
  capHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  capLabel: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
  },
  capCompany: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
    marginTop: scaleSizeH(5),
  },
  capBody: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(22),
  },
  capBbsCount: {
    fontSize: setSpText(10),
    color: TEXT_SUB,
  },
  capContentBox: {
    marginTop: scaleSizeH(7),
  },
  capContent: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  capBtns: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  capBtn: {
    flex: 1,
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  scriptBox: {
    marginTop: scaleSizeH(14),
    backgroundColor: '#EEF3FF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(20),
  },
  scriptText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  copyBtn: {
    marginTop: scaleSizeH(16),
    height: scaleSizeH(39),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
});
