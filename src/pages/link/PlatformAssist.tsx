import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AppBlurView from '@/components/capabilities/AppBlurView';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { AssistCompassIcon, AssistHandshakeIcon, AssistVerifyIcon, ChevronLeftIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 半透明卡片：高斯模糊底（backdrop blur 5px）+ 白色 0.8 覆盖层，保证文字可读；安卓走纯色降级 */
function FrostedCard({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.frostedCard, style]}>
      <AppBlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={5}
        androidFallbackColor="rgba(255,255,255,0.5)"
      />
      <View style={[StyleSheet.absoluteFill, styles.frostedTint]} pointerEvents="none" />
      {children}
    </View>
  );
}

type ServiceType = 1 | 2 | 3;

const SERVICES: {
  key: string;
  type: ServiceType;
  title: string;
  desc: string;
  color: string;
  Icon: typeof AssistVerifyIcon;
}[] = [
  {
    key: 'verify',
    type: 1,
    title: '信息核验',
    desc: '核验企业主体、需求真实性与关键联系人。按项目评估',
    color: PRIMARY,
    Icon: AssistVerifyIcon,
  },
  {
    key: 'seek',
    type: 2,
    title: '定向寻找',
    desc: '根据需求主动寻找符合条件的企业、专家或服务商。按项目评估',
    color: '#36BE69',
    Icon: AssistCompassIcon,
  },
  {
    key: 'match',
    type: 3,
    title: '撮合跟进',
    desc: '协助双方建立联系、梳理需求并跟进关键节点。按项目评估',
    color: '#F2722C',
    Icon: AssistHandshakeIcon,
  },
];

/** 63.申请平台协助（figma 402:2577）：浅蓝底 + 玻璃返回 + 服务项 + 提交按钮 */
export default function PlatformAssist() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<ServiceType | null>(null);

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ExpoImage
        source={require('@/assets/link/hero-bg.png')}
        style={styles.headerBg}
        contentFit="cover"
      />
      {/* 自定义头部 */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <View style={styles.glassBtnBlur} pointerEvents="none">
            <AppBlurView
              style={StyleSheet.absoluteFill}
              blurType="light"
              blurAmount={5}
              androidFallbackColor="rgba(255,255,255,0.5)"
            />
            <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
          </View>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>申请平台协助</Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
      >
        {/* 标题区（figma 402:2577：猫头鹰 x5/y115 109×109，标题 x112/y149 22px） */}
        <View style={styles.titleBlock}>
          <ExpoImage
            source={require('@/assets/link/assist-mascot-547d6d.png')}
            style={styles.mascot}
            contentFit="cover"
          />
          <Text style={styles.pageTitle}>需要平台进一步协助？</Text>
        </View>

        {/* 说明卡（猫头鹰脚部压住卡片上沿 30） */}
        <FrostedCard style={styles.introCard}>
          <View style={styles.introBar} />
          <Text style={styles.introText}>
            可选择核验、定向寻找或撮合跟进。平台确认服务范围后按项目报价，不影响免费发布和表达合作意向书。
          </Text>
        </FrostedCard>

        {/* 服务项 */}
        {SERVICES.map(item => {
          const active = selected === item.type;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              onPress={() => setSelected(item.type)}
            >
              <FrostedCard style={[styles.serviceCard, active && styles.serviceCardActive]}>
                <View style={[styles.serviceIcon, { backgroundColor: item.color }]}>
                  <item.Icon />
                </View>
                <View style={styles.serviceTextCol}>
                  <Text style={styles.serviceTitle}>{item.title}</Text>
                  <Text style={styles.serviceDesc}>{item.desc}</Text>
                </View>
              </FrostedCard>
            </TouchableOpacity>
          );
        })}

        {/* 产品口径 2026-10-30：不直接提交申请，跳转「联系我们」（helpCenter，同关于页-联系我们入口） */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.submitBtn}
          onPress={() => navigation.navigate('helpCenter')}
        >
          <Text style={styles.submitBtnText}>联系平台顾问</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(218),
    opacity: 0.3,
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(10),
  },
  glassBtn: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  glassBtnBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scaleSizeW(22),
    overflow: 'hidden',
  },
  glassTint: {
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  navPlaceholder: {
    width: scaleSizeW(44),
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: scaleSizeH(79),
  },
  mascot: {
    width: scaleSizeW(109),
    height: scaleSizeW(109),
    marginLeft: scaleSizeW(5),
  },
  pageTitle: {
    marginLeft: scaleSizeW(-2),
    marginTop: scaleSizeH(34),
    fontSize: setSpText(22),
    fontWeight: '600',
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
  },
  frostedCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
  },
  frostedTint: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  introCard: {
    flexDirection: 'row',
    marginHorizontal: scaleSizeW(16),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(18),
    paddingBottom: scaleSizeH(20),
    marginBottom: scaleSizeH(20),
  },
  introBar: {
    width: scaleSizeW(2),
    height: scaleSizeH(16),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    marginTop: scaleSizeH(2),
    marginRight: scaleSizeW(6),
  },
  introText: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(14),
  },
  serviceCardActive: {
    borderColor: PRIMARY,
  },
  serviceIcon: {
    width: scaleSizeW(35),
    height: scaleSizeW(35),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextCol: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(5),
  },
  serviceTitle: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  serviceDesc: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  submitBtn: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(30),
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
