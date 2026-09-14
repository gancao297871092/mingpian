import React, { forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';

export interface AppBottomSheetProps {
  onClose?: () => void;
  children: React.ReactNode;
  backgroundColor?: string;
  showHandle?: boolean;
  backdropOpacity?: number;
  enablePanDownToClose?: boolean;
}

const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(function Sheet(
  {
    onClose,
    children,
    backgroundColor = '#F6F7FB',
    showHandle = true,
    backdropOpacity = 0.25,
    enablePanDownToClose = true,
  },
  ref,
) {
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={backdropOpacity}
        pressBehavior="close"
      />
    ),
    [backdropOpacity],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleComponent={showHandle ? undefined : null}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={[styles.background, { backgroundColor }]}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + scaleSizeH(20) }]}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default AppBottomSheet;

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
  },
  handle: {
    width: scaleSizeW(34),
    height: scaleSizeH(6),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#A3A3A3',
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
  },
});
