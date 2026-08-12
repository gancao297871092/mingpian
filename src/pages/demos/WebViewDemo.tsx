import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { AppWebView } from '@/components/capabilities';

export default function WebViewDemo() {
  const [url, setUrl] = useState('https://www.baidu.com');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WebView 浏览器</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={() => {}}
          placeholder="输入 URL"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <AppWebView url={url} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    backgroundColor: '#fafafa',
  },
});
