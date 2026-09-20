import React, { useMemo, useRef, useState } from 'react';
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

export interface UploadImage {
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
  value: UploadImage[];
  onChange: (images: UploadImage[]) => void;
  maxCount?: number;
  itemSize?: number;
  gap?: number;
  showCoverBadge?: boolean;
  maxBytes?: number;
  uploadFn?: (uri: string, mime?: string) => Promise<string>;
  style?: StyleProp<ViewStyle>;
}

const AnimatedGestureScrollView = Animated.createAnimatedComponent(GestureScrollView);

const ICONS = {
  add: require('@/assets/publish/add.png'),
  remove: require('@/assets/publish/remove.png'),
};

interface SortableGridProps {
  images: UploadImage[];
  itemSize: number;
  gap: number;
  showAdd: boolean;
  showCoverBadge: boolean;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onRetry: (item: UploadImage) => void;
  onPreview: (index: number) => void;
  onDrop: (id: string, position: number, allPositions?: { [id: string]: number }) => void;
}

function SortableGrid({
  images,
  itemSize,
  gap,
  showAdd,
  showCoverBadge,
  onAdd,
  onRemove,
  onRetry,
  onPreview,
  onDrop,
}: SortableGridProps) {
  const data = useMemo(() => images.map(item => ({ ...item, id: item.key })), [images]);
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
          width: contentWidth + (showAdd ? itemSize : 0),
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
              onDrop={onDrop}
            >
              <View style={[styles.mediaItem, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}>
                <TouchableOpacity style={styles.mediaImgTouch} activeOpacity={0.9} onPress={() => onPreview(index)}>
                  <Image source={{ uri: item.uri }} style={styles.mediaImg} />
                </TouchableOpacity>
                {showCoverBadge && index === 0 && (
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
                    onPress={() => onRetry(item)}
                  >
                    <Text style={styles.mediaRetryText}>重试</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.mediaRemove} hitSlop={6} onPress={() => onRemove(item.key)}>
                  <Image source={ICONS.remove} style={styles.mediaRemoveIcon} />
                </TouchableOpacity>
              </View>
            </SortableItem>
          );
        })}
        {showAdd && (
          <TouchableOpacity
            style={[
              styles.mediaItem,
              styles.mediaAdd,
              styles.mediaAddAbsolute,
              { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12, left: data.length * (itemSize + gap) },
            ]}
            activeOpacity={0.8}
            onPress={onAdd}
          >
            <Image source={ICONS.add} style={styles.mediaAddIcon} />
          </TouchableOpacity>
        )}
      </AnimatedGestureScrollView>
    </DropProvider>
  );
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
}: ImageUploaderProps) {

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const latestRef = useRef<UploadImage[]>(value);
  const lastSentRef = useRef<UploadImage[]>(value);
  if (value !== lastSentRef.current) {
    lastSentRef.current = value;
    latestRef.current = value;
  }

  const emitChange = (updater: (prev: UploadImage[]) => UploadImage[]) => {
    const next = updater(latestRef.current);
    latestRef.current = next;
    lastSentRef.current = next;
    onChange(next);
  };

  const updateImage = (key: string, patch: Partial<UploadImage>) => {
    emitChange(prev => prev.map(item => (item.key === key ? { ...item, ...patch } : item)));
  };

  const uploadImageItem = async (key: string, uri: string, mime?: string) => {
    try {
      const compressed = await maybeCompressImage(uri);
      if (compressed !== uri) updateImage(key, { uri: compressed });
      const url = await uploadFn(compressed, mime);
      updateImage(key, { url, uploading: false });
    } catch {
      updateImage(key, { uploading: false, failed: true });
    }
  };

  const pickImages = async () => {
    try {
      const remain = maxCount - latestRef.current.length;
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
      const newItems: UploadImage[] = valid.slice(0, remain).map(item => ({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri: item.path,
        uploading: true,
        width: item.width,
        height: item.height,
        size: item.size,
      }));
      if (!newItems.length) return;
      emitChange(prev => [...prev, ...newItems].slice(0, maxCount));
      newItems.forEach((item, i) => {
        uploadImageItem(item.key, item.uri, valid[i]?.mime);
      });
    } catch (e) {
      console.log('选择图片异常', e);
    }
  };

  const removeImage = (key: string) => {
    emitChange(prev => prev.filter(item => item.key !== key));
  };

  const handleDrop = (_id: string, _position: number, allPositions?: { [id: string]: number }) => {
    if (!allPositions) return;
    emitChange(prev => [...prev].sort((a, b) => (allPositions[a.key] ?? 0) - (allPositions[b.key] ?? 0)));
  };

  return (
    <View style={[{ height: itemSize }, style]}>
      <SortableGrid
        key={value.map(item => item.key).join('|')}
        images={value}
        itemSize={itemSize}
        gap={gap}
        showAdd={value.length < maxCount}
        showCoverBadge={showCoverBadge}
        onAdd={pickImages}
        onRemove={removeImage}
        onRetry={item => {
          updateImage(item.key, { uploading: true, failed: false });
          uploadImageItem(item.key, item.uri);
        }}
        onPreview={index => setPreviewIndex(index)}
        onDrop={handleDrop}
      />
      <Modal
        transparent
        visible={previewIndex !== null}
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        {previewIndex !== null && (
          <GestureViewer
            data={value.map(item => item.uri)}
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
