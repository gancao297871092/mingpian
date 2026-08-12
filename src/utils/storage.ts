import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'app-storage' });

export const storageUtils = {
  getString: (key: string) => storage.getString(key),
  getNumber: (key: string) => storage.getNumber(key),
  getBoolean: (key: string) => storage.getBoolean(key),
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | number | boolean) => storage.set(key, value),
  setObject: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
  remove: (key: string) => storage.remove(key),
  clearAll: () => storage.clearAll(),
};
