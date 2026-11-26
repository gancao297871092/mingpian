import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppImage from '@/components/AppImage';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

const PURPLE = '#7B5BD6';
const GREEN = '#36BE69';
const TEXT_SUB = '#6C6C6C';

interface InsightItem {
  opportunityId: number;
  title: string;
  stage?: string;
  /** AI 解读（详情接口 aiInsight.analysis；老版本无此字段时隐藏解读区） */
  analysis?: string;
}

interface FeedInfo {
  title: string;
  author: string;
  company: string;
  cover: string;
}

const CN_NUM = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 汇总文案：按商机标题拼装（figma 516:3434「…主要反映了A、B和C三个合作方向。」） */
function buildSummary(titles: string[]): string {
  const list = titles.filter(Boolean);
  const n = list.length;
  if (n === 0) return '';
  const shown = list.slice(0, 3);
  const joined = shown.length > 1
    ? `${shown.slice(0, -1).join('、')}和${shown[shown.length - 1]}`
    : shown[0];
  const count = CN_NUM[n] ?? String(n);
  return `结合内容语义与上下文，AI判断这篇内容主要反映了${joined}${n > 3 ? '等' : ''}${count}个合作方向。`;
}

/** AI洞察（figma 516:3407）：来源动态 + AI总结 + 识别出的合作商机列表，点击进方向详情 */
export default function AiInsight() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'aiInsight'>>();
  const params = route.params;

  const [feed, setFeed] = useState<FeedInfo>({
    title: params?.feedTitle ?? '',
    author: params?.feedAuthor ?? '',
    company: params?.feedCompany ?? '',
    cover: params?.feedCover ?? '',
  });
  const [items, setItems] = useState<InsightItem[]>(params?.items ?? []);

  // 路由参数缺失（如页面恢复）时回源详情接口补齐
  const load = useCallback(async () => {
    if (!params?.bbsId || (params.items?.length && params.feedTitle)) return;
    try {
      const res = await API.square.bbsDetail({ bbsId: params.bbsId });
      const bbs: any = res.data?.bbs ?? {};
      const info = bbs.userInfoVo ?? {};
      const mediaList: any[] = bbs.mediaLinkList ?? bbs.mediaList ?? [];
      const firstMedia = mediaList[0]?.media?.mdUrl ?? mediaList[0]?.mdUrl ?? bbs.coverUrl ?? bbs.posterUrl ?? '';
      setFeed({
        title: bbs.title ?? '',
        author: info.nickname || info.realName || info.username || '',
        company: info.cpName ?? '',
        cover: firstMedia,
      });
      setItems(res.data?.aiInsight ?? []);
    } catch {
      // 拦截器已提示错误
    }
  }, [params?.bbsId, params?.items?.length, params?.feedTitle]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = buildSummary(items.map(i => i.title));

  return (
    <SafeView backgroundColor="#E8EFFF">
      <AppImage
        source={require('@/assets/link/hero-bg.png')}
        style={styles.headerBg}
        contentFit="cover"
      />
      {/* 自定义头部：玻璃返回 + 居中标题（同产业正在发生/申请平台协助） */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI洞察</Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
      >
        {/* 来源动态卡 */}
        <View style={styles.feedCard}>
          <View style={styles.feedTextCol}>
            <Text style={styles.feedTitle} numberOfLines={2}>{feed.title}</Text>
            <Text style={styles.feedAuthor} numberOfLines={1}>
              {[feed.author, feed.company].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {!!feed.cover && (
            <AppImage source={{ uri: feed.cover }} style={styles.feedCover} contentFit="cover" transition={150} />
          )}
        </View>

        {/* AI 识别横幅：机器人压在绿色胶囊与总结卡左上角 */}
        <View style={styles.bannerRow}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerText}>AI识别到 {items.length} 个合作商机</Text>
          </View>
          <AppImage
            source={require('@/assets/link/ai-insight-robot.png')}
            style={styles.bannerRobot}
            contentFit="contain"
          />
        </View>

        {/* AI 总结卡（与机器人底部重叠，磨砂盖在机器人下沿） */}
        {!!summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{summary}</Text>
            <Text style={styles.summaryNote}>以下结果仅供合作判断参考，可根据实际情况发送合作意向。</Text>
          </View>
        )}

        {/* 合作商机 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>合作商机</Text>
          <Text style={styles.sectionCount}>共 {items.length} 条</Text>
        </View>

        {items.map(item => {
          const confirmed = item.stage === '明确表达';
          return (
            <TouchableOpacity
              key={item.opportunityId}
              activeOpacity={0.85}
              style={styles.oppCard}
              onPress={() => navigation.navigate('directionDetail', { opportunityId: item.opportunityId })}
            >
              <View style={styles.oppRow}>
                <View style={[styles.stagePill, confirmed ? styles.stagePillExpress : styles.stagePillAi]}>
                  <Text style={confirmed ? styles.stageTextExpress : styles.stageTextAi}>{item.stage || 'AI研判'}</Text>
                </View>
                <Text style={styles.oppTitle} numberOfLines={1}>{item.title}</Text>
                <ChevronRightIcon size={10} />
              </View>
              {!!item.analysis && <Text style={styles.oppAnalysis}>{item.analysis}</Text>}
            </TouchableOpacity>
          );
        })}
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
    // 不给 elevation：Android 上半透明背景 + elevation 会被阴影渗色成脏灰块；iOS 阴影走 shadow* 不受影响
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  navPlaceholder: {
    width: scaleSizeW(44),
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
  },
  feedTextCol: {
    flex: 1,
    gap: scaleSizeH(20),
  },
  feedTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    lineHeight: setSpText(20),
  },
  feedAuthor: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
    lineHeight: setSpText(12),
  },
  feedCover: {
    width: scaleSizeW(53),
    height: scaleSizeW(71),
    borderRadius: scaleSizeW(4),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleSizeW(16),
    height: scaleSizeW(75),
  },
  bannerRobot: {
    position: 'absolute',
    left: 0,
    width: scaleSizeW(75),
    height: scaleSizeW(75),
    zIndex: 1,
  },
  bannerPill: {
    marginLeft: scaleSizeW(38),
    paddingLeft: scaleSizeW(46),
    paddingRight: scaleSizeW(16),
    paddingVertical: scaleSizeH(6),
    backgroundColor: '#0CC160',
    borderTopRightRadius: scaleSizeW(90),
    borderBottomRightRadius: scaleSizeW(90),
  },
  bannerText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  summaryCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(-21),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(16),
  },
  summaryText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  summaryNote: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  sectionTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  sectionCount: {
    fontSize: setSpText(14),
    color: TEXT_SUB,
  },
  oppCard: {
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
  },
  oppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(9),
  },
  stagePill: {
    flexShrink: 0,
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  stagePillAi: {
    backgroundColor: '#EFE9FF',
  },
  stagePillExpress: {
    backgroundColor: '#E7FFF2',
  },
  stageTextAi: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: PURPLE,
  },
  stageTextExpress: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: GREEN,
  },
  oppTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  oppAnalysis: {
    marginTop: scaleSizeH(12),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: TEXT_SUB,
  },
});
