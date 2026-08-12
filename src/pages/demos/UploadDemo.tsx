import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Uploader } from '@/components/capabilities';

export default function UploadDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>上传组件</Text>
        <Text style={styles.desc}>
          支持选择图片/拍照，配合阿里云 OSS 直传（需对接实际上传接口）
        </Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>图片上传</Text>
          <Uploader />
        </View>
        <Text style={styles.tip}>
          说明：上传默认指向 httpbin.org 测试接口，{'\n'}
          实际项目中请替换为您的 OSS/CDN 上传地址
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
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  tip: { marginTop: 20, fontSize: 12, color: '#bbb', textAlign: 'center', lineHeight: 18 },
});
