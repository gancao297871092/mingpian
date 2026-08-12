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
  return registerApp({ appid: env.wechatAppId });
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
  const resp = await sendAuthRequest({ scope: 'snsapi_userinfo' });
  if (resp.errorCode !== 0) {
    throw new WechatError(resp.errorCode, resp.errorStr ?? undefined);
  }
  return { code: resp.data.code, state: resp.data.state };
}