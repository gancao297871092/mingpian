import React, { useMemo, useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ImagePicker from 'react-native-image-crop-picker';
import Video from 'react-native-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import { storageUtils } from '@/utils/storage';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import { getFeedCoverHeight } from '@/utils/feedLayout';
import type { RootStackParamList } from '@/route/map';

const BG = '#1A191E';
const CROP_W = scaleSizeW(386);

export const COVER_RATIO_KEY = 'publish-cover-ratio';
export const COVER_URI_KEY = 'publish-cover-uri';
export const COVER_TRANSFORM_KEY = 'publish-cover-transform';

type RatioKey = '3:4' | '16:9';
const RATIO_H: Record<RatioKey, number> = {
  '3:4': scaleSizeW(515),
  '16:9': scaleSizeW(289),
};

export default function PublishCover() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'publishCover'>>();
  const { videoUri, ratio: initialRatio = '3:4', title = '' } = route.params;

  const [tab, setTab] = useState<'crop' | 'preview'>('crop');
  const [ratio, setRatio] = useState<RatioKey>(initialRatio);
  const [albumCover, setAlbumCover] = useState<string | null>(null);

  const cropH = RATIO_H[ratio];

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const clampOffsets = () => {
    'worklet';
    const maxX = (CROP_W * (scale.value - 1)) / 2;
    const maxY = (cropH * (scale.value - 1)) / 2;
    tx.value = Math.min(Math.max(tx.value, -maxX), maxX);
    ty.value = Math.min(Math.max(ty.value, -maxY), maxY);
  };

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
      clampOffsets();
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
      clampOffsets();
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const previewCoverSize = {
    width: scaleSizeW(194),
    height: getFeedCoverHeight(scaleSizeW(194), ratio),
  };
  const previewK = previewCoverSize.width / CROP_W;
  const previewMediaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value * previewK },
      { translateY: ty.value * previewK },
      { scale: scale.value },
    ],
  }));

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pickFromAlbum = async () => {
    try {
      const picked = await ImagePicker.openPicker({ mediaType: 'photo', multiple: false });
      const item = Array.isArray(picked) ? picked[0] : picked;
      if (item?.path) {
        setAlbumCover(item.path);
        resetTransform();
      }
    } catch {
      // 用户取消
    }
  };

  const onDone = () => {
    storageUtils.set(COVER_RATIO_KEY, ratio);
    if (albumCover) {
      storageUtils.set(COVER_URI_KEY, albumCover);
    }
    storageUtils.setObject(COVER_TRANSFORM_KEY, {
      tx: savedTx.value,
      ty: savedTy.value,
      scale: savedScale.value,
    });
    navigation.goBack();
  };

  const renderMedia = (width: number, height: number) =>
    albumCover ? (
      <Animated.Image source={{ uri: albumCover }} style={{ width, height }} resizeMode="cover" />
    ) : (
      <Video source={{ uri: videoUri }} style={{ width, height }} paused resizeMode="cover" />
    );

  const renderCrop = () => (
    <View>
      <View style={[styles.cropRegion, { height: cropH }]}>
        <View style={styles.cropDim}>{renderMedia(CROP_W, cropH)}</View>
        <GestureDetector gesture={composed}>
          <View style={[styles.cropWindow, { height: cropH }]}>
            <Animated.View style={mediaStyle}>{renderMedia(CROP_W, cropH)}</Animated.View>
          </View>
        </GestureDetector>
        <Text style={styles.cropHint}>拖动调整位置，双指缩放</Text>
        <TouchableOpacity
          style={styles.ratioBadge}
          activeOpacity={0.8}
          onPress={() => {
            setRatio(ratio === '3:4' ? '16:9' : '3:4');
            resetTransform();
          }}
        >
          <Image source={require('@/assets/publish/ratio.png')} style={styles.ratioBadgeIcon} />
          <Text style={styles.ratioBadgeText}>{ratio}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.albumBtn} activeOpacity={0.8} onPress={pickFromAlbum}>
        <Image source={require('@/assets/publish/album.png')} style={styles.albumIcon} />
        <Text style={styles.albumText}>相册</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMyCard = () => (
    <View style={styles.streamCard}>
      <View style={[styles.streamCover, previewCoverSize]}>
        <Animated.View style={[previewCoverSize, previewMediaStyle]}>
          {renderMedia(previewCoverSize.width, previewCoverSize.height)}
        </Animated.View>
        <View style={styles.streamBadge}>
          <Svg width={scaleSizeW(8)} height={scaleSizeW(8)} viewBox="0 0 24 24">
            <Path d="M7 4l13 8-13 8z" fill="#FFFFFF" />
          </Svg>
          <Text style={styles.streamBadgeText}>含视频</Text>
        </View>
      </View>
      <View style={styles.streamBody}>
        <Text style={styles.streamTitle} numberOfLines={1}>{title || '发布中的视频动态'}</Text>
        <View style={styles.streamMeta}>
          <View style={styles.streamAvatar} />
          <View style={styles.streamAuthor}>
            <Text style={styles.streamName}>刘强</Text>
            <Text style={styles.streamCompany} numberOfLines={1}>云南赣云供应链管理有...</Text>
          </View>
          <Svg width={scaleSizeW(14)} height={scaleSizeW(14)} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 20s-7-4.4-9.2-9A5.2 5.2 0 0 1 12 6.5 5.2 5.2 0 0 1 21.2 11C19 15.6 12 20 12 20Z"
              stroke="#616161"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.streamLike}>赞</Text>
        </View>
      </View>
    </View>
  );

  const renderPlaceholderCard = (key: string, tall: boolean) => (
    <View key={key} style={styles.placeholderCard}>
      <View style={[styles.placeholderImage, tall ? styles.placeholderImageTall : styles.placeholderImageShort]} />
      <View style={styles.placeholderBody}>
        <View style={styles.placeholderBarWide} />
        <View style={styles.placeholderBar} />
      </View>
    </View>
  );

  const renderPreview = () => {
    const myHeight = previewCoverSize.height + scaleSizeH(72);
    const items = [
      { key: 'mine', height: myHeight, node: renderMyCard() },
      { key: 'p1', height: scaleSizeW(237) + scaleSizeH(62), node: renderPlaceholderCard('p1', true) },
      { key: 'p2', height: scaleSizeW(160) + scaleSizeH(62), node: renderPlaceholderCard('p2', false) },
      { key: 'p3', height: scaleSizeW(237) + scaleSizeH(62), node: renderPlaceholderCard('p3', true) },
    ];
    const columns: typeof items[] = [[], []];
    const heights = [0, 0];
    items.forEach(item => {
      const target = heights[0] <= heights[1] ? 0 : 1;
      columns[target].push(item);
      heights[target] += item.height + scaleSizeW(4);
    });
    return (
      <View style={styles.stream}>
        {columns.map((col, i) => (
          <View key={`col-${i}`} style={styles.streamColumn}>
            {col.map(item => item.node)}
          </View>
        ))}
      </View>
    );
  };

  const header = useMemo(
    () => (
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab('crop')}>
          <Text style={[styles.tabText, tab !== 'crop' && styles.tabTextDim]}>选封面</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => setTab('preview')}>
          <Text style={[styles.tabText, tab !== 'preview' && styles.tabTextDim]}>预览</Text>
        </TouchableOpacity> */}
      </View>
    ),
    [tab],
  );

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" />
      <SafeView backgroundColor={BG} disableTop={false}>
        {header}
        {tab === 'crop' ? renderCrop() : renderPreview()}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.exitBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Text style={styles.exitBtnText}>退出</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} activeOpacity={0.85} onPress={onDone}>
            <Text style={styles.doneBtnText}>完成</Text>
          </TouchableOpacity>
        </View>
      </SafeView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: BG,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeW(50),
    paddingVertical: scaleSizeH(10),
  },
  tabText: {
    fontSize: scaleSizeW(17),
    color: '#FFFFFF',
  },
  tabTextDim: {
    opacity: 0.5,
  },
  cropRegion: {
    width: '100%',
    marginTop: scaleSizeH(16),
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cropDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  cropWindow: {
    width: CROP_W,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cropHint: {
    position: 'absolute',
    top: scaleSizeH(14),
    alignSelf: 'center',
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.47)',
    textShadowRadius: 1.8,
    textShadowOffset: { width: 0, height: 1 },
  },
  ratioBadge: {
    position: 'absolute',
    right: scaleSizeW(16),
    bottom: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(8),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  ratioBadgeText: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  ratioBadgeIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  albumBtn: {
    marginTop: scaleSizeH(30),
    marginLeft: scaleSizeW(16),
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#313035',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeH(3),
  },
  albumIcon: {
    width: scaleSizeW(13),
    height: scaleSizeW(13),
  },
  albumText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  stream: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(5),
    marginTop: scaleSizeH(16),
  },
  streamColumn: {
    width: scaleSizeW(194),
    gap: scaleSizeW(4),
  },
  streamCard: {
    width: scaleSizeW(194),
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  streamCover: {
    width: scaleSizeW(194),
    height: scaleSizeW(237),
    overflow: 'hidden',
  },
  streamBadge: {
    position: 'absolute',
    top: scaleSizeW(10),
    right: scaleSizeW(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  streamBadgeText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  streamBody: {
    padding: scaleSizeW(11),
  },
  streamTitle: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    color: '#333333',
  },
  streamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    marginTop: scaleSizeH(8),
  },
  streamAvatar: {
    width: scaleSizeW(27),
    height: scaleSizeW(27),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#E5E5E5',
  },
  streamAuthor: {
    flex: 1,
  },
  streamName: {
    fontSize: scaleSizeW(12),
    color: '#333333',
  },
  streamCompany: {
    fontSize: scaleSizeW(10),
    color: '#6C6C6C',
    marginTop: scaleSizeH(2),
  },
  streamLike: {
    fontSize: scaleSizeW(12),
    color: '#616161',
  },
  placeholderCard: {
    width: scaleSizeW(194),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#272729',
    overflow: 'hidden',
  },
  placeholderImage: {
    backgroundColor: '#2F2F33',
  },
  placeholderImageTall: {
    height: scaleSizeW(237),
  },
  placeholderImageShort: {
    height: scaleSizeW(160),
  },
  placeholderBody: {
    padding: scaleSizeW(10),
    gap: scaleSizeH(6),
  },
  placeholderBarWide: {
    width: scaleSizeW(150),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#3D3D3D',
  },
  placeholderBar: {
    width: scaleSizeW(77),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#3D3D3D',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: scaleSizeH(40),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
  },
  exitBtn: {
    width: scaleSizeW(80),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#2D2C31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  doneBtn: {
    width: scaleSizeW(80),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#2962D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
