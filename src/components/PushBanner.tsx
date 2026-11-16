import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

/**
 * 应用内推送横幅（App 前台收到推送时展示，替代系统通知栏）。
 *
 * 架构：push.ts 的 notificationArrived 事件 → showInAppPush() → 本组件滑入展示。
 * 点击横幅走与通知栏点击相同的路由（push.ts 传入 onPress）。
 * 消失方式：4.5s 自动 / 上滑手势（跟手，过阈值或快甩消失，否则回弹）/ 点 ×。
 */

export interface InAppPushPayload {
  title: string;
  content: string;
  /** 点击跳转回调（JS 内直接引用，不跨序列化） */
  onPress?: () => void;
}

type ShowHandler = (payload: InAppPushPayload) => void;
let showHandler: ShowHandler | null = null;

/** 全局弹应用内推送横幅（宿主未挂载时静默丢弃） */
export function showInAppPush(payload: InAppPushPayload): void {
  showHandler?.(payload);
}

const DISMISS_MS = 4500;
/** 上滑消失阈值：位移 40dp 或甩动速度 0.6dp/ms */
const SWIPE_DISMISS_DY = -40;
const SWIPE_DISMISS_VY = -0.6;
/** 隐藏时移出屏幕顶部的距离（含安全区余量，取够大即可） */
const HIDDEN_OFFSET = -160;

export function PushBannerHost(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [payload, setPayload] = useState<InAppPushPayload | null>(null);
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const dismiss = () => {
    clearTimer();
    translateY.stopAnimation();
    Animated.timing(translateY, {
      toValue: HIDDEN_OFFSET,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPayload(null));
  };

  const armTimer = () => {
    clearTimer();
    timer.current = setTimeout(dismiss, DISMISS_MS);
  };

  // PanResponder 创建一次，回调经 ref 取最新 dismiss/armTimer，避免闭包过期
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;
  const armTimerRef = useRef(armTimer);
  armTimerRef.current = armTimer;
  const clearTimerRef = useRef(clearTimer);
  clearTimerRef.current = clearTimer;

  const panResponder = useRef(
    PanResponder.create({
      // 只接管明显上滑意图；点击/微动仍交给 Pressable。
      // 必须配 Capture：Pressable 会在 touch start 先锁 responder，
      // 冒泡阶段的 shouldSet 轮不到父级，捕获阶段才能在上滑时夺回手势。
      onMoveShouldSetPanResponder: (_, g) => g.dy < -6 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy < -6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        // 手指按住：暂停自动消失计时，停掉可能未完成的入场动画
        clearTimerRef.current();
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        translateY.setValue(Math.min(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < SWIPE_DISMISS_DY || g.vy < SWIPE_DISMISS_VY) {
          dismissRef.current();
        } else {
          Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 240, useNativeDriver: true }).start();
          armTimerRef.current();
        }
      },
      onPanResponderTerminate: () => {
        // 手势被系统打断：回弹并重新计时
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 240, useNativeDriver: true }).start();
        armTimerRef.current();
      },
    }),
  ).current;

  useEffect(() => {
    showHandler = p => {
      clearTimer();
      setPayload(p);
      translateY.stopAnimation();
      translateY.setValue(HIDDEN_OFFSET);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 240,
        useNativeDriver: true,
      }).start();
      armTimer();
    };
    return () => {
      showHandler = null;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!payload) return null;

  const handlePress = () => {
    const cb = payload.onPress;
    dismiss();
    cb?.();
  };

  const cardDynamicStyle = {
    backgroundColor: theme.dark ? theme.card : '#FFFFFF',
    shadowColor: theme.dark ? '#000000' : '#1A1A2E',
  };

  return (
    <View style={[styles.wrap, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ translateY }] }} {...panResponder.panHandlers}>
        <Pressable style={[styles.card, cardDynamicStyle]} onPress={handlePress}>
          <Image source={require('@/assets/ming/logo.png')} style={styles.icon} />
          <View style={styles.texts}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {payload.title}
            </Text>
            {!!payload.content && (
              <Text style={[styles.content, { color: theme.subText }]} numberOfLines={2}>
                {payload.content}
              </Text>
            )}
          </View>
          <Pressable hitSlop={12} onPress={dismiss} style={styles.close}>
            <Text style={[styles.closeText, { color: theme.placeholder }]}>×</Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  texts: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  close: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    lineHeight: 22,
  },
});
