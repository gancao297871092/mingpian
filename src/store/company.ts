import { create } from 'zustand';

interface CompanyState {
  memberAuditCount: number;
  bbsAuditCount: number;
  /** 企业合作池待接手数量（/company/manager/tips companyWorkCount） */
  poolCount: number;
  memberKeyword: string;
  setMemberAuditCount: (count: number) => void;
  setBbsAuditCount: (count: number) => void;
  setPoolCount: (count: number) => void;
  setMemberKeyword: (keyword: string) => void;
}

export const useCompanyStore = create<CompanyState>(set => ({
  memberAuditCount: 0,
  bbsAuditCount: 0,
  poolCount: 0,
  memberKeyword: '',
  setMemberAuditCount: memberAuditCount => set({ memberAuditCount }),
  setBbsAuditCount: bbsAuditCount => set({ bbsAuditCount }),
  setPoolCount: poolCount => set({ poolCount }),
  setMemberKeyword: memberKeyword => set({ memberKeyword }),
}));
