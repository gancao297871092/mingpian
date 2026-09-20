import React, { useRef, useState } from 'react';
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
import type { UploadImage } from '@/components/ImageUploader';

const ICONS = {
  add: require('@/assets/publish/add.png'),
  remove: require('@/assets/publish/remove.png'),
};

interface UploaderProps {
  value?: UploadImage[];
  onChange?: (images: UploadImage[]) => void;
  maxCount?: number;
  itemSize?: number;
  gap?: number;
  maxBytes?: number;
  uploadFn?: (uri: string, mime?: string) => Promise<string>;
  addIcon?: React.ReactNode;
}

export default function Uploader({
  value,
  onChange,
  maxCount = 9,
  itemSize = scaleSizeW(78),
  gap = scaleSizeW(10),
  maxBytes = MAX_IMAGE_BYTES,
  uploadFn = uploadToOss,
  addIcon,
}: UploaderProps) {
  const [innerImages, setInnerImages] = useState<UploadImage[]>([]);
  const controlled = value !== undefined;
  const images = controlled ? value : innerImages;
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const latestRef = useRef(images);
  latestRef.current = images;

  const emitChange = (updater: (prev: UploadImage[]) => UploadImage[]) => {
    const next = updater(latestRef.current);
    latestRef.current = next;
    if (controlled) {
      onChange?.(next);
    } else {
      setInnerImages(next);
      onChange?.(next);
    }
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

  return (
    <View style={[styles.grid, { gap }]}>
      {images.map((item, index) => (
        <View
          key={item.key}
          style={[styles.thumbWrap, { width: itemSize, height: itemSize, borderRadius: itemSize * 0.12 }]}
        >
          <TouchableOpacity style={styles.thumbTouch} activeOpacity={0.9} onPress={() => setPreviewIndex(index)}>
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
                updateImage(item.key, { uploading: true, failed: false });
                uploadImageItem(item.key, item.uri);
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
      {images.length < maxCount && (
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
            data={images.map(item => item.uri)}
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
