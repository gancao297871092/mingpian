import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import Animated from 'react-native-reanimated';
import { LegacyScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  DropProvider,
  SortableDirection,
  SortableItem,
  useHorizontalSortableList,
} from 'react-native-reanimated-dnd';
import { scaleSizeW } from '@/utils/screenUtils';
import { MAX_IMAGE_BYTES, maybeCompressImage } from '@/utils/media';
import { uploadToOss } from '@/utils/ossUpload';

interface UploadImageItem {
  key: string;
  uri: string;
  url?: string;
  uploading: boolean;
  failed?: boolean;
  width?: number;
  height?: number;
  size?: number;
}

interface ImageUploaderProps {
  /** 已上传图片 url 列表（对外契约，与后端 images 字段一致） */
  value: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
  itemSize?: number;
  gap?: number;
  showCoverBadge?: boolean;
  maxBytes?: number;
  uploadFn?: (uri: string, mime?: string) => Promise<string>;
  style?: StyleProp<ViewStyle>;
  /** 存在上传中或失败项时回调（用于发布前校验） */
  onBusyChange?: (busy: boolean) => void;
}

const ICONS = {
  add: require('@/assets/publish/add.png'),
  remove: require('@/assets/publish/remove.png'),
};

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function toItem(url: string): UploadImageItem {
  return { key: newKey(), uri: url, url, uploading: false };
}

