import React, { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import {
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  LockIcon,
  PinIcon,
  ReportIcon,
} from './sheetIcons';

const RED = '#EF4444';

export type CommentAction = 'pin' | 'copy' | 'report' | 'delete' | 'edit' | 'permission';

export interface CommentActionSheetProps {
  variant?: 'user' | 'author' | 'manage';
  isTop?: boolean;
  onAction?: (action: CommentAction) => void;
  onClose?: () => void;
}

interface Row {
  key: CommentAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  chevron?: boolean;
}

const CommentActionSheet = forwardRef<BottomSheetModal, CommentActionSheetProps>(function Sheet(
  { variant = 'user', isTop = false, onAction, onClose },
  ref,
) {
  const pinLabel = isTop ? '取消置顶' : '置顶';
  const rows: Row[] =
    variant === 'manage'
      ? [
          { key: 'edit', label: '编辑', icon: <EditIcon /> },
          { key: 'permission', label: '权限设置', icon: <LockIcon /> },
          { key: 'pin', label: pinLabel, icon: <PinIcon /> },
          { key: 'delete', label: '删除', icon: <DeleteIcon />, danger: true },
        ]
      : variant === 'author'
        ? [
            { key: 'pin', label: pinLabel, icon: <PinIcon /> },
            { key: 'copy', label: '复制', icon: <CopyIcon /> },
            { key: 'report', label: '举报', icon: <ReportIcon />, chevron: true },
            { key: 'delete', label: '删除', icon: <DeleteIcon />, danger: true },
          ]
        : [
            { key: 'copy', label: '复制', icon: <CopyIcon /> },
            { key: 'report', label: '举报', icon: <ReportIcon />, chevron: true },
          ];

  return (
    <AppBottomSheet ref={ref} onClose={onClose}>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={row.key}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => onAction?.(row.key)}
            >
              {row.icon}
              <Text style={[styles.rowText, row.danger && styles.rowTextDanger]}>{row.label}</Text>
              {row.chevron && (
                <View style={styles.chevron}>
                  <ChevronRightIcon />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </AppBottomSheet>
  );
});

export default CommentActionSheet;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
  },
  row: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(16),
  },
  rowText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  rowTextDanger: {
    color: RED,
  },
  chevron: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(16),
  },
});
