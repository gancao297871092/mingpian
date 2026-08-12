import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import { LiquidGlass } from '@/components/capabilities';

export default function LiquidGlassDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>液态玻璃 (Glassmorphism)</Text>
        <Text style={styles.desc}>
          iOS 使用原生 BlurView，Android 使用半透明叠加层模拟
        </Text>

        <View style={styles.demoArea}>
          <Image
            source={{ uri: 'https://picsum.photos/400/300' }}
            style={styles.bgImage}
          />
          <LiquidGlass style={styles.glassCard}>
            <Text style={styles.glassTitle}>磨砂玻璃效果</Text>
            <Text style={styles.glassDesc}>
              这是 iOS 上常见的毛玻璃/液态玻璃效果，可用于卡片、弹窗、导航栏等场景。
            </Text>
          </LiquidGlass>
        </View>

        <View style={styles.row}>
          <LiquidGlass effect="clear" tintColor="rgba(255,255,255,0.15)" style={styles.smallCard}>
            <Text style={styles.smallTitle}>浅色</Text>
          </LiquidGlass>
        <LiquidGlass effect="regular" tintColor="rgba(0,0,0,0.2)" colorScheme="dark" style={{ ...styles.smallCard, ...styles.darkCard }}>
          <Text style={[styles.smallTitle, { color: '#fff' }]}>深色</Text>
          </LiquidGlass>
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
  demoArea: {
    height: 240, borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    justifyContent: 'flex-end',
  },
  bgImage: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: undefined, height: undefined },
  glassCard: { padding: 20, borderRadius: 16 },
  glassTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  glassDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: {
    flex: 1, height: 100, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  darkCard: { backgroundColor: 'rgba(0,0,0,0.4)' },
  smallTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
});
