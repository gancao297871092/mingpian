import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

export type VisibilityKey = 'public' | 'mutual' | 'private';
export type CommentKey = 'everyone' | 'fans' | 'mutual' | 'self';

/** 前端选项 → 后端字段值（与发布页一致） */
export const VISIBILITY_MAP: Record<VisibilityKey, number> = { public: 0, mutual: 1, private: 2 };
export const COMMENT_MAP: Record<CommentKey, number> = { everyone: 0, fans: 1, mutual: 2, self: 3 };
/** 后端字段值 → 前端选项（详情回显） */
export const VISIBILITY_FROM_VALUE: Record<number, VisibilityKey> = { 0: 'public', 1: 'mutual', 2: 'private' };
export const COMMENT_FROM_VALUE: Record<number, CommentKey> = { 0: 'everyone', 1: 'fans', 2: 'mutual', 3: 'self' };
/** 选项文案（选中提示复用） */
export const VISIBILITY_LABEL: Record<VisibilityKey, string> = {
  public: '公开·所有人可见',
  mutual: '仅互关好友可见',
  private: '私密·仅自己可见',
};
export const COMMENT_LABEL: Record<CommentKey, string> = {
  everyone: '所有人',
  fans: '仅粉丝',
  mutual: '仅互关好友',
  self: '仅自己',
};

const VISIBILITY_OPTIONS: { key: VisibilityKey; label: string }[] = [
  { key: 'public', label: VISIBILITY_LABEL.public },
  { key: 'mutual', label: VISIBILITY_LABEL.mutual },
  { key: 'private', label: VISIBILITY_LABEL.private },
];

const COMMENT_OPTIONS: { key: CommentKey; label: string; icon: number }[] = [
  { key: 'everyone', label: COMMENT_LABEL.everyone, icon: require('@/assets/publish/comment-all.png') },
  { key: 'fans', label: COMMENT_LABEL.fans, icon: require('@/assets/publish/comment-fans.png') },
  { key: 'mutual', label: COMMENT_LABEL.mutual, icon: require('@/assets/publish/comment-mutual.png') },
  { key: 'self', label: COMMENT_LABEL.self, icon: require('@/assets/publish/comment-self.png') },
];

export interface PermissionSheetProps {
  visibility?: VisibilityKey;
  commentScope?: CommentKey;
  onSelectVisibility?: (key: VisibilityKey) => void;
  onSelectComment?: (key: CommentKey) => void;
  onClose?: () => void;
}

/** 动态详情-权限设置（仅对本条动态生效）：可见范围 + 谁可以评论 */
const PermissionSheet = forwardRef<BottomSheetModal, PermissionSheetProps>(function Sheet(
  { visibility = 'public', commentScope = 'everyone', onSelectVisibility, onSelectComment, onClose },
  ref,
) {
  const renderCheck = (checked: boolean) =>
    checked ? (
      <Image source={require('@/assets/publish/check.png')} style={styles.check} />
    ) : (
      <View style={styles.check} />
    );

  return (
    <AppBottomSheet ref={ref} onClose={onClose}>
      <Text style={styles.note}>以下权限设置只对本条动态生效</Text>

      <Text style={styles.sectionTitle}>可见范围</Text>
      <View style={styles.card}>
        {VISIBILITY_OPTIONS.map((opt, i) => (
          <View key={opt.key}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => onSelectVisibility?.(opt.key)}
            >
              <Text style={styles.rowText}>{opt.label}</Text>
              {renderCheck(visibility === opt.key)}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>谁可以评论</Text>
      <View style={styles.card}>
        {COMMENT_OPTIONS.map((opt, i) => (
          <View key={opt.key}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => onSelectComment?.(opt.key)}
            >
              <View style={styles.rowLeft}>
                <Image source={opt.icon} style={styles.rowIcon} />
                <Text style={styles.rowText}>{opt.label}</Text>
              </View>
              {renderCheck(commentScope === opt.key)}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </AppBottomSheet>
  );
});

export default PermissionSheet;

const styles = StyleSheet.create({
  note: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(16),
    marginTop: scaleSizeH(4),
  },
  sectionTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  row: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  rowIcon: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  rowText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  check: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(16),
  },
});
