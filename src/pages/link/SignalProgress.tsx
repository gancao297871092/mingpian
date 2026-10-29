import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { elapsedDays } from './linkFormat';
import { parseAbilityContent } from './signalDraft';
import { NoteDotIcon, SignalIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

interface ProgressView {
  title: string;
  /** 后端状态 1/2/3/4/5 */
  status: number;
  days?: number;
  summary: { label: string; value: string }[];
  stats: { label: string; value: number }[];
}

const EMPTY: ProgressView = {
  title: '',
  status: 0,
  summary: [],
  stats: [
    { label: '已触达', value: 0 },
    { label: '已查看', value: 0 },
    { label: '已连接', value: 0 },
  ],
};

/** 信号进展·触达中（figma 2805:7992，分组10最新稿） */
export default function SignalProgress() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'signalProgress'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const signalId = route.params?.id;
  const [data, setData] = useState<ProgressView>(EMPTY);

  const load = useCallback(async () => {
    if (!signalId) return;
    try {
      const res = await API.signal.progress({ signalId, pageNum: 1, pageSize: 20 });
      const signal = res.data.signal ?? ({} as typeof res.data.signal);
      const intent = parseAbilityContent(signal.abilityContent);
      const funnel = res.data.funnel ?? { deliverCount: 0, viewCount: 0, responseCount: 0 };
      setData({
        title: signal.targetDesc || '未命名信号',
        status: signal.status ?? 0,
        days: elapsedDays(signal.startTime),
        summary: [
          { label: '目标客户', value: signal.targetDesc || '—' },
          { label: '合作目的', value: signal.purpose || intent?.note || '—' },
          {
            label: '能力内容',
            value: intent
              ? `${intent.feedTitles?.length ?? 0} 篇真实动态 + 能力阐述`
              : '未创建合作意向书',
          },
          {
            label: '触达身份',
            value: [intent?.contactName, intent?.contactTitle].filter(Boolean).join(' · ') || '—',
          },
        ],
        stats: [
          { label: '已触达', value: funnel.deliverCount ?? 0 },
          { label: '已查看', value: funnel.viewCount ?? 0 },
          { label: '已连接', value: funnel.responseCount ?? 0 },
        ],
      });
    } catch {
      // 拦截器已提示错误
    }
  }, [signalId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** 投放中 / 已结束不可修改（后端拒绝），仅审核中 / 已暂停可编辑 */
  const editable = data.status === 1 || data.status === 3;

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 信号标题卡 */}
        <View style={styles.card}>
          <View style={styles.signalRow}>
            <SignalIcon />
            <Text style={styles.signalTitle} numberOfLines={1}>{data.title}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>触达中·{data.days ?? 0}天</Text>
          </View>
        </View>

        {/* 触达摘要 */}
        <View style={styles.card}>
          <View style={styles.summaryTitleRow}>
            <View style={styles.summaryDot}>
              <NoteDotIcon />
            </View>
            <Text style={styles.summaryTitle}>触达摘要</Text>
          </View>
          <View style={styles.summaryRows}>
            {data.summary.map(row => (
              <View key={row.label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.intentBtn}
            onPress={() => navigation.navigate('cooperationIntentView', { signalId })}
          >
            <Text style={styles.intentBtnText}>查看合作意向书</Text>
          </TouchableOpacity>
        </View>

        {/* 触达统计 */}
        <View style={[styles.card, styles.statsCard]}>
          {data.stats.map(item => (
            <View key={item.label} style={styles.statsItem}>
              <Text style={styles.statsLabel}>{item.label}</Text>
              <Text style={styles.statsValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部操作条：仅可编辑状态展示 */}
      {editable && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(14)) }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.editBtn}
            onPress={() => navigation.navigate('createCooperationSignal', { id: signalId })}
          >
            <Text style={styles.editBtnText}>修改信号</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(30),
    paddingBottom: scaleSizeH(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(14),
    marginBottom: scaleSizeH(10),
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  signalTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(10),
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(10),
    backgroundColor: '#F2F6FF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  statusPillText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: PRIMARY,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  summaryDot: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
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
  intentBtn: {
    marginTop: scaleSizeH(20),
    height: scaleSizeH(35),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: scaleSizeH(14),
  },
  statsItem: {
    alignItems: 'center',
    gap: scaleSizeH(5),
  },
  statsLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  statsValue: {
    fontSize: setSpText(17),
    lineHeight: setSpText(20),
    fontWeight: '600',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  editBtn: {
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
