import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import Uploader from '@/components/capabilities/Uploader';
import type { UploadImage } from '@/components/ImageUploader';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CameraIcon } from '../bbsDetail/sheetIcons';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';
const RED = '#EF4444';

const REPORT_TYPES = ['色情低俗', '垃圾广告', '违法违规', '未成年保护', '辱骂攻击', '其他'];

export default function ReportBbs() {
  const route = useRoute<RouteProp<RootStackParamList, 'reportBbs'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [typeIndex, setTypeIndex] = useState(-1);
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<UploadImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = typeIndex >= 0 && !submitting;

  const onSubmit = () => {
    if (!canSubmit) return;
    if (images.some(i => i.uploading)) {
      Alert.alert('提示', '图片上传中，请稍候再提交');
      return;
    }
    const urls = images.filter(i => i.url).map(i => i.url as string);
    setSubmitting(true);
    API.bbs
      .reportSubmit({
        reportedTargetId: Number(route.params.id),
        reportedTargetType: 2,
        reportType: typeIndex + 1,
        reportReason: reason.trim() || undefined,
        reportImages: urls.join(';') || undefined,
      })
      .then(() => {
        Alert.alert('提示', '举报成功，我们会尽快处理', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      })
      .catch(() => { })
      .finally(() => setSubmitting(false));
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>问题类型</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <View style={styles.chipsWrap}>
            {REPORT_TYPES.map((type, i) => {
              const active = typeIndex === i;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.7}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTypeIndex(i)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>详细原因</Text>
          <TextInput
            style={styles.textarea}
            multiline
            maxLength={500}
            placeholder="详细描述举报原因..."
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />
          <Text style={styles.counter}>{reason.length}/500</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>上传图片</Text>
          <View style={styles.uploadWrap}>
            <Uploader
              value={images}
              onChange={setImages}
              itemSize={scaleSizeW(78)}
              addIcon={<CameraIcon />}
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>{submitting ? '提交中...' : '提交'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(19),
  },
  required: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: RED,
    lineHeight: scaleSizeH(19),
    marginLeft: scaleSizeW(2),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(11),
    marginTop: scaleSizeH(15),
  },
  chip: {
    paddingHorizontal: scaleSizeW(25),
    paddingVertical: scaleSizeH(8),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F6F7FB',
  },
  chipActive: {
    backgroundColor: BLUE,
  },
  chipText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  textarea: {
    height: scaleSizeH(130),
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(20),
    padding: 0,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#999999',
    lineHeight: scaleSizeH(16),
  },
  uploadWrap: {
    marginTop: scaleSizeH(15),
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(90),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(20),
  },
  submitBtnDisabled: {
    opacity: 0.3,
  },
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
