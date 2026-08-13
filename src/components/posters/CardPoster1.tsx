import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CardPoster1Props {
  data: any;
}

/** NORMAL 样式分享海报 - 320x246 */
export default function CardPoster1({ data }: CardPoster1Props) {
  const hasAddr = data.province || data.city || data.district || data.address;
  const addrText = hasAddr
    ? `${data.province || ''}${data.city || ''}${data.district || ''}${data.address || ''}`
    : '';

  return (
    <View style={styles.container}>
      {/* 背景 */}
      <Image source={require('@/assets/ming/card_bg1.png')} style={styles.bg} resizeMode="cover" />

      {/* 内容层 */}
      <View style={styles.content}>
        {/* 姓名 */}
        <Text style={styles.name} numberOfLines={1}>
          {data.nameZh || ''}
        </Text>

        {/* 职位 */}
        {data.position ? <Text style={styles.position}>{data.position}</Text> : null}

        {/* 企业名称 */}
        {data.cpName ? (
          <Text style={styles.company} numberOfLines={2}>
            {data.cpName}
          </Text>
        ) : null}

        {/* 地址 */}
        {addrText ? (
          <View style={styles.infoRow}>
            <Image source={require('@/assets/ming/46.png')} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={2}>
              {addrText}
            </Text>
          </View>
        ) : null}

        {/* 邮箱 */}
        {data.email ? (
          <View style={styles.infoRow}>
            <Image source={require('@/assets/ming/45.png')} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              {data.email}
            </Text>
          </View>
        ) : null}

        {/* 底部提示 */}
        <Text style={styles.tip}>您好，这是我的名片，请扫码查看详情~</Text>

        {/* 企业 Logo */}
        {data.cpLogo ? (
          <Image source={{ uri: data.cpLogo }} style={styles.logo} />
        ) : null}

        {/* 太阳码 */}
        {data.sunCode ? (
          <Image source={{ uri: data.sunCode }} style={styles.sunCode} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 246,
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    width: 320,
    height: 246,
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 320,
    height: 246,
    paddingHorizontal: 21,
    paddingTop: 36,
    paddingBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 32,
    maxWidth: 160,
  },
  position: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  company: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 12,
    maxWidth: 200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  infoText: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
  },
  tip: {
    position: 'absolute',
    left: 21,
    bottom: 16,
    fontSize: 11,
    color: '#ffffff',
  },
  logo: {
    position: 'absolute',
    right: 20,
    top: 126,
    width: 45,
    height: 45,
    borderRadius: 4,
  },
  sunCode: {
    position: 'absolute',
    right: 20,
    top: 196,
    width: 40,
    height: 40,
  },
});
