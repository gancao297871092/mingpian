import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CardPoster2Props {
  data: any;
}

/** TRADITIONAL 样式分享海报 - 320x246 */
export default function CardPoster2({ data }: CardPoster2Props) {
  const backColor = data.backColor || '#000000';
  const fontColor = data.fontColor || '#ffffff';

  return (
    <View style={styles.container}>
      {/* 背景 */}
      <Image source={require('@/assets/ming/card_bg2.png')} style={styles.bg} resizeMode="cover" />

      <View style={styles.content}>
        {/* 左侧海报图 */}
        <View style={styles.left}>
          {data.cardPoster ? (
            <Image source={{ uri: data.cardPoster }} style={styles.poster} resizeMode="cover" />
          ) : null}
        </View>

        {/* 右侧信息块 */}
        <View style={[styles.right, { backgroundColor: backColor }]}>
          <View>
            <Text style={[styles.name, { color: fontColor }]}>{data.nameZh || ''}</Text>
            {data.nameEn?.trimStart() ? (
              <Text style={[styles.enName, { color: fontColor }]}>{data.nameEn}</Text>
            ) : null}
          </View>

          <View>
            {data.position ? (
              <Text style={[styles.position, { color: fontColor }]}>{data.position}</Text>
            ) : null}
            {data.cpName ? (
              <Text style={[styles.cpName, { color: fontColor }]}>@{data.cpName}</Text>
            ) : null}
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.tip}>您好，这是我的名片，请扫码查看详情~</Text>
          </View>
        </View>
      </View>

      {/* 二维码 */}
      {data.sunCode ? (
        <Image source={{ uri: data.sunCode }} style={styles.sunCode} />
      ) : null}

      {/* 企业 Logo */}
      {data.cpLogo ? (
        <Image source={{ uri: data.cpLogo }} style={styles.logo} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 246,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  bg: {
    width: 320,
    height: 246,
    position: 'absolute',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    top: 0,
    width: 320,
    height: 246,
  },
  left: {
    width: 186,
    height: 246,
    overflow: 'hidden',
  },
  poster: {
    width: 186,
    height: 246,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  right: {
    flex: 1,
    height: 186,
    paddingLeft: 13,
    paddingTop: 15,
    paddingRight: 10,
    paddingBottom: 23,
    justifyContent: 'space-between',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  enName: {
    marginTop: 6,
    fontSize: 9,
    opacity: 0.5,
  },
  position: {
    marginTop: 8,
    fontSize: 9,
    opacity: 0.5,
  },
  cpName: {
    marginTop: 6,
    fontSize: 9,
    opacity: 0.5,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 13,
    right: 10,
  },
  tip: {
    fontSize: 12,
    color: '#000000',
  },
  sunCode: {
    position: 'absolute',
    right: 10,
    top: 196,
    width: 40,
    height: 40,
  },
  logo: {
    position: 'absolute',
    right: 10,
    top: 143,
    width: 37,
    height: 37,
    borderRadius: 4,
  },
});
