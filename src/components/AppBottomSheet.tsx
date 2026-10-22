import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
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
  bottomGap?: boolean;
  /** 内容超长时可滚动（内部使用 BottomSheetScrollView，弹层高度由 heightRatio 决定） */
  scrollable?: boolean;
  /** scrollable 模式下的弹层高度占比（0~1），默认 0.85 */
  heightRatio?: number;
}

const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(function Sheet(
  {
    onClose,
    children,
    backgroundColor = '#F6F7FB',
    showHandle = true,
    backdropOpacity = 0.25,
    enablePanDownToClose = true,
    bottomGap = true,
    scrollable = false,
    heightRatio = 0.85,
  },
  ref,
) {
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => [`${Math.round(heightRatio * 100)}%`], [heightRatio]);

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

  const contentStyle = {
    paddingBottom: bottomGap ? insets.bottom + scaleSizeH(20) : scaleSizeH(20),
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={!scrollable}
      snapPoints={scrollable ? snapPoints : undefined}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleComponent={showHandle ? undefined : null}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={[styles.background, { backgroundColor }]}
    >
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={[styles.content, contentStyle]}>{children}</BottomSheetView>
      )}
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
