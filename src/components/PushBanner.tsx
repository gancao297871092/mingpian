import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

/**
 * 应用内推送横幅（App 前台收到推送时展示，替代系统通知栏）。
 *
 * 架构：push.ts 的 notificationArrived 事件 → showInAppPush() → 本组件滑入展示。
 * 点击横幅走与通知栏点击相同的路由（push.ts 传入 onPress）。
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
    Animated.timing(translateY, {
      toValue: HIDDEN_OFFSET,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPayload(null));
  };

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
      timer.current = setTimeout(dismiss, DISMISS_MS);
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
      <Animated.View style={{ transform: [{ translateY }] }}>
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
