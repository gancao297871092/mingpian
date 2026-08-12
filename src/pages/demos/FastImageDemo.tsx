import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';

const IMAGES = [
  {
    uri: 'https://picsum.photos/seed/exp1/400/400',
    label: '优先下载 (priority)',
    priority: 'high' as const,
  },
  {
    uri: 'https://picsum.photos/seed/exp2/400/400',
    label: '低优先',
    priority: 'low' as const,
  },
  {
    uri: 'https://picsum.photos/seed/exp3/400/400',
    label: '仅内存缓存 (memory)',
    priority: 'normal' as const,
    cache: 'memory' as const,
  },
  {
    uri: 'https://picsum.photos/seed/exp4/400/400',
    label: '跳过缓存',
    priority: 'normal' as const,
    cache: 'none' as const,
  },
];

const BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

export default function FastImageDemo() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>图片加载与缓存</Text>
        <Text style={styles.desc}>expo-image · 替代 react-native-fast-image，支持缓存/占位/过渡</Text>

        <View style={styles.grid}>
          {IMAGES.map(({ uri, label, priority, cache }) => (
            <View key={label} style={styles.cell}>
              <Image
                source={{ uri }}
                style={styles.thumb}
                priority={priority}
                cachePolicy={cache}
                transition={300}
                contentFit="cover"
                recyclingKey={uri}
              />
              <Text style={styles.cellLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>模糊占位 + 渐显过渡</Text>
        <Image
          key={`large-${reloadKey}`}
          source={{ uri: 'https://picsum.photos/seed/blurhash/900/500' }}
          style={styles.large}
          placeholder={{ blurhash: BLURHASH }}
          transition={600}
          contentFit="cover"
        />

        <Pressable
          style={styles.button}
          onPress={() => setReloadKey((k) => k + 1)}
        >
          <Text style={styles.buttonText}>重新加载大图</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#e5e7eb' },
  cellLabel: { fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 8 },
  large: {
    width: '100%', height: 220, borderRadius: 16, backgroundColor: '#e5e7eb',
  },
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
