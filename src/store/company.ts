import { create } from 'zustand';
import { API } from '@/api';
import { useUserStore } from '@/store/user';

interface CompanyState {
  memberAuditCount: number;
  bbsAuditCount: number;
  /** 企业合作池待接手数量（/company/manager/tips companyWorkCount） */
  poolCount: number;
  memberKeyword: string;
  /** 业务员工作台待触达数（/sales/task/count pending，我的页入口角标） */
  workbenchTodo: number;
  setMemberAuditCount: (count: number) => void;
  setBbsAuditCount: (count: number) => void;
  setPoolCount: (count: number) => void;
  setMemberKeyword: (keyword: string) => void;
  setWorkbenchTodo: (count: number) => void;
  /** 拉取「我的」tab 红点所需角标（企业管理审核数 + 业务员工作台待触达），未登录/无身份清零 */
  fetchMineBadges: () => Promise<void>;
}

/** 企业管理入口与底部「我的」红点共用内部待处理数量。 */
export const selectCompanyPendingCount = (state: CompanyState) =>
  state.memberAuditCount + state.bbsAuditCount + state.poolCount;

export const useCompanyStore = create<CompanyState>(set => ({
  memberAuditCount: 0,
  bbsAuditCount: 0,
  poolCount: 0,
  memberKeyword: '',
  workbenchTodo: 0,
  setMemberAuditCount: memberAuditCount => set({ memberAuditCount }),
  setBbsAuditCount: bbsAuditCount => set({ bbsAuditCount }),
  setPoolCount: poolCount => set({ poolCount }),
  setMemberKeyword: memberKeyword => set({ memberKeyword }),
  setWorkbenchTodo: workbenchTodo => set({ workbenchTodo }),
  fetchMineBadges: async () => {
    const { token, userInfo } = useUserStore.getState();
    if (!token) {
      set({ memberAuditCount: 0, bbsAuditCount: 0, poolCount: 0, workbenchTodo: 0 });
      return;
    }
    // 企业管理角标：有企业才拉，无企业清零
    if (userInfo?.cpId) {
      try {
        const r = await API.company.managerTips();
        if (r.code === '200' && r.data) {
          set({
            memberAuditCount: r.data.companyUserAuthCount ?? 0,
            bbsAuditCount: r.data.bbsCount ?? 0,
            poolCount: r.data.companyWorkCount ?? 0,
          });
        }
      } catch {
        // 静默：角标失败不影响主流程
      }
    } else {
      set({ memberAuditCount: 0, bbsAuditCount: 0, poolCount: 0 });
    }
    // 工作台待触达：仅业务员拉取，非业务员清零
    if (userInfo?.isYwy) {
      try {
        const r = await API.salesTask.count();
        set({ workbenchTodo: r.data?.pending ?? 0 });
      } catch {
        // 静默
      }
    } else {
      set({ workbenchTodo: 0 });
    }
  },
}));
