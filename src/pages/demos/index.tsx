import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/route/map';

const demos = [
  { key: 'CameraDemo', title: '📷 摄像头', icon: '📷' },
  { key: 'GalleryDemo', title: '🖼 相册', icon: '🖼' },
  { key: 'VideoDemo', title: '🎬 播放器', icon: '🎬' },
  { key: 'QRCodeDemo', title: '📱 二维码', icon: '📱' },
  { key: 'PosterDemo', title: '🖼️ 海报', icon: '🖼️' },
  { key: 'ShareDemo', title: '📤 分享', icon: '📤' },
  { key: 'CarouselDemo', title: '🎠 轮播图', icon: '🎠' },
  { key: 'DragSortDemo', title: '🔀 拖拽排序', icon: '🔀' },
  { key: 'UploadDemo', title: '☁️ 上传组件', icon: '☁️' },
  { key: 'LiquidGlassDemo', title: '💧 液态玻璃', icon: '💧' },

  { key: 'SwipeDeleteDemo', title: '↩️ 滑块删除', icon: '↩️' },
  { key: 'AccordionDemo', title: '📐 手风琴', icon: '📐' },
  { key: 'TabViewDemo', title: '📑 标签页', icon: '📑' },
  { key: 'WebViewDemo', title: '🌐 浏览器', icon: '🌐' },
  { key: 'RichTextDemo', title: '📝 富文本', icon: '📝' },
  { key: 'BottomSheetDemo', title: '⬆️ 底部弹层', icon: '⬆️' },
  { key: 'NetInfoDemo', title: '📶 网络状态', icon: '📶' },
  { key: 'CompressorDemo', title: '🗜 文件压缩', icon: '🗜' },
  { key: 'ExitAppDemo', title: '🚪 退出应用', icon: '🚪' },
  { key: 'HapticDemo', title: '📳 触感反馈', icon: '📳' },
  { key: 'LinearGradientDemo', title: '🌈 线性渐变', icon: '🌈' },
  { key: 'GradientTextDemo', title: '🔤 渐变文字', icon: '🔤' },
  { key: 'SkeletonDemo', title: '💀 骨架屏', icon: '💀' },
  { key: 'WheelyDemo', title: '🎡 滚轮选择', icon: '🎡' },
  { key: 'MaskedViewDemo', title: '🎭 遮罩视图', icon: '🎭' },
  { key: 'BgTimerDemo', title: '⏱ 后台定时器', icon: '⏱' },
  { key: 'SvgaDemo', title: '✨ SVGA 动画', icon: '✨' },
  { key: 'FastImageDemo', title: '🖼 图片缓存', icon: '🖼' },
  { key: 'ImagePreviewDemo', title: '🔍 图片预览', icon: '🔍' },
] as const;

export default function DemosPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>组件能力演示</Text>
      <Text style={[styles.subtitle, { color: theme.placeholder }]}>基于 coingetApp-2026 精选的基础库</Text>
      <View style={styles.grid}>
        {demos.map(({ key, title, icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate(key as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardIcon}>{icon}</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.cardArrow, { color: theme.placeholder }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },
  grid: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 12, elevation: 1, shadowColor: '#000',
    shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  cardIcon: { fontSize: 24, marginRight: 12, width: 32, textAlign: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  cardArrow: { fontSize: 20 },
});
