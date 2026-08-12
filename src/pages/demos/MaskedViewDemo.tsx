import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export default function MaskedViewDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>遮罩视图</Text>
        <Text style={styles.desc}>@react-native-masked-view/masked-view · 渐隐图片 / 渐变文字</Text>

        <Text style={styles.sectionTitle}>渐变文字 (手动遮罩)</Text>
        <MaskedView
          maskElement={
            <Text style={styles.maskText}>渐变标题</Text>
          }
        >
          <LinearGradient colors={['#f5576c', '#f093fb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.hiddenText}>渐变标题</Text>
          </LinearGradient>
        </MaskedView>

        <Text style={styles.sectionTitle}>图片渐隐遮罩</Text>
        <View style={styles.imageBox}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/mask/600/400' }}
            style={styles.image}
          />
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['transparent', '#fff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <Image
              source={{ uri: 'https://picsum.photos/seed/mask/600/400' }}
              style={styles.image}
            />
          </MaskedView>
        </View>

        <Text style={styles.sectionTitle}>文字遮罩形状</Text>
        <MaskedView
          maskElement={
            <View style={styles.ringMask} />
          }
        >
          <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.ringFill} />
        </MaskedView>
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
  bigText: { fontSize: 44, fontWeight: '900', textAlign: 'center' },
  maskText: { fontSize: 44, fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent' },
  hiddenText: { fontSize: 44, fontWeight: '900', textAlign: 'center', opacity: 0 },
  imageBox: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: { width: '100%', height: '100%' },
  ringMask: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 24, borderColor: '#000',
    backgroundColor: 'transparent',
  },
  ringFill: { width: 120, height: 120 },
});
