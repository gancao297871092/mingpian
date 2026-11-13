import { NativeModules, Platform } from 'react-native';
import { storageUtils } from '@/utils/storage';
import pkg from '../../package.json';

/**
 * App 渠道信息 RN 桥（原生模块 AppChannel，见 android appchannel 包）。
 *
 * Android：channel 取自 Manifest meta-data APP_CHANNEL（日常构建 official，
 * 上架渠道包由加固工具按商店改写），deviceId 为 ANDROID_ID（重装保留）。
 * iOS：无渠道概念，channel 固定 official；deviceId 为本地持久化 UUID（重装后重新生成）。
 *
 * 渠道口径与后端 POST /v1/common/activation 一致：
 * huawei / honor / xiaomi / oppo / vivo / tencent / official（其余值后端落 unknown）。
 */

export interface AppChannelInfo {
  channel: string;
  deviceId: string;
  appVersion: string;
  os: string;
  osVersion: string;
  deviceModel: string;
}

interface AppChannelNativeModule {
  getInfo(): Promise<AppChannelInfo>;
}

const native = NativeModules.AppChannel as AppChannelNativeModule | undefined;

const IOS_DEVICE_ID_KEY = 'appDeviceId';

/** iOS 设备标识：首次生成 v4 UUID 持久化到 MMKV */
function getIosDeviceId(): string {
  const cached = storageUtils.getString(IOS_DEVICE_ID_KEY);
  if (cached) return cached;
  const hex = '0123456789abcdef';
  const randHex = () => hex[Math.floor(Math.random() * 16)];
  const randVariant = () => hex[8 + Math.floor(Math.random() * 4)]; // v4 变体位：8/9/a/b
  const seg = (n: number) => Array.from({ length: n }, randHex).join('');
  const uuid = `${seg(8)}-${seg(4)}-4${seg(3)}-${randVariant()}${seg(3)}-${seg(12)}`;
  storageUtils.set(IOS_DEVICE_ID_KEY, uuid);
  return uuid;
}

/** 读取渠道与设备信息（后端 /v1/common/activation 上报入参） */
export async function getAppChannelInfo(): Promise<AppChannelInfo> {
  if (Platform.OS === 'android' && native) {
    return native.getInfo();
  }
  return {
    channel: 'official',
    deviceId: getIosDeviceId(),
    appVersion: pkg.version,
    os: 'ios',
    osVersion: String(Platform.Version),
    deviceModel: '',
  };
}
