import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const variantImages: Record<string, ImageSourcePropType> = {
  content: require('@/assets/empty-state/empty-content.png'),
  search: require('@/assets/empty-state/empty-search.png'),
  comment: require('@/assets/empty-state/empty-comment.png'),
  permission: require('@/assets/empty-state/empty-permission.png'),
};

const variantTitles: Record<string, string> = {
  content: '暂无内容',
  search: '暂无搜索结果',
  comment: '暂无评论',
  permission: '暂无权限',
};

export interface EmptyStateProps {
  variant?: 'content' | 'search' | 'comment' | 'permission' | 'custom';
  image?: ImageSourcePropType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  variant = 'content',
  image,
  title,
  description,
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  const source = image ?? variantImages[variant] ?? variantImages.content;
  const displayTitle = title ?? variantTitles[variant] ?? '';

  return (
    <View style={[styles.container, style]}>
      <Image source={source} style={styles.image} resizeMode="contain" />
      {displayTitle ? (
        <Text style={[styles.title, { color: theme.text }]}>{displayTitle}</Text>
      ) : null}
      {description ? (
        <Text style={[styles.description, { color: theme.subText }]}>{description}</Text>
      ) : null}
      {actionText && onAction ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onAction} style={[styles.actionButton, { backgroundColor: theme.primary }]}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSizeH(40),
    paddingHorizontal: scaleSizeW(32),
  },
  image: {
    width: scaleSizeW(160),
    height: scaleSizeW(160),
    marginBottom: scaleSizeH(12),
  },
  title: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(22),
    marginBottom: scaleSizeH(4),
  },
  description: {
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
    textAlign: 'center',
    marginBottom: scaleSizeH(16),
  },
  actionButton: {
    paddingVertical: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(24),
    borderRadius: scaleSizeW(20),
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: setSpText(14),
    fontWeight: '500',
  },
});
