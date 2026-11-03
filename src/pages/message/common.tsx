import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

export const PRIMARY = '#2962D4';
export const RED = '#EF4444';
export const LIKE_RED = '#FE2955';
export const TEXT_MAIN = '#000000';
export const TEXT_SUB = '#9A9A9A';
export const TEXT_DESC = '#6C6C6C';
export const BORDER = '#D9D9D9';
export const DIVIDER = '#EBEBEB';

/**
 * 解析后端时间：支持 "yyyy/MM/dd HH:mm:ss"（JsonFormat）与 ISO。
 * Hermes 无法解析非标准格式，统一归一化为 "yyyy-MM-ddTHH:mm:ss"。
 */
export function parseMsgTime(time?: string | null): Date | null {
  if (!time) return null;
  const normalized = time.includes('T') ? time : time.replace(/\//g, '-').replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 消息列表时间（figma 29/30/31）：刚刚 / n分钟前 / HH:mm（今天）/ MM-dd（今年）/ yyyy-MM-dd */
export function formatListTime(time?: string | null): string {
  const date = parseMsgTime(time);
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (diffMs < 60 * 1000) return '刚刚';
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / 60000)} 分钟前`;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (startOf(now) === startOf(date)) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (now.getFullYear() === date.getFullYear()) return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 未读数红色胶囊角标（figma：高 14、左右 padding 5、圆角 90、10px Demibold 白字） */
export function UnreadBadge({ count, style }: { count?: number | null; style?: object }) {
  if (!count || count <= 0) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

/** 48 圆形头像（白底 1px 描边；无图显示首字；showDot 时右上角未读红点，figma 38/39） */
export function MsgAvatar({
  uri,
  name,
  size = 48,
  showDot,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  showDot?: boolean;
}) {
  const s = scaleSizeW(size);
  return (
    <View style={[styles.avatarBox, { width: s, height: s, borderRadius: s / 2 }]}>
      {uri ? (
        <ExpoImage source={{ uri }} style={[StyleSheet.absoluteFill, { borderRadius: s / 2 }]} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>{(name || '友').slice(0, 1)}</Text>
        </View>
      )}
      {showDot ? <View style={styles.redDot} /> : null}
    </View>
  );
}

/** 列表右侧箭头（figma 31/39 的 chevron） */
export function ChevronRight({ color = '#999999', size = 12 }: { color?: string; size?: number }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <Path d="M4 2.5L7.5 6L4 9.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: scaleSizeW(14),
    height: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(7),
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: setSpText(10),
    fontWeight: '600',
    lineHeight: setSpText(12),
    color: '#FFFFFF',
  },
  avatarBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: 'visible',
  },
  avatarFallback: {
    borderRadius: 999,
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: PRIMARY,
  },
  redDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    borderRadius: scaleSizeW(5),
    backgroundColor: RED,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
