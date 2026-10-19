import { storageUtils } from './storage';

export interface CachedUserHome {
  /** 他人主页资料（UserInfo 结构，对齐 /user/home/info 组装后的数据） */
  profile: any;
  /** 当前登录用户是否已关注对方 */
  isFollowed: boolean;
}

const KEY = 'user-home-cache';
const MAX_ENTRIES = 20;

type CacheMap = Record<string, CachedUserHome>;

function readAll(): CacheMap {
  return storageUtils.getObject<CacheMap>(KEY) ?? {};
}

/** 读取某个用户的主页缓存（无则 null） */
export function getUserHomeCache(userId: number): CachedUserHome | null {
  return readAll()[String(userId)] ?? null;
}

/** 写入/覆盖某个用户的主页缓存（LRU：超出上限淘汰最早写入的） */
export function setUserHomeCache(userId: number, entry: CachedUserHome) {
  const all = readAll();
  const key = String(userId);
  delete all[key];
  all[key] = entry;
  const keys = Object.keys(all);
  if (keys.length > MAX_ENTRIES) {
    for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) {
      delete all[k];
    }
  }
  storageUtils.setObject(KEY, all);
}
