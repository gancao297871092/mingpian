import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SafeView from '@/components/SafeView';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingArrowIcon } from './settingsIcons';
import { CertCompanyIcon, CertJobIcon, CertPerkArrowIcon, CertPerkBriefcaseIcon, CertPerkIcon, CertPerkMedalIcon, CertRealIcon } from './subIcons';

const PERKS: { label: string; icon: React.ReactNode }[] = [
  { label: '独有标识', icon: <CertPerkIcon /> },
  { label: '一步认证', icon: <CertPerkArrowIcon /> },
  { label: '职刻点亮', icon: <CertPerkBriefcaseIcon /> },
  { label: '权威背书', icon: <CertPerkMedalIcon /> },
];

type CertKey = 'authRealCard' | 'authPosition' | 'authCompany';

interface CertItem {
  key: CertKey;
  label: string;
  color: string;
  icon: React.ReactNode;
  /** 展开后的占位说明文字（待手动调整） */
  expandText: string;
}

/** 76.认证中心 */
export default function CertificationCenter() {
  const userInfo = useUserStore(s => s.userInfo);
  const wqUser = userInfo?.wqUser;
  const [expandedKey, setExpandedKey] = useState<CertKey | null>(null);

  const items: CertItem[] = [
    {
      key: 'authRealCard',
      label: '实名认证',
      color: '#36BE69',
      icon: <CertRealIcon />,
      expandText:
        '实名认证后，将自动显示您的真实姓名，显著提升名片的可信度与辨识度，为拓展人脉奠定坚实基础。（占位文字，待调整）',
    },
    {
      key: 'authPosition',
      label: '职业认证',
      color: '#F2722C',
      icon: <CertJobIcon />,
      expandText: '职业认证说明占位文字：认证后可展示职业身份标识，提升专业形象与合作信任度。（待调整）',
    },
    {
      key: 'authCompany',
      label: '企业认证',
      color: '#2962D4',
      icon: <CertCompanyIcon />,
      expandText: '企业认证说明占位文字：认证后可获得企业官方标识，解锁企业名片与企业动态等能力。（待调整）',
    },
  ];

  const toggle = (key: CertKey) => setExpandedKey(prev => (prev === key ? null : key));

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

        <LinearGradient
          colors={['#FEF4E8', '#FFE4C2']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.perkCard}
        >
          {PERKS.map((p, i) => (
            <View key={p.label} style={[styles.perkItem, i === PERKS.length - 1 && styles.perkItemLast, i=== 0 && styles.perkItemFirst]}>
              {p.icon}
              <Text style={[styles.perkText, i === PERKS.length - 1 && styles.perkTextLast]}>{p.label}</Text>
            </View>
          ))}
        </LinearGradient>

        <View style={styles.certCard}>
          {items.map((item, i) => {
            const expanded = expandedKey === item.key;
            return (
              <React.Fragment key={item.key}>
                {i > 0 && <View style={styles.divider} />}
                <TouchableOpacity activeOpacity={0.7} style={styles.certRow} onPress={() => toggle(item.key)}>
                  <View style={[styles.certIconWrap, { backgroundColor: item.color }]}>{item.icon}</View>
                  <Text style={styles.certLabel}>{item.label}</Text>
                  <View style={styles.certRight}>
                    <Text style={styles.certStatus}>{wqUser?.[item.key] ? '已认证' : '未认证'}</Text>
                    <View style={[styles.arrow, expanded && styles.arrowExpanded]}>
                      <SettingArrowIcon color="#6C6C6C" />
                    </View>
                  </View>
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.expandCard}>
                    <Text style={styles.expandText}>{item.expandText}</Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
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
    alignItems: 'flex-start',
    gap: scaleSizeW(27),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(32),
    height: scaleSizeH(100),
    borderRadius: scaleSizeW(10),
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeH(40),
    flex: 1,
  },
  perkItemLast: {
    marginRight: scaleSizeW(10),
  },
  perkItemFirst:{
    marginLeft: scaleSizeW(10),
  },
  perkText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#4C3416',
  },
  perkTextLast: {
    fontWeight: '400',
  },
  certCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: -scaleSizeH(56),
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
  arrow: {
    transform: [{ rotate: '0deg' }],
  },
  arrowExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  expandCard: {
    marginHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  expandText: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
});
