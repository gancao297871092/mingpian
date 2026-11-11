import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';

import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CardVerifiedIcon } from '@/components/cards/cardIcons';
import type { CompanyCardData } from '@/components/cards/CompanyCard';

interface CompanyPosterProps {
  data: CompanyCardData;
  width?: number;
}

/** 企业名片分享海报：整图 + 渐变 + 角标 + 二维码（figma 分享 1072:4204） */
export default function CompanyPoster({ data, width }: CompanyPosterProps) {
  return (
    <View style={[styles.container, width ? { width } : null]}>
      {data.poster ? (
        <ExpoImage source={{ uri: data.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.photoEmpty]} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.81]}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.info}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>企业名片</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {data.cpName || '企业名称'}
          </Text>
          <CardVerifiedIcon size={13} />
        </View>
      </View>
      <View style={styles.qrBox}>
        {!!data.sunCode && (
            <ExpoImage source={{ uri: data.sunCode }} style={{ width: scaleSizeW(62), height: scaleSizeW(62) }} contentFit="contain" />
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  photoEmpty: {
    backgroundColor: '#E5E5E5',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: scaleSizeW(118),
  },
  info: {
    position: 'absolute',
    left: scaleSizeW(14),
    right: scaleSizeW(100),
    bottom: scaleSizeW(14),
    gap: scaleSizeW(8),
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2962D4',
    borderRadius: scaleSizeW(90),
    paddingHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeW(3),
  },
  pillText: {
    fontSize: setSpText(10),
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  name: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  qrBox: {
    position: 'absolute',
    right: scaleSizeW(15),
    bottom: scaleSizeW(20),
    width: scaleSizeW(74),
    height: scaleSizeW(74),
    borderRadius: scaleSizeW(6),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
