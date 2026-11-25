import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

/**
 * 阿里云号码认证一键登录 RN 桥（原生模块 LCPhoneLogin，见 ios/PhoneLogin、android phonelogin 包）。
 *
 * 错误码约定（两端一致）：
 * - CANCELLED     用户取消（返回键/返回按钮）
 * - SWITCH_OTHER  用户点了授权页内“其他号码登录”
 * - SWITCH_BACK   用户点了授权页内“返回其他登录方式”
 * - OPEN_AGREEMENT 点击协议，message 为协议类型（userSure/privates），由 JS 打开 App 内协议页
 * - UNSUPPORTED   当前环境不支持一键登录
 * - BUSY          授权页已打开
 * - FAILED        其他失败（msg 为原因）
 */

export type PhoneLoginPresentation = 'fullscreen' | 'bottomSheet';

export interface PhoneLoginToken {
  token: string;
  /** 新版运营商授权信息（如 SDK 返回则原样透传后端） */
  userAuthorization?: string;
}

interface PhoneLoginNativeModule {
  initSDK(): void;
  checkSupport(): Promise<boolean>;
  preLogin(): void;
  /** 预取号并回传运营商掩码号码（如 130****1234）；无掩码能力/失败时 resolve null */
  getMaskPhone(): Promise<string | null>;
  open(options: { presentation: PhoneLoginPresentation }): Promise<PhoneLoginToken>;
  close(): void;
}

const native = NativeModules.LCPhoneLogin as PhoneLoginNativeModule | undefined;

export const isPhoneLoginAvailable = !!native;

/** App 启动时调用一次（原生内部幂等，提前设置方案密钥/初始化 SDK）。 */
export function initPhoneLogin(): void {
  try {
    native?.initSDK();
  } catch {
    // 旧版本安装包无此原生模块时静默
  }
}

/** 预取号加速授权页弹起，失败静默。 */
export function preLoginPhone(): void {
  try {
    native?.preLogin();
  } catch {
    // ignore
  }
}

/**
 * 预取号并回传本机掩码号码（如 130****1234）。
 * iOS 新版 SDK 预取号成功返回 securityPhone；Android 当前 SDK 版本无掩码能力返回 null。
 * 任何失败/不支持均返回 null，调用方隐藏号码展示行即可。
 */
export async function getMaskPhone(): Promise<string | null> {
  if (!native?.getMaskPhone) return null;
  try {
    return await native.getMaskPhone();
  } catch {
    return null;
  }
}

/** 当前设备环境是否支持一键登录（有 SIM 卡、蜂窝网络等）。 */
export async function checkPhoneLoginSupport(): Promise<boolean> {
  if (!native) return false;
  try {
    if (Platform.OS === 'android') {
      // 一键登录必须持有电话权限（读取 SIM/蜂窝状态），拒绝则降级短信登录
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
        title: '权限申请',
        message: '一键登录需要电话权限以完成本机号码认证',
        buttonPositive: '允许',
        buttonNegative: '取消',
      });
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }
    return await native.checkSupport();
  } catch {
    return false;
  }
}

export function openPhoneLogin(
  options: { presentation?: PhoneLoginPresentation } = {},
): Promise<PhoneLoginToken> {
  if (!native) {
    return Promise.reject(Object.assign(new Error('当前版本不支持一键登录'), { code: 'UNSUPPORTED' }));
  }
  return native.open({ presentation: options.presentation ?? 'fullscreen' });
}

export function closePhoneLogin(): void {
  try {
    native?.close();
  } catch {
    // ignore
  }
}
