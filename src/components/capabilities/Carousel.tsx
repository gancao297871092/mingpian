import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Carousel as ReanimatedCarousel, type CarouselRenderItemInfo } from 'react-native-reanimated-carousel';
import { SCREEN_WIDTH } from '@/utils/screenUtils';

interface CarouselItem {
  id: string;
  title: string;
  color: string;
}

interface CarouselProps {
  data?: CarouselItem[];
  autoPlay?: boolean;
  loop?: boolean;
  height?: number;
}

const defaultData: CarouselItem[] = [
  { id: '1', title: '轮播图 1', color: '#FF6B6B' },
  { id: '2', title: '轮播图 2', color: '#4ECDC4' },
  { id: '3', title: '轮播图 3', color: '#45B7D1' },
  { id: '4', title: '轮播图 4', color: '#96CEB4' },
];

export default function Carousel({
  data = defaultData,
  autoPlay = true,
  loop = true,
  height = 180,
}: CarouselProps) {
  const PAGE_WIDTH = Math.round(SCREEN_WIDTH - 32);

  const renderItem = ({ item }: CarouselRenderItemInfo<CarouselItem>) => (
    <View style={[styles.slide, { backgroundColor: item.color }]}>
      <Text style={styles.slideText}>{item.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { height }]}>
      <ReanimatedCarousel
        data={data}
        renderItem={renderItem}
        loop={loop}
        autoplay={autoPlay}
        autoplayInterval={3000}
        style={{ width: PAGE_WIDTH }}
        renderWindowSize={PAGE_WIDTH}
        itemSize={PAGE_WIDTH}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%', alignItems: 'center', alignSelf: 'center',
  },
  slide: {
    flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12,
  },
  slideText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
