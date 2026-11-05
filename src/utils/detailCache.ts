const MAX_ENTRIES = 50;
const cache = new Map<string, any>();

/** 列表 → 详情跳转前写入列表项原始数据 */
export function setDetailCache(id: string, data: any) {
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(id, data);
}

/** 详情页读取缓存（不删除，允许重复进入） */
export function getDetailCache(id: string): any {
  return cache.get(id);
}

export function removeDetailCache(id: string) {
  cache.delete(id);
}
