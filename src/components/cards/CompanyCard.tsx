import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { numTokw } from '@/utils/format';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CardVerifiedIcon, EyeWhiteIcon } from './cardIcons';

export interface CompanyCardData {
  cpId?: number | string;
  cpName?: string;
  /** 企业封面/海报图 */
  poster?: string;
  countBrowse?: number;
  isAuth?: number;
  [key: string]: any;
}

interface CompanyCardProps {
  data: CompanyCardData;
  /** 是否显示浏览量（海报态不显示） */
  showViews?: boolean;
}

/** 企业名片：整图 + 底部渐变 + 企业名片角标（figma 企业名片 1062:4007） */
export default function CompanyCard({ data, showViews = true }: CompanyCardProps) {
  return (
    <View style={styles.container}>
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
          <View style={styles.nameBox}>
            <Text style={styles.name} numberOfLines={2}>
              {data.cpName || '企业名称'}
            </Text>
            {/* 企业名右侧认证 icon（figma 企业名片，1062:4035） */}
            <CardVerifiedIcon size={13} />
          </View>
          {showViews && (
            <View style={styles.viewsRow}>
              <EyeWhiteIcon />
              <Text style={styles.viewsText}>{numTokw(data.countBrowse ?? 0)}</Text>
            </View>
          )}
        </View>
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
    right: scaleSizeW(14),
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
    justifyContent: 'space-between',
    gap: scaleSizeW(8),
  },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    flexShrink: 1,
    maxWidth: scaleSizeW(250),
  },
  name: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  viewsText: {
    fontSize: setSpText(12),
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: scaleSizeW(21),
  },
});
