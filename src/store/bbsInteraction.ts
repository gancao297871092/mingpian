import { create } from 'zustand';

interface BbsInteractionState {
  likeMap: Record<string, { isLiked: boolean; likeCount: number }>;
  favMap: Record<string, { isFaved: boolean; favCount: number }>;
  /** 已删除的动态 id：详情页删除成功后标记，各列表页订阅过滤（避免返回时列表还在） */
  deletedMap: Record<string, true>;
  setLike: (id: string, v: { isLiked: boolean; likeCount: number }) => void;
  setFav: (id: string, v: { isFaved: boolean; favCount: number }) => void;
  markDeleted: (id: string) => void;
}

export const useBbsInteractionStore = create<BbsInteractionState>()(set => ({
  likeMap: {},
  favMap: {},
  deletedMap: {},
  setLike: (id, v) => set(state => ({ likeMap: { ...state.likeMap, [id]: v } })),
  setFav: (id, v) => set(state => ({ favMap: { ...state.favMap, [id]: v } })),
  markDeleted: id => set(state => ({ deletedMap: { ...state.deletedMap, [id]: true } })),
}));
