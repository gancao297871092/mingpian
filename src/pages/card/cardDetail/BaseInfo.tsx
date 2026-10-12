import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { PhoneBlueIcon } from './icons';

interface BaseInfoProps {
  userCard: any;
  userInfo: any;
}

/** 基本信息 tab（figma 预览1）：所在公司 + 联系方式 */
export default function BaseInfo({ userCard, userInfo }: BaseInfoProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const wqUser = userInfo?.wqUser;
  const address = `${userCard?.province || ''}${userCard?.city || ''}${userCard?.district || ''}${userCard?.address || ''}`;

  const contacts: { label: string; value: string; tel?: boolean }[] = [
    { label: '电话', value: userCard?.phone || '', tel: true },
    { label: '传真', value: userCard?.fax || '' },
    { label: '座机', value: userCard?.telNumber || '', tel: true },
    { label: '邮箱', value: userCard?.email || '' },
    { label: '地址', value: address },
  ].filter((c) => !!c.value);

  return (
    <View style={styles.container}>
      {!!userInfo?.cpId && (
        <>
          <Text style={styles.sectionLabel}>所在公司</Text>
          <TouchableOpacity
            style={styles.companyRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('companyPage', { id: userInfo.cpId, userId: wqUser?.id })}
          >
            {wqUser?.avatar ? (
              <ExpoImage source={{ uri: wqUser.avatar }} style={styles.companyLogo} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.companyLogo, styles.companyLogoEmpty]} />
            )}
            <View style={styles.companyTextCol}>
              <Text style={styles.companyName} numberOfLines={1}>
                {userInfo.cpName}
              </Text>
              {!!userInfo?.position && (
                <Text style={styles.companyPosition} numberOfLines={1}>
                  {userInfo.position}
                </Text>
              )}
            </View>
            <Text style={styles.companyLink}>查看企业主页</Text>
            <ChevronRightIcon />
          </TouchableOpacity>
        </>
      )}

      {contacts.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>联系方式</Text>
          <View style={styles.contactCol}>
            {contacts.map((c) => (
              <View key={c.label} style={styles.contactRow}>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactValue}>{c.value}</Text>
                {c.tel && (
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={() => Linking.openURL(`tel:${c.value}`).catch(() => {})}
                  >
                    <PhoneBlueIcon />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(24),
  },
  sectionLabel: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeW(9),
  },
  companyLogo: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyLogoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  companyTextCol: {
    flex: 1,
    gap: scaleSizeW(4),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
  companyPosition: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeW(12),
  },
  companyLink: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
  },
  contactCol: {
    marginTop: scaleSizeW(6),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeW(40),
    gap: scaleSizeW(13),
  },
  contactLabel: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#6C6C6C',
  },
  contactValue: {
    flex: 1,
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
});
