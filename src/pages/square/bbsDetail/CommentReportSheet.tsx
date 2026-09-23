import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetScrollView, type BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { TipIcon } from './sheetIcons';

const BLUE = '#2962D4';

const REASONS = [
  '色情低俗',
  '政治敏感',
  '煽动对立',
  '导流到站外',
  '诈骗信息',
  '不友善',
  '低质广告',
  '违法违规',
  '网络暴力',
  '涉未成年人',
  '内容不相关',
  '其他',
];

export interface CommentReportSheetProps {
  onSubmit?: (reason: string) => void;
  onClose?: () => void;
}

const CommentReportSheet = forwardRef<BottomSheetModal, CommentReportSheetProps>(function Sheet(
  { onSubmit, onClose },
  ref,
) {
  const [selected, setSelected] = useState(-1);
  const canSubmit = selected >= 0;

  return (
    <AppBottomSheet ref={ref} onClose={() => { setSelected(-1); onClose?.(); }}>
      <Text style={styles.title}>评论举报</Text>
      <View style={styles.tipBanner}>
        <TipIcon />
        <Text style={styles.tipText}>请选择最符合的举报原因，帮助我们准确处理</Text>
      </View>
      <BottomSheetScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {REASONS.map((reason, i) => (
          <View key={reason}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.reasonRow}
              onPress={() => setSelected(i)}
            >
              <Text style={styles.reasonText}>{reason}</Text>
              <View style={[styles.radio, selected === i && styles.radioActive]}>
                {selected === i && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </BottomSheetScrollView>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        onPress={() => {
          if (!canSubmit) return;
          onSubmit?.(REASONS[selected]);
        }}
      >
        <Text style={styles.submitText}>提交</Text>
      </TouchableOpacity>
    </AppBottomSheet>
  );
});

export default CommentReportSheet;

const styles = StyleSheet.create({
  title: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(4),
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    marginTop: scaleSizeH(14),
  },
  tipText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: BLUE,
    lineHeight: scaleSizeH(14),
    flex: 1,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginTop: scaleSizeH(14),
    maxHeight: scaleSizeH(435),
    flexGrow: 0,
  },
  reasonRow: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  reasonText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  radio: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: BLUE,
  },
  radioDot: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    borderRadius: scaleSizeW(5),
    backgroundColor: BLUE,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(14),
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(90),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(20),
  },
  submitBtnDisabled: {
    opacity: 0.3,
  },
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
