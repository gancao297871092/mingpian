import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  Image as ImageCompressor,
  Video as VideoCompressor,
  createVideoThumbnail,
  getImageMetaData,
  getVideoMetaData,
} from 'react-native-compressor';

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(2)} ${units[unit]}`;
}

export default function CompressorDemo() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [videoOriginalSize, setVideoOriginalSize] = useState<number>(0);
  const [videoCompressedSize, setVideoCompressedSize] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const pickAndCompressImage = async () => {
    try {
      setBusy('正在选择图片…');
      const picked = await ImagePicker.openPicker({ mediaType: 'photo', includeBase64: false });
      setBusy('正在压缩图片…');
      setOriginalImage(picked.sourceURL ?? picked.path);
      const originalMeta = await getImageMetaData(picked.sourceURL ?? picked.path);
      setOriginalSize(originalMeta.size);
      const result = await ImageCompressor.compress(picked.sourceURL ?? picked.path, {
        compressionMethod: 'auto',
        quality: 70,
      });
      setCompressedImage(result);
      const compressedMeta = await getImageMetaData(result);
      setCompressedSize(compressedMeta.size);
    } catch (error: any) {
      if (error?.message !== 'User cancelled image selection') {
        Alert.alert('压缩失败', String(error?.message ?? error));
      }
    } finally {
      setBusy(null);
    }
  };

  const pickAndCompressVideo = async () => {
    try {
      setBusy('正在选择视频…');
      const picked = await ImagePicker.openPicker({ mediaType: 'video' });
      setBusy('正在压缩视频…');
      setVideoResult(null);
      setVideoThumbnail(null);
      setProgress(0);
      const originalMeta = await getVideoMetaData(picked.path);
      setVideoOriginalSize(originalMeta.size);
      const result = await VideoCompressor.compress(
        picked.path,
        { compressionMethod: 'auto' },
        (p) => setProgress(p),
      );
      setVideoResult(result);
      const compressedMeta = await getVideoMetaData(result);
      setVideoCompressedSize(compressedMeta.size);
      const thumb = await createVideoThumbnail(result);
      setVideoThumbnail(thumb.path);
    } catch (error: any) {
      if (error?.message !== 'User cancelled image selection') {
        Alert.alert('压缩失败', String(error?.message ?? error));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>文件压缩</Text>
        <Text style={styles.desc}>react-native-compressor · 图片 / 视频压缩与缩略图</Text>

        <Text style={styles.sectionTitle}>图片压缩</Text>
        <Pressable style={styles.button} onPress={pickAndCompressImage}>
          <Text style={styles.buttonText}>选择图片并压缩</Text>
        </Pressable>
        {(originalImage || compressedImage) && (
          <View style={styles.card}>
            <View style={styles.imageRow}>
              <View style={styles.imageCol}>
                <Text style={styles.imageLabel}>原图</Text>
                {originalImage ? (
                  <Image source={{ uri: originalImage }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <Text style={styles.sizeText}>{formatBytes(originalSize)}</Text>
              </View>
              <View style={styles.imageCol}>
                <Text style={styles.imageLabel}>压缩后</Text>
                {compressedImage ? (
                  <Image source={{ uri: compressedImage }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <Text style={styles.sizeText}>{formatBytes(compressedSize)}</Text>
              </View>
            </View>
            {originalSize > 0 && (
              <Text style={styles.ratioText}>
                节省 {Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))}%
              </Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>视频压缩</Text>
        <Pressable style={styles.button} onPress={pickAndCompressVideo}>
          <Text style={styles.buttonText}>选择视频并压缩</Text>
        </Pressable>
        {busy === '正在压缩视频…' && (
          <View style={styles.progressBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.progressText}>压缩中 {Math.round(progress)}%</Text>
          </View>
        )}
        {videoResult && (
          <View style={styles.card}>
            <Text style={styles.metaText}>
              原始 {formatBytes(videoOriginalSize)} → 压缩后 {formatBytes(videoCompressedSize)}
            </Text>
            {videoThumbnail && <Image source={{ uri: videoThumbnail }} style={styles.thumb} />}
            <Text style={styles.metaText}>输出: {videoResult}</Text>
          </View>
        )}

        {busy && busy !== '正在压缩视频…' && (
          <View style={styles.progressBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.progressText}>{busy}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 8 },
  button: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  imageRow: { flexDirection: 'row', gap: 12 },
  imageCol: { flex: 1 },
  imageLabel: { fontSize: 13, color: '#666', marginBottom: 6, textAlign: 'center' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 10 },
  imagePlaceholder: { backgroundColor: '#e5e7eb' },
  sizeText: { textAlign: 'center', marginTop: 6, fontSize: 13, color: '#333', fontWeight: '600' },
  ratioText: { marginTop: 12, fontSize: 14, color: '#16a34a', fontWeight: '700', textAlign: 'center' },
  progressBox: {
    marginTop: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  progressText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  metaText: { fontSize: 13, color: '#555', marginTop: 8 },
  thumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, marginTop: 12, backgroundColor: '#000' },
});
