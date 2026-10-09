import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import {
  SettingAboutIcon,
  SettingAccountIcon,
  SettingArrowIcon,
  SettingClearIcon,
  SettingGeneralIcon,
  SettingHelpIcon,
  SettingLogoutIcon,
  SettingPrivacyIcon,
  SettingSwitchIcon,
} from './settingsIcons';
import type { RootStackParamList } from '@/route/map';

interface RowItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function Section({ title, rows }: { title?: string; rows: RowItem[] }) {
  return (
    <View style={styles.section}>
      {!!title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={row.onPress}>
              {row.icon}
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={styles.rowArrow}>
                <SettingArrowIcon />
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export default function Settings() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useUserStore(s => s.logout);

  const onClearCache = () => {
    Alert.alert('清理缓存', '确定要清理本地缓存吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          await Promise.all([
            ExpoImage.clearMemoryCache().catch(() => false),
            ExpoImage.clearDiskCache().catch(() => false),
          ]);
          Toast.show({ type: 'success', text1: '缓存已清理' });
        },
      },
    ]);
  };

  const onSwitchAccount = () => {
    Alert.alert('切换账号', '确定要切换账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'login' }] });
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出登录',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'login' }] });
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Section
          title="账号"
          rows={[
            { label: '账号与安全', icon: <SettingAccountIcon />, onPress: () => navigation.navigate('accountSecurity') },
            { label: '隐私与权限', icon: <SettingPrivacyIcon />, onPress: () => navigation.navigate('privacySettings') },
          ]}
        />
        <Section
          title="通用"
          rows={[
            { label: '通用设置', icon: <SettingGeneralIcon />, onPress: () => navigation.navigate('generalSettings') },
            { label: '清理缓存', icon: <SettingClearIcon />, onPress: onClearCache },
          ]}
        />
        <Section
          title="关于"
          rows={[
            { label: '帮助与客服', icon: <SettingHelpIcon />, onPress: () => navigation.navigate('helpCenter') },
            { label: '关于联诚采信', icon: <SettingAboutIcon />, onPress: () => navigation.navigate('aboutUs') },
          ]}
        />
        <Section
          rows={[
            { label: '切换账号', icon: <SettingSwitchIcon />, onPress: onSwitchAccount },
            { label: '退出登录', icon: <SettingLogoutIcon />, onPress: onLogout },
          ]}
        />
        <Text style={styles.footerLinks}>
          {'《个人信息收集清单》《第三方信息共享清单》\n《联诚采信用户服务协议》《联诚采信隐私政策》'}
        </Text>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  section: {
    marginTop: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(16),
  },
  sectionTitle: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginBottom: scaleSizeH(10),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  row: {
    height: scaleSizeH(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
  },
  rowLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  rowArrow: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginLeft: scaleSizeW(46),
  },
  footerLinks: {
    marginTop: scaleSizeH(30),
    fontSize: setSpText(12),
    lineHeight: scaleSizeH(20),
    color: '#2962D4',
    textAlign: 'center',
  },
});
