import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppAlert } from '@/components/AppAlert';
import ImagePicker from 'react-native-image-crop-picker';
import { Image as ExpoImage } from 'expo-image';
import Animated from 'react-native-reanimated';
import { LegacyScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  DropProvider,
  SortableDirection,
  SortableGridItem,
  SortableItem,
  GridOrientation,
  useGridSortableList,
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
}

export type ImageUploaderLayout = 'horizontal' | 'grid';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  maxCount?: number;
  itemSize?: number;
  gap?: number;
  /** 布局模式：横向滚动（默认）或九宫格 */
  layout?: ImageUploaderLayout;
  /** 九宫格列数，仅 layout 为 grid 时生效 */
  columns?: number;
  showCoverBadge?: boolean;
  /** 添加按钮背景色 */
  addBackgroundColor?: string;
  maxBytes?: number;
  uploadFn?: (uri: string, mime?: string) => Promise<string>;
  /** 条目附加操作区（渲染在图片左下角，如「设为封面」） */
  renderItemActions?: (item: UploadImage, index: number) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedGestureScrollView = Animated.createAnimatedComponent(GestureScrollView);

const ICONS = {
  add: require('@/assets/publish/add.png'),
  remove: require('@/assets/publish/remove.png'),
};

interface MediaItemProps {
  item: UploadImage;
  index: number;
  itemSize: number;
  showCoverBadge: boolean;
  onRemove: (key: string) => void;
  onRetry: (item: UploadImage) => void;
  onPreview: (index: number) => void;
  renderItemActions?: (item: UploadImage, index: number) => React.ReactNode;
}

function MediaItem({ item, index, itemSize, showCoverBadge, onRemove, onRetry, onPreview, renderItemActions }: MediaItemProps) {
  return (
    <View style={[styles.mediaItem, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}>
      <TouchableOpacity style={styles.mediaImgTouch} activeOpacity={0.9} onPress={() => onPreview(index)}>
        {/* expo-image 内存+磁盘双缓存 + recyclingKey 防回收池复用闪图：tab 切换（display:none）恢复时不重新加载 */}
        <ExpoImage source={{ uri: item.uri }} recyclingKey={item.uri} style={styles.mediaImg} contentFit="cover" cachePolicy="memory-disk" transition={0} />
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
        <TouchableOpacity style={styles.mediaLoading} activeOpacity={0.8} onPress={() => onRetry(item)}>
          <Text style={styles.mediaRetryText}>重试</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.mediaRemove} hitSlop={6} onPress={() => onRemove(item.key)}>
        <Image source={ICONS.remove} style={styles.mediaRemoveIcon} />
      </TouchableOpacity>
      {!item.uploading && !item.failed && renderItemActions?.(item, index)}
    </View>
  );
}

interface SharedListProps {
  images: UploadImage[];
  itemSize: number;
  gap: number;
  showAdd: boolean;
  showCoverBadge: boolean;
  addBackgroundColor: string;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onRetry: (item: UploadImage) => void;
  onPreview: (index: number) => void;
  renderItemActions?: (item: UploadImage, index: number) => React.ReactNode;
}

interface HorizontalListProps extends SharedListProps {
  onDrop: (id: string, position: number, allPositions?: { [id: string]: number }) => void;
}

