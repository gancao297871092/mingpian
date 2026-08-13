import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CpPosterProps {
  data: any;
}

/** 企业名片分享海报 - 320x390 */
export default function CpPoster({ data }: CpPosterProps) {
  return (
    <View style={styles.container}>
      {/* 背景 */}
      <Image source={require('@/assets/ming/poster2.png')} style={styles.bg} resizeMode="cover" />

      <View style={styles.content}>
        {/* 上部大图 */}
        {data.cardPoster ? (
          <Image source={{ uri: data.cardPoster }} style={styles.poster} resizeMode="cover" />
        ) : null}

        {/* 底部黑色信息栏 */}
        <View style={styles.footer}>
          <Text style={styles.title} numberOfLines={2}>
            {data.posterTitle || data.cpName || ''}
          </Text>
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
    height: 390,
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    width: 320,
    height: 390,
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 320,
    height: 390,
  },
  poster: {
    width: 320,
    height: 320,
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 320,
    height: 70,
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    maxWidth: 220,
  },
  sunCode: {
    position: 'absolute',
    right: 10,
    top: 331,
    width: 50,
    height: 50,
  },
});
