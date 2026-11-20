import { Platform } from 'react-native';

/**
 * 是否需要 JS 手动键盘避让。
 * Android 15（API 35）起 targetSdk≥35 强制 edge-to-edge，adjustResize 不再缩小窗口，
 * 原先「Android 交给 adjustResize」的页面底部会被键盘遮挡（聊天页/发布页同款问题）；
 * iOS 全版本手动；Android 14 及以下仍由 adjustResize 处理。
 */
export const NEED_MANUAL_KEYBOARD =
  Platform.OS === 'ios' || (Platform.OS === 'android' && Number(Platform.Version) >= 35);

/**
 * KeyboardAvoidingView 统一 behavior：
 * iOS / Android 15+ 手动 padding；Android 14 及以下交给 adjustResize（behavior=undefined）。
 */
export const KAV_BEHAVIOR = NEED_MANUAL_KEYBOARD ? ('padding' as const) : undefined;