function HorizontalList({
  images,
  itemSize,
  gap,
  showAdd,
  showCoverBadge,
  addBackgroundColor,
  onAdd,
  onRemove,
  onRetry,
  onPreview,
  renderItemActions,
  onDrop,
}: HorizontalListProps) {
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
              <MediaItem
                item={item}
                index={index}
                itemSize={itemSize}
                showCoverBadge={showCoverBadge}
                onRemove={onRemove}
                onRetry={onRetry}
                onPreview={onPreview}
                renderItemActions={renderItemActions}
              />
            </SortableItem>
          );
        })}
        {showAdd && (
          <TouchableOpacity
            style={[
              styles.mediaItem,
              styles.mediaAdd,
              styles.mediaAddAbsolute,
              {
                width: itemSize,
                height: itemSize,
                borderRadius: itemSize * 0.12,
                left: data.length * (itemSize + gap),
                backgroundColor: addBackgroundColor,
              },
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

interface GridListProps extends SharedListProps {
  columns: number;
  onDrop: (id: string, position: number, allPositions?: { [id: string]: { index: number } }) => void;
}

function GridList({
  images,
  itemSize,
  gap,
  columns,
  showAdd,
  showCoverBadge,
  addBackgroundColor,
  onAdd,
  onRemove,
  onRetry,
  onPreview,
  renderItemActions,
  onDrop,
}: GridListProps) {
  const data = useMemo(() => images.map(item => ({ ...item, id: item.key })), [images]);
  const dimensions = useMemo(
    () => ({ columns, itemWidth: itemSize, itemHeight: itemSize, rowGap: gap, columnGap: gap }),
    [columns, itemSize, gap],
  );
  const { dropProviderRef, contentWidth, getItemProps } = useGridSortableList({
    data,
    dimensions,
    orientation: GridOrientation.Vertical,
  });

  const total = data.length + (showAdd ? 1 : 0);
  const rows = Math.ceil(total / columns);
  const height = rows > 0 ? rows * itemSize + (rows - 1) * gap : itemSize;
  const addLeft = (data.length % columns) * (itemSize + gap);
  const addTop = Math.floor(data.length / columns) * (itemSize + gap);

  return (
    <DropProvider ref={dropProviderRef}>
      <View style={{ width: contentWidth, height }}>
        {data.map((item, index) => {
          const itemProps = getItemProps(item, index);
          return (
            <SortableGridItem
              key={itemProps.id}
              id={itemProps.id}
              data={item}
              positions={itemProps.positions}
              scrollY={itemProps.scrollY}
              scrollX={itemProps.scrollX}
              autoScrollDirection={itemProps.autoScrollDirection}
              itemsCount={itemProps.itemsCount}
              dimensions={itemProps.dimensions}
              orientation={itemProps.orientation}
              strategy={itemProps.strategy}
              onDragStart={() =>
                ReactNativeHapticFeedback.trigger('impactLight', { enableVibrateFallback: true })
              }
              onDrop={onDrop}
            >
              <MediaItem
                item={item}
                index={index}
                itemSize={itemSize}
                showCoverBadge={showCoverBadge}
                onRemove={onRemove}
                onRetry={onRetry}
                onPreview={onPreview}
                renderItemActions={renderItemActions}
              />
            </SortableGridItem>
          );
        })}
        {showAdd && (
          <TouchableOpacity
            style={[
              styles.mediaItem,
              styles.mediaAdd,
              styles.mediaAddAbsolute,
              {
                width: itemSize,
                height: itemSize,
                borderRadius: itemSize * 0.12,
                left: addLeft,
                top: addTop,
                backgroundColor: addBackgroundColor,
              },
            ]}
            activeOpacity={0.8}
            onPress={onAdd}
          >
            <Image source={ICONS.add} style={styles.mediaAddIcon} />
          </TouchableOpacity>
        )}
      </View>
    </DropProvider>
  );
}

function urlsToUploadImages(urls: string[]): UploadImage[] {
  return urls.map(url => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${url.slice(-8)}`,
    uri: url,
    url,
    uploading: false,
  }));
}

export default function ImageUploader({
  value,
  onChange,
  onBusyChange,
  maxCount = 9,
  itemSize = scaleSizeW(85),
  gap = scaleSizeW(10),
  layout = 'horizontal',
  columns = 3,
  showCoverBadge = true,
  addBackgroundColor = '#F5F5F5',
  maxBytes = MAX_IMAGE_BYTES,
  uploadFn = uploadToOss,
  renderItemActions,
  style,
}: ImageUploaderProps) {
  const [innerItems, setInnerItems] = useState<UploadImage[]>(() => urlsToUploadImages(value));
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const currentUrls = innerItems.map(i => i.url).filter(Boolean) as string[];
    if (value.length !== currentUrls.length || !value.every((u, i) => u === currentUrls[i])) {
      setInnerItems(urlsToUploadImages(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitUrls = (nextItems: UploadImage[]) => {
    const urls = nextItems.map(i => i.url).filter(Boolean) as string[];
    onChange(urls);
    const busy = nextItems.some(i => i.uploading || i.failed);
    onBusyChange?.(busy);
  };

  const emitItems = (updater: (prev: UploadImage[]) => UploadImage[]) => {
    setInnerItems(prev => {
      const next = updater(prev);
      emitUrls(next);
      return next;
    });
  };

  const updateImage = (key: string, patch: Partial<UploadImage>) => {
    setInnerItems(prev => {
      const next = prev.map(item => (item.key === key ? { ...item, ...patch } : item));
      emitUrls(next);
      return next;
    });
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
      const remain = maxCount - innerItems.length;
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
        AppAlert.alert('提示', `图片过大，请选择${Math.round(maxBytes / 1024 / 1024)}MB以内的图片`);
      }
      const newItems: UploadImage[] = valid.slice(0, remain).map(item => ({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri: item.path,
        uploading: true,
      }));
      if (!newItems.length) return;
      emitItems(prev => [...prev, ...newItems].slice(0, maxCount));
      newItems.forEach((item, i) => {
        uploadImageItem(item.key, item.uri, valid[i]?.mime);
      });
    } catch (e) {
      console.log('选择图片异常', e);
    }
  };

  const removeImage = (key: string) => {
    emitItems(prev => prev.filter(item => item.key !== key));
  };

  const handleDrop = (_id: string, _position: number, allPositions?: { [id: string]: number }) => {
    if (!allPositions) return;
    emitItems(prev => [...prev].sort((a, b) => (allPositions[a.key] ?? 0) - (allPositions[b.key] ?? 0)));
  };

  const handleGridDrop = (_id: string, _position: number, allPositions?: { [id: string]: { index: number } }) => {
    if (!allPositions) return;
    emitItems(prev =>
      [...prev].sort((a, b) => (allPositions[a.key]?.index ?? 0) - (allPositions[b.key]?.index ?? 0)),
    );
  };

  const sharedProps = {
    images: innerItems,
    itemSize,
    gap,
    showAdd: innerItems.length < maxCount,
    showCoverBadge,
    addBackgroundColor,
    onAdd: pickImages,
    onRemove: removeImage,
    onRetry: (item: UploadImage) => {
      updateImage(item.key, { uploading: true, failed: false });
      uploadImageItem(item.key, item.uri);
    },
    onPreview: (index: number) => setPreviewIndex(index),
    renderItemActions,
  };

  const listKey = innerItems.map(item => item.key).join('|');

  return (
    <View style={[layout === 'horizontal' && { height: itemSize }, style]}>
      {layout === 'grid' ? (
        <GridList key={listKey} {...sharedProps} columns={columns} onDrop={handleGridDrop} />
      ) : (
        <HorizontalList key={listKey} {...sharedProps} onDrop={handleDrop} />
      )}
      <Modal
        transparent
        visible={previewIndex !== null}
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        {previewIndex !== null && (
          <GestureViewer
            data={innerItems.map(item => item.uri)}
            initialIndex={previewIndex}
            renderItem={(uri: string) => (
              <ExpoImage source={{ uri }} recyclingKey={uri} style={styles.previewViewerImage} contentFit="contain" cachePolicy="memory-disk" transition={0} />
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
