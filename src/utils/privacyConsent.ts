import { storageUtils } from '@/utils/storage';

/**
 * 首启隐私政策同意标记（工信部合规：同意前不初始化任何三方 SDK/上报）。
 * 同意后：极光 JCore.setAuth(true) + JPush.init、渠道激活上报、微信/号码认证 SDK 初始化。
 */
const KEY = 'privacyConsentAgreed';

/** 是否已同意隐私政策（MMKV 同步读取，启动无闪烁） */
export function hasPrivacyConsent(): boolean {
  return storageUtils.getBoolean(KEY) === true;
}

/** 记录用户已同意（首启弹窗点「同意并继续」时调用） */
export function setPrivacyConsent(): void {
  storageUtils.set(KEY, true);
}
