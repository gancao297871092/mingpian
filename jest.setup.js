/* eslint-disable no-undef */

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  const createInstance = () => ({
    set: (key, value) => store.set(key, value),
    getString: key => store.get(key),
    getNumber: key => store.get(key),
    getBoolean: key => store.get(key),
    remove: key => store.delete(key),
    clearAll: () => store.clear(),
  });
  return {
    createMMKV: createInstance,
    MMKV: createInstance,
  };
});

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageTag: 'zh-CN' }],
}));
