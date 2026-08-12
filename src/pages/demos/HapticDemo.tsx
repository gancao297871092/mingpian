import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Switch } from 'react-native';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

const COMMON_TYPES: { key: keyof typeof HapticFeedbackTypes; label: string }[] = [
  { key: 'impactLight', label: '轻触反馈' },
  { key: 'impactMedium', label: '中触反馈' },
  { key: 'impactHeavy', label: '重触反馈' },
  { key: 'soft', label: '柔滑' },
  { key: 'rigid', label: '硬朗' },
  { key: 'selection', label: '选择' },
  { key: 'notificationSuccess', label: '成功通知' },
  { key: 'notificationWarning', label: '警告通知' },
  { key: 'notificationError', label: '错误通知' },
];

export default function HapticDemo() {
  const [enabled, setEnabled] = useState(true);
  const [lastEvent, setLastEvent] = useState('尚未触发');
  const [supported, setSupported] = useState<boolean | null>(null);

  const trigger = (type: keyof typeof HapticFeedbackTypes) => {
    ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true });
    setLastEvent(`trigger(${type})`);
  };

  const checkSupport = async () => {
    const result = ReactNativeHapticFeedback.isSupported();
    setSupported(result);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>触感反馈</Text>
        <Text style={styles.desc}>react-native-haptic-feedback · 原生 Haptics</Text>

        <Pressable style={styles.buttonPrimary} onPress={checkSupport}>
          <Text style={styles.buttonText}>检测硬件支持 (isSupported)</Text>
        </Pressable>
        {supported !== null && (
          <Text style={styles.meta}>isSupported: {String(supported)}</Text>
        )}

        <Text style={styles.sectionTitle}>常用类型</Text>
        <View style={styles.grid}>
          {COMMON_TYPES.map(({ key, label }) => (
            <Pressable key={key} style={styles.gridButton} onPress={() => trigger(key)}>
              <Text style={styles.gridButtonText}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>自定义强度 (impact)</Text>
        <View style={styles.grid}>
          {[0.3, 0.7, 1.0].map((intensity) => (
            <Pressable
              key={intensity}
              style={styles.gridButtonPurple}
              onPress={() => {
                ReactNativeHapticFeedback.impact('impactMedium', intensity);
                setLastEvent(`impact(impactMedium, ${intensity})`);
              }}
            >
              <Text style={styles.gridButtonText}>强度 {intensity.toFixed(1)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>震动序列 (triggerPattern)</Text>
        <View style={styles.grid}>
          {(['success', 'error', 'warning', 'heartbeat'] as const).map((name) => (
            <Pressable
              key={name}
              style={styles.gridButtonCyan}
              onPress={() => {
                ReactNativeHapticFeedback.triggerPattern(
                  name === 'success'
                    ? [{ time: 0, type: 'transient', intensity: 0.9, sharpness: 0.5 }]
                    : name === 'error'
                      ? [{ time: 0, duration: 120, intensity: 1.0, sharpness: 0.6 }]
                      : name === 'warning'
                        ? [
                            { time: 0, type: 'transient', intensity: 0.8, sharpness: 0.5 },
                            { time: 90, type: 'transient', intensity: 0.8, sharpness: 0.5 },
                          ]
                        : [
                            { time: 0, type: 'transient', intensity: 0.7, sharpness: 0.4 },
                            { time: 120, type: 'transient', intensity: 0.7, sharpness: 0.4 },
                            { time: 240, type: 'transient', intensity: 0.7, sharpness: 0.4 },
                          ],
                );
                setLastEvent(`triggerPattern(${name})`);
              }}
            >
              <Text style={styles.gridButtonText}>{name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>全局启用</Text>
          <Switch
            value={enabled}
            onValueChange={(value) => {
              setEnabled(value);
              ReactNativeHapticFeedback.setEnabled(value);
            }}
          />
        </View>

        <Text style={styles.meta}>最近触发: {lastEvent}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 8 },
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14,
  },
  buttonPrimary: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridButton: {
    minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 8, backgroundColor: '#334155',
  },
  gridButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  gridButtonPurple: {
    minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 8, backgroundColor: '#7c3aed',
  },
  gridButtonCyan: {
    minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 8, backgroundColor: '#0891b2',
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16,
  },
  toggleLabel: { fontSize: 15, color: '#333' },
  meta: { marginTop: 12, fontSize: 13, color: '#666' },
});
