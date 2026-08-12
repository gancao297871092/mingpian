import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Reanimated, { useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';

// RN 自带 Animated 包装（smart-refresh 同款机制）
const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
// reanimated 包装
const ReanimatedLottieView = Reanimated.createAnimatedComponent(LottieView);

const source = require('@/assets/lottile/materialAdapter.json');
const STEPS = [0, 0.25, 0.5, 0.75, 1];

export default function Detail() {
  const theme = useTheme();
  // O. 官方例子：Animated.timing 驱动 progress，5 秒播完
  const animationProgress = useRef(new Animated.Value(0)).current;
  const playOfficial = () => {
    animationProgress.setValue(0);
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };
  useEffect(() => {
    playOfficial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A. useState 静态进度
  const [staticProgress, setStaticProgress] = useState(0);

  // B. RN Animated.Value + 拖动手势
  const dragValue = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        dragValue.setValue(Math.max(0, Math.min(1, g.dy / 200)));
      },
      onPanResponderRelease: () => {
        Animated.timing(dragValue, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  // C. reanimated shared value
  const reProgress = useSharedValue(0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={[styles.groupTitle, { color: theme.text }]}>O. 官方例子：Animated.timing 5秒播完（应匀速播放）</Text>
      <View style={[styles.lottieBox, { backgroundColor: theme.card }]}>
        <AnimatedLottieView
          source={source}
          progress={animationProgress}
          style={styles.lottie}
        />
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={playOfficial}>
          <Text style={styles.btnText}>重新播放</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>A. useState 控制 progress</Text>
      <View style={[styles.lottieBox, { backgroundColor: theme.card }]}>
        <LottieView source={source} progress={staticProgress} style={styles.lottie} />
      </View>
      <View style={styles.btnRow}>
        {STEPS.map(v => (
          <TouchableOpacity key={v} style={[styles.btn, { backgroundColor: theme.primary }]} onPress={() => setStaticProgress(v)}>
            <Text style={styles.btnText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>B. RN Animated 拖动（在下方区域上下拖动）</Text>
      <View {...pan.panHandlers} style={[styles.lottieBox, { backgroundColor: theme.card }, styles.dragBox]}>
        <AnimatedLottieView source={source} progress={dragValue} style={styles.lottie} />
        <Text style={[styles.dragHint, { color: theme.placeholder }]}>按住此区域上下拖动</Text>
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>C. reanimated shared value</Text>
      <View style={[styles.lottieBox, { backgroundColor: theme.card }]}>
        <ReanimatedLottieView
          source={source}
          progress={reProgress as any}
          style={styles.lottie}
        />
      </View>
      <View style={styles.btnRow}>
        {STEPS.map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={() => {
              reProgress.value = v;
            }}
          >
            <Text style={styles.btnText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>D. autoPlay loop（对照组）</Text>
      <View style={[styles.lottieBox, { backgroundColor: theme.card }]}>
        <LottieView source={source} autoPlay loop style={styles.lottie} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scaleSizeH(15),
  },
  groupTitle: {
    fontSize: setSpText(14),
    fontWeight: 'bold',
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  lottieBox: {
    height: scaleSizeH(120),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleSizeH(10),
  },
  dragBox: {
    height: scaleSizeH(200),
  },
  dragHint: {
    fontSize: setSpText(11),
    marginTop: scaleSizeH(6),
  },
  lottie: {
    width: scaleSizeH(60),
    height: scaleSizeH(60),
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(10),
  },
  btn: {
    flex: 1,
    marginHorizontal: scaleSizeH(4),
    height: scaleSizeH(32),
    borderRadius: scaleSizeH(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: setSpText(12),
    color: '#fff',
  },
});
