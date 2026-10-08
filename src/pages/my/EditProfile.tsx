import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import AreaPicker from '@/components/AreaPicker';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { uploadToOss } from '@/utils/ossUpload';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CameraBadgeIcon } from './myIcons';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';

const GENDER_OPTIONS = [
  { key: 1, label: '男' },
  { key: 2, label: '女' },
  { key: 0, label: '保密' },
];

export default function EditProfile() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userInfo, setUserInfo } = useUserStore();
  const wqUser = userInfo?.wqUser;
  const genderSheetRef = useRef<BottomSheetModal>(null);
  const [areaVisible, setAreaVisible] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const refreshUserInfo = useCallback(() => {
    API.user.info()
      .then(res => res.data && setUserInfo(res.data))
      .catch(() => {});
  }, [setUserInfo]);

  const saveField = useCallback(
    (data: Parameters<typeof API.user.updateInfo>[0]) => {
      API.user
        .updateInfo(data)
        .then(() => {
          Toast.show({ type: 'success', text1: '已保存' });
          refreshUserInfo();
        })
        .catch(err => Toast.show({ type: 'error', text1: err?.msg || '保存失败' }));
    },
    [refreshUserInfo],
  );

  const onPickAvatar = async () => {
    if (avatarBusy) return;
    try {
      const img = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 400,
        height: 400,
        cropperCircleOverlay: true,
      });
      if (!img?.path) return;
      const localUri = img.path.startsWith('file://') ? img.path : `file://${img.path}`;
      setAvatarPreview(localUri);
      setAvatarBusy(true);
      try {
        const url = await uploadToOss(img.path, img.mime);
        await API.user.updateInfo({ avatar: url });
        const res = await API.user.info();
        if (res.data) setUserInfo(res.data);
        setAvatarPreview(null);
        Toast.show({ type: 'success', text1: '已保存' });
      } catch (err: any) {
        setAvatarPreview(null);
        Toast.show({ type: 'error', text1: err?.msg || '头像上传失败，请重试' });
      } finally {
        setAvatarBusy(false);
      }
    } catch {
      // 用户取消选择
    }
  };

  const renderRow = (label: string, value: string, placeholder: boolean, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, placeholder && styles.rowValuePlaceholder]} numberOfLines={1}>
        {value}
      </Text>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <TouchableOpacity activeOpacity={0.9} style={styles.avatarBox} onPress={onPickAvatar} disabled={avatarBusy}>
        <ExpoImage
          source={{ uri: avatarPreview || wqUser?.avatar || 'https://i.pravatar.cc/100?img=8' }}
          style={styles.avatar}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.avatarBadge}>
          <CameraBadgeIcon />
        </View>
        {avatarBusy && (
          <View style={styles.avatarLoading}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.card}>
        {renderRow('昵称', wqUser?.username || wqUser?.nickname || '', !wqUser?.username && !wqUser?.nickname, () =>
          navigation.navigate('editName'),
        )}
        <View style={styles.divider} />
        {renderRow('简介', wqUser?.des || '简单介绍一下你自己...', !wqUser?.des, () =>
          navigation.navigate('editBio'),
        )}
      </View>
{/* 
      <View style={styles.card}>
        {renderRow('性别', genderText(wqUser?.gender), false, () => genderSheetRef.current?.present())}
        <View style={styles.divider} />
        {renderRow('生日', birthdayText(wqUser?.birthday), !wqUser?.birthday, () =>
          Toast.show({ type: 'info', text1: '生日设置暂未开放' }),
        )}
        <View style={styles.divider} />
        {renderRow('所在地', regionValue, regionValue === '未设置', () => setAreaVisible(true))}
      </View> */}

      <AppBottomSheet ref={genderSheetRef}>
        <View style={styles.genderCard}>
          {GENDER_OPTIONS.map((opt, i) => (
            <View key={opt.key}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.genderRow}
                onPress={() => {
                  genderSheetRef.current?.dismiss();
                  saveField({ gender: opt.key });
                }}
              >
                <Text style={styles.genderText}>{opt.label}</Text>
                {wqUser?.gender === opt.key && <View style={styles.genderDot} />}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </AppBottomSheet>

      <AreaPicker
        visible={areaVisible}
        onClose={() => setAreaVisible(false)}
        defaultProvince={wqUser?.province}
        defaultCity={wqUser?.city}
        defaultDistrict={wqUser?.district}
        onConfirm={(province, city, district) => {
          setAreaVisible(false);
          saveField({ province, city, district });
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  avatarBox: {
    alignSelf: 'center',
    marginTop: scaleSizeH(20),
  },
  avatar: {
    width: scaleSizeW(80),
    height: scaleSizeW(80),
    borderRadius: scaleSizeW(40),
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#EAEAEA',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scaleSizeW(40),
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
  },
  row: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  rowLabel: {
    width: scaleSizeW(80),
    fontSize: setSpText(15),
    color: '#6C6C6C',
  },
  rowValue: {
    flex: 1,
    fontSize: setSpText(15),
    color: '#000000',
  },
  rowValuePlaceholder: {
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(14),
  },
  genderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginTop: scaleSizeH(4),
  },
  genderRow: {
    height: scaleSizeH(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  genderText: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  genderDot: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    borderRadius: scaleSizeW(5),
    backgroundColor: BLUE,
  },
});
