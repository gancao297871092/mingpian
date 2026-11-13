import { Platform } from 'react-native';
import JPush from 'jpush-react-native';
import JCore from 'jcore-react-native';

/**
 * 极光推送 RN 桥（jpush-react-native 3.x / jcore-react-native 2.x）。
 *
 * 合规链路（重要）：原生 MainApplication 已 JCollectionAuth.setAuth(false)，
 * 必须在用户同意隐私政策后：setPushAuth(true) → initPush() → getRegistrationId() → 后端 /common/push/bind。
 *
 * 说明：
 * - Android 的 appKey 走 build.gradle manifestPlaceholders（JPUSH_APPKEY）；iOS 走 init 参数；
 * - iOS 需 Xcode 推送能力（entitlements 的 aps-environment）+ AppDelegate 桥接（didRegister/JPUSHRegisterDelegate）；
 * - 通知点击回调 extras 结构见后端 PUSH-JUMP-MAPPING.md（自定义参数在 params 节点，msgCode 需 trim）。
 */

/** 与后端 application-*.yml 的 jpush.app-key 一致（dev/prod 同应用） */
export const JPUSH_APPKEY = '36761347ae1f17b420e5cb49';

/** 双端均已启用推送（后端 JpushService 推 android+ios） */
export const pushSupported = Platform.OS === 'android' || Platform.OS === 'ios';

export interface JPushNotificationEvent {
  messageID?: string;
  title?: string;
  content?: string;
  /** 自定义附加字段（后端 extras；自定义参数在其 params 子节点） */
  extras?: Record<string, any>;
  /** notificationArrived（到达）/ notificationOpened（点击） */
  notificationEventType?: string;
}

/** 隐私合规授权开关：同意隐私政策后调 true（原生默认 false） */
export function setPushAuth(auth: boolean): void {
  if (!pushSupported) return;
  JCore.setAuth(auth);
}

/** 初始化推送服务（须在 setPushAuth(true) 之后） */
export function initPush(channel: string): void {
  if (!pushSupported) return;
  JPush.setLoggerEnable(__DEV__);
  JPush.init({ appKey: JPUSH_APPKEY, channel, production: !__DEV__ });
  // 渠道动态覆盖（用于极光后台按商店渠道看送达统计；失败不影响主流程）
  try {
    (JPush as any).setChannel?.({ channel });
  } catch {
    // ignore
  }
}

/** 获取 registrationId（init 成功后异步注册完成才有值，空调用方负责重试） */
export function getRegistrationId(): Promise<string> {
  return new Promise((resolve) => {
    if (!pushSupported) return resolve('');
    try {
      JPush.getRegistrationID(({ registerID }) => resolve(registerID || ''));
    } catch {
      resolve('');
    }
  });
}

/** 通知到达/点击监听（点击冷启动场景插件会缓存事件，init 后尽早注册） */
export function addPushNotificationListener(cb: (e: JPushNotificationEvent) => void): void {
  if (!pushSupported) return;
  JPush.addNotificationListener(cb as any);
}

/** Android 13+ 通知运行时权限 */
export function requestPushPermission(): void {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    JPush.requestPermission();
  }
}
