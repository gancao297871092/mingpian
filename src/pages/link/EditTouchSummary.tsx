import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { setPendingTouchSummary } from './signalDraft';
import { InfoIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 54.修改触达摘要（figma 327:2236）：系统头 + 表单 + 保存 */
export default function EditTouchSummary() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'editTouchSummary'>>();
  const initial = route.params?.summary ?? { target: '', purpose: '', capability: '', identity: '' };
  const [form, setForm] = useState(initial);

  const fields: { key: keyof typeof initial; label: string }[] = [
    { key: 'target', label: '目标客户' },
    { key: 'purpose', label: '合作目的' },
    { key: 'capability', label: '能力内容' },
    { key: 'identity', label: '触达身份' },
  ];

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {fields.map(field => (
          <View key={field.key} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.fieldInput}
                value={form[field.key]}
                onChangeText={text => setForm(prev => ({ ...prev, [field.key]: text }))}
                placeholderTextColor="#999999"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveBtn}
          onPress={() => {
            setPendingTouchSummary(form);
            navigation.goBack();
          }}
        >
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>

        <View style={styles.tipRow}>
          <InfoIcon size={16} />
          <Text style={styles.tipText}>修改后将同步更新预览</Text>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(30),
  },
  fieldBlock: {
    marginBottom: scaleSizeH(10),
  },
  fieldLabel: {
    marginLeft: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    fontSize: setSpText(14),
    color: TEXT_SUB,
  },
  fieldCard: {
    marginHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  fieldInput: {
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  saveBtn: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(30),
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(15),
  },
  tipText: {
    fontSize: setSpText(12),
    color: PRIMARY,
  },
});
