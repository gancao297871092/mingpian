import React, { useCallback, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import { shareImage } from 'native-wechat';
import AppBlurView from '@/components/capabilities/AppBlurView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PersonalPoster from '@/components/posters/PersonalPoster';
import CompanyPoster from '@/components/posters/CompanyPoster';
import { normalizeCardStyle, type CardData } from '@/components/cards/types';
import type { CompanyCardData } from '@/components/cards/CompanyCard';
import { saveToGallery } from '@/components/capabilities/Gallery';
import { isWechatAvailable } from '@/utils/wechat';
import { MomentsIcon, SaveIcon, WechatIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const WX_SCENE_SESSION = 0;
const WX_SCENE_TIMELINE = 1;

export interface CardShareSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 个人名片数据（个人名片分享时传） */
  card?: CardData | null;
  /** 企业名片数据（企业名片分享时传） */
  company?: CompanyCardData | null;
}

/** 名片分享蒙层：海报浮于模糊蒙层 + 底部更多操作（figma 分享个人名片 1072:4545 / 分享 1072:4204） */
export default function CardShareSheet({ visible, onClose, card, company }: CardShareSheetProps) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  const isPersonal = !!card;
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.mask}>
        <AppBlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={10} androidFallbackColor="rgba(0,0,0,0.25)" />
        <View style={styles.maskDim} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* 海报预览：浮于蒙层，垂直居中于弹层上方区域 */}
        <View style={styles.posterArea} pointerEvents="box-none">
          <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
            {isPersonal ? (
              <PersonalPoster
                data={card!}
                style={normalizeCardStyle(card?.styleCode)}
                fontColor={card?.fontColor}
                backColor={card?.backColor}
              />
            ) : (
              <CompanyPoster data={company || {}} />
            )}
          </ViewShot>
        </View>

        {/* 底部更多操作 */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + scaleSizeH(16) }]}>
          <View style={styles.grabber} />
          <View style={styles.actions}>
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
        </View>

        {/* Modal 会盖住 App 根部的 Toast，弹层内单独挂一个保证提示可见 */}
        <Toast topOffset={80} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
  },
  maskDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  posterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(16),
  },
  shot: {
    width: '100%',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: '#F6F7FB',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingTop: scaleSizeH(10),
  },
  grabber: {
    alignSelf: 'center',
    width: scaleSizeW(34),
    height: scaleSizeH(6),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#A3A3A3',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(26),
    marginTop: scaleSizeH(20),
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
