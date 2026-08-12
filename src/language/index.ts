import { I18n } from 'i18n-js';
import { getLocales } from 'react-native-localize';
import { storageUtils } from '@/utils/storage';
import cn from './cn';
import tw from './tw';
import us from './us';

export type LocaleKey = 'zh_CN' | 'zh_TW' | 'en_US';

const translations = {
  zh_CN: cn,
  zh_TW: tw,
  en_US: us,
};

const i18n = new I18n(translations);
i18n.defaultLocale = 'zh_CN';
i18n.enableFallback = true;

export const setLocale = (locale: LocaleKey) => {
  i18n.locale = locale;
  storageUtils.set('app_locale', locale);
};

export const initLocale = () => {
  const saved = storageUtils.getString('app_locale') as LocaleKey | undefined;
  if (saved && translations[saved]) {
    i18n.locale = saved;
    return;
  }
  const deviceLocale = getLocales()[0]?.languageTag ?? 'zh-CN';
  if (deviceLocale.includes('TW') || deviceLocale.includes('HK')) {
    i18n.locale = 'zh_TW';
  } else if (deviceLocale.startsWith('zh')) {
    i18n.locale = 'zh_CN';
  } else {
    i18n.locale = 'en_US';
  }
};

export const currentLocale = (): LocaleKey => i18n.locale as LocaleKey;

initLocale();

export default i18n;
