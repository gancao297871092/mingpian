import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import RNExitApp from 'react-native-exit-app';

export default function ExitAppDemo() {
  const [countdown, setCountdown] = useState(3);
  const [armed, setArmed] = useState(false);

  const handleExit = () => {
    if (!armed) {
      AppAlert.alert('提示', '点击后会立即退出应用，确认继续吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '继续',
          style: 'destructive',
          onPress: () => {
            setArmed(true);
            setCountdown(3);
          },
        },
      ]);
      return;
    }
    if (countdown > 0) {
      setCountdown((c) => c - 1);
      return;
    }
    RNExitApp.exitApp();
  };

  const label = !armed ? '退出应用' : countdown > 0 ? `即将退出 (${countdown})` : '正在退出…';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>退出应用</Text>
        <Text style={styles.desc}>
          react-native-exit-app · 调用原生 exit(0) 完全关闭 App（已打补丁适配 RN 0.86 新架构）
        </Text>
        <Pressable
          style={[styles.button, armed && countdown === 0 && styles.buttonActive]}
          onPress={handleExit}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </Pressable>
        <Text style={styles.tip}>验证方式：点击后 App 将直接关闭回到桌面。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#dc2626',
  },
  buttonActive: { backgroundColor: '#b91c1c' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tip: { marginTop: 12, fontSize: 13, color: '#666' },
});
