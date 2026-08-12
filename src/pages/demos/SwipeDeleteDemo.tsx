import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SwipeableRow } from '@/components/capabilities';

export default function SwipeDeleteDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>滑块删除</Text>
        <Text style={styles.desc}>基于 react-native-swipe-list-view，向左滑动显示删除按钮</Text>
        <View style={styles.card}>
          <SwipeableRow />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
    overflow: 'hidden',
  },
});
