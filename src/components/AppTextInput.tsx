import React, { forwardRef, useId } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { BottomSheetTextInput as NativeBottomSheetTextInput } from '@gorhom/bottom-sheet';

/** iOS「完成」只结束输入，不调用表单提交或清空内容。 */
function useKeyboardCompletion(props: TextInputProps) {
  const id = useId();
  const accessoryId = `input-completion-${id}`;
  if (Platform.OS !== 'ios') return { inputProps: props, accessory: null };

  const multiline = !!props.multiline;
  return {
    inputProps: {
      ...props,
      returnKeyType: multiline ? 'default' as const : 'done' as const,
      submitBehavior: multiline ? 'newline' as const : 'blurAndSubmit' as const,
      onSubmitEditing: multiline ? undefined : Keyboard.dismiss,
      // 数字键盘无 return 键，由 RN 的原生辅助栏提供「完成」。
      inputAccessoryViewButtonLabel: '完成',
      inputAccessoryViewID: multiline ? accessoryId : undefined,
    },
    accessory: multiline ? (
      <InputAccessoryView nativeID={accessoryId} backgroundColor="#F6F7F9">
        <View style={styles.toolbar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="完成，收起键盘"
            onPress={Keyboard.dismiss}
            style={styles.done}
          >
            <Text style={styles.doneText}>完成</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    ) : null,
  };
}

const Input = forwardRef<NativeTextInput, TextInputProps>(function InputWithCompletion(props, ref) {
  const { inputProps, accessory } = useKeyboardCompletion(props);
  return (
    <>
      <NativeTextInput {...inputProps} ref={ref} />
      {accessory}
    </>
  );
});

/** 保留原生 ref 和 State，供焦点定位、滚动避让使用。 */
export type AppTextInput = NativeTextInput;
export const AppTextInput = Object.assign(Input, { State: NativeTextInput.State });

export const AppBottomSheetTextInput = forwardRef<NativeTextInput, TextInputProps>(
  function SheetInputWithCompletion(props, ref) {
    const { inputProps, accessory } = useKeyboardCompletion(props);
    return (
      <>
        <NativeBottomSheetTextInput
          {...inputProps}
          ref={input => {
            if (typeof ref === 'function') ref(input ?? null);
            else if (ref) ref.current = input ?? null;
          }}
        />
        {accessory}
      </>
    );
  },
);

const styles = StyleSheet.create({
  toolbar: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9DCE1',
  },
  done: {
    minWidth: 64,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#2962D4',
    fontSize: 16,
    fontWeight: '500',
  },
});
