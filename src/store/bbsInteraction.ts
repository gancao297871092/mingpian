import { create } from 'zustand';

interface BbsInteractionState {
  likeMap: Record<string, { isLiked: boolean; likeCount: number }>;
  favMap: Record<string, { isFaved: boolean; favCount: number }>;
  setLike: (id: string, v: { isLiked: boolean; likeCount: number }) => void;
  setFav: (id: string, v: { isFaved: boolean; favCount: number }) => void;
}

export const useBbsInteractionStore = create<BbsInteractionState>()(set => ({
  likeMap: {},
  favMap: {},
  setLike: (id, v) => set(state => ({ likeMap: { ...state.likeMap, [id]: v } })),
  setFav: (id, v) => set(state => ({ favMap: { ...state.favMap, [id]: v } })),
}));
