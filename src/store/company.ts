import { create } from 'zustand';

interface CompanyState {
  memberAuditCount: number;
  bbsAuditCount: number;
  memberKeyword: string;
  setMemberAuditCount: (count: number) => void;
  setBbsAuditCount: (count: number) => void;
  setMemberKeyword: (keyword: string) => void;
}

export const useCompanyStore = create<CompanyState>(set => ({
  memberAuditCount: 0,
  bbsAuditCount: 0,
  memberKeyword: '',
  setMemberAuditCount: memberAuditCount => set({ memberAuditCount }),
  setBbsAuditCount: bbsAuditCount => set({ bbsAuditCount }),
  setMemberKeyword: memberKeyword => set({ memberKeyword }),
}));
