import { NativeModules, Platform } from 'react-native';

/**
 * 腾讯云增强版人脸核身（App SDK 含 UI）RN 桥（原生模块 WqFaceVerify，
 * Android 见 faceverify 包 / iOS 见 ios/FaceVerify）。
 *
 * 链路（结果必须服务端查询，不能信端上回调）：
 * 1. 页面收集姓名+身份证号 → API.user.faceidPrepare → 后端返回 SDK 启动参数（含 sign/faceId）
 * 2. startFaceVerify(params) 拉起原生 SDK 刷脸（光线活体，直连腾讯）
 * 3. SDK 回调成功 → API.user.faceidResult(orderNo) 查询权威结果（通过则后端回写实名）
 *
 * 错误码约定（Promise reject 的 code，两端一致）：
 * - CANCELLED   用户中途取消/返回
 * - UNSUPPORTED 当前安装包未集成核身原生模块（旧版本兜底）
 * - FAILED      活体失败/网络异常/SDK 内部错误（message 为 SDK 原始错误描述）
 * - LOGIN_OUT   SDK 报登录态异常（极少见，可引导重试）
 *
 * License：增强版控制台「查看license」获取。iOS BundleId 与 Android PkgName 同为
 * com.wqlccx.com，控制台确认两端共用同一条（截图确认）。当前为测试 License（TIDA7qHa），
 * 上架前换正式 SDK License（控制台同页「SDK License」列，IF9XvL6j...）。
 */
const FACE_LICENSE_ANDROID =
  'aU089X2v1MKcD2Cg3+CZfgaEqQfOan03iXj5AcY+tMxHRPqdJ73yrECX0IHKF1miPrEdekdSUvYw2xWeEithTVC41mCxpCCYDB94SaKUcltvFsrNrv58pZ9UPDc1AFpLA4jXbdYONohVFjVh14GPxQpe4CLv6IStqYb/oYDgdDaXWt5vvohpwC3/gUlpwJO8pbYyi78tVKI/5xVrPghfrdrmdM2ddaWLGKL51Txk0t76rP5NMxZ6JoE1q+GUG4ZjLS7co8gbkRhkSFNy5ZrLLz+X3LQtPmX381ZDWsViISp/Och6pghSr3piv0spDy1Oo95+z4/6C8PB8Sy7hNJPVg==';
// iOS 与 Android 包名相同（com.wqlccx.com），控制台确认两端共用同一条 License
const FACE_LICENSE_IOS = FACE_LICENSE_ANDROID;

export interface FaceVerifySdkParams {
  appId: string;
  orderNo: string;
  userId: string;
  version: string;
  nonce: string;
  sign: string;
  faceId: string;
  optimalDomain?: string;
}

interface FaceVerifyNativeModule {
  start(options: FaceVerifySdkParams & { license: string }): Promise<null>;
}

const native = NativeModules.WqFaceVerify as FaceVerifyNativeModule | undefined;

export const isFaceVerifyAvailable = !!native;

/**
 * 拉起增强版人脸核身 SDK（全屏刷脸页，UI 由 SDK 托管）。
 * resolve(null) 表示 SDK 流程完成且进入服务端比对阶段（domain=WBFaceErrorDomainCompareServer），
 * 页面需紧接着调 API.user.faceidResult 查权威结果。
 */
export function startFaceVerify(params: FaceVerifySdkParams): Promise<null> {
  if (!native) {
    return Promise.reject(
      Object.assign(new Error('当前版本暂不支持人脸核身，请使用手机号验证'), { code: 'UNSUPPORTED' }),
    );
  }
  return native.start({
    ...params,
    license: Platform.OS === 'ios' ? FACE_LICENSE_IOS : FACE_LICENSE_ANDROID,
  });
}
