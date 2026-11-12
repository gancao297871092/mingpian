import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useIsFocused, useNavigation } from '@react-navigation/native';

type BlurType = React.ComponentProps<typeof BlurView>['blurType'];

interface AppBlurViewProps {
  blurType?: BlurType;
  blurAmount?: number;
  style?: StyleProp<ViewStyle>;
  /** 过渡期间的兜底底色；不传时按 blurType 给默认（light→白0.5 / dark→黑0.35） */
  androidFallbackColor?: string;
}

/** 等路由过渡动画结束的时长（原生 stack 推入约 300ms，留余量），期间用纯色兜底 */
const ANDROID_SETTLE_DELAY = 450;

/**
 * 安卓 BlurView（eightbitlab）是对根视图实时快照，路由过渡期间新旧屏同挂根视图，
 * 会把上一屏内容快照绘制到新屏上（重影）。这里屏幕聚焦且过渡结束后再挂载真模糊，规避该问题。
 */
function AndroidBlur({
  blurType,
  blurAmount,
  style,
  fallbackColor,
}: {
  blurType: BlurType;
  blurAmount: number;
  style?: StyleProp<ViewStyle>;
  fallbackColor: string;
}) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [settled, setSettled] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFocused) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), ANDROID_SETTLE_DELAY);
    return () => clearTimeout(t);
  }, [isFocused]);

  // 所在屏幕一旦开始路由过渡（被盖住/手势返回）立即退回纯色
  useEffect(() => {
    // transitionStart 仅 stack 导航器会派发，tab 导航器上不会触发（靠 useIsFocused 兜底）
    return (navigation as any).addListener('transitionStart', () => setSettled(false));
  }, [navigation]);

  useEffect(() => {
    if (settled) {
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      opacity.setValue(0);
    }
  }, [settled, opacity]);

  return (
    <View style={[style, { backgroundColor: fallbackColor }]} pointerEvents="none">
      {settled && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <BlurView style={StyleSheet.absoluteFill} blurType={blurType} blurAmount={blurAmount} />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * 全平台磨砂底：iOS 立即渲染真 BlurView；安卓渲染真 BlurView，但延迟到路由过渡结束后挂载
 * （过渡期间用 androidFallbackColor 纯色兜底，避免根视图快照把上一屏画到新屏上）。
 */
export default function AppBlurView({
  blurType = 'light',
  blurAmount = 10,
  style,
  androidFallbackColor,
}: AppBlurViewProps) {
  if (Platform.OS === 'android') {
    const fallbackColor =
      androidFallbackColor ?? (blurType === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)');
    return (
      <AndroidBlur blurType={blurType} blurAmount={blurAmount} style={style} fallbackColor={fallbackColor} />
    );
  }
  return (
    <BlurView
      style={style}
      blurType={blurType}
      blurAmount={blurAmount}
      reducedTransparencyFallbackColor={androidFallbackColor}
    />
  );
}
