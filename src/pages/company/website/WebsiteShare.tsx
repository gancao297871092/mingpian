import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { shareMiniProgram } from 'native-wechat';
import Toast from 'react-native-toast-message';
import AppBottomSheet from '@/components/AppBottomSheet';
import { useUserStore } from '@/store/user';
import { initWechat, isWechatAvailable } from '@/utils/wechat';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { MomentsIcon, WechatIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { ShareCircle } from './common';

interface Props {
  cpId: number | string;
  title?: string;
  coverUrl?: string;
}

export default function WebsiteShare({ cpId, title, coverUrl }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const busyRef = useRef(false);
  const userId = useUserStore(s => s.userInfo?.wqUser?.id);

  const onWechat = async () => {
    if (busyRef.current) return;
    if (!userId) {
      Toast.show({ type: 'info', text1: '请先登录后分享' });
      return;
    }
    busyRef.current = true;
    try {
      initWechat();
      if (!(await isWechatAvailable())) {
        Toast.show({ type: 'info', text1: '微信不可用' });
        return;
      }
      sheetRef.current?.dismiss();
      await shareMiniProgram({
        userName: 'gh_e0ace5730087',
        path: `pages/home/companyPage/companyPage?id=${encodeURIComponent(cpId)}&userId=${encodeURIComponent(userId)}`,
        miniProgramType: 0,
        scene: 0,
        // SDK 必填：旧版微信不支持小程序时回退到品牌官网。
        webpageUrl: 'https://www.lccxin.com/',
        title: title || '企业官网',
        coverUrl: coverUrl || '',
      });
    } catch (error) {
      console.warn('[wechatShare] company mini program failed:', error);
      Toast.show({ type: 'error', text1: '分享失败，请稍后重试' });
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <>
      <ShareCircle onPress={() => sheetRef.current?.present()} />
      <AppBottomSheet ref={sheetRef}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={onWechat}>
            <View style={[styles.circle, styles.green]}><WechatIcon /></View>
            <Text style={styles.label}>分享到微信</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => Toast.show({ type: 'info', text1: '暂时不支持分享到朋友圈' })}
          >
            <View style={styles.circle}><MomentsIcon /></View>
            <Text style={styles.label}>分享到朋友圈</Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12 },
  item: { alignItems: 'center' },
  circle: { width: scaleSizeW(50), height: scaleSizeW(50), borderRadius: scaleSizeW(25), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: '#3FCF77' },
  label: { fontSize: setSpText(12), color: '#6C6C6C', marginTop: 10 },
});
