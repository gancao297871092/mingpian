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
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import ImageUploader from '@/components/ImageUploader';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const GRAY = '#999999';

/** 我要纠错（figma 1970:6636） */
export default function CompanyErrorCorrection() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyErrorCorrection'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const collectId = route.params?.collectId;

  const [content, setContent] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imgBusy, setImgBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    if (imgBusy) {
      Toast.show({ type: 'error', text1: '图片上传中或存在上传失败，请稍候' });
      return;
    }
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
  }, [collectId, content, images, imgBusy, phone, navigation]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 上传图片（公用 ImageUploader，OSS 直传，4 列九宫格，对齐小程序 UploadImages） */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>上传图片</Text>
          <ImageUploader
            value={images}
            onChange={setImages}
            onBusyChange={setImgBusy}
            layout="grid"
            columns={4}
            itemSize={scaleSizeW(78)}
            gap={scaleSizeW(10)}
            maxCount={9}
            showCoverBadge={false}
            addBackgroundColor="#F5F5F5"
            style={styles.uploader}
          />
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
          style={[styles.submitBtn, (submitting || imgBusy) && styles.submitBtnDisabled]}
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
  uploader: {
    marginTop: scaleSizeH(14),
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
