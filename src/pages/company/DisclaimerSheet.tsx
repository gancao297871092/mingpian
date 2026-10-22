import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { setSpText } from '@/utils/screenUtils';
import CompanyBottomSheet from './CompanyBottomSheet';

const SERVICE_PHONE = '023-68163883';

interface DisclaimerSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** 免责声明（figma 1970:6719） */
export default function DisclaimerSheet({ visible, onClose }: DisclaimerSheetProps) {
  const onCall = () => {
    Linking.openURL(`tel:${SERVICE_PHONE}`).catch(() => {
      Toast.show({ type: 'error', text1: '拨号失败' });
    });
  };

  return (
    <CompanyBottomSheet visible={visible} title="免责声明" contentGap={17} onClose={onClose}>
      <Text style={styles.content}>
        当前企业的工商信息与联系方式均来自网络公开信息(快启api)，我们不对该内容的真实性、准确性、有效性等做任何保证或承担任何责任。如您发现相关内容涉嫌侵犯他人合法权益，请及时通过反馈渠道与我们联系
      </Text>
      <View style={styles.phoneRow}>
        <Text style={styles.phoneLabel}>电话:</Text>
        <Text style={styles.phone} onPress={onCall}>
          {SERVICE_PHONE}
        </Text>
      </View>
    </CompanyBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
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
