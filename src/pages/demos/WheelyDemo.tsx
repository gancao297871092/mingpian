import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Wheely from 'react-native-wheely';

const OPTIONS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];

const COLORS = ['#4facfe', '#f093fb', '#f5576c', '#11998e', '#f6d365', '#7c3aed', '#0891b2', '#16a34a', '#f59e0b', '#dc2626'];

export default function WheelyDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>滚轮选择器</Text>
        <Text style={styles.desc}>react-native-wheely · 惯性滚动 + 回弹居中</Text>

        <View style={styles.wheelBox}>
          <Wheely
            selectedIndex={selectedIndex}
            options={OPTIONS}
            onChange={setSelectedIndex}
            itemHeight={52}
            visibleRest={3}
            itemTextStyle={styles.itemText}
            selectedIndicatorStyle={styles.indicator}
          />
        </View>

        <View style={styles.result}>
          <Text style={styles.resultLabel}>当前选择</Text>
          <View style={[styles.resultBadge, { backgroundColor: COLORS[selectedIndex] }]}>
            <Text style={styles.resultValue}>{OPTIONS[selectedIndex]}</Text>
          </View>
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
  wheelBox: {
    height: 280, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  itemText: { fontSize: 20, fontWeight: '600', color: '#222' },
  indicator: { backgroundColor: 'rgba(37, 99, 235, 0.25)' },
  result: {
    marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  resultLabel: { fontSize: 15, color: '#666' },
  resultBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  resultValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
