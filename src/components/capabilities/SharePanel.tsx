import React, { useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, Alert, Clipboard,
} from 'react-native';
import Share from 'react-native-share';

interface SharePanelProps {
  url?: string;
  title?: string;
  message?: string;
  imageUrl?: string;
}

export default function SharePanel({
  url = 'https://example.com',
  title = '分享标题',
  message = '分享内容',
  imageUrl,
}: SharePanelProps) {
  const handleShare = useCallback(async () => {
    try {
      await Share.open({
        title,
        message,
        url: imageUrl || url,
        failOnCancel: false,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('分享失败', error?.message);
      }
    }
  }, [url, title, message, imageUrl]);

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(url);
    Alert.alert('已复制', '链接已复制到剪贴板');
  }, [url]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handleShare}>
        <Text style={styles.btnText}>分享到其他应用</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.copyBtn]} onPress={handleCopyLink}>
        <Text style={styles.btnText}>复制链接</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 16,
  },
  btn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#1EA3B5', borderRadius: 8,
  },
  copyBtn: { backgroundColor: '#666' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
