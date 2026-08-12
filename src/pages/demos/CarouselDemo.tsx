import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Carousel } from '@/components/capabilities';
import { SCREEN_WIDTH } from '@/utils/screenUtils';

export default function CarouselDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>轮播图</Text>
        <Text style={styles.desc}>基于 react-native-reanimated-carousel，支持自动播放</Text>

        <Text style={styles.sectionTitle}>自动轮播</Text>
        <Carousel height={180} />

        <Text style={styles.sectionTitle}>自定义内容</Text>
        <Carousel
          height={120}
          data={[
            { id: '1', title: '活动推荐', color: '#FF6B6B' },
            { id: '2', title: '热门资讯', color: '#4ECDC4' },
            { id: '3', title: '限时优惠', color: '#45B7D1' },
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 20 },
  sectionTitle: {
    fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 8,
  },
});
