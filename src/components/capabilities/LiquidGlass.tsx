import React from "react";
import {
  requireNativeComponent,
  View,
  StyleSheet,
  type ViewStyle,
  type LayoutChangeEvent,
  Platform,
} from "react-native";
import { BlurView } from '@react-native-community/blur';

interface LiquidGlassProps {
  tintColor?: string;
  interactive?: boolean;
  effect?: 'regular' | 'clear' | 'none';
  colorScheme?: 'system' | 'dark' | 'light';
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const NativeGlassView = Platform.OS === 'ios'
  ? requireNativeComponent<LiquidGlassProps>('RNLiquidGlassView')
  : null;

const useNativeGlass = Platform.OS === 'ios' && Number(Platform.Version) >= 26;

const blurTypeMap: Record<string, 'light' | 'dark' | 'ultraThinMaterial' | 'regular'> = {
  regular: 'light',
  clear: 'ultraThinMaterial',
};

const LiquidGlass: React.FC<LiquidGlassProps> = ({
  tintColor,
  interactive,
  effect = 'regular',
  colorScheme = 'system',
  style,
  children,
  onLayout,
}) => {
  if (useNativeGlass && NativeGlassView) {
    return (
      <NativeGlassView
        tintColor={tintColor}
        interactive={interactive}
        effect={effect}
        colorScheme={colorScheme}
        style={style}
        onLayout={onLayout}
      >
        {children}
      </NativeGlassView>
    );
  }

  if (effect === 'none') {
    return (
      <View style={[style, { backgroundColor: tintColor || 'transparent' }]} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  const blurType = blurTypeMap[effect] || 'light';
  const blurAmount = effect === 'clear' ? 35 : 25;
  const resolvedTint = tintColor || 'transparent';
  const androidFallback = effect === 'clear'
    ? 'rgba(255,255,255,0.18)'
    : 'rgba(255,255,255,0.35)';

  return (
    <View style={[style, styles.clip]} onLayout={onLayout}>
      {Platform.OS === 'ios' ? (
        <BlurView
          blurType={blurType}
          blurAmount={blurAmount}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: androidFallback }]}
          pointerEvents="none"
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: resolvedTint }]} pointerEvents="none" />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});

export default LiquidGlass;
export type { LiquidGlassProps };
