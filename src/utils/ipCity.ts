import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { storageUtils } from '@/utils/storage';

/**
 * IP 属地同步（对齐微博/抖音「IP属地」语义：按公网 IP 解析，非 GPS 定位）。
 *
 * 流程：腾讯位置服务 IP 定位接口（不传 ip 参数 = 解析调用方公网 IP，与小程序逆地理同 key）
 * → 城市与已存不一致时更新到服务端 /user/info/base/update，并刷新本地 userStore，
 * 驱动「我的」IP·城市 chip 即时显示。
 *
 * 特点：无需定位权限、无权限弹窗；仅登录后调用；24h 节流一次；失败静默。
 */
const TENCENT_MAP_KEY = 'YPVBZ-KL3KA-ORQK2-CNF3L-32N2S-7JFVU';
const LAST_SYNC_KEY = 'ipCityLastSyncAt';
const SYNC_INTERVAL = 24 * 3600 * 1000;

export async function syncIpCity(): Promise<void> {
  const { token } = useUserStore.getState();
  if (!token) return;
  const now = Date.now();
  if (now - (storageUtils.getNumber(LAST_SYNC_KEY) ?? 0) < SYNC_INTERVAL) return;
  storageUtils.set(LAST_SYNC_KEY, now);
  try {
    const res = await fetch(`https://apis.map.qq.com/ws/location/v1/ip?key=${TENCENT_MAP_KEY}`);
    const json = await res.json();
    const city: string = json?.result?.ad_info?.city ?? '';
    const province: string = json?.result?.ad_info?.province ?? '';
    if (!city) return;
    if (city === useUserStore.getState().userInfo?.wqUser?.city) return;
    const r = await API.user.updateInfo({ city, province });
    if (r.code === '200') {
      // 服务端已更新，同步补丁到本地 store，「我的」chip 无需等下次刷新
      const cur = useUserStore.getState().userInfo;
      if (cur?.wqUser) {
        useUserStore.getState().setUserInfo({ ...cur, wqUser: { ...cur.wqUser, city, province } });
      }
    }
  } catch {
    // 网络/配额失败静默，下个节流周期再试
  }
}
