import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AppAlertButton {
  text: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  /** Android 返回键是否可关闭，默认可关闭（对齐系统 Alert） */
  cancelable?: boolean;
  /** 通过返回键/遮罩关闭时回调（未选择按钮） */
  onDismiss?: () => void;
}

let currentAlert: AppAlertOptions | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => currentAlert;

/**
 * 全局 Alert 弹窗，替代系统 Alert.alert。
 * iOS 使用 RN 自带系统 Alert；Android 使用下方自定义弹窗（设计稿样式）。
 * 设计稿：71.更换手机号提示 / 绑定提醒 / 取消申请（figma 440:3822 / 440:3837 / 690:6551）。
 */
export const AppAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void },
  ) {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, buttons, {
        cancelable: options?.cancelable,
        onDismiss: options?.onDismiss,
      });
      return;
    }
    currentAlert = {
      title,
      message,
      buttons,
      cancelable: options?.cancelable ?? true,
      onDismiss: options?.onDismiss,
    };
    emit();
  },
  dismiss() {
    // iOS 走系统 Alert，无 dismiss API；项目内也未使用
    if (Platform.OS === 'ios') return;
    currentAlert = null;
    emit();
  },
};

/** 需在 App 根节点挂载一次（iOS 为空实现，走系统 Alert） */
export function AppAlertHost() {
  const options = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = !!options;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.92);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 18, stiffness: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, opacity, scale]);

  const close = useCallback(() => {
    currentAlert = null;
    emit();
  }, []);

  const onPressButton = useCallback(
    (button: AppAlertButton) => {
      close();
      if (button.onPress) {
        // 先关闭弹窗再执行回调，避免回调里再弹窗时被覆盖
        setTimeout(button.onPress, 0);
      }
    },
    [close],
  );

  const buttons = options?.buttons?.length ? options.buttons : [{ text: '我知道了' }];
  // 设计稿顺序：操作按钮在上，取消/次要按钮在下
  const orderedButtons = [
    ...buttons.filter(b => b.style !== 'cancel'),
    ...buttons.filter(b => b.style === 'cancel'),
  ];

  if (Platform.OS === 'ios') return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={() => {
        if (options?.cancelable) {
          close();
          options?.onDismiss?.();
        }
      }}
    >
      <View style={styles.mask}>
        <Animated.View
          accessibilityViewIsModal
          style={[styles.shadow, { opacity, transform: [{ scale }] }]}
        >
          <View style={styles.card}>
            <View style={styles.body}>
              <Text style={styles.title}>{options?.title}</Text>
              {!!options?.message && <Text style={styles.message}>{options.message}</Text>}
            </View>
            <View style={styles.buttons}>
              {orderedButtons.map((button, index) => {
                const variant =
                  button.style === 'destructive'
                    ? 'destructive'
                    : button.style === 'cancel' || orderedButtons.length === 1
                      ? 'secondary'
                      : 'primary';
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    activeOpacity={0.8}
                    style={[
                      styles.button,
                      variant === 'primary' && styles.buttonPrimary,
                      variant === 'secondary' && styles.buttonSecondary,
                      variant === 'destructive' && styles.buttonSecondary,
                    ]}
                    onPress={() => onPressButton(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        variant === 'primary' && styles.buttonTextPrimary,
                        variant === 'destructive' && styles.buttonTextDestructive,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(24),
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  shadow: {
    width: scaleSizeW(300),
    borderRadius: scaleSizeW(34),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: scaleSizeH(8) },
    shadowOpacity: 0.12,
    shadowRadius: scaleSizeW(20),
    elevation: 16,
  },
  card: {
    width: '100%',
    borderRadius: scaleSizeW(34),
    padding: scaleSizeW(14),
    overflow: 'hidden',
    // 卡片填充：不透明浅灰（反馈：半透明会透出底部内容）
    backgroundColor: '#F5F5F5',
  },
  body: {
    paddingHorizontal: scaleSizeW(8),
    paddingTop: scaleSizeW(8),
    paddingBottom: scaleSizeW(10),
    gap: scaleSizeH(10),
  },
  title: {
    fontSize: setSpText(16),
    lineHeight: setSpText(22),
    fontWeight: '600',
    letterSpacing: setSpText(16) * -0.0269,
    color: '#000000',
  },
  message: {
    fontSize: setSpText(16),
    lineHeight: setSpText(24),
    fontWeight: '400',
    letterSpacing: setSpText(16) * -0.0269,
    color: '#000000',
  },
  buttons: {
    marginTop: scaleSizeH(10),
    gap: scaleSizeH(10),
  },
  button: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(100),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(16),
  },
  buttonPrimary: {
    backgroundColor: '#2962D4',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
  },
  buttonText: {
    fontSize: setSpText(16),
    lineHeight: setSpText(22),
    fontWeight: '500',
    letterSpacing: setSpText(16) * -0.0269,
    color: '#000000',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#EF4444',
  },
});
