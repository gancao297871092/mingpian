import React, { useRef } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { useCompanyStore, type CompanyRole } from '@/store/company';
import { COMPANY_BUTLER } from '@/data/company';
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

const PRIMARY = '#2962D4';
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

function ButlerSheet({ sheetRef }: { sheetRef: React.RefObject<BottomSheetModal | null> }) {
  const onCall = () => Linking.openURL(`tel:${COMPANY_BUTLER.phone}`).catch(() => undefined);
  return (
    <AppBottomSheet ref={sheetRef}>
      <Text style={styles.sheetTitle}>查看管家</Text>
      <View style={styles.butlerCard}>
        <ExpoImage source={{ uri: COMPANY_BUTLER.avatar }} style={styles.butlerAvatar} contentFit="cover" transition={150} />
        <View style={styles.butlerText}>
          <Text style={styles.butlerName}>{COMPANY_BUTLER.name}</Text>
          <Text style={styles.butlerPhone}>{COMPANY_BUTLER.phone}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.butlerCall} onPress={onCall}>
          <ButlerPhoneIcon />
        </TouchableOpacity>
      </View>
    </AppBottomSheet>
  );
}

const ROLE_OPTIONS: { key: CompanyRole; label: string }[] = [
  { key: 'admin', label: '管理员' },
  { key: 'member', label: '普通成员' },
  { key: 'none', label: '未加入企业' },
];

/** 100.企业管理（按角色渲染：超管/管理员、普通成员、未加入企业） */
export default function CompanyManage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const role = useCompanyStore(s => s.role);
  const setRole = useCompanyStore(s => s.setRole);
  const memberAuditCount = useCompanyStore(s => s.memberAuditCount);
  const butlerRef = useRef<BottomSheetModal>(null);

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const onExit = () => {
    Alert.alert('退出企业', '退出后将失去企业成员身份，确认退出？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => setRole('none') },
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
              { label: '动态审核', icon: <CompanyBbsAuditIcon />, onPress: () => navigation.navigate('companyBbsAudit') },
            ],
          },
          {
            title: '其他',
            rows: [
              { label: '能力卡管理', icon: <CompanyCapIcon />, onPress: () => navigation.navigate('companyCapCards') },
              { label: '查看管家', icon: <CompanyButlerIcon />, onPress: () => butlerRef.current?.present() },
            ],
          },
        ]
      : role === 'member'
        ? [
            {
              title: '我的企业',
              rows: [{ label: '职位变更', icon: <CompanyJobIcon />, onPress: () => navigation.navigate('companyJobChange') }],
            },
          ]
        : [
            {
              title: '企业认证',
              rows: [
                { label: '创建企业', icon: <CompanyInfoIcon />, onPress: todo },
                { label: '加入企业', icon: <CompanyManagerIcon />, tag: '待审核', onPress: todo },
              ],
            },
          ];

  const extraRows: RowItem[] =
    role === 'none' ? [{ label: '实名认证', icon: <CompanyAuditIcon />, onPress: todo }] : [];

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
        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devTitle}>演示角色切换（仅开发环境）</Text>
            <View style={styles.devRow}>
              {ROLE_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.key}
                  activeOpacity={0.7}
                  style={[styles.devBtn, role === o.key && styles.devBtnOn]}
                  onPress={() => setRole(o.key)}
                >
                  <Text style={[styles.devBtnText, role === o.key && styles.devBtnTextOn]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <ButlerSheet sheetRef={butlerRef} />
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
  devBox: {
    marginTop: scaleSizeH(24),
  },
  devTitle: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#999999',
    marginBottom: scaleSizeH(8),
  },
  devRow: {
    flexDirection: 'row',
    gap: scaleSizeW(8),
  },
  devBtn: {
    flex: 1,
    height: scaleSizeH(32),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnOn: {
    backgroundColor: PRIMARY,
  },
  devBtnText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#000000',
  },
  devBtnTextOn: {
    color: '#FFFFFF',
  },
});
