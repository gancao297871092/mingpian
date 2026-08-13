import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { numTokw } from '@/utils/format';
import { scaleSizeW } from '@/utils/screenUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CpCardProps {
  cardInfo: any;
  onShare?: () => void;
}

export default function CpCard({ cardInfo, onShare }: CpCardProps) {
  if (!cardInfo) return null;

  // 小程序 swiper 高度：calc(100vw - 58rpx)
  const cardHeight = SCREEN_WIDTH - scaleSizeW(31);

  return (
    <View style={[styles.container, { height: cardHeight }]}>
      <Image source={{ uri: cardInfo.cardPoster }} style={styles.poster} resizeMode="cover" />

      {onShare && (
        <TouchableOpacity style={styles.shareBtn}
          onPress={onShare}
        >
          <Image source={require('@/assets/ming/share_new.png')} style={styles.shareIcon} />
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <View style={styles.footerBlur} />
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.label}>企业名片</Text>
            <Text style={styles.name}>{cardInfo.posterTitle || cardInfo.cpName}</Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Image source={require('@/assets/ming/17.png')} style={styles.statIcon} />
              <Text style={styles.statText}>{numTokw(cardInfo.countBrowse)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  shareBtn: {
    position: 'absolute',
    right: scaleSizeW(19),
    top: scaleSizeW(19),
    width: scaleSizeW(32),
    height: scaleSizeW(32),
    borderRadius: scaleSizeW(16),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSizeW(3) },
    shadowOpacity: 0.25,
    shadowRadius: scaleSizeW(6),
    elevation: 4,
  },
  shareIcon: {
    width: scaleSizeW(32),
    height: scaleSizeW(32),
  },
  footer: {
    position: 'absolute',
    bottom: scaleSizeW(21),
    left: scaleSizeW(16),
    right: scaleSizeW(16),
    height: scaleSizeW(74),
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    justifyContent: 'center',
  },
  footerBlur: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    opacity: 0.38,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(15),
    height: '100%',
  },
  label: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#ffffff',
  },
  name: {
    fontSize: scaleSizeW(18),
    fontWeight: '600',
    color: '#ffffff',
    marginTop: scaleSizeW(7),
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: scaleSizeW(21),
    height: scaleSizeW(21),
  },
  statText: {
    fontSize: scaleSizeW(13),
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: scaleSizeW(2),
  },
});
