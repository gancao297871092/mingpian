import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import NativeLottieRefreshHeader from './LottieRefreshHeaderNativeComponent';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

export interface LottieRefreshHeaderProps {
  refreshing: boolean;
  onRefresh?: () => void;
  /** lottie json 资源 */
  source: any;
  /** 刷新中头部固定高度，默认 80 */
  headerHeight?: number;
  /** 触发刷新的下拉距离，默认 100 */
  triggerHeight?: number;
  /** 动画播完整个进度所需的下拉距离，默认 300（与 smart-refresh 原版一致） */
  progressDistance?: number;
  lottieStyle?: any;
  containerStyle?: any;
  style?: any;
  children?: React.ReactNode;
}

/** 下拉进度 → lottie progress（RN 自带 Animated，setNativeProps 链路） */
function useLottieProgress(triggerHeight: number, progressDistance: number) {
  const offsetValue = useRef(new Animated.Value(0)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefreshRef = useRef<(() => void) | undefined>(undefined);
  const setOnRefresh = useCallback((fn?: () => void) => {
    onRefreshRef.current = fn;
  }, []);

  const onChangeOffset = useCallback(
    (e: any) => {
      const offset = e.nativeEvent.offset ?? 0;
      offsetValue.setValue(offset);
    },
    [offsetValue],
  );

  const onChangeState = useCallback(
    (e: any) => {
      const state = e.nativeEvent.state;
      if (state === 2) {
        setIsRefreshing(true);
        onRefreshRef.current?.();
      } else if (state === 0) {
        setIsRefreshing(false);
        offsetValue.setValue(0);
      }
    },
    [offsetValue],
  );

  const progress = offsetValue.interpolate({
    inputRange: [0, progressDistance],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return { progress, isRefreshing, onChangeOffset, onChangeState, setOnRefresh };
}

function LottieContent({
  source,
  isRefreshing,
  progress,
  lottieStyle,
}: {
  source: any;
  isRefreshing: boolean;
  progress: any;
  lottieStyle?: any;
}) {
  return isRefreshing ? (
    <LottieView source={source} autoPlay loop style={[styles.lottie, lottieStyle]} />
  ) : (
    <AnimatedLottieView
      source={source}
      progress={progress}
      style={[styles.lottie, lottieStyle]}
    />
  );
}

function IOSLottieRefreshHeader(props: LottieRefreshHeaderProps) {
  const {
    refreshing,
    onRefresh,
    source,
    headerHeight = 80,
    triggerHeight = 100,
    progressDistance = 300,
    lottieStyle,
    containerStyle,
  } = props;

  const { progress, isRefreshing, onChangeOffset, onChangeState, setOnRefresh } =
    useLottieProgress(triggerHeight, progressDistance);
  setOnRefresh(onRefresh);

  return (
    <NativeLottieRefreshHeader
      style={[
        styles.container,
        containerStyle,
        { height: headerHeight, top: 0, transform: [{ translateY: -headerHeight }] },
      ]}
      refreshing={refreshing}
      triggerHeight={triggerHeight}
      headerHeight={headerHeight}
      onChangeOffset={onChangeOffset}
      onChangeState={onChangeState}
    >
      <LottieContent
        source={source}
        isRefreshing={isRefreshing}
        progress={progress}
        lottieStyle={lottieStyle}
      />
    </NativeLottieRefreshHeader>
  );
}

function AndroidLottieRefreshHeader(props: LottieRefreshHeaderProps) {
  const { refreshing, onRefresh } = props;
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
}

export default function LottieRefreshHeader(props: LottieRefreshHeaderProps) {
  if (Platform.OS === 'android') {
    return <AndroidLottieRefreshHeader {...props} />;
  }
  return <IOSLottieRefreshHeader {...props} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 999,
  },
  androidContainer: {
    flex: 1,
  },
  lottie: {
    width: 50,
    height: 50,
  },
});
