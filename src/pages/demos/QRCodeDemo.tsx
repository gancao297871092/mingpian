import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, SafeAreaView, TouchableOpacity, ScrollView,
} from 'react-native';
import { QRCodeView } from '@/components/capabilities';

export default function QRCodeDemo() {
  const [text, setText] = useState('https://github.com');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>输入要生成二维码的内容</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="输入文本或链接"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.qrWrap}>
          {text ? (
            <QRCodeView value={text} size={220} />
          ) : (
            <Text style={styles.hint}>输入内容后显示二维码</Text>
          )}
        </View>
        <Text style={styles.scanHint}>
          使用微信/支付宝扫一扫即可扫描上方二维码
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600', color: '#333', alignSelf: 'flex-start', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 14,
    color: '#333', borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20,
    alignSelf: 'stretch',
  },
  qrWrap: {
    width: 260, height: 260, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  hint: { color: '#999', fontSize: 14 },
  scanHint: { marginTop: 20, fontSize: 13, color: '#999', textAlign: 'center' },
});
