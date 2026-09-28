import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingArrowIcon } from './settings/settingsIcons';
import {
  CompanyAuditIcon,
  CompanyBbsAuditIcon,
  CompanyCapIcon,
  CompanyExitIcon,
  CompanyInfoIcon,
  CompanyManagerIcon,
  CompanyMemberIcon,
} from './myIcons';

interface RowItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onPress: () => void;
}

/** 100.企业管理 */
export default function CompanyManage() {
  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const onExit = () => {
    Alert.alert('退出企业', '退出后将失去企业成员身份，确认退出？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: todo },
    ]);
  };

  const groups: { title: string; rows: RowItem[] }[] = [
    {
      title: '企业',
      rows: [
        { label: '企业信息', icon: <CompanyInfoIcon />, onPress: todo },
        { label: '能力卡创建', icon: <CompanyCapIcon />, onPress: todo },
        { label: '企业管家', icon: <CompanyManagerIcon />, onPress: todo },
      ],
    },
    {
      title: '成员',
      rows: [
        { label: '成员管理', icon: <CompanyMemberIcon />, onPress: todo },
        { label: '成员审核', icon: <CompanyAuditIcon />, onPress: todo },
        { label: '动态审核', icon: <CompanyBbsAuditIcon />, onPress: todo },
      ],
    },
  ];

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
                  <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={row.onPress}>
                    {row.icon}
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <View style={styles.arrow}>
                      <SettingArrowIcon />
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        <View style={[styles.card, styles.exitCard]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={onExit}>
            <CompanyExitIcon />
            <Text style={styles.rowLabel}>退出企业</Text>
            <View style={styles.arrow}>
              <SettingArrowIcon />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: scaleSizeH(4),
  },
  exitCard: {
    marginTop: scaleSizeH(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(16),
  },
  rowLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(14),
    color: '#000000',
  },
  arrow: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginLeft: scaleSizeW(46),
  },
});
