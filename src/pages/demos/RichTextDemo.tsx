import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { RichTextViewer } from '@/components/capabilities';

const sampleHtml = `
  <h1>富文本展示</h1>
  <p>这是一个使用 WebView 渲染的富文本示例，支持多种 HTML 标签。</p>

  <h2>文本样式</h2>
  <p><strong>粗体</strong>、<em>斜体</em>、<u>下划线</u>、<del>删除线</del></p>

  <h2>图片展示</h2>
  <img src="https://picsum.photos/400/200" alt="示例图片" />

  <h2>表格</h2>
  <table>
    <tr><th>项目</th><th>说明</th></tr>
    <tr><td>WebView</td><td>渲染 HTML 内容</td></tr>
    <tr><td>原生组件</td><td>高性能 Native 组件</td></tr>
  </table>

  <h2>代码块</h2>
  <pre><code>function hello() {
  console.log("Hello World!");
}</code></pre>

  <h2>列表</h2>
  <ul>
    <li>支持图片、表格</li>
    <li>支持列表、代码块</li>
    <li>响应式布局</li>
  </ul>

  <h2>链接</h2>
  <p>点击 <a href="https://reactnative.dev">React Native 官网</a> 了解更多。</p>
`;

export default function RichTextDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <RichTextViewer html={sampleHtml} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
