import { registerApp, sendAuthRequest, isWechatInstalled } from 'native-wechat';
import { env } from '@/config/env';

export interface WechatAuthCode {
  code: string;
  state: string;
}

export class WechatError extends Error {
  code: number;
  constructor(code: number, message?: string) {
    super(message || `微信授权失败（${code}）`);
    this.code = code;
  }
}

let registered = false;

export function initWechat(): () => void {
  if (!env.wechatAppId) {
    console.warn('[wechat] 未配置 WECHAT_APPID，微信登录不可用');
    return () => {};
  }
  if (registered) return () => {};
  registered = true;
  return registerApp({
    appid: env.wechatAppId,
    universalLink: 'https://www.lccxin.com/wechat/',
  });
}

export function isWechatConfigured(): boolean {
  return !!env.wechatAppId;
}

export async function isWechatAvailable(): Promise<boolean> {
  if (!isWechatConfigured()) return false;
  try {
    return await isWechatInstalled();
  } catch {
    return false;
  }
}

export async function wechatLogin(): Promise<WechatAuthCode> {
  if (!isWechatConfigured()) {
    throw new WechatError(-1, '微信登录未配置，请先设置 WECHAT_APPID');
  }
  initWechat();
  const state = `login_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const resp = await sendAuthRequest({ scope: 'snsapi_userinfo', state }).catch((error: unknown) => {
    // native-wechat 将 SDK 错误码包装在 Error.message 中。
    const message = error instanceof Error ? error.message : '';
    const match = message.match(/\[Native Wechat\]: \((-?\d+)\)/);
    if (match) {
      const code = Number(match[1]);
      throw new WechatError(code, code === -2 ? '已取消微信授权' : code === -4 ? '微信授权被拒绝' : '微信授权失败，请重试');
    }
    throw error;
  });
  if (resp.errorCode !== 0) {
    throw new WechatError(resp.errorCode, resp.errorStr ?? undefined);
  }
  if (!resp.data?.code || resp.data.state !== state) {
    throw new WechatError(-1, '微信授权回调无效，请重新登录');
  }
  return { code: resp.data.code, state: resp.data.state };
}
