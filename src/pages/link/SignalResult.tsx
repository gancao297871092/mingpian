import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { parseAbilityContent } from './signalDraft';
import { NoteDotIcon, SignalIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

interface ResultView {
  title: string;
  summary: { label: string; value: string }[];
  stats: { label: string; value: number }[];
}

const EMPTY: ResultView = {
  title: '',
  summary: [],
  stats: [
    { label: '已触达', value: 0 },
    { label: '已查看', value: 0 },
    { label: '已连接', value: 0 },
  ],
};

/** 查看结果记录（figma 2805:8070，分组10）：已结束信号的结果页 */
export default function SignalResult() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'signalResult'>>();
  const signalId = route.params?.id;
  const [data, setData] = useState<ResultView>(EMPTY);

  const load = useCallback(async () => {
    if (!signalId) return;
    try {
      const res = await API.signal.progress({ signalId, pageNum: 1, pageSize: 20 });
      const signal = res.data.signal ?? ({} as typeof res.data.signal);
      const intent = parseAbilityContent(signal.abilityContent);
      const funnel = res.data.funnel ?? { deliverCount: 0, viewCount: 0, responseCount: 0 };
      setData({
        title: signal.targetDesc || '未命名信号',
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
            <Text style={styles.statusPillText}>已结束</Text>
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
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(30),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(14),
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
    marginTop: scaleSizeH(12),
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(11),
    backgroundColor: '#F6F8FC',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  statusPillText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
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
    fontWeight: '500',
    color: '#000000',
  },
  summaryRows: {
    marginTop: scaleSizeH(15),
    gap: scaleSizeH(10),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(35),
  },
  summaryLabel: {
    width: scaleSizeW(60),
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
    marginTop: scaleSizeH(15),
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
    paddingVertical: scaleSizeH(14),
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
    fontWeight: '600',
    lineHeight: setSpText(20),
    color: '#000000',
  },
});
