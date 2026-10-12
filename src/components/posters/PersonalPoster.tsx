import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import PersonalCard from '@/components/cards/PersonalCard';
import type { CardData, CardStyle } from '@/components/cards/types';

interface PersonalPosterProps {
  data: CardData;
  style?: CardStyle;
  fontColor?: string;
  backColor?: string;
  qrValue: string;
  /** 海报整体宽度，默认按设计稿 370 缩放 */
  width?: number;
}

/** 个人名片分享海报：名片 + 黑色扫码条（figma 分享个人名片 1072:4545） */
export default function PersonalPoster({ data, style, fontColor, backColor, qrValue, width }: PersonalPosterProps) {
  return (
    <View style={[styles.container, width ? { width } : null]}>
      <PersonalCard data={data} style={style} fontColor={fontColor} backColor={backColor} squareBottom />
      <View style={styles.footer}>
        <Text style={styles.footerText}>您好，这是我的名片，请扫码查看详情~</Text>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={scaleSizeW(37)} color="#000000" backgroundColor="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  footer: {
    height: scaleSizeW(60),
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    justifyContent: 'space-between',
    gap: scaleSizeW(10),
  },
  footerText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  qrBox: {
    width: scaleSizeW(43),
    height: scaleSizeW(43),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
