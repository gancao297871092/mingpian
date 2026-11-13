import Constants from 'expo-constants';
import pkg from '../../package.json';

export interface AppVersionInfo {
  /** 原生版本号：iOS MARKETING_VERSION / Android versionName（来自安装包本身），读取失败回退 package.json 版本 */
  nativeVersion: string;
  /** 项目版本号（构建号）：iOS CURRENT_PROJECT_VERSION / Android versionCode */
  nativeBuild: string;
  /** JS 包版本（package.json version，热更后可能与原生不一致） */
  jsVersion: string;
}

let cached: AppVersionInfo | null = null;

/** 应用版本信息：原生版本号 + 项目版本号（构建号）+ JS 包版本 */
export function getAppVersionInfo(): AppVersionInfo {
  if (cached) return cached;
  cached = {
    nativeVersion: Constants.nativeAppVersion ?? pkg.version,
    nativeBuild: Constants.nativeBuildVersion ?? '',
    jsVersion: pkg.version,
  };
  return cached;
}
