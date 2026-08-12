import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Image } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

function UserRow({ name, title }: { name: string; title: string }) {
  return (
    <View style={styles.userRow}>
      <Image
        source={{ uri: `https://picsum.photos/seed/${name}/100/100` }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userTitle}>{title}</Text>
      </View>
    </View>
  );
}

const USERS = [
  { name: 'Alice', title: '产品设计师' },
  { name: 'Bob', title: '前端工程师' },
  { name: 'Carol', title: '后端工程师' },
  { name: 'Dave', title: '测试工程师' },
];

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>骨架屏</Text>
        <Text style={styles.desc}>react-native-skeleton-placeholder · 加载占位动画</Text>

        <Pressable
          style={styles.button}
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2500);
          }}
        >
          <Text style={styles.buttonText}>重新加载 (2.5s)</Text>
        </Pressable>

        <View style={styles.card}>
          {loading ? (
            <SkeletonPlaceholder>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonLines}>
                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonLineNarrow} />
                </View>
              </View>
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonLines}>
                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonLineNarrow} />
                </View>
              </View>
            </SkeletonPlaceholder>
          ) : (
            <View>
              {USERS.map((user) => (
                <UserRow key={user.name} {...user} />
              ))}
            </View>
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
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 24 },
  skeletonLines: { marginLeft: 12, gap: 8 },
  skeletonLineWide: { width: 180, height: 16, borderRadius: 8 },
  skeletonLineNarrow: { width: 120, height: 14, borderRadius: 7 },
  skeletonCard: { height: 120, borderRadius: 12, marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  userInfo: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#222' },
  userTitle: { fontSize: 13, color: '#888', marginTop: 2 },
});
