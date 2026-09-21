import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import { scaleSizeW } from '@/utils/screenUtils';
import { MAX_IMAGE_BYTES, maybeCompressImage } from '@/utils/media';
import { uploadToOss } from '@/utils/ossUpload';

interface UploadItem {
  key: string;
  uri: string;
  url?: string;
  uploading: boolean;
  failed?: boolean;
}

interface UploaderProps {
  /** 已上传图片 url 列表（对外契约，与后端 images 字段一致）；不传则内部自管 */
  value?: string[];
  onChange?: (urls: string[]) => void;
  /** 存在上传中或失败项时回调（用于提交前校验） */
  onBusyChange?: (busy: boolean) => void;
  maxCount?: number;
  itemSize?: number;
  gap?: number;
  maxBytes?: number;
  uploadFn?: (uri: string, mime?: string) => Promise<string>;
  addIcon?: React.ReactNode;
}

const ICONS = {
  add: require('@/assets/publish/add.png'),
  remove: require('@/assets/publish/remove.png'),
};

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function toItem(url: string): UploadItem {
  return { key: newKey(), uri: url, url, uploading: false };
}

export default function Uploader({
  value,
  onChange,
  onBusyChange,
  maxCount = 9,
  itemSize = scaleSizeW(78),
  gap = scaleSizeW(10),
  maxBytes = MAX_IMAGE_BYTES,
  uploadFn = uploadToOss,
  addIcon,
}: UploaderProps) {
  const controlled = value !== undefined;
  const [innerUrls, setInnerUrls] = useState<string[]>([]);
  const urls = controlled ? (value as string[]) : innerUrls;
  const [items, setItems] = useState<UploadItem[]>(() => urls.map(toItem));
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const lastEmittedRef = useRef<string[]>(urls);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const emit = (next: UploadItem[]) => {
    const nextUrls = next.filter(i => !!i.url).map(i => i.url as string);
    lastEmittedRef.current = nextUrls;
    if (!controlled) setInnerUrls(nextUrls);
    onChange?.(nextUrls);
  };

  const updateItems = (updater: (prev: UploadItem[]) => UploadItem[]) => {
    const next = updater(itemsRef.current);
    setItems(next);
    onBusyChange?.(next.some(i => i.uploading || i.failed));
    return next;
  };

  // 外部回填：value 变化且非本组件 emit 引起时重建
  useEffect(() => {
    if (urls === lastEmittedRef.current) return;
    lastEmittedRef.current = urls;
    updateItems(() => urls.map(toItem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls]);

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
      const newItems: UploadItem[] = valid.slice(0, remain).map(item => ({
        key: newKey(),
        uri: item.path,
        uploading: true,
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

  const previewUrls = items.filter(i => !!i.url).map(i => i.url as string);

  return (
    <View style={[styles.grid, { gap }]}>
      {items.map(item => (
        <View
          key={item.key}
          style={[styles.thumbWrap, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}
        >
          <TouchableOpacity
            style={styles.thumbTouch}
            activeOpacity={0.9}
            onPress={() => {
              const idx = previewUrls.indexOf(item.url as string);
              if (idx >= 0) setPreviewIndex(idx);
            }}
          >
            <Image source={{ uri: item.uri }} style={styles.thumb} />
          </TouchableOpacity>
          {item.uploading && (
            <View style={styles.thumbOverlay}>
              <ActivityIndicator color="#FFFFFF" size="small" />
            </View>
          )}
          {!item.uploading && item.failed && (
            <TouchableOpacity
              style={styles.thumbOverlay}
              activeOpacity={0.8}
              onPress={() => {
                updateItems(prev =>
                  prev.map(i => (i.key === item.key ? { ...i, uploading: true, failed: false } : i)),
                );
                uploadItem(item.key, item.uri);
              }}
            >
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.removeBtn} hitSlop={6} onPress={() => removeImage(item.key)}>
            <Image source={ICONS.remove} style={styles.removeIcon} />
          </TouchableOpacity>
        </View>
      ))}
      {items.length < maxCount && (
        <TouchableOpacity
          style={[styles.addBtn, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}
          activeOpacity={0.8}
          onPress={pickImages}
        >
          {addIcon ?? <Image source={ICONS.add} style={styles.addIcon} />}
        </TouchableOpacity>
      )}
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
              <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbWrap: {
    overflow: 'hidden',
  },
  thumbTouch: {
    width: '100%',
    height: '100%',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  removeBtn: {
    position: 'absolute',
    top: scaleSizeW(3),
    right: scaleSizeW(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  addBtn: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
