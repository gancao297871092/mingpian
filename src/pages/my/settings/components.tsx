import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingArrowIcon } from './settingsIcons';

const BLUE = '#2962D4';

export function SettingCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SettingDivider({ indent }: { indent?: boolean }) {
  return <View style={[styles.divider, indent && { marginLeft: scaleSizeW(46) }]} />;
}

interface SettingRowProps {
  label: string;
  icon?: React.ReactNode;
  value?: string;
  onPress?: () => void;
  /** 传则渲染开关 */
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  /** 隐藏右侧箭头（如开关行） */
  hideArrow?: boolean;
}

export function SettingRow({ label, icon, value, onPress, switchValue, onSwitchChange, hideArrow }: SettingRowProps) {
  const isSwitch = switchValue !== undefined;
  return (
    <TouchableOpacity
      activeOpacity={isSwitch ? 1 : 0.7}
      style={styles.row}
      onPress={isSwitch ? undefined : onPress}
      disabled={isSwitch || !onPress}
    >
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#E9E9EA', true: BLUE }}
            thumbColor="#FFFFFF"
          />
        ) : (
          <>
            {!!value && <Text style={styles.rowValue}>{value}</Text>}
            {!hideArrow && <SettingArrowIcon />}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!right && <Text style={styles.sectionTitleRight}>{right}</Text>}
    </View>
  );
}

/** 白底流程页居中大标题（figma 72/73/74/89-91） */
export function WhitePageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.whiteTitleWrap}>
      <Text style={styles.whiteTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.whiteSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export { BLUE };

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginLeft: scaleSizeW(14),
  },
  row: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  rowLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  rowRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  rowValue: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  sectionTitle: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(16),
  },
  sectionTitleRight: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(16),
  },
  whiteTitleWrap: {
    alignItems: 'center',
    marginTop: scaleSizeH(54),
    paddingHorizontal: scaleSizeW(40),
    gap: scaleSizeH(5),
  },
  whiteTitle: {
    fontSize: setSpText(24),
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  whiteSubtitle: {
    fontSize: setSpText(12),
    color: '#B9B9B9',
    textAlign: 'center',
    lineHeight: scaleSizeH(18),
  },
});
