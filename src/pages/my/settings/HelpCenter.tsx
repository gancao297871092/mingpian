import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, SectionTitle, SettingCard, SettingDivider } from './components';
import { MailIcon, PhoneIcon } from './subIcons';

const SERVICE_PHONE = '023-68163883';
const SERVICE_EMAIL = 'jiaruntouzi@qq.com';

const BRANCHES = [
  { tag: '总部', address: '重庆市九龙坡区智博中心18层', phone: '023-68163883' },
  { tag: '四川/陕西区域', address: '四川省成都市成华区羊子山路88号融景城写字楼3栋', phone: '18580768454' },
  { tag: '重庆/贵州区域', address: '重庆市九龙坡区智博中心18层', phone: '18983176222' },
  { tag: '总部业务部', address: '重庆市九龙坡区智博中心18层', phone: '18996271777' },
];

/** 82.帮助与客服 */
export default function HelpCenter() {
  const call = (phone: string) => Linking.openURL(`tel:${phone}`).catch(() => {});

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SettingCard>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>客服电话</Text>
            <Text style={styles.contactValue}>{SERVICE_PHONE}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => call(SERVICE_PHONE)}>
              <PhoneIcon />
            </TouchableOpacity>
          </View>
          <SettingDivider />
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>电子邮箱</Text>
            <Text style={styles.contactValue}>{SERVICE_EMAIL}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(`mailto:${SERVICE_EMAIL}`).catch(() => {})}>
              <MailIcon />
            </TouchableOpacity>
          </View>
        </SettingCard>

        <SectionTitle title="服务网点" />
        {BRANCHES.map(b => (
          <View key={b.tag} style={styles.branchCard}>
            <View style={styles.branchTag}>
              <Text style={styles.branchTagText}>{b.tag}</Text>
            </View>
            <Text style={styles.branchAddress}>{b.address}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => call(b.phone)}>
              <Text style={styles.branchPhone}>{b.phone}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(40),
  },
  contactRow: {
    height: scaleSizeH(51),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    gap: scaleSizeW(10),
  },
  contactLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  contactValue: {
    marginLeft: 'auto',
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
  },
  branchCard: {
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    gap: scaleSizeH(12),
  },
  branchTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  branchTagText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
  },
  branchAddress: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  branchPhone: {
    fontSize: setSpText(14),
    color: BLUE,
    lineHeight: scaleSizeH(14),
  },
});
