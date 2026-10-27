import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { AssistCompassIcon, AssistHandshakeIcon, AssistVerifyIcon, ChevronLeftIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调） */
const MOCK_SERVICES = [
  {
    key: 'verify',
    title: '信息核验',
    desc: '核验企业主体、需求真实性与关键联系人。按项目评估',
    color: PRIMARY,
    Icon: AssistVerifyIcon,
  },
  {
    key: 'seek',
    title: '定向寻找',
    desc: '根据需求主动寻找符合条件的企业、专家或服务商。按项目评估',
    color: '#36BE69',
    Icon: AssistCompassIcon,
  },
  {
    key: 'match',
    title: '撮合跟进',
    desc: '协助双方建立联系、梳理需求并跟进关键节点。按项目评估',
    color: '#F2722C',
    Icon: AssistHandshakeIcon,
  },
];

/** 63.申请平台协助（figma 402:2577）：浅蓝底 + 玻璃返回 + 服务项 + 提交按钮 */
export default function PlatformAssist() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>申请平台协助</Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + scaleSizeH(64) }]}
      >
        {/* 标题区 */}
        <View style={styles.titleBlock}>
          <ExpoImage
            source={require('@/assets/link/assist-mascot-547d6d.png')}
            style={styles.mascot}
            contentFit="cover"
          />
          <Text style={styles.pageTitle}>需要平台进一步协助？</Text>
        </View>

        {/* 说明卡 */}
        <View style={styles.introCard}>
          <View style={styles.introBar} />
          <Text style={styles.introText}>
            可选择核验、定向寻找或撮合跟进。平台确认服务范围后按项目报价，不影响免费发布和表达合作意向书。
          </Text>
        </View>

        {/* 服务项 */}
        {MOCK_SERVICES.map(item => (
          <View key={item.key} style={styles.serviceCard}>
            <View style={[styles.serviceIcon, { backgroundColor: item.color }]}>
              <item.Icon />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.submitBtn}
          onPress={() => console.log('go: 提交协助申请')}
        >
          <Text style={styles.submitBtnText}>提交协助申请</Text>
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
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
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
    alignItems: 'center',
    height: scaleSizeW(80),
    marginBottom: scaleSizeH(10),
  },
  mascot: {
    width: scaleSizeW(109),
    height: scaleSizeW(109),
    marginLeft: scaleSizeW(-11),
    marginTop: scaleSizeH(-20),
  },
  pageTitle: {
    marginLeft: scaleSizeW(-2),
    fontSize: setSpText(22),
    fontWeight: '600',
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(18),
    marginBottom: scaleSizeH(10),
  },
  introBar: {
    width: scaleSizeW(2),
    height: scaleSizeH(16),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    marginTop: scaleSizeH(2),
    marginRight: scaleSizeW(8),
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(17),
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
    marginTop: scaleSizeH(20),
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
