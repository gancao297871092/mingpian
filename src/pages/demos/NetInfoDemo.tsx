import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Switch } from 'react-native';
import NetInfo, { useNetInfo, type NetInfoState } from '@react-native-community/netinfo';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function NetInfoDemo() {
  const netInfo = useNetInfo();
  const [fetched, setFetched] = useState<NetInfoState | null>(null);
  const [subscribed, setSubscribed] = useState(true);
  const [eventCount, setEventCount] = useState(0);

  const handleFetch = useCallback(async () => {
    const state = await NetInfo.fetch();
    setFetched(state);
  }, []);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  useEffect(() => {
    if (!subscribed) {
      return;
    }
    const unsubscribe = NetInfo.addEventListener((state) => {
      setEventCount((count) => count + 1);
      setFetched(state);
    });
    return unsubscribe;
  }, [subscribed]);

  const state = fetched ?? netInfo;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>网络状态</Text>
        <Text style={styles.desc}>@react-native-community/netinfo · 实时监听 + 手动探测</Text>

        <View style={styles.card}>
          <InfoRow label="是否连接" value={state.isConnected === null ? '未知' : state.isConnected ? '是' : '否'} />
          <InfoRow label="是否可访问外网" value={state.isInternetReachable === null ? '未知' : state.isInternetReachable ? '是' : '否'} />
          <InfoRow label="网络类型" value={String(state.type ?? '-')} />
          <InfoRow label="WiFi" value={state.type === 'wifi' ? '是' : '否'} />
          <InfoRow label="蜂窝" value={state.type === 'cellular' ? '是' : '否'} />
          <InfoRow label="系统WiFi开关" value={state.isWifiEnabled === null || state.isWifiEnabled === undefined ? '-' : state.isWifiEnabled ? '开' : '关'} />
          <InfoRow
            label="细节"
            value={
              state.details
                ? JSON.stringify({
                    ipAddress: (state.details as any).ipAddress,
                    ssid: (state.details as any).ssid,
                    isConnectionExpensive: (state.details as any).isConnectionExpensive,
                    cellularGeneration: (state.details as any).cellularGeneration,
                  })
                : '-'
            }
          />
          <InfoRow label="监听事件数" value={String(eventCount)} />
        </View>

        <Pressable style={styles.button} onPress={handleFetch}>
          <Text style={styles.buttonText}>立即探测 (NetInfo.fetch)</Text>
        </Pressable>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>订阅网络变化</Text>
          <Switch value={subscribed} onValueChange={setSubscribed} />
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
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  infoLabel: { width: 130, fontSize: 14, color: '#888' },
  infoValue: { flex: 1, fontSize: 14, color: '#222', fontWeight: '500' },
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16,
  },
  toggleLabel: { fontSize: 15, color: '#333' },
});
