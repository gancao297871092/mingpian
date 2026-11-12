import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, 
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { SharePanel, saveToGallery } from '@/components/capabilities';

export default function ShareDemo() {
  const [shareUrl, setShareUrl] = useState('https://github.com/RnBaseTemplate');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>分享功能</Text>
        <Text style={styles.desc}>支持分享到其他应用及复制链接</Text>

        <Text style={styles.label}>分享链接</Text>
        <TextInput
          style={styles.input}
          value={shareUrl}
          onChangeText={setShareUrl}
          placeholder="输入分享链接"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <SharePanel url={shareUrl} title="分享标题" message="分享内容" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>保存图片到相册</Text>
          <Text style={styles.cardDesc}>测试相册写入权限</Text>
          <View style={styles.cardActions}>
            <View
              style={styles.mockImg}
              onTouchEnd={() =>
                saveToGallery('https://via.placeholder.com/300/1EA3B5/fff?text=Test')
                  .then(ok => ok ? AppAlert.alert('提示', '保存成功') : null)
              }
            >
              <Text style={styles.mockImgText}>点击保存</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 14,
    color: '#333', borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 20,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#999', marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 12 },
  mockImg: {
    width: 100, height: 100, backgroundColor: '#1EA3B5', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  mockImgText: { color: '#fff', fontSize: 13 },
});
