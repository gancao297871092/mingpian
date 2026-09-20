import React, { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { FlagIcon, LinkIcon, ShareImgIcon, WechatIcon } from './sheetIcons';

export type MoreAction = 'wechat' | 'link' | 'shareImage' | 'report';

export interface MoreActionSheetProps {
  onAction?: (action: MoreAction) => void;
  onClose?: () => void;
}

const ITEMS: { key: MoreAction; label: string; green?: boolean; icon: React.ReactNode }[] = [
  { key: 'wechat', label: '微信好友', green: true, icon: <WechatIcon /> },
  { key: 'link', label: '复制链接', icon: <LinkIcon /> },
  { key: 'shareImage', label: '生成分享图', icon: <ShareImgIcon /> },
  { key: 'report', label: '举报', icon: <FlagIcon /> },
];

const MoreActionSheet = forwardRef<BottomSheetModal, MoreActionSheetProps>(function Sheet(
  { onAction, onClose },
  ref,
) {
  return (
    <AppBottomSheet ref={ref} onClose={onClose}>
      <View style={styles.row}>
        {ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            style={styles.item}
            onPress={() => onAction?.(item.key)}
          >
            <View style={[styles.circle, item.green && styles.circleGreen]}>{item.icon}</View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </AppBottomSheet>
  );
});

export default MoreActionSheet;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(10),
    marginTop: scaleSizeH(4),
  },
  item: {
    alignItems: 'center',
  },
  circle: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(25),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGreen: {
    backgroundColor: '#3FCF77',
  },
  label: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginTop: scaleSizeH(10),
  },
});
