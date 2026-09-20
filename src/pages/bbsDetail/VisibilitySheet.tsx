import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

export type VisibilityKey = 'public' | 'mutual' | 'private';

const OPTIONS: { key: VisibilityKey; label: string }[] = [
  { key: 'public', label: '公开·所有人可见' },
  { key: 'mutual', label: '仅互关好友可见' },
  { key: 'private', label: '私密·仅自己可见' },
];

export interface VisibilitySheetProps {
  value?: VisibilityKey;
  onSelect?: (key: VisibilityKey) => void;
  onClose?: () => void;
}

const VisibilitySheet = forwardRef<BottomSheetModal, VisibilitySheetProps>(function Sheet(
  { value = 'public', onSelect, onClose },
  ref,
) {
  return (
    <AppBottomSheet ref={ref} onClose={onClose}>
      <Text style={styles.note}>以下可见权限设置只对本条动态生效</Text>
      <View style={styles.card}>
        {OPTIONS.map((opt, i) => {
          const checked = value === opt.key;
          return (
            <View key={opt.key}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.row}
                onPress={() => onSelect?.(opt.key)}
              >
                <Text style={styles.rowText}>{opt.label}</Text>
                {checked ? (
                  <Image source={require('@/assets/publish/check.png')} style={styles.check} />
                ) : (
                  <View style={styles.check} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </AppBottomSheet>
  );
});

export default VisibilitySheet;

const styles = StyleSheet.create({
  note: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(16),
    marginTop: scaleSizeH(4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginTop: scaleSizeH(14),
  },
  row: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  rowText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  check: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(16),
  },
});
