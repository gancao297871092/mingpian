import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { SparklesIcon } from '@/pages/card/cardDetail/icons';

/** 瀑布流穿插的「去广场发现更多」渐变卡（figma 预览3 / 企业主页； PlazaList、企业主页共用） */
export default function GoSquareCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.squareCard} onPress={onPress}>
      <LinearGradient
        colors={['#2962D4', '#224FA8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.squareCardBody}>
        <SparklesIcon />
        <Text style={styles.squareTitle}>去广场发现更多</Text>
        <Text style={styles.squareSub}>查看更多同行动态与合作机会</Text>
        <View style={styles.squareBtn}>
          <Text style={styles.squareBtnText}>去广场逛逛</Text>
          <ChevronRightIcon color="#000000" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  squareCard: {
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    marginHorizontal: scaleSizeW(2),
    marginBottom: scaleSizeW(5),
  },
  squareCardBody: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeW(14),
    paddingBottom: scaleSizeW(14),
    gap: scaleSizeW(10),
  },
  squareTitle: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: scaleSizeW(24),
    letterSpacing: -0.4,
  },
  squareSub: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: scaleSizeW(24),
    letterSpacing: -0.4,
  },
  squareBtn: {
    marginTop: scaleSizeW(32),
    height: scaleSizeW(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  squareBtnText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
});
