import { create } from 'zustand';
import type { SelectedBbs } from '@/utils/selectBbsBridge';

export const MAX_SELECT_BBS = 3;

interface SelectBbsState {
  selected: SelectedBbs[];
  /** 进入选择流程时初始化（回显已选） */
  init: (list: SelectedBbs[]) => void;
  /** 返回 added/removed/full（full 表示已达上限未变更） */
  toggle: (item: SelectedBbs) => 'added' | 'removed' | 'full';
  remove: (id: string) => void;
  clear: () => void;
}

/** 选择动态（选择动态页 + 搜索动态页共享选中态，确认后回传并清空） */
export const useSelectBbsStore = create<SelectBbsState>()((set, get) => ({
  selected: [],
  init: list => set({ selected: list.slice(0, MAX_SELECT_BBS) }),
  toggle: item => {
    const cur = get().selected;
    if (cur.some(i => i.id === item.id)) {
      set({ selected: cur.filter(i => i.id !== item.id) });
      return 'removed';
    }
    if (cur.length >= MAX_SELECT_BBS) return 'full';
    set({ selected: [...cur, item] });
    return 'added';
  },
  remove: id => set(s => ({ selected: s.selected.filter(i => i.id !== id) })),
  clear: () => set({ selected: [] }),
}));