export default function ImageUploader({
  value,
  onChange,
  maxCount = 9,
  itemSize = scaleSizeW(85),
  gap = scaleSizeW(10),
  showCoverBadge = true,
  maxBytes = MAX_IMAGE_BYTES,
  uploadFn = uploadToOss,
  style,
  onBusyChange,
}: ImageUploaderProps) {
  const [items, setItems] = useState<UploadImageItem[]>(() => value.map(toItem));
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const lastEmittedRef = useRef<string[]>(value);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const emit = (next: UploadImageItem[]) => {
    const urls = next.filter(i => !!i.url).map(i => i.url as string);
    lastEmittedRef.current = urls;
    onChange(urls);
  };

  const updateItems = (updater: (prev: UploadImageItem[]) => UploadImageItem[]) => {
    const next = updater(itemsRef.current);
    setItems(next);
    onBusyChange?.(next.some(i => i.uploading || i.failed));
    return next;
  };

  // 外部回填（草稿/编辑回显）：value 变化且非本组件 emit 引起时重建
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    updateItems(() => value.map(toItem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const uploadItem = async (key: string, uri: string, mime?: string) => {
    try {
      const compressed = await maybeCompressImage(uri);
      if (compressed !== uri) {
        updateItems(prev => prev.map(i => (i.key === key ? { ...i, uri: compressed } : i)));
      }
      const url = await uploadFn(compressed, mime);
      const next = updateItems(prev =>
        prev.map(i => (i.key === key ? { ...i, url, uploading: false } : i)),
      );
      emit(next);
    } catch {
      updateItems(prev => prev.map(i => (i.key === key ? { ...i, uploading: false, failed: true } : i)));
    }
  };

  const pickImages = async () => {
    try {
      const remain = maxCount - itemsRef.current.length;
      if (remain <= 0) return;
      const picked = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: remain,
        mediaType: 'photo',
      });
      const list = Array.isArray(picked) ? picked : [picked];
      const valid: typeof list = [];
      let oversize = false;
      list.forEach(item => {
        if (item.size && item.size > maxBytes) {
          oversize = true;
        } else if (item.path) {
          valid.push(item);
        }
      });
      if (oversize) {
        Alert.alert('提示', `图片过大，请选择${Math.round(maxBytes / 1024 / 1024)}MB以内的图片`);
      }
      const newItems: UploadImageItem[] = valid.slice(0, remain).map(item => ({
        key: newKey(),
        uri: item.path,
        uploading: true,
        width: item.width,
        height: item.height,
        size: item.size,
      }));
      if (!newItems.length) return;
      updateItems(prev => [...prev, ...newItems].slice(0, maxCount));
      newItems.forEach((item, i) => {
        uploadItem(item.key, item.uri, valid[i]?.mime);
      });
    } catch (e) {
      console.log('选择图片异常', e);
    }
  };

  const removeImage = (key: string) => {
    const next = updateItems(prev => prev.filter(item => item.key !== key));
    emit(next);
  };

  const previewUrls = useMemo(() => items.filter(i => !!i.url).map(i => i.url as string), [items]);

  const handleDrop = (_id: string, _position: number, allPositions?: { [id: string]: number }) => {
    if (!allPositions) return;
    const next = updateItems(prev =>
      [...prev].sort((a, b) => (allPositions[a.key] ?? 0) - (allPositions[b.key] ?? 0)),
    );
    emit(next);
  };

  // 注意：必须保持为嵌套组件——useHorizontalSortableList 的 positions 只在挂载时初始化，
  // 每次父渲染重挂载才能让新添加的图片拿到位置（与改造前行为一致）
  // eslint-disable-next-line react/no-unstable-nested-components
  const SortableGrid = (_props: { data: UploadImageItem[] }) => {
    const data = useMemo(() => _props.data.map(i => ({ ...i, id: i.key })), [_props.data]);
    const { scrollViewRef, dropProviderRef, handleScroll, handleScrollEnd, contentWidth, getItemProps } =
      useHorizontalSortableList({ data, itemWidth: itemSize, gap });

    return (
      <DropProvider ref={dropProviderRef}>
        <AnimatedGestureScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{
            width: contentWidth + (data.length < maxCount ? itemSize : 0),
            height: itemSize,
          }}
        >
          {data.map((item, index) => {
            const itemProps = getItemProps(item, index);
            return (
              <SortableItem
                key={itemProps.id}
                id={itemProps.id}
                data={item}
                direction={SortableDirection.Horizontal}
                positions={itemProps.positions}
                leftBound={itemProps.leftBound}
                autoScrollHorizontalDirection={itemProps.autoScrollDirection}
                itemsCount={itemProps.itemsCount}
                itemWidth={itemProps.itemWidth}
                gap={itemProps.gap}
                paddingHorizontal={itemProps.paddingHorizontal}
                onDragStart={() =>
                  ReactNativeHapticFeedback.trigger('impactLight', { enableVibrateFallback: true })
                }
                onDrop={handleDrop}
              >
                <View style={[styles.mediaItem, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}>
                  <TouchableOpacity
                    style={styles.mediaImgTouch}
                    activeOpacity={0.9}
                    onPress={() => {
                      const idx = previewUrls.indexOf(item.url as string);
                      if (idx >= 0) setPreviewIndex(idx);
                    }}
                  >
                    <Image source={{ uri: item.uri }} style={styles.mediaImg} />
                  </TouchableOpacity>
                  {showCoverBadge && index === 0 && !!item.url && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>封面</Text>
                    </View>
                  )}
                  {item.uploading && (
                    <View style={styles.mediaLoading}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    </View>
                  )}
                  {!item.uploading && item.failed && (
                    <TouchableOpacity
                      style={styles.mediaLoading}
                      activeOpacity={0.8}
                      onPress={() => {
                        updateItems(prev =>
                          prev.map(i => (i.key === item.key ? { ...i, uploading: true, failed: false } : i)),
                        );
                        uploadItem(item.key, item.uri);
                      }}
                    >
                      <Text style={styles.mediaRetryText}>重试</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.mediaRemove} hitSlop={6} onPress={() => removeImage(item.key)}>
                    <Image source={ICONS.remove} style={styles.mediaRemoveIcon} />
                  </TouchableOpacity>
                </View>
              </SortableItem>
            );
          })}
          {data.length < maxCount && (
            <TouchableOpacity
              style={[
                styles.mediaItem,
                styles.mediaAdd,
                styles.mediaAddAbsolute,
                { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12, left: data.length * (itemSize + gap) },
              ]}
              activeOpacity={0.8}
              onPress={pickImages}
            >
              <Image source={ICONS.add} style={styles.mediaAddIcon} />
            </TouchableOpacity>
          )}
        </AnimatedGestureScrollView>
      </DropProvider>
    );
  };

  return (
    <View style={[{ height: itemSize }, style]}>
      <SortableGrid data={items} />
      <Modal
        transparent
        visible={previewIndex !== null}
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        {previewIndex !== null && (
          <GestureViewer
            data={previewUrls}
            initialIndex={previewIndex}
            renderItem={(uri: string) => (
              <Image source={{ uri }} style={styles.previewViewerImage} resizeMode="contain" />
            )}
            ListComponent={ScrollView}
            onDismiss={() => setPreviewIndex(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const AnimatedGestureScrollView = Animated.createAnimatedComponent(GestureScrollView);

const styles = StyleSheet.create({
  mediaItem: {
    overflow: 'hidden',
  },
  mediaLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaRetryText: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaImgTouch: {
    width: '100%',
    height: '100%',
  },
  mediaAdd: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaAddAbsolute: {
    position: 'absolute',
  },
  mediaAddIcon: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
  },
  coverBadge: {
    position: 'absolute',
    top: scaleSizeW(3),
    left: scaleSizeW(3),
    height: scaleSizeW(16),
    paddingHorizontal: scaleSizeW(7),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  coverBadgeText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  mediaRemove: {
    position: 'absolute',
    top: scaleSizeW(3),
    right: scaleSizeW(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaRemoveIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  previewViewerImage: {
    width: '100%',
    height: '100%',
  },
});
