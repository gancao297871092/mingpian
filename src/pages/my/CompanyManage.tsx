import React, { useCallback, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { useCompanyStore } from '@/store/company';
import { useUserStore } from '@/store/user';
import { API } from '@/api';
import { SettingArrowIcon } from './settings/settingsIcons';
import {
  ButlerPhoneIcon,
  CompanyAuditIcon,
  CompanyBbsAuditIcon,
  CompanyButlerIcon,
  CompanyCapIcon,
  CompanyExitIcon,
  CompanyInfoIcon,
  CompanyJobIcon,
  CompanyManagerIcon,
  CompanyMemberIcon,
} from './myIcons';

const DANGER = '#EF4444';
const ORANGE = '#F2722C';

interface RowItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  badge?: number;
  tag?: string;
  onPress: () => void;
}

/** 企业管家（/company/manager/getManager，对齐小程序 moreSets viewManager） */
interface Butler {
  id: number;
  realName?: string;
  mobile?: string;
  phone?: string;
  tel?: string;
  avatar?: string;
}

function ButlerSheet({ sheetRef, butlers }: { sheetRef: React.RefObject<BottomSheetModal | null>; butlers: Butler[] }) {
  return (
    <AppBottomSheet ref={sheetRef}>
      <Text style={styles.sheetTitle}>查看管家</Text>
      {butlers.length === 0 && <Text style={styles.butlerEmpty}>未设置管家</Text>}
      {butlers.map((b) => {
        const phone = b.mobile || b.phone || b.tel || '';
        return (
          <View key={b.id} style={styles.butlerCard}>
            <ExpoImage source={{ uri: b.avatar }} style={styles.butlerAvatar} contentFit="cover" transition={150} recyclingKey={b.avatar} />
            <View style={styles.butlerText}>
              <Text style={styles.butlerName}>{b.realName || ''}</Text>
              <Text style={styles.butlerPhone}>{phone || '未设置'}</Text>
            </View>
            {!!phone && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.butlerCall}
                onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => undefined)}
              >
                <ButlerPhoneIcon />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </AppBottomSheet>
  );
}

/** 100.企业管理（按角色渲染：超管/管理员、普通成员、未加入企业） */
export default function CompanyManage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const memberAuditCount = useCompanyStore(s => s.memberAuditCount);
  const bbsAuditCount = useCompanyStore(s => s.bbsAuditCount);
  const userInfo = useUserStore(s => s.userInfo);
  // 真实角色（对齐小程序 moreSets）：isManager=管理端；cpId 且非管理员=普通成员；无 cpId=未加入企业
  const role: 'admin' | 'member' | 'none' = !userInfo?.cpId ? 'none' : userInfo?.isManager === 1 ? 'admin' : 'member';
  const butlerRef = useRef<BottomSheetModal>(null);
  const [butlers, setButlers] = useState<Butler[]>([]);

  // 每次进入刷新用户信息（移交超管/退出企业等操作后角色需同步）与审核角标（对齐小程序 getTips）
  useFocusEffect(
    useCallback(() => {
      API.user
        .info()
        .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
        .catch(() => {});
      API.company
        .managerTips()
        .then((r) => {
          if (r.code === '200' && r.data) {
            useCompanyStore.getState().setMemberAuditCount(r.data.companyUserAuthCount ?? 0);
            useCompanyStore.getState().setBbsAuditCount(r.data.bbsCount ?? 0);
          }
        })
        .catch(() => {});
    }, []),
  );

  /** 查看管家：拉取后展开弹层（对齐小程序 viewManager） */
  const onViewButler = async () => {
    try {
      const res = await API.company.managerGet();
      if (res.code === '200') {
        setButlers(res.data || []);
        butlerRef.current?.present();
      }
    } catch {
      // ignore
    }
  };

  /** 退出企业（对齐小程序 exitCp）：超管需先移交，普通成员确认后调 /company/user/liveOut */
  const onExit = () => {
    if (userInfo?.isMaster === 1) {
      Alert.alert('提示', '请先移交管理员权限，再退出企业', [
        { text: '取消', style: 'cancel' },
        { text: '去移交', onPress: () => navigation.navigate('companyMembers') },
      ]);
      return;
    }
    Alert.alert('提示', '确认退出企业吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.company.liveOut();
            if (res.code !== '200') return;
            Toast.show({ type: 'success', text1: '已退出企业！' });
            // 刷新用户信息（cpId/isManager 等失效，角色随之变为未加入企业）
            API.user
              .info()
              .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
              .catch(() => {});
          } catch {
            Toast.show({ type: 'error', text1: '操作失败' });
          }
        },
      },
    ]);
  };

  const groups: { title: string; rows: RowItem[] }[] =
    role === 'admin'
      ? [
          {
            title: '企业',
            rows: [
              { label: '企业信息', icon: <CompanyInfoIcon />, onPress: () => navigation.navigate('companyInfo') },
              { label: '成员管理', icon: <CompanyMemberIcon />, onPress: () => navigation.navigate('companyMembers') },
            ],
          },
          {
            title: '审核',
            rows: [
              {
                label: '成员审核',
                icon: <CompanyAuditIcon />,
                badge: memberAuditCount,
                onPress: () => navigation.navigate('companyMemberAudit'),
              },
              { label: '动态审核', icon: <CompanyBbsAuditIcon />, badge: bbsAuditCount, onPress: () => navigation.navigate('companyBbsAudit') },
            ],
          },
          {
            title: '其他',
            rows: [
              { label: '能力卡管理', icon: <CompanyCapIcon />, onPress: () => navigation.navigate('companyCapCards') },
              { label: '查看管家', icon: <CompanyButlerIcon />, onPress: onViewButler },
            ],
          },
        ]
      : role === 'member'
        ? [
            {
              title: '我的企业',
              rows: [
                {
                  label: '职位变更',
                  icon: <CompanyJobIcon />,
                  onPress: () =>
                    navigation.navigate('companyApply', {
                      cpId: userInfo?.cpId ?? '',
                      type: '2',
                      position: userInfo?.position ?? '',
                    }),
                },
              ],
            },
          ]
        : [
            {
              title: '企业认证',
              rows: [
                { label: '创建企业', icon: <CompanyInfoIcon />, onPress: () => navigation.navigate('companyCert') },
                { label: '加入企业', icon: <CompanyManagerIcon />, tag: '待审核', onPress: () => navigation.navigate('companyJoin') },
              ],
            },
          ];

  const extraRows: RowItem[] =
    role === 'none' ? [{ label: '实名认证', icon: <CompanyAuditIcon />, onPress: () => navigation.navigate('companyRealName') }] : [];

  const renderRow = (row: RowItem) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={row.onPress}>
      {row.icon}
      <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>{row.label}</Text>
      <View style={styles.rowRight}>
        {!!row.badge && row.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{row.badge}</Text>
          </View>
        )}
        {!!row.tag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{row.tag}</Text>
          </View>
        )}
        <SettingArrowIcon />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {groups.map(g => (
          <View key={g.title}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <View style={styles.card}>
              {g.rows.map((row, i) => (
                <React.Fragment key={row.label}>
                  {i > 0 && <View style={styles.divider} />}
                  {renderRow(row)}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        {extraRows.length > 0 && (
          <View style={[styles.card, styles.standaloneCard]}>{extraRows.map(renderRow)}</View>
        )}
        {role !== 'none' && (
          <View style={[styles.card, styles.standaloneCard]}>
            {renderRow({ label: '退出企业', icon: <CompanyExitIcon color={DANGER} />, danger: true, onPress: onExit })}
          </View>
        )}
      </ScrollView>
      <ButlerSheet sheetRef={butlerRef} butlers={butlers} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  groupTitle: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#6C6C6C',
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(10),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  standaloneCard: {
    marginTop: scaleSizeH(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(55),
  },
  rowLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(14),
    color: '#000000',
  },
  rowLabelDanger: {
    color: DANGER,
  },
  badge: {
    height: scaleSizeH(14),
    minWidth: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: setSpText(10),
    fontWeight: '600',
    lineHeight: setSpText(12),
    color: '#FFFFFF',
  },
  tag: {
    height: scaleSizeH(26),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeW(90),
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(14),
    color: '#FFFFFF',
  },
  rowRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginLeft: scaleSizeW(46),
  },
  sheetTitle: {
    fontSize: setSpText(17),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: '#000000',
    textAlign: 'center',
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(16),
  },
  butlerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  butlerEmpty: {
    fontSize: setSpText(13),
    lineHeight: setSpText(18),
    color: '#BBBBBB',
    textAlign: 'center',
    paddingVertical: scaleSizeH(20),
  },
  butlerAvatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  butlerText: {
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(10),
  },
  butlerName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  butlerPhone: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  butlerCall: {
    marginLeft: 'auto',
    padding: scaleSizeW(6),
  },
});
