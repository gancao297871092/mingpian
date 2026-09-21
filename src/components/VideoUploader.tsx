import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';
import { MAX_VIDEO_BYTES } from '@/utils/media';

export interface UploadVideo {
  uri: string;
  mediaId?: number;
  url?: string;
  uploading: boolean;
  failed?: boolean;
  width?: number;
  height?: number;
  size?: number;
  duration?: number;
  /** 本地上传标记：1=本次新上传（发布时需提交） */
  isLocal?: number;
}

interface VideoUploaderProps {
  value: UploadVideo | null;
  onChange: (video: UploadVideo | null) => void;
  width?: number;
  height?: number;
  emptySize?: number;
  maxBytes?: number;
  style?: StyleProp<ViewStyle>;
}

const ICONS = {
  videoAdd: require('@/assets/publish/video-add.png'),
  remove: require('@/assets/publish/remove.png'),
};

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TIMES = 150;

export default function VideoUploader({
  value,
  onChange,
  width = scaleSizeW(110),
  height = scaleSizeW(110),
  emptySize = scaleSizeW(85),
  maxBytes = MAX_VIDEO_BYTES,
  style,
}: VideoUploaderProps) {
  const [playerVisible, setPlayerVisible] = useState(false);
  const tokenRef = useRef(0);

  const pollMedia = async (mediaId: number, token: number): Promise<string> => {
    for (let i = 0; i < POLL_MAX_TIMES; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      if (tokenRef.current !== token) throw new Error('cancelled');
      const res = await API.file.mediaStatus({ mediaId });
      if (res.data.status === 1 && res.data.url) return res.data.url;
      if (res.data.status !== 0) throw new Error('视频转码失败');
    }
    throw new Error('视频转码超时');
  };

  const startUpload = async (video: UploadVideo, mime?: string) => {
    const token = ++tokenRef.current;
    onChange({ ...video, uploading: true, failed: false });
    try {
      const name = video.uri.split('/').pop() || `video-${Date.now()}.mp4`;
      const fileUri = video.uri.startsWith('file://') ? video.uri : `file://${video.uri}`;
      const form = new FormData();
      form.append('file', { uri: fileUri, type: mime || 'video/mp4', name } as any);
      form.append('fileName', name);
      const res = await API.file.uploadVideo(form);
      const mediaId = res.data.id;
      if (tokenRef.current !== token) return;
      onChange({ ...video, mediaId, uploading: true });
      const url = await pollMedia(mediaId, token);
      if (tokenRef.current !== token) return;
      onChange({ ...video, mediaId, url, uploading: false });
    } catch (e: any) {
      if (tokenRef.current !== token) return;
      if (e?.message !== 'cancelled') {
        onChange({ ...video, uploading: false, failed: true });
      }
    }
  };

  const pickVideo = async () => {
    try {
      const picked = await ImagePicker.openPicker({ mediaType: 'video', multiple: false });
      const item = Array.isArray(picked) ? picked[0] : picked;
      if (!item?.path) return;
      if (item.size && item.size > maxBytes) {
        Alert.alert('提示', `视频过大，请选择${Math.round(maxBytes / 1024 / 1024)}MB以内的视频`);
        return;
      }
      startUpload(
        {
          uri: item.path,
          uploading: true,
          width: item.width,
          height: item.height,
          size: item.size,
          duration: item.duration,
          isLocal: 1,
        },
        item.mime,
      );
    } catch {
      // 用户取消
    }
  };

  const removeVideo = () => {
    tokenRef.current += 1;
    onChange(null);
  };

  const size = { width, height };

  return (
    <View style={style}>
      {value ? (
        <View style={[styles.videoPreview, size]}>
          <TouchableOpacity style={styles.videoPreviewTouch} activeOpacity={0.9} onPress={() => setPlayerVisible(true)}>
            <Video source={{ uri: value.uri }} style={styles.videoPreviewImg} paused resizeMode="cover" />
            <View style={styles.videoPlayBtn}>
              <Svg width={scaleSizeW(18)} height={scaleSizeW(18)} viewBox="0 0 24 24">
                <Path d="M8 5l12 7-12 7z" fill="#FFFFFF" />
              </Svg>
            </View>
            {value.uploading && (
              <View style={styles.mediaLoading}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            )}
            {!value.uploading && value.failed && (
              <TouchableOpacity
                style={styles.mediaLoading}
                activeOpacity={0.8}
                onPress={() => startUpload(value)}
              >
                <Text style={styles.mediaRetryText}>重试</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View style={styles.videoBadge}>
            <Svg width={scaleSizeW(8)} height={scaleSizeW(8)} viewBox="0 0 24 24">
              <Path d="M7 4l13 8-13 8z" fill="#FFFFFF" />
            </Svg>
            <Text style={styles.videoBadgeText}>含视频</Text>
          </View>
          <TouchableOpacity style={styles.videoRemove} hitSlop={6} onPress={removeVideo}>
            <Image source={ICONS.remove} style={styles.mediaRemoveIcon} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.mediaAdd, { width: emptySize, height: emptySize }]}
          activeOpacity={0.8}
          onPress={pickVideo}
        >
          <Image source={ICONS.videoAdd} style={styles.mediaAddIcon} />
        </TouchableOpacity>
      )}
      <VideoPlayerModal visible={playerVisible} uri={value?.uri ?? null} onClose={() => setPlayerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  mediaAdd: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaAddIcon: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
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
  mediaRemoveIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  videoPreview: {
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  videoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  videoPreviewTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: scaleSizeW(-18),
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: scaleSizeW(10),
    right: scaleSizeW(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoBadgeText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  videoRemove: {
    position: 'absolute',
    top: scaleSizeW(4),
    left: scaleSizeW(4),
  },
});
