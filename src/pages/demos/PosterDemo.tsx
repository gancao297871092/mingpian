import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { PosterCapture } from '@/components/capabilities';
import { scaleSizeW } from '@/utils/screenUtils';

const { width } = Dimensions.get('window');

export default function PosterDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>海报示例</Text>
        <Text style={styles.desc}>点击下方按钮保存海报到相册</Text>
        <PosterCapture>
          <View style={styles.poster}>
            <Text style={styles.posterTitle}>示例海报</Text>
            <View style={styles.divider} />
            <Text style={styles.posterText}>
              这是一张由 React Native 组件生成的海报。{'\n'}
              你可以使用 ViewShot 组件将{'\n'}
              任意视图捕获为图片并保存。
            </Text>
            <View style={styles.footer}>
              <Text style={styles.footerText}>RnBaseTemplate</Text>
              <Text style={styles.footerDate}>2026</Text>
            </View>
          </View>
        </PosterCapture>

        <Text style={styles.tip}>
          实际项目中可展示邀请海报、{'\n'}分享卡片、活动封面等内容
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 20 },
  poster: {
    width: width - 64, backgroundColor: '#fff', borderRadius: 16,
    padding: 24, elevation: 3, shadowColor: '#000',
    shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  posterTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#1EA3B5', textAlign: 'center',
  },
  divider: { height: 2, backgroundColor: '#1EA3B5', marginVertical: 16, opacity: 0.3 },
  posterText: {
    fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center',
  },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 20,
    paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e0e0e0',
  },
  footerText: { fontSize: 12, color: '#999' },
  footerDate: { fontSize: 12, color: '#999' },
  tip: { marginTop: 24, fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20 },
});
