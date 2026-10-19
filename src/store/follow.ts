import { create } from 'zustand';
import Toast from 'react-native-toast-message';
import { API } from '@/api';

interface FollowState {
  /** key 为 userId，value 为当前登录用户是否已关注对方 */
  map: Record<string, boolean>;
  /** 写入关注状态（接口返回 / 页面缓存回灌时调用） */
  setFollow: (userId: number, followed: boolean) => void;
}

/**
 * 关注状态全局共享 store（对齐 bbsInteraction 的 likeMap/favMap 模式）。
 * key 按 userId 维度存储，任何页面（动态详情/他人主页/关注列表…）订阅同一份数据，
 * 与路由嵌套层数无关：一处变更，处处同步。
 */
export const useFollowStore = create<FollowState>()(set => ({
  map: {},
  setFollow: (userId, followed) =>
    set(state => ({ map: { ...state.map, [String(userId)]: followed } })),
}));

/**
 * 关注/取关统一入口：乐观更新 store，失败自动回滚并提示。
 * 页面无需各自处理 API + 回滚 + Toast，直接调用即可保证多页面状态一致。
 * @returns settle 后的 Promise（成功/失败均已回写终态，可用于关闭 loading 等）
 */
export function toggleFollow(userId: number, currentlyFollowed: boolean): Promise<void> {
  const next = !currentlyFollowed;
  useFollowStore.getState().setFollow(userId, next);
  return API.user
    .followOperate({ targetUserId: userId, isFollow: next ? 1 : 0 })
    .then(() => {})
    .catch(() => {
      useFollowStore.getState().setFollow(userId, currentlyFollowed);
      Toast.show({ type: 'error', text1: '操作失败，请重试' });
    });
}

/** 非组件环境（effect/回调）直接写入关注状态 */
export const setFollow = (userId: number, followed: boolean) =>
  useFollowStore.getState().setFollow(userId, followed);
