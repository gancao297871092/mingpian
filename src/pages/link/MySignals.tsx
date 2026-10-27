import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { PlusSignalIcon, SignalIcon } from './icons';

const PRIMARY = '#2962D4';
const ORANGE = '#F2722C';
const RED = '#EF4444';
const TEXT_SUB = '#6C6C6C';

type SignalStatus = 'review' | 'reaching' | 'failed';

interface Signal {
  id: string;
  title: string;
  status: SignalStatus;
  days?: number;
  stats?: { reached: number; viewed: number; replied: number };
  failReason?: string;
}

/** 静态 mock（接口待联调） */
const MOCK_SIGNALS: Signal[] = [
  { id: '1', title: '寻找西南区域吨袋供应合作', status: 'review' },
  {
    id: '2',
    title: '寻找华东编织袋生产企业',
    status: 'reaching',
    days: 3,
    stats: { reached: 126, viewed: 48, replied: 3 },
  },
  {
    id: '3',
    title: '连接华南食品包装生产企业',
    status: 'failed',
    failReason: '目标范围过窄，送达 7 天未找到匹配的高质企业。',
  },
];

type FilterKey = 'all' | SignalStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'review', label: '审核中' },
  { key: 'reaching', label: '触达中' },
  { key: 'failed', label: '审核失败' },
];

function StatusPill({ signal }: { signal: Signal }) {
  if (signal.status === 'review') {
    return (
      <View style={[styles.statusPill, styles.statusPillReview]}>
        <Text style={[styles.statusPillText, styles.statusPillTextReview]}>审核中</Text>
      </View>
    );
  }
  if (signal.status === 'reaching') {
    return (
      <View style={[styles.statusPill, styles.statusPillReaching]}>
        <Text style={[styles.statusPillText, styles.statusPillTextReaching]}>触达中 · {signal.days} 天</Text>
      </View>
    );
  }
  return (
    <View style={[styles.statusPill, styles.statusPillFailed]}>
      <Text style={[styles.statusPillText, styles.statusPillTextFailed]}>审核失败</Text>
    </View>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SignalIcon />
        <Text style={styles.cardTitle} numberOfLines={1}>{signal.title}</Text>
        <StatusPill signal={signal} />
      </View>
      <View style={styles.divider} />

      {signal.status === 'review' && (
        <>
          <Text style={styles.reviewTip}>审核通过后将开始触达</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionBtn}
            onPress={() => console.log('go: 修改信号', signal.id)}
          >
            <Text style={styles.actionBtnText}>修改信号</Text>
          </TouchableOpacity>
        </>
      )}

      {signal.status === 'reaching' && signal.stats && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>已触达</Text>
              <Text style={styles.statsValue}>{signal.stats.reached}</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>已查看</Text>
              <Text style={styles.statsValue}>{signal.stats.viewed}</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>有效回应</Text>
              <Text style={styles.statsValue}>{signal.stats.replied}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionBtn, styles.actionBtnHalf]}
              onPress={() => console.log('go: 修改信号', signal.id)}
            >
              <Text style={styles.actionBtnText}>修改信号</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionBtn, styles.actionBtnHalf, styles.actionBtnProgress]}
              onPress={() => navigation.navigate('signalProgress', { id: signal.id })}
            >
              <Text style={styles.actionBtnProgressText}>查看进展</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {signal.status === 'failed' && (
        <>
          <Text style={styles.failReason}>
            <Text style={styles.failReasonLabel}>失败原因{'\n'}</Text>
            <Text style={styles.failReasonValue}>{signal.failReason}</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionBtn}
            onPress={() => console.log('go: 修改信号', signal.id)}
          >
            <Text style={styles.actionBtnText}>修改信号</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/** 头部右侧：发新信号（figma 玻璃圆钮 + 加号） */
export function MySignalsHeaderRight() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.headerPlus}
      onPress={() => navigation.navigate('createCooperationSignal')}
    >
      <PlusSignalIcon size={18} />
    </TouchableOpacity>
  );
}

/** 50.我的信号（figma 2805:8180，分组10最新稿） */
export default function MySignals() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = {
      all: MOCK_SIGNALS.length,
      review: 0,
      reaching: 0,
      failed: 0,
    };
    MOCK_SIGNALS.forEach(s => {
      result[s.status] += 1;
    });
    return result;
  }, []);

  const list = filter === 'all' ? MOCK_SIGNALS : MOCK_SIGNALS.filter(s => s.status === filter);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 状态筛选 */}
        <View style={styles.filterRow}>
          {FILTERS.map(item => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {item.key === 'all' ? (
                    item.label
                  ) : (
                    <>
                      {item.label}{' '}
                      <Text style={active && styles.filterPillTextActive}>{counts[item.key]}</Text>
                    </>
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {list.map(signal => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerPlus: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(30),
    paddingBottom: scaleSizeH(20),
  },
  filterRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginBottom: scaleSizeH(20),
  },
  filterPill: {
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  filterPillActive: {
    backgroundColor: '#000000',
  },
  filterPillText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(19),
    marginBottom: scaleSizeH(20),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  statusPill: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  statusPillReview: {
    backgroundColor: '#FFF0E8',
  },
  statusPillReaching: {
    backgroundColor: PRIMARY,
  },
  statusPillFailed: {
    backgroundColor: '#FFEDED',
  },
  statusPillText: {
    fontSize: setSpText(10),
    fontWeight: '500',
  },
  statusPillTextReview: {
    color: ORANGE,
  },
  statusPillTextReaching: {
    color: '#F2F6FF',
  },
  statusPillTextFailed: {
    color: RED,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(10),
  },
  reviewTip: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  actionBtn: {
    marginTop: scaleSizeH(15),
    height: scaleSizeH(35),
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  actionRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  actionBtnHalf: {
    flex: 1,
  },
  actionBtnProgress: {
    backgroundColor: '#F2F6FF',
    borderColor: '#F2F6FF',
  },
  actionBtnProgressText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: scaleSizeH(10),
  },
  statsItem: {
    alignItems: 'center',
    gap: scaleSizeH(5),
  },
  statsLabel: {
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  statsValue: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    fontWeight: '500',
    color: '#000000',
  },
  failReason: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
  },
  failReasonLabel: {
    color: TEXT_SUB,
  },
  failReasonValue: {
    color: '#000000',
  },
});
