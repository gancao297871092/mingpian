import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CardPoster3Props {
  data: any;
}

/** FASHION 样式分享海报 - 320x320 */
export default function CardPoster3({ data }: CardPoster3Props) {
  return (
    <View style={styles.container}>
      {/* 全图背景 */}
      {data.cardPoster ? (
        <Image source={{ uri: data.cardPoster }} style={styles.bg} resizeMode="cover" />
      ) : (
        <Image source={require('@/assets/ming/card_bg3.png')} style={styles.bg} resizeMode="cover" />
      )}

      {/* 底部遮罩 */}
      <Image source={require('@/assets/ming/card_b.png')} style={styles.footerBg} resizeMode="stretch" />

      {/* 底部内容 */}
      <View style={styles.footerContent}>
        <View>
          <Text style={styles.subTitle}>
            {data.cpName || ''}
            {data.position ? `·${data.position}` : ''}
          </Text>
          <Text style={styles.name}>{data.nameZh || ''}</Text>
        </View>
      </View>

      {/* 太阳码 */}
      {data.sunCode ? (
        <Image source={{ uri: data.sunCode }} style={styles.sunCode} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
  },
  bg: {
    width: 320,
    height: 320,
    position: 'absolute',
  },
  footerBg: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 320,
    height: 135,
  },
  footerContent: {
    position: 'absolute',
    left: 14,
    bottom: 20,
    right: 70,
  },
  subTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sunCode: {
    position: 'absolute',
    right: 10,
    top: 260,
    width: 50,
    height: 50,
  },
});
