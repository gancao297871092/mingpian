import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingArrowIcon } from './settingsIcons';
import { CertCompanyIcon, CertJobIcon, CertPerkIcon, CertRealIcon } from './subIcons';

const PERKS = ['独有标识', '一步认证', '职刻点亮', '权威背书'];

interface CertItem {
  key: 'authRealCard' | 'authPosition' | 'authCompany';
  label: string;
  color: string;
  icon: React.ReactNode;
}

/** 76.认证中心 */
export default function CertificationCenter() {
  const userInfo = useUserStore(s => s.userInfo);
  const wqUser = userInfo?.wqUser;

  const items: CertItem[] = [
    { key: 'authRealCard', label: '实名认证', color: '#36BE69', icon: <CertRealIcon /> },
    { key: 'authPosition', label: '职业认证', color: '#F2722C', icon: <CertJobIcon /> },
    { key: 'authCompany', label: '企业认证', color: '#2962D4', icon: <CertCompanyIcon /> },
  ];

  const realName = wqUser?.nameZh || wqUser?.nickname || '';

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={require('@/assets/my/settings/cert-glow.png')} style={styles.glow} resizeMode="contain" />
        <View style={styles.hero}>
          <Image source={require('@/assets/my/settings/cert-illustration.png')} style={styles.illustration} resizeMode="contain" />
          <Text style={styles.heroTitle}>认证中心</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>提升身份真实性</Text>
          </View>
        </View>

        <View style={styles.perkCard}>
          {PERKS.map(p => (
            <View key={p} style={styles.perkItem}>
              <CertPerkIcon />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.certCard}>
          {items.map((item, i) => (
            <React.Fragment key={item.key}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.certRow}
                onPress={() => Toast.show({ type: 'info', text1: '认证申请流程开发中' })}
              >
                <View style={[styles.certIconWrap, { backgroundColor: item.color }]}>{item.icon}</View>
                <Text style={styles.certLabel}>{item.label}</Text>
                <View style={styles.certRight}>
                  <Text style={styles.certStatus}>{wqUser?.[item.key] ? '已认证' : '未认证'}</Text>
                  <SettingArrowIcon color="#6C6C6C" />
                </View>
              </TouchableOpacity>
              {item.key === 'authRealCard' && !!wqUser?.authRealCard && (
                <View style={styles.realInfoCard}>
                  <View style={styles.realInfoRow}>
                    <Text style={styles.realInfoLabel}>姓名</Text>
                    <Text style={styles.realInfoValue}>{realName}</Text>
                  </View>
                  <View style={styles.realInfoRow}>
                    <Text style={styles.realInfoLabel}>认证方式</Text>
                    <Text style={styles.realInfoValue}>阿里云三要素核验，安全快捷</Text>
                  </View>
                  <View style={styles.realInfoRow}>
                    <Text style={styles.realInfoLabel}>认证价值</Text>
                    <Text style={[styles.realInfoValue, styles.realInfoFlex]}>
                      实名认证后，将自动显示您的真实姓名，显著提升名片的可信度与辨识度，为拓展人脉奠定坚实基础。
                    </Text>
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  glow: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: scaleSizeW(302),
    height: scaleSizeW(302),
    opacity: 0.2,
  },
  hero: {
    alignItems: 'center',
    marginTop: scaleSizeH(24),
  },
  illustration: {
    width: scaleSizeW(170),
    height: scaleSizeH(132),
  },
  heroTitle: {
    fontSize: setSpText(22),
    fontWeight: '600',
    color: '#000000',
    marginTop: scaleSizeH(2),
  },
  heroBadge: {
    marginTop: scaleSizeH(8),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  heroBadgeText: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(32),
    paddingHorizontal: scaleSizeW(13),
    height: scaleSizeH(100),
    borderRadius: scaleSizeW(10),
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FEF4E8',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  perkText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#4C3416',
  },
  certCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(14),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    paddingVertical: scaleSizeH(10),
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: scaleSizeW(14),
    marginVertical: scaleSizeH(10),
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
  },
  certIconWrap: {
    width: scaleSizeW(35),
    height: scaleSizeW(35),
    borderRadius: scaleSizeW(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  certLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(18),
  },
  certRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  certStatus: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(18),
  },
  realInfoCard: {
    marginHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    gap: scaleSizeH(10),
  },
  realInfoRow: {
    flexDirection: 'row',
    gap: scaleSizeW(24),
  },
  realInfoLabel: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
    width: scaleSizeW(48),
  },
  realInfoValue: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  realInfoFlex: {
    flex: 1,
  },
});
