import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

interface Props {
  visible: boolean;
  nickname: string;
  likeCount: number;
  bbsCount: number;
  favoriteCount: number;
  onClose: () => void;
}

/** 87.获赞与收藏弹窗（我的页点「获赞」弹出） */
export default function LikesDialog({ visible, nickname, likeCount, bbsCount, favoriteCount, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mask}>
        <View style={styles.dialog}>
          <Image source={require('@/assets/my/workbench/ip9.png')} style={styles.mascot} resizeMode="contain" />
          <View style={styles.panel}>
            <Text style={styles.title}>“{nickname}”共获得 {likeCount} 个赞</Text>
            <Text style={styles.subtitle}>
              共计发布动态 {bbsCount} 条，已被收藏 {favoriteCount.toLocaleString()} 次
            </Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>我知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: scaleSizeW(300),
    borderRadius: scaleSizeW(20),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mascot: {
    width: scaleSizeW(150),
    height: scaleSizeW(150),
    marginTop: scaleSizeH(26),
  },
  panel: {
    alignSelf: 'stretch',
    marginTop: -scaleSizeH(35),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(20),
    paddingTop: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(14),
    paddingBottom: scaleSizeH(14),
  },
  title: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#6C6C6C',
    textAlign: 'center',
    marginTop: scaleSizeH(10),
  },
  button: {
    marginTop: scaleSizeH(20),
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(100),
    backgroundColor: '#2962D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: setSpText(16),
    fontWeight: '500',
    lineHeight: setSpText(22),
    color: '#FFFFFF',
  },
});
