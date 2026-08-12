import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Switch } from 'react-native';
import SvgaPlayer from '@jayming/expo-svga-player';

const SVGA_URLS = [
  'https://chat-bucket-vv.oss-cn-beijing.aliyuncs.com/webStorage/web_17275154284112757.svga',
  'https://chat-bucket-vv.oss-cn-beijing.aliyuncs.com/webStorage/web_17275155334879886.svga',
  'https://chat-bucket-vv.oss-cn-beijing.aliyuncs.com/webStorage/web_17275166228604031.svga',
];

export default function SvgaDemo() {
  const [index, setIndex] = useState(0);
  const [loops, setLoops] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = SVGA_URLS[index];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>SVGA 动画</Text>
        <Text style={styles.desc}>@jayming/expo-svga-player · 播放云端 SVGA 特效（替代 expo-svga）</Text>

        <View style={styles.playerBox}>
          <SvgaPlayer
            key={`${index}-${playKey}`}
            source={current}
            style={styles.player}
            autoPlay
            loops={loops ? 0 : 1}
            clearsAfterStop
            align="center"
            onLoaded={() => {
              setFinished(false);
              setError(null);
            }}
            onError={(e) => setError(e?.message ?? '加载失败')}
            onFinished={() => setFinished(true)}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {finished && !loops && <Text style={styles.finished}>播放结束</Text>}

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>循环播放</Text>
          <Switch value={loops} onValueChange={setLoops} />
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.button, styles.buttonGhost]}
            onPress={() => {
              setFinished(false);
              setIndex((i) => (i - 1 + SVGA_URLS.length) % SVGA_URLS.length);
            }}
          >
            <Text style={styles.buttonGhostText}>上一个</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
              setFinished(false);
              setIndex((i) => (i + 1) % SVGA_URLS.length);
            }}
          >
            <Text style={styles.buttonText}>下一个</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
              setFinished(false);
              setPlayKey((k) => k + 1);
            }}
          >
            <Text style={styles.buttonText}>重播</Text>
          </Pressable>
        </View>

        <Text style={styles.urlText} numberOfLines={2}>
          当前: {current}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  playerBox: {
    height: 260, backgroundColor: '#111', borderRadius: 16, overflow: 'hidden',
  },
  player: { flex: 1 },
  finished: { textAlign: 'center', color: '#16a34a', fontSize: 13, fontWeight: '600', marginTop: 8 },
  error: { textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: '600', marginTop: 8 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12,
  },
  toggleLabel: { fontSize: 15, color: '#333' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 12 },
  buttonPrimary: { backgroundColor: '#2563eb' },
  buttonGhost: { backgroundColor: '#e2e8f0' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  buttonGhostText: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  urlText: { marginTop: 12, fontSize: 11, color: '#999', textAlign: 'center' },
});
