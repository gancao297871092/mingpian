import { create } from 'zustand';

export type CompanyRole = 'admin' | 'member' | 'none';

interface CompanyState {
  role: CompanyRole;
  memberAuditCount: number;
  memberKeyword: string;
  setRole: (role: CompanyRole) => void;
  setMemberAuditCount: (count: number) => void;
  setMemberKeyword: (keyword: string) => void;
}

export const useCompanyStore = create<CompanyState>(set => ({
  role: 'admin',
  memberAuditCount: 2,
  memberKeyword: '',
  setRole: role => set({ role }),
  setMemberAuditCount: memberAuditCount => set({ memberAuditCount }),
  setMemberKeyword: memberKeyword => set({ memberKeyword }),
}));
