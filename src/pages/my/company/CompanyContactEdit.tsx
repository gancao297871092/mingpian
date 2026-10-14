import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const PHONE_REG = /^[\d+\-\s]{5,20}$/;

/** 编辑模块：编辑联系方式（联系人/职位/联系电话；传 id 为编辑，不传为新增，对齐小程序 editContact.vue） */
export default function CompanyContactEdit() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'companyContactEdit'>>();
  const id = route.params?.id;
  const [name, setName] = useState(route.params?.name ?? '');
  const [position, setPosition] = useState(route.params?.position ?? '');
  const [phone, setPhone] = useState(route.params?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = useCallback(async () => {
    if (saving) return;
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入联系人' });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: '请输入联系电话' });
      return;
    }
    if (!PHONE_REG.test(phone.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的联系电话' });
      return;
    }
    setSaving(true);
    try {
      const payload: { id?: number | string; name: string; position: string; phone: string } = {
        name: name.trim(),
        position: position.trim(),
        phone: phone.trim(),
      };
      if (id != null) payload.id = id;
      const res = await API.company.contactSave(payload);
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: '保存成功' });
      navigation.goBack();
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSaving(false);
    }
  }, [saving, name, position, phone, id, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={styles.headerSave} onPress={onSave}>保存</Text>
      ),
    });
  }, [navigation, onSave]);

  const rows: { label: string; value: string; onChange: (t: string) => void; keyboardType?: 'phone-pad' }[] = [
    { label: '联系人', value: name, onChange: setName },
    { label: '职位', value: position, onChange: setPosition },
    { label: '联系电话', value: phone, onChange: setPhone, keyboardType: 'phone-pad' },
  ];

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          {rows.map((row, i) => (
            <React.Fragment key={row.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <TextInput
                  style={styles.rowInput}
                  value={row.value}
                  onChangeText={row.onChange}
                  placeholder="请输入"
                  placeholderTextColor="#999999"
                  keyboardType={row.keyboardType}
                  textAlign="right"
                />
              </View>
            </React.Fragment>
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerSave: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(55),
  },
  rowLabel: {
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
  },
  rowInput: {
    flex: 1,
    padding: 0,
    marginLeft: scaleSizeW(10),
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
  },
});
