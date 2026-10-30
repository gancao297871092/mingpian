import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon, SignalTaskIcon } from './myIcons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const CARD_BG = '#F6F7FB';

/** 92.业务员工作台 */
export default function Workbench() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  /** 触达任务三态计数：count 接口返回 {pending, sent, total}，已查看 = total - pending - sent */
  const [stats, setStats] = useState({ todo: 0, sent: 0, viewed: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await API.salesTask.count();
          const d = res.data ?? {};
          const pending = d.pending ?? 0;
          const sent = d.sent ?? 0;
          const total = d.total ?? 0;
          setStats({ todo: pending, sent, viewed: Math.max(total - pending - sent, 0) });
        } catch {
          // 拦截器已提示错误
        }
      })();
    }, []),
  );

  const STATS = [
    { num: stats.todo, label: '待触达' },
    { num: stats.sent, label: '已发送' },
    { num: stats.viewed, label: '已查看' },
  ];

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <SignalTaskIcon />
            <Text style={styles.cardTitle}>信号触达任务</Text>
            <BlueBadgeIcon />
          </View>
          <View style={styles.divider} />
          <Text style={styles.desc}>合作信号匹配到线下客户时，系统会分配给你负责触达</Text>
          <View style={styles.statsRow}>
            {STATS.map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statNum}>{s.num} 个</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionBtn}
            onPress={() => navigation.navigate('touchTasks')}
          >
            <Text style={styles.actionBtnText}>查看任务</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <SignalTaskIcon />
            <Text style={styles.cardTitle}>企业查询</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.desc}>查询未入驻的企业信息，可直接认领录入平台</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionBtn}
            onPress={() => navigation.navigate('companySearch')}
          >
            <Text style={styles.actionBtnText}>去查询</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
    gap: scaleSizeH(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  cardTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: CARD_BG,
    marginTop: scaleSizeH(13),
  },
  desc: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
    marginTop: scaleSizeH(10),
  },
  statsRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(20),
  },
  statBox: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: scaleSizeW(10),
    paddingVertical: scaleSizeH(10),
    alignItems: 'center',
    gap: scaleSizeH(3),
  },
  statNum: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: PRIMARY,
  },
  statLabel: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  actionBtn: {
    marginTop: scaleSizeH(14),
    height: scaleSizeH(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
});
