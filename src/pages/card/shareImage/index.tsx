import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { shareImage } from 'native-wechat';
import SafeView from '@/components/SafeView';
import PersonalPoster from '@/components/posters/PersonalPoster';
import CompanyPoster from '@/components/posters/CompanyPoster';
import { normalizeCardStyle, type CardData } from '@/components/cards/types';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { saveToGallery } from '@/components/capabilities/Gallery';
import { isWechatAvailable } from '@/utils/wechat';
import { MomentsIcon, SaveIcon, WechatIcon } from '@/pages/square/bbsDetail/sheetIcons';
import type { RootStackParamList } from '@/route/map';

const WX_SCENE_SESSION = 0;
const WX_SCENE_TIMELINE = 1;

export default function CardShareImage() {
  const route = useRoute<RouteProp<RootStackParamList, 'cardShareImage'>>();
  const { cardId, cpId, cpName, poster } = route.params || {};
  const isPersonal = !!cardId;

  const [card, setCard] = useState<CardData | null>(null);
  const [busy, setBusy] = useState(false);
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  useEffect(() => {
    if (!isPersonal) return;
    let mounted = true;
    API.card
      .detail({ cardId: cardId! })
      .then(res => {
        if (mounted && res.code === '200') setCard(res.data || {});
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isPersonal, cardId]);

  const qrValue = isPersonal
    ? `mingpian://cardDetail?id=${cardId}`
    : `mingpian://companyPage?id=${cpId || ''}`;

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

  const loading = isPersonal && !card;

  return (
    <SafeView backgroundColor="#F6F7FB" style={styles.container}>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2962D4" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
              {isPersonal ? (
                <PersonalPoster
                  data={card!}
                  style={normalizeCardStyle(card?.styleCode)}
                  fontColor={card?.fontColor}
                  backColor={card?.backColor}
                  qrValue={qrValue}
                />
              ) : (
                <CompanyPoster
                  data={{ cpId, cpName, poster }}
                  qrValue={qrValue}
                />
              )}
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
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(24),
    paddingBottom: scaleSizeH(24),
  },
  shot: {
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSizeW(50),
    paddingHorizontal: scaleSizeW(26),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(24),
    backgroundColor: '#F6F7FB',
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
