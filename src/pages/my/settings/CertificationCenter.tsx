import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingArrowIcon } from './settingsIcons';
import { CertCompanyIcon, CertJobIcon, CertPerkArrowIcon, CertPerkBriefcaseIcon, CertPerkIcon, CertPerkMedalIcon, CertRealIcon } from './subIcons';
import type { RootStackParamList } from '@/route/map';

const PERKS: { label: string; icon: React.ReactNode }[] = [
  { label: '独有标识', icon: <CertPerkIcon /> },
  { label: '一步认证', icon: <CertPerkArrowIcon /> },
  { label: '职刻点亮', icon: <CertPerkBriefcaseIcon /> },
  { label: '权威背书', icon: <CertPerkMedalIcon /> },
];

type CertKey = 'real' | 'position' | 'company';

/** 实名认证状态枚举（对齐小程序 authStatusEnums） */
const AUTH_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: '未认证', color: '#EF4444' },
  1: { label: '已认证', color: '#6C6C6C' },
  2: { label: '待审核', color: '#F2722C' },
  3: { label: '未通过', color: '#EF4444' },
};

/** 各认证项的操作跳转与协议（对齐旧版 certification.vue） */
const CERT_ACTION: Record<CertKey, { route: keyof RootStackParamList; agreement?: { type: string; name: string } }> = {
  real: { route: 'companyRealName', agreement: { type: 'cardSure', name: '《联诚采信实名认证服务协议》' } },
  position: { route: 'companyJoin', agreement: { type: 'cpSure', name: '《联诚采信企业认证服务协议》' } },
  company: { route: 'companyCert', agreement: { type: 'cpSure', name: '《联诚采信企业认证服务协议》' } },
};

interface CertItem {
  key: CertKey;
  label: string;
  color: string;
  icon: React.ReactNode;
  /** 展开面板信息行（认证后首行为 姓名/职位/企业） */
  rows: { label: string; value: string }[];
  /** 认证后额外展示的首行（原型 certification-center verified 态） */
  verifiedRow?: { label: string; value: string };
}

