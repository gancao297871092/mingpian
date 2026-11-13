import { API } from '@/api';
import { getAppChannelInfo } from '@/native/AppChannel';

/**
 * App 渠道激活上报：每次冷启动调用一次（免登录）。
 * 后端幂等：同 deviceId 重复上报仅累加启动次数；失败静默，下次冷启动自愈，不影响启动流程。
 */
export async function reportActivation(): Promise<void> {
  try {
    const info = await getAppChannelInfo();
    await API.common.activation(info);
  } catch {
    // 静默失败
  }
}
