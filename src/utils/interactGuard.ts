import { API } from '@/api';
import { requireBindPhone } from '@/components/BindPhoneSheet';
import { useUserStore } from '@/store/user';

/**
 * 互动合规守卫（产品规则）：未实名且未绑定手机时，不允许发私信/评论/发动态；
 * 实名（authStatus=1）或绑定手机号，满足任一即放行。
 * 不满足时弹出绑定手机流程（一键绑定/其他手机），绑定成功 resolve true 继续原操作。
 */

/**
 * ⚠️ 临时调试开关：模拟器无法微信登录，强制弹出绑定手机弹层以测试绑定流程。
 * 测试完成后必须改回 false（提交前检查）。
 */
const FORCE_BIND_SHEET_FOR_DEBUG = false;

/** 当前是否已满足互动条件（实名或绑手机任一） */
export function isInteractVerified(): boolean {
  const u = useUserStore.getState().userInfo?.wqUser;
  return u?.authStatus === 1 || !!u?.mobile;
}

/**
 * 互动前校验：满足直接 true；不满足弹绑定手机流程，绑定成功 true、取消 false。
 * userInfo 未加载的极端时序先补拉一次再判断，避免误弹绑定层。
 */
export async function ensureInteractVerified(): Promise<boolean> {
  if (!useUserStore.getState().token) return false;
  if (FORCE_BIND_SHEET_FOR_DEBUG) return requireBindPhone();
  if (isInteractVerified()) return true;
  if (!useUserStore.getState().userInfo) {
    try {
      const res = await API.user.info();
      if (res.code === '200' && res.data) {
        useUserStore.getState().setUserInfo(res.data);
      }
    } catch {
      // 拉取失败按未验证处理，继续弹绑定
    }
    if (isInteractVerified()) return true;
  }
  return requireBindPhone();
}
