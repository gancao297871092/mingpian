import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const GRAY = '#999999';

function PlusIcon() {
  return (
    <Svg width={scaleSizeW(20)} height={scaleSizeW(20)} viewBox="0 0 20 20" fill="none">
      <Path d="M10 4v12M4 10h12" stroke="#B4B4B9" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** 我要纠错（figma 1970:6636） */
export default function CompanyErrorCorrection() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyErrorCorrection'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const collectId = route.params?.collectId;
  const companyName = route.params?.companyName;

  const [content, setContent] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onPick = useCallback(async () => {
    if (images.length >= 9) {
      Toast.show({ type: 'error', text1: '最多上传9张图片' });
      return;
    }
    setUploading(true);
    try {
      const picked = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: false,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });
      const formData = new FormData();
      formData.append('file', {
        uri: picked.path,
        type: picked.mime || 'image/jpeg',
        name: picked.filename || `error_${Date.now()}.jpg`,
      } as any);
      const res = await API.file.upload(formData);
      if (res.code === '200' && res.data?.mdUrl) {
        setImages((prev) => [...prev, res.data.mdUrl]);
      }
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') Toast.show({ type: 'error', text1: '上传失败' });
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const onSubmit = useCallback(async () => {
    if (!content.trim() && images.length === 0) {
      Toast.show({ type: 'error', text1: '没有任何纠错内容！' });
      return;
    }
    if (content.length > 500) {
      Toast.show({ type: 'error', text1: '纠错内容不能超过500字！' });
      return;
    }
    if (!collectId) {
      Toast.show({ type: 'error', text1: '请先认领企业后再提交纠错' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.common.companyError({
        collectId,
        errorContent: content,
        errorImg: images.join(','),
        linkPhone: phone,
      });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: '纠错上报成功！' });
      setTimeout(() => navigation.goBack(), 800);
    } catch {
      Toast.show({ type: 'error', text1: '提交失败' });
    } finally {
      setSubmitting(false);
    }
  }, [collectId, content, images, phone, navigation]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!!companyName && <Text style={styles.companyName}>{companyName}</Text>}

        {/* 上传图片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>上传图片</Text>
          <View style={styles.imageRow}>
            {images.map((url, i) => (
              <TouchableOpacity
                key={`${url}-${i}`}
                activeOpacity={0.8}
                style={styles.imageItem}
                onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <ExpoImage source={{ uri: url }} style={styles.image} contentFit="cover" transition={150} />
              </TouchableOpacity>
            ))}
            {images.length < 9 && (
              <TouchableOpacity activeOpacity={0.8} style={styles.addImage} onPress={onPick}>
                {uploading ? <ActivityIndicator size="small" color="#B4B4B9" /> : <PlusIcon />}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 纠错内容 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>纠错内容</Text>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={(t) => setContent(t.slice(0, 500))}
            placeholder="请输入纠错的内容..."
            placeholderTextColor={GRAY}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>
            <Text style={styles.counterNum}>{content.length}</Text>/500
          </Text>
        </View>

        {/* 联系方式 */}
        <View style={[styles.card, styles.phoneCard]}>
          <Text style={styles.cardTitle}>联系方式（选填）</Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="请输入"
            placeholderTextColor={GRAY}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitBtn, (submitting || uploading) && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>提交</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(60),
  },
  companyName: {
    fontSize: setSpText(14),
    color: '#000000',
    marginBottom: scaleSizeH(12),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeW(10),
  },
  cardTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(14),
  },
  imageItem: {
    width: scaleSizeW(78),
    height: scaleSizeW(78),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  addImage: {
    width: scaleSizeW(78),
    height: scaleSizeW(78),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    marginTop: scaleSizeH(14),
    minHeight: scaleSizeH(140),
    padding: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#000000',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: setSpText(12),
    color: GRAY,
  },
  counterNum: {
    color: '#000000',
  },
  phoneCard: {
    paddingBottom: scaleSizeW(14),
  },
  phoneInput: {
    marginTop: scaleSizeH(14),
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(70),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
