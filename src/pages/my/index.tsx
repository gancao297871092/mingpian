import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import i18n, { setLocale, currentLocale, LocaleKey } from '@/language';
import { useUserStore } from '@/store/user';
import { useTheme, useThemeMode, type ThemeMode } from '@/theme';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const LOCALES: { key: LocaleKey; label: string }[] = [
  { key: 'zh_CN', label: '简体中文' },
  { key: 'zh_TW', label: '繁體中文' },
  { key: 'en_US', label: 'English' },
];

const THEME_MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: '跟随系统' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
];

export default function My() {
  const { token, userInfo, logout } = useUserStore();
  const locale = currentLocale();
  const theme = useTheme();
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();

  const renderOptions = <T extends string>(
    options: { key: T; label: string }[],
    activeKey: T,
    onPress: (key: T) => void,
  ) => (
    <View style={styles.optionRow}>
      {options.map(item => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.optionBtn,
            { borderColor: theme.border },
            item.key === activeKey && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => onPress(item.key)}
        >
          <Text
            style={[
              styles.optionText,
              { color: theme.text },
              item.key === activeKey && styles.optionTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{i18n.t('我的')}</Text>
        <Text style={[styles.info, { color: theme.subText }]}>
          {token ? `已登录：${userInfo?.nickname ?? '-'}` : '未登录'}
        </Text>
        {token ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={logout}>
            <Text style={styles.btnText}>{i18n.t('退出登录')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>主题 / Theme</Text>
        {renderOptions<ThemeMode>(THEME_MODES, themeMode, setThemeMode)}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>语言 / Language</Text>
        {renderOptions<LocaleKey>(LOCALES, locale, setLocale)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scaleSizeW(15),
  },
  section: {
    marginBottom: scaleSizeH(24),
  },
  sectionTitle: {
    fontSize: setSpText(16),
    fontWeight: 'bold',
    marginBottom: scaleSizeH(12),
  },
  info: {
    fontSize: setSpText(13),
    marginBottom: scaleSizeH(12),
  },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeH(8),
    borderRadius: scaleSizeH(8),
  },
  btnText: {
    fontSize: setSpText(13),
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  optionBtn: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(8),
    borderRadius: scaleSizeH(8),
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: setSpText(12),
  },
  optionTextActive: {
    color: '#fff',
  },
});
