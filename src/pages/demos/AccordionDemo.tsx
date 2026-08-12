import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Accordion } from '@/components/capabilities';

export default function AccordionDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>手风琴 (Accordion)</Text>
        <Text style={styles.desc}>点击标题展开/收起内容，支持 LayoutAnimation 动画</Text>
        <Accordion />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
});
