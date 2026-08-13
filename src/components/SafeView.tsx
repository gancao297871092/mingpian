import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeViewProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  disableTop?: boolean;
}

export default function SafeView({ children, backgroundColor = '#fff', style, disableTop }: SafeViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {!disableTop && <View style={{ height: insets.top }} />}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
