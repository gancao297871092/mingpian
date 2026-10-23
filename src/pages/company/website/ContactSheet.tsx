import React, { forwardRef } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CallPhoneIcon, ContactPersonIcon } from './icons';

export interface ContactItem {
  name?: string;
  position?: string;
  phone?: string;
}

export interface ContactSheetProps {
  contacts: ContactItem[];
  onClose?: () => void;
}

/** 企业联系方式弹层（对齐小程序 contactModal） */
const ContactSheet = forwardRef<BottomSheetModal, ContactSheetProps>(function Sheet(
  { contacts, onClose },
  ref,
) {
  const onCall = (item: ContactItem) => {
    const phone = String(item.phone || '').replace(/\s/g, '');
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Toast.show({ type: 'error', text1: '拨号失败' });
    });
  };

  return (
    <AppBottomSheet ref={ref} backgroundColor="#FFFFFF" onClose={onClose}>
      <Text style={styles.title}>企业联系方式</Text>
      <View style={styles.list}>
        {contacts.map((item, index) => (
          <View key={index} style={styles.item}>
            <ContactPersonIcon size={50} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.position ? `${item.position}·${item.name || ''}` : item.name || ''}
              </Text>
              <Text style={styles.itemPhone}>{item.phone || ''}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onCall(item)}>
              <CallPhoneIcon size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </AppBottomSheet>
  );
});

export default ContactSheet;

const styles = StyleSheet.create({
  title: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  list: {
    marginTop: scaleSizeH(16),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: scaleSizeW(10),
    paddingVertical: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(10),
    marginBottom: scaleSizeH(10),
  },
  itemInfo: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    marginRight: scaleSizeW(10),
  },
  itemName: {
    fontSize: setSpText(14),
    fontWeight: '700',
    color: '#000000',
  },
  itemPhone: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#2962D4',
  },
});
