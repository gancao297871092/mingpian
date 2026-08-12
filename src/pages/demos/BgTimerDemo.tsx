import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { BackgroundTimer, type SchedulerStats } from 'react-native-nitro-bg-timer';

export default function BgTimerDemo() {
  const [ticks, setTicks] = useState(0);
  const [running, setRunning] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState('尚未触发 setTimeout');
  const [stats, setStats] = useState<SchedulerStats | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const startInterval = () => {
    if (intervalRef.current !== null) {
      return;
    }
    setTicks(0);
    setRunning(true);
    intervalRef.current = BackgroundTimer.setInterval(() => {
      setTicks((t) => t + 1);
    }, 1000);
  };

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      BackgroundTimer.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const runTimeout = () => {
    setTimeoutMessage('3 秒后触发…');
    if (timeoutRef.current !== null) {
      BackgroundTimer.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = BackgroundTimer.setTimeout(() => {
      setTimeoutMessage(`✅ setTimeout 已触发 (${new Date().toLocaleTimeString()})`);
      timeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    const timer = BackgroundTimer.onStats((s) => setStats(s));
    return () => {
      timer();
      stopInterval();
      if (timeoutRef.current !== null) {
        BackgroundTimer.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>后台定时器</Text>
        <Text style={styles.desc}>
          react-native-nitro-bg-timer · Nitro 原生定时器，退到后台依然运行（替代 react-native-background-timer）
        </Text>

        <View style={styles.card}>
          <Text style={styles.tickCount}>{ticks} 秒</Text>
          <Text style={styles.tickDesc}>
            {running ? 'interval 运行中（可切后台验证仍计数）' : 'interval 已停止'}
          </Text>
          <View style={styles.row}>
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={startInterval}>
              <Text style={styles.buttonText}>开始计数</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonDanger]} onPress={stopInterval}>
              <Text style={styles.buttonText}>停止</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>setTimeout</Text>
          <Text style={styles.message}>{timeoutMessage}</Text>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={runTimeout}>
            <Text style={styles.buttonText}>3 秒后触发</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>调度器统计</Text>
          {stats ? (
            <>
              <Text style={styles.statText}>激活任务: {stats.activeCount}</Text>
              <Text style={styles.statText}>回调次数: {stats.callbackCount}</Text>
              <Text style={styles.statText}>迟到分发: {stats.lateDispatchCount}</Text>
              <Text style={styles.statText}>平均延迟: {stats.avgLatenessMs.toFixed(2)}ms</Text>
              <Text style={styles.statText}>p95 延迟: {stats.p95LatenessMs.toFixed(2)}ms</Text>
            </>
          ) : (
            <Text style={styles.message}>暂无统计</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  tickCount: { fontSize: 44, fontWeight: '900', color: '#2563eb' },
  tickDesc: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  message: { fontSize: 14, color: '#555', marginBottom: 12 },
  statText: { fontSize: 14, color: '#333', marginVertical: 2 },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 12 },
  buttonPrimary: { backgroundColor: '#2563eb' },
  buttonDanger: { backgroundColor: '#dc2626' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
