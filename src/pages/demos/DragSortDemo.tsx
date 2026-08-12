import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { DragSortList } from '@/components/capabilities';

export default function DragSortDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>拖拽排序</Text>
        <Text style={styles.desc}>基于 react-native-draggable-flatlist，长按拖拽</Text>
        <View style={styles.card}>
          <DragSortList />
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
