import React, { forwardRef } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';

const SERVICE_PHONE = '023-68163883';

export interface DisclaimerSheetProps {
  onClose?: () => void;
}

/** 免责声明（figma 1970:6719） */
const DisclaimerSheet = forwardRef<BottomSheetModal, DisclaimerSheetProps>(function Sheet(
  { onClose },
  ref,
) {
  const onCall = () => {
    Linking.openURL(`tel:${SERVICE_PHONE}`).catch(() => {
      Toast.show({ type: 'error', text1: '拨号失败' });
    });
  };

  return (
    <AppBottomSheet ref={ref} backgroundColor="#FFFFFF" onClose={onClose}>
      <Text style={styles.title}>免责声明</Text>
      <Text style={styles.content}>
        当前企业的工商信息与联系方式均来自网络公开信息(快启api)，我们不对该内容的真实性、准确性、有效性等做任何保证或承担任何责任。如您发现相关内容涉嫌侵犯他人合法权益，请及时通过反馈渠道与我们联系
      </Text>
      <View style={styles.phoneRow}>
        <Text style={styles.phoneLabel}>电话:</Text>
        <Text style={styles.phone} onPress={onCall}>
          {SERVICE_PHONE}
        </Text>
      </View>
    </AppBottomSheet>
  );
});

export default DisclaimerSheet;

const styles = StyleSheet.create({
  title: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(17),
    fontWeight: '500',
    lineHeight: setSpText(23),
    color: '#000000',
  },
  content: {
    marginTop: scaleSizeH(17),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  phoneLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  phone: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
});
