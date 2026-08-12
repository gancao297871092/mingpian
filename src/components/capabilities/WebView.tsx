import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

interface AppWebViewProps extends WebViewProps {
  url?: string;
  html?: string;
}

export default function AppWebView({ url, html, style, ...rest }: AppWebViewProps) {
  const source = html ? { html } : url ? { uri: url } : undefined;
  return (
    <View style={[styles.container, style]}>
      {source && (
        <WebView source={source} style={styles.webview} {...rest} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1 },
});
