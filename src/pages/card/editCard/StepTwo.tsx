import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CameraGrayIcon, DelCircleIcon, InfoBlueIcon } from './stepIcons';
import type { StepHandle } from './types';

interface StepTwoProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

const StepTwo = forwardRef<StepHandle, StepTwoProps>(function StepTwoForm({ cardId, data, onNext }, ref) {
  // 对齐小程序：名片 id 优先取 props，其次取第一步返回的 preId/cardId
  const cid = cardId ?? (data.preId ? Number(data.preId) : null) ?? (data.cardId ? Number(data.cardId) : null);
  const [mediaList, setMediaList] = useState<any[]>(
    (data.mediaList || data.mediaLinkList || []).filter((o: any) => !!o.media || !!o.mdUrl)
  );
  const [indexId, setIndexId] = useState<number | null>(
    (data.mediaList || data.mediaLinkList || [])?.find((o: any) => o.isIndex)?.mdId || null
  );
  const [uploading, setUploading] = useState(false);

  const uploadImg = async () => {
    if (mediaList.length >= 9) {
      Alert.alert('提示', '最多上传9张图片');
      return;
    }
    if (!cid) {
      Alert.alert('提示', '请先完成第一步');
      return;
    }

    try {
      const image = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        cropperCircleOverlay: false,
        compressImageQuality: 0.8,
      });

      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: image.path,
        type: image.mime || 'image/jpeg',
        name: image.filename || 'image.jpg',
      } as any);

      const res = await API.file.upload(formData);
      if (res.code === '200' && res.data) {
        const mediaData = res.data;
        const newLink = {
          userId: mediaData.userId ?? data.userId,
          type: 1,
          mdId: mediaData.id,
          targetId: cid,
          isIndex: 0,
          media: {
            id: mediaData.id,
            mdUrl: mediaData.mdUrl || mediaData.url,
            width: mediaData.width,
            height: mediaData.height,
          },
        };

        setMediaList([...mediaList, newLink]);

        // 保存素材关系（失败不阻断，但需等待完成：下一步设封面按 mdId 查 link，未落库会更新失败）
        try {
          await API.common.mediaLinkSave([newLink]);
        } catch {
          // ignore
        }
      }
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('上传失败', e?.msg || '请稍后重试');
      }
    } finally {
      setUploading(false);
    }
  };

  const onSetIndex = async (item: any) => {
    try {
      // 对齐小程序：先设新封面，再取消旧封面
      await API.common.mediaLinkUpdate({ mdId: item.mdId, isIndex: 1 });
      if (indexId && indexId !== item.mdId) {
        await API.common.mediaLinkUpdate({ mdId: indexId, isIndex: 0 });
      }
      setIndexId(item.mdId);
    } catch {
      Alert.alert('设置失败');
    }
  };

  const onDelete = async (item: any, index: number) => {
    // 乐观更新：先移除 UI，再调删除接口
    if (indexId === item.mdId) {
      setIndexId(null);
    }
    const newList = [...mediaList];
    newList.splice(index, 1);
    setMediaList(newList);
    if (item.mdId) {
      try {
        await API.common.mediaDel({ mediaId: item.mdId });
      } catch {
        Alert.alert('删除失败');
      }
    }
  };

  const onSubmit = async () => {
    if (mediaList.length <= 0) {
      Alert.alert('提示', '请上传名片照片');
      return;
    }
    // 未手动设封面时默认第一张为封面（对齐小程序）；接口失败不影响本地封面态
    if (!indexId && mediaList[0]) {
      try {
        await API.common.mediaLinkUpdate({ mdId: mediaList[0].mdId, isIndex: 1 });
      } catch {
        // ignore
      }
      setIndexId(mediaList[0].mdId);
    }
    // 提前加载下一步的 itemsList（对齐小程序）
    try {
      const res = await API.card.projectPre({ cardId: cid! });
      if (res.code === '200') {
        onNext(3, {
          preId: cid,
          userId: mediaList[0]?.userId ?? data.userId,
          mediaList,
          itemsList: res.data?.[0]?.itemsList || [],
          pjId: res.data?.[0]?.id,
        });
        return;
      }
    } catch {
      // ignore
    }
    onNext(3, { preId: cid, mediaList });
  };

  useImperativeHandle(ref, () => ({ submit: onSubmit }));

  return (
    <View style={styles.container}>
      {/* 提示条（figma 创建名片2） */}
      <View style={styles.tipBanner}>
        <InfoBlueIcon />
        <Text style={styles.tipText}>图片建议宽高比为1:1</Text>
      </View>

      <View style={styles.grid}>
        {mediaList.map((item, index) => {
          const isCover = item.mdId === indexId;
          return (
            <View key={item.mdId || index} style={styles.imgBox}>
              <ExpoImage
                source={{ uri: item.media?.mdUrl || item.mdUrl }}
                style={styles.img}
                contentFit="cover"
                transition={150}
              />
              {isCover && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverText}>封面</Text>
                </View>
              )}
              {!isCover && (
                <TouchableOpacity
                  style={styles.setCoverBadge}
                  activeOpacity={0.8}
                  onPress={() => onSetIndex(item)}
                >
                  <Text style={styles.setCoverText}>设为封面</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.delBtn}
                activeOpacity={0.8}
                onPress={() => onDelete(item, index)}
              >
                <DelCircleIcon />
              </TouchableOpacity>
            </View>
          );
        })}
        {mediaList.length < 9 && (
          <TouchableOpacity
            style={[styles.uploadBox, uploading && { opacity: 0.6 }]}
            activeOpacity={0.8}
            onPress={uploadImg}
            disabled={uploading}
          >
            <CameraGrayIcon />
            <Text style={styles.uploadText}>上传图片{mediaList.length}/9</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: scaleSizeW(40) }} />
    </View>
  );
});

export default StepTwo;

const styles = StyleSheet.create({
  container: {},
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeW(10),
    marginTop: scaleSizeW(10),
  },
  tipText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#2962D4',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(11),
    marginTop: scaleSizeW(16),
  },
  imgBox: {
    width: scaleSizeW(116),
    height: scaleSizeW(116),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    left: scaleSizeW(5),
    top: scaleSizeW(5),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(90),
    paddingHorizontal: scaleSizeW(7),
    paddingVertical: scaleSizeW(2),
    zIndex: 2,
  },
  coverText: {
    color: '#FFFFFF',
    fontSize: setSpText(10),
    fontWeight: '500',
  },
  setCoverBadge: {
    position: 'absolute',
    left: scaleSizeW(24),
    bottom: scaleSizeW(11),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: scaleSizeW(90),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeW(3),
    zIndex: 2,
  },
  setCoverText: {
    color: '#FFFFFF',
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  delBtn: {
    position: 'absolute',
    right: scaleSizeW(5),
    top: scaleSizeW(5),
    zIndex: 2,
  },
  uploadBox: {
    width: scaleSizeW(116),
    height: scaleSizeW(116),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  uploadText: {
    fontWeight: '400',
    fontSize: setSpText(10),
    color: '#999999',
  },
});
