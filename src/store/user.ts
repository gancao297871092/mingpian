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
  nickname?: string;
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
  /** 手机号（/user/base/info 返回，登录手机号自动绑定落库 wq_user.mobile） */
  mobile?: string;
  /** 微信小程序/APP 微信 openid（非空即已绑定微信；无昵称字段，仅作绑定态展示） */
  xcxOpenid?: string;
  position?: string;
  nameZh?: string;
  nameEn?: string;
  /** 性别：0未知 1男 2女 */
  gender?: number;
  /** 生日（秒级时间戳，后端暂不持久化修改） */
  birthday?: number;
  cpId?: number;
  cpName?: string;
  /** 所属企业 Logo（待后端在用户聚合信息中补充） */
  cpAvatar?: string;
  /** 隐私开关（1公开 0关闭）：我的动态 */
  bbsShow?: number;
  /** 我的点赞 */
  isLikePrivate?: number;
  /** 我的收藏 */
  isFavoritePrivate?: number;
  /** 我的关注 */
  isFollowShow?: number;
  /** 我的粉丝 */
  isFansShow?: number;
  /** AI产业连接开关（主开关）：0关 1开（默认），控制新发动态默认参与AI分析 */
  aiConnectDefault?: number;
  /** 分析我的公开动态开关：0关 1开（默认） */
  aiAnalyzeBbs?: number;
  /** 为我推荐企业与机会开关：0关 1开（默认） */
  aiRecommendOpp?: number;
  /** 实名认证状态：0未认证 1已认证 2待审核 3未通过（小程序认证中心以此为判断依据） */
  authStatus?: number;
  /** 真实姓名（实名认证通过后返回） */
  realName?: string;
}

export interface UserInfo {
  wqUser?: WqUser;
  followCount?: number;
  fansCount?: number;
  /** 互关数（后端暂未返回时前端展示 '-'） */
  mutualFollowCount?: number;
  bbsCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  /** 我的名片数量（有效名片 status=1） */
  cardCount?: number;
  /** 名片总数量上限（base_config USER_MAX_LIMIT，未配置或非法时为 0） */
  cardMaxLimit?: number;
  /** 收藏的名片数量 */
  favoriteCardCount?: number;
  /** 发布的动态总数量（不含草稿与已删除） */
  bbsTotalCount?: number;
  /** 动态获得的总点赞数量 */
  totalLikeCount?: number;
  /** 动态被收藏的总数量 */
  totalFavoriteCount?: number;
  cpId?: number;
  cpName?: string;
  /** 所属企业 Logo（待后端在用户聚合信息中补充） */
  cpAvatar?: string;
  /** 是否企业管理员（1是 0否） */
  isManager?: number;
  /** 是否企业超级管理员（1是 0否） */
  isMaster?: number;
  /** 企业内职位名称 */
  position?: string;
  /** 企业名片公开开关（1公开 0关闭） */
  isCpShow?: number;
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