/** 76.认证中心（文案对齐原型 certification-center，样式对齐 figma 76） */
export default function CertificationCenter() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userInfo = useUserStore(s => s.userInfo);
  const setUserInfo = useUserStore(s => s.setUserInfo);
  const wqUser = userInfo?.wqUser;
  const [expandedKey, setExpandedKey] = useState<CertKey | null>(null);

  // 进入页面刷新认证状态（对齐旧版 onShow 拉取 /user/base/info）
  useFocusEffect(
    useCallback(() => {
      API.user.info()
        .then(res => res.data && setUserInfo(res.data))
        .catch(() => {});
    }, [setUserInfo]),
  );

  const toggle = (key: CertKey) => setExpandedKey(prev => (prev === key ? null : key));

  const authStatus = wqUser?.authStatus ?? 0;

  /** 职位/企业认证以实名认证为前提，未实名先拦截提示（同小程序 onTipsAuthRealCard） */
  const onAction = (key: CertKey) => {
    if (key !== 'real' && authStatus !== 1) {
      AppAlert.alert('提示', '您还未实名认证，是否进行认证!', [
        { text: '取消', style: 'cancel' },
        { text: '去认证', onPress: () => navigation.navigate('companyRealName') },
      ]);
      return;
    }
    navigation.navigate(CERT_ACTION[key].route as never);
  };
  const hasCompany = !!userInfo?.cpId;
  /** 认证判断与小程序一致：实名=wqUser.authStatus，职业/企业=userInfo.cpId */
  const certified: Record<CertKey, boolean> = {
    real: authStatus === 1,
    position: hasCompany,
    company: hasCompany,
  };
  const statusOf = (key: CertKey): { label: string; color: string } =>
    key === 'real'
      ? AUTH_STATUS[authStatus] ?? AUTH_STATUS[0]
      : hasCompany
        ? { label: '已认证', color: '#6C6C6C' }
        : { label: '未认证', color: '#EF4444' };

  const items: CertItem[] = [
    {
      key: 'real',
      label: '实名认证',
      color: '#36BE69',
      icon: <CertRealIcon />,
      verifiedRow: { label: '姓名', value: wqUser?.realName || '' },
      rows: [
        { label: '认证方式', value: '阿里云三要素核验，安全快捷' },
        { label: '认证价值', value: '实名认证后，将自动显示您的真实姓名，显著提升名片的可信度与辨识度，为拓展人脉奠定坚实基础。' },
      ],
    },
    {
      key: 'position',
      label: '职位认证',
      color: '#F2722C',
      icon: <CertJobIcon />,
      verifiedRow: { label: '职位', value: userInfo?.isManager ? '管理员' : userInfo?.position || '' },
      rows: [
        { label: '认证条件', value: '完成实名认证' },
        { label: '认证方式', value: '搜索并申请加入任职企业，可同时选择一个或多个职位。' },
        { label: '认证价值', value: '经过认证的职位信息将在个人主页醒目展示，如同您的专业“身份证”，有效增强在商务社交中的专业可信度。' },
      ],
    },
    {
      key: 'company',
      label: '企业认证',
      color: '#2962D4',
      icon: <CertCompanyIcon />,
      verifiedRow: { label: '企业', value: userInfo?.cpName || '' },
      rows: [
        { label: '认证条件', value: '完成实名认证' },
        { label: '认证方式', value: '通过阿里云企业四要素核验，验证企业信息及法人身份。' },
        { label: '认证价值', value: '通过验证企业主体的真实性，极大提升您在招标、洽谈等场景中的公信力与透明度，是获取关键合作与重大项目信任的核心凭证。' },
      ],
    },
  ];

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
            const isCertified = certified[item.key];
            const rows = isCertified && item.verifiedRow?.value ? [item.verifiedRow, ...item.rows] : item.rows;
            const itemAction = CERT_ACTION[item.key];
            return (
              <React.Fragment key={item.key}>
                {i > 0 && <View style={styles.divider} />}
                <TouchableOpacity activeOpacity={0.7} style={styles.certRow} onPress={() => toggle(item.key)}>
                  <View style={[styles.certIconWrap, { backgroundColor: item.color }]}>{item.icon}</View>
                  <Text style={styles.certLabel}>{item.label}</Text>
                  <View style={styles.certRight}>
                    <Text style={[styles.certStatus, { color: statusOf(item.key).color }]}>{statusOf(item.key).label}</Text>
                    <View style={[styles.arrow, expanded && styles.arrowExpanded]}>
                      <SettingArrowIcon color="#6C6C6C" />
                    </View>
                  </View>
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.expandWrap}>
                    <View style={styles.expandCard}>
                      {rows.map(r => (
                        <View key={r.label} style={styles.expandRow}>
                          <Text style={styles.expandLabel}>{r.label}</Text>
                          <Text style={styles.expandValue}>{r.value}</Text>
                        </View>
                      ))}
                    </View>
                    {!isCertified && (
                      <View style={styles.actionArea}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.actionBtn}
                          onPress={() => onAction(item.key)}
                        >
                          <Text style={styles.actionBtnText}>立即认证</Text>
                        </TouchableOpacity>
                        {itemAction.agreement && (
                          <Text style={styles.agreementText}>
                            点击立即认证，即同意
                            <Text
                              style={styles.agreementLink}
                              onPress={() => navigation.navigate('agreement', { type: itemAction.agreement!.type, title: '服务协议' })}
                            >
                              {itemAction.agreement.name}
                            </Text>
                          </Text>
                        )}
                      </View>
                    )}
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
  expandWrap: {
    marginHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  expandCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    gap: scaleSizeH(10),
  },
  expandRow: {
    flexDirection: 'row',
    gap: scaleSizeW(24),
  },
  expandLabel: {
    width: scaleSizeW(48),
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
  },
  expandValue: {
    flex: 1,
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  actionArea: {
    marginTop: scaleSizeH(10),
    alignItems: 'center',
  },
  actionBtn: {
    marginHorizontal: scaleSizeW(14),
    alignSelf: 'stretch',
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(24),
    backgroundColor: '#2962D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: scaleSizeH(24),
  },
  agreementText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(24),
    marginTop: scaleSizeH(10),
    textAlign: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  agreementLink: {
    color: '#2962D4',
  },
});
