import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { shareImage } from 'native-wechat';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import { getDetailCache } from '@/utils/detailCache';
import { saveToGallery } from '@/components/capabilities/Gallery';
import { isWechatAvailable } from '@/utils/wechat';
import { MomentsIcon, SaveIcon, WechatIcon } from '../bbsDetail/sheetIcons';
import { VERIFIED_PATH, transformDetail, type DetailData } from '../bbsDetail/detailTransform';
import type { RootStackParamList } from '@/route/map';

const CARD_W = SCREEN_WIDTH - scaleSizeW(32);
const DEFAULT_COVER_H = CARD_W * (535 / 370);
const WX_SCENE_SESSION = 0;
const WX_SCENE_TIMELINE = 1;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function BbsShareImage() {
  const route = useRoute<RouteProp<RootStackParamList, 'bbsShareImage'>>();
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [busy, setBusy] = useState(false);
  const [measuredCover, setMeasuredCover] = useState<{ w: number; h: number } | null>(null);
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  useEffect(() => {
    let mounted = true;
    const cached = getDetailCache(route.params.id);
    if (cached && mounted) setDetail(transformDetail(cached));
    API.square
      .bbsDetail({ bbsId: route.params.id })
      .then(res => {
        if (mounted) setDetail(transformDetail(res.data?.bbs ?? {}));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [route.params.id]);

  const plainContent = useMemo(() => (detail ? stripHtml(detail.content) : ''), [detail]);

  // 按首图真实宽高比展示，避免 cover 裁切；无尺寸信息时回退设计稿比例
  const coverHeight = useMemo(() => {
    const size =
      detail && detail.mediaWidth > 0 && detail.mediaHeight > 0
        ? { w: detail.mediaWidth, h: detail.mediaHeight }
        : measuredCover;
    if (size) {
      const h = CARD_W * (size.h / size.w);
      return Math.min(Math.max(h, CARD_W * 0.5), DEFAULT_COVER_H);
    }
    return DEFAULT_COVER_H;
  }, [detail, measuredCover]);

  const capture = useCallback(async (): Promise<string | null> => {
    try {
      const uri = await shotRef.current?.capture?.();
      return uri || null;
    } catch {
      return null;
    }
  }, []);

  const shareToWechat = useCallback(
    async (scene: number) => {
      if (busy) return;
      if (!(await isWechatAvailable())) {
        Toast.show({ type: 'error', text1: '微信不可用' });
        return;
      }
      setBusy(true);
      try {
        const uri = await capture();
        if (!uri) throw new Error('capture failed');
        await shareImage({ src: uri, scene });
      } catch {
        Toast.show({ type: 'error', text1: '分享失败' });
      } finally {
        setBusy(false);
      }
    },
    [busy, capture],
  );

  const saveImage = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await capture();
      if (!uri) throw new Error('capture failed');
      const ok = await saveToGallery(uri, 'photo');
      Toast.show({ type: ok ? 'success' : 'error', text1: ok ? '已保存到相册' : '保存失败' });
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setBusy(false);
    }
  }, [busy, capture]);

  return (
    <SafeView backgroundColor="#000000" style={styles.container}>
      {!detail ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <ExpoImage
                    source={{ uri: detail.authorAvatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={styles.authorCol}>
                    <Text style={styles.authorName} numberOfLines={1}>
                      {detail.authorName}
                    </Text>
                    <View style={styles.companyRow}>
                      {!!detail.authorCompany && (
                        <Text style={styles.authorCompany} numberOfLines={1}>
                          {detail.authorCompany}
                        </Text>
                      )}
                      <Svg width={scaleSizeW(12)} height={scaleSizeW(12)} viewBox="0 0 12 12">
                        <Path d={VERIFIED_PATH} fill="#2962D4" />
                      </Svg>
                    </View>
                  </View>
                </View>
                {detail.images.length > 0 && (
                  <ExpoImage
                    source={{ uri: detail.images[0] }}
                    style={[styles.cover, { height: coverHeight }]}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onLoad={e => {
                      const { width, height } = e.source;
                      if (width > 0 && height > 0) setMeasuredCover({ w: width, h: height });
                    }}
                  />
                )}
                <View style={styles.cardBody}>
                  {!!detail.title && (
                    <Text style={styles.title} numberOfLines={2}>
                      {detail.title}
                    </Text>
                  )}
                  {!!plainContent && (
                    <Text style={styles.content} numberOfLines={15}>
                      {plainContent}
                    </Text>
                  )}
                  {detail.tags.length > 0 && <Text style={styles.tags}>{detail.tags.join('  ')}</Text>}
                  <Text style={styles.meta}>
                    {detail.timeText}
                    {detail.location ? ` · ${detail.location}` : ''}
                  </Text>
                  <View style={styles.divider} />
                  <View style={styles.footerRow}>
                    <View style={styles.footerLeft}>
                      <RNImage
                        source={require('@/assets/share/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                      <Text style={styles.slogan}>让真实产业动态，连接可信合作。</Text>
                    </View>
                    <QRCode
                      value={`mingpian://bbsDetail?id=${detail.id}`}
                      size={scaleSizeW(74)}
                      color="#000000"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            </ViewShot>
          </ScrollView>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionItem}
              onPress={() => shareToWechat(WX_SCENE_SESSION)}
            >
              <View style={[styles.actionCircle, styles.actionCircleGreen]}>
                <WechatIcon />
              </View>
              <Text style={styles.actionLabel}>微信好友</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionItem}
              onPress={() => shareToWechat(WX_SCENE_TIMELINE)}
            >
              <View style={styles.actionCircle}>
                <MomentsIcon />
              </View>
              <Text style={styles.actionLabel}>朋友圈</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.actionItem} onPress={saveImage}>
              <View style={styles.actionCircle}>
                <SaveIcon />
              </View>
              <Text style={styles.actionLabel}>保存图片</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(16),
  },
  shot: {
    backgroundColor: '#000000',
  },
  card: {
    width: CARD_W,
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(60),
    paddingHorizontal: scaleSizeW(14),
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: scaleSizeW(37),
    height: scaleSizeW(37),
    borderRadius: scaleSizeW(18.5),
    borderWidth: 0.5,
    borderColor: '#F5F5F5',
    backgroundColor: '#F5F5F5',
  },
  authorCol: {
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(5),
  },
  authorName: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(12),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  authorCompany: {
    fontSize: setSpText(10),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  cover: {
    width: CARD_W,
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(12),
  },
  title: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  content: {
    fontSize: setSpText(14),
    color: '#333333',
    lineHeight: scaleSizeH(24),
    marginBottom: scaleSizeH(10),
  },
  tags: {
    fontSize: setSpText(14),
    color: '#2962D4',
    lineHeight: scaleSizeH(24),
    marginBottom: scaleSizeH(10),
  },
  meta: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(16),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexShrink: 1,
  },
  logo: {
    width: scaleSizeW(119),
    height: scaleSizeW(38),
  },
  slogan: {
    fontSize: setSpText(10),
    color: '#999999',
    marginTop: scaleSizeH(4),
  },
  bottomBar: {
    flexDirection: 'row',
    gap: scaleSizeW(50),
    paddingHorizontal: scaleSizeW(26),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(24),
    backgroundColor: 'rgba(246,247,251,0.8)',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(25),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleGreen: {
    backgroundColor: '#3FCF77',
  },
  actionLabel: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginTop: scaleSizeH(10),
  },
});
