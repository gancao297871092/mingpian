import React, { forwardRef, useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const BLUE = '#2962D4';

export interface CommentInputSheetProps {
  placeholder?: string;
  onSend?: (text: string) => void;
  onClose?: () => void;
}

const CommentInputSheet = forwardRef<BottomSheetModal, CommentInputSheetProps>(function Sheet(
  { placeholder = '留下你的看法', onSend, onClose },
  ref,
) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend?.(text.trim());
    setText('');
    (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
  }, [canSend, onSend, ref, text]);

  return (
    <AppBottomSheet
      ref={ref}
      backgroundColor="#FFFFFF"
      bottomGap={false}
      onClose={() => {
        setText('');
        onClose?.();
      }}
    >
      <View style={styles.inputBox}>
        <BottomSheetTextInput
          style={styles.input}
          multiline
          autoFocus
          placeholder={placeholder}
          placeholderTextColor="#999999"
          selectionColor={BLUE}
          value={text}
          onChangeText={setText}
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        onPress={handleSend}
      >
        <Text style={styles.sendText}>发送</Text>
      </TouchableOpacity>
    </AppBottomSheet>
  );
});

export default CommentInputSheet;

const styles = StyleSheet.create({
  inputBox: {
    minHeight: scaleSizeH(55),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F4F4F4',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
    marginTop: scaleSizeH(4),
  },
  input: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(20),
    padding: 0,
    textAlignVertical: 'top',
  },
  sendBtn: {
    alignSelf: 'flex-end',
    marginTop: scaleSizeH(11),
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeH(90),
    backgroundColor: BLUE,
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
  sendText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
