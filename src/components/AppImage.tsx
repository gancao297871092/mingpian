import React from 'react';
import { Image as ExpoImage, type ImageProps } from 'expo-image';

/**
 * ExpoImage 全局统一封装。
 *
 * 修复 expo-image 原生行为：source 变化后旧图会一直显示到新图加载完成
 * （FlatList/FlashList 回收复用时，会先闪出上一屏的旧图再切新图，观感差）。
 * 官方解法 recyclingKey：key 变化时先清空再加载——本组件按 source.uri 自动携带，
 * 业务侧零感知；显式传 recyclingKey 时以显式值为准。
 *
 * 静态能力（prefetch / clearMemoryCache / clearDiskCache 等）仍从 'expo-image' 原包引入。
 */
export default function AppImage({ source, recyclingKey, ...rest }: ImageProps) {
  const first = Array.isArray(source) ? source[0] : source;
  const rawUri =
    typeof first === 'string'
      ? first
      : first && typeof first === 'object' && 'uri' in first
        ? (first as { uri?: unknown }).uri
        : undefined;
  const autoKey = typeof rawUri === 'string' ? rawUri : undefined;
  return <ExpoImage source={source} recyclingKey={recyclingKey ?? autoKey} {...rest} />;
}
