import { create } from 'zustand';
import { API } from '@/api';
import { useUserStore } from '@/store/user';

interface MessageUnreadState {
  /** 未读消息总数（私信+系统+互动，GET /v1/message/count），驱动底部 tab 红点 */
  unreadCount: number;
  /** 拉取未读数（未登录时清零，静默失败） */
  fetchUnread: () => Promise<void>;
  /** 本地直接修正（如「全部已读」后即时清零对应部分前的兜底） */
  setUnread: (count: number) => void;
}

/**
 * 消息未读全局 store：底部 tab 红点（LiquidGlassTabBar）订阅。
 * 消息页加载/已读操作后调用 fetchUnread 保持同步。
 */
export const useMessageUnreadStore = create<MessageUnreadState>()(set => ({
  unreadCount: 0,
  fetchUnread: async () => {
    if (!useUserStore.getState().token) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      const res = await API.message.count();
      set({ unreadCount: Number(res.data) || 0 });
    } catch {
      // 静默：红点失败不影响主流程
    }
  },
  setUnread: count => set({ unreadCount: Math.max(0, count) }),
}));
