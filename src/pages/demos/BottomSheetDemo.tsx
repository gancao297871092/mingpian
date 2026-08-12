import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />;
}

function BottomSheetContent() {
  const modalRef = useRef<BottomSheetModal>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const snapPoints = useMemo(() => ['30%', '60%', '90%'], []);
  const [dismissCount, setDismissCount] = useState(0);

  const present = useCallback(() => {
    modalRef.current?.present();
  }, []);

  return (
    <View style={styles.content}>
      <Text style={styles.title}>底部弹层</Text>
      <Text style={styles.desc}>@gorhom/bottom-sheet · 拖动/点击遮罩关闭，含 3 档 snapPoints</Text>
      <Pressable style={styles.primaryButton} onPress={present}>
        <Text style={styles.primaryButtonText}>打开底部弹层</Text>
      </Pressable>
      <Text style={styles.meta}>当前档位: {currentIndex} · 已关闭次数: {dismissCount}</Text>

      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={(index) => setCurrentIndex(index)}
        onDismiss={() => setDismissCount((count) => count + 1)}
      >
        <BottomSheetView style={styles.sheetView}>
          <Text style={styles.sheetTitle}>这是一个 BottomSheet</Text>
          <Text style={styles.sheetText}>
            支持手势拖动、snapPoints 档位切换、backdrop 点击关闭。由 react-native-gesture-handler 与
            reanimated 驱动。
          </Text>
          <View style={styles.sheetRow}>
            <Pressable style={styles.sheetButtonAmber} onPress={() => modalRef.current?.snapToIndex(1)}>
              <Text style={styles.sheetButtonText}>切到 60%</Text>
            </Pressable>
            <Pressable style={styles.sheetButtonRed} onPress={() => modalRef.current?.dismiss()}>
              <Text style={styles.sheetButtonText}>关闭</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

export default function BottomSheetDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <BottomSheetModalProvider>
        <ScrollView>
          <BottomSheetContent />
        </ScrollView>
      </BottomSheetModalProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  primaryButton: {
    alignItems: 'center', borderRadius: 12, paddingVertical: 14, backgroundColor: '#2563eb',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { marginTop: 12, fontSize: 13, color: '#666' },
  sheetView: { padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  sheetText: { fontSize: 14, lineHeight: 22, color: '#555', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  sheetButtonAmber: {
    flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 12, backgroundColor: '#f59e0b',
  },
  sheetButtonRed: {
    flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 12, backgroundColor: '#dc2626',
  },
  sheetButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
