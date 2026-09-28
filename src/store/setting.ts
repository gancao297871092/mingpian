import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/utils/storage';

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

export type DefaultHome = 'square' | 'link';

interface SettingState {
  /** 打开视频时默认静音 */
  videoMuted: boolean;
  /** 默认首页 */
  defaultHome: DefaultHome;
  /** 资料公开范围 */
  publicBbs: boolean;
  publicLike: boolean;
  publicFavorite: boolean;
  publicFollow: boolean;
  publicFans: boolean;
  /** AI 产业连接 */
  aiConnect: boolean;
  /** 分析我的公开动态 */
  analyzeBbs: boolean;
  /** 为我推荐企业与机会 */
  recommendCompany: boolean;
  setValue: <K extends keyof SettingValues>(key: K, value: SettingValues[K]) => void;
}

interface SettingValues {
  videoMuted: boolean;
  defaultHome: DefaultHome;
  publicBbs: boolean;
  publicLike: boolean;
  publicFavorite: boolean;
  publicFollow: boolean;
  publicFans: boolean;
  aiConnect: boolean;
  analyzeBbs: boolean;
  recommendCompany: boolean;
}

export const useSettingStore = create<SettingState>()(
  persist(
    set => ({
      videoMuted: false,
      defaultHome: 'square',
      publicBbs: true,
      publicLike: false,
      publicFavorite: false,
      publicFollow: false,
      publicFans: false,
      aiConnect: true,
      analyzeBbs: true,
      recommendCompany: true,
      setValue: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'setting-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
