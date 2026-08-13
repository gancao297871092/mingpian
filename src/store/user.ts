import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, storageUtils } from '@/utils/storage';

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

export interface WqUser {
  id?: number;
  username?: string;
  avatar?: string;
  des?: string;
  authRealCard?: boolean;
  authCompany?: boolean;
  authPosition?: boolean;
  userType?: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  email?: string;
  phone?: string;
  position?: string;
  nameZh?: string;
  nameEn?: string;
  cpId?: number;
  cpName?: string;
}

export interface UserInfo {
  wqUser?: WqUser;
  followCount?: number;
  fansCount?: number;
  bbsCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  cpId?: number;
  cpName?: string;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
  setToken: (token: string | null) => void;
  setUserInfo: (info: UserInfo | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      token: null,
      userInfo: null,
      setToken: token => {
        if (token) {
          storageUtils.set('token', token);
        } else {
          storageUtils.remove('token');
        }
        set({ token });
      },
      setUserInfo: userInfo => {
        if (userInfo) {
          storageUtils.set('userInfo', JSON.stringify(userInfo));
        } else {
          storageUtils.remove('userInfo');
        }
        set({ userInfo });
      },
      logout: () => {
        storageUtils.remove('token');
        set({ token: null, userInfo: null });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
