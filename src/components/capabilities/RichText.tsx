import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RichTextViewerProps {
  html: string;
  baseStyle?: Record<string, any>;
}

const defaultBaseStyle = {
  fontSize: 15,
  lineHeight: 24,
  color: '#333',
};

export default function RichTextViewer({ html, baseStyle }: RichTextViewerProps) {
  const insets = useSafeAreaInsets();
  const mergedStyle = { ...defaultBaseStyle, ...baseStyle };

  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-size: ${mergedStyle.fontSize}px;
          line-height: ${mergedStyle.lineHeight}px;
          color: ${mergedStyle.color};
          padding: ${insets.left + 16}px ${insets.right + 16}px 40px;
          font-family: -apple-system, system-ui, sans-serif;
        }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        a { color: #1EA3B5; }
        pre { background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; }
        code { font-size: 13px; }
        h1, h2, h3, h4 { margin: 16px 0 8px; }
        p { margin: 8px 0; }
        ul, ol { padding-left: 20px; margin: 8px 0; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  return <WebViewContent html={styledHtml} />;
}

function WebViewContent({ html }: { html: string }) {
  const { WebView } = require('react-native-webview');
  return (
    <WebView
      source={{ html }}
      originWhitelist={['*']}
      style={styles.webview}
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#fff' },
});
