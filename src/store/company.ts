import { create } from 'zustand';
import { CAP_CARDS, type CapCard } from '@/data/company';

export type CompanyRole = 'admin' | 'member' | 'none';

interface CompanyState {
  role: CompanyRole;
  memberAuditCount: number;
  memberKeyword: string;
  /** 能力卡（新功能，暂无后端接口，本地状态管理） */
  capCards: CapCard[];
  setRole: (role: CompanyRole) => void;
  setMemberAuditCount: (count: number) => void;
  setMemberKeyword: (keyword: string) => void;
  addCapCard: (card: CapCard) => void;
  updateCapCard: (card: CapCard) => void;
  removeCapCard: (id: string) => void;
}

export const useCompanyStore = create<CompanyState>(set => ({
  role: 'admin',
  memberAuditCount: 2,
  memberKeyword: '',
  capCards: CAP_CARDS,
  setRole: role => set({ role }),
  setMemberAuditCount: memberAuditCount => set({ memberAuditCount }),
  setMemberKeyword: memberKeyword => set({ memberKeyword }),
  addCapCard: card => set(s => ({ capCards: [card, ...s.capCards] })),
  updateCapCard: card => set(s => ({ capCards: s.capCards.map(c => (c.id === card.id ? card : c)) })),
  removeCapCard: id => set(s => ({ capCards: s.capCards.filter(c => c.id !== id) })),
}));
