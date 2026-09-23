import React from 'react';
import { StyleSheet, View } from 'react-native';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';

const CARD_WIDTH = scaleSizeW(194);
const COLUMN_GAP = scaleSizeW(4);
const CARD_MARGIN_BOTTOM = scaleSizeH(5);

function SkeletonCard({ imageHeight }: { imageHeight: number }) {
  return (
    <View style={styles.card}>
      <View style={[styles.imageSkeleton, { height: scaleSizeH(imageHeight) }]} />
      <View style={styles.contentSkeleton}>
        <View style={styles.titleSkeleton} />
        <View style={styles.titleSkeletonShort} />
        <View style={styles.metaSkeleton}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.textSkeleton}>
            <View style={styles.nameSkeleton} />
            <View style={styles.companySkeleton} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function WaterfallSkeleton() {
  const leftCards = [
    { imageHeight: 237 },
    { imageHeight: 237 },
    { imageHeight: 237 },
  ];
  const rightCards = [
    { imageHeight: 237 },
    { imageHeight: 237 },
    { imageHeight: 237 },
  ];

  return (
    <View style={styles.waterfall}>
      <View style={styles.column}>
        {leftCards.map((card, idx) => (
          <SkeletonCard key={`left-${idx}`} imageHeight={card.imageHeight} />
        ))}
      </View>
      <View style={styles.column}>
        {rightCards.map((card, idx) => (
          <SkeletonCard key={`right-${idx}`} imageHeight={card.imageHeight} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waterfall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: COLUMN_GAP,
  },
  column: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    marginBottom: CARD_MARGIN_BOTTOM,
  },
  imageSkeleton: {
    width: CARD_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  contentSkeleton: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(10),
  },
  titleSkeleton: {
    height: scaleSizeH(16),
    backgroundColor: '#f0f0f0',
    borderRadius: scaleSizeH(2),
    marginBottom: scaleSizeH(4),
  },
  titleSkeletonShort: {
    height: scaleSizeH(16),
    backgroundColor: '#f0f0f0',
    borderRadius: scaleSizeH(2),
    width: '70%',
    marginBottom: scaleSizeH(8),
  },
  metaSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: scaleSizeW(27),
    height: scaleSizeW(27),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#f0f0f0',
  },
  textSkeleton: {
    flex: 1,
    marginLeft: scaleSizeW(5),
  },
  nameSkeleton: {
    height: scaleSizeH(12),
    backgroundColor: '#f0f0f0',
    borderRadius: scaleSizeH(2),
    width: '60%',
    marginBottom: scaleSizeH(4),
  },
  companySkeleton: {
    height: scaleSizeH(10),
    backgroundColor: '#f0f0f0',
    borderRadius: scaleSizeH(2),
    width: '80%',
  },
});
