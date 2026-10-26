import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { TipInfoIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

const TITLES = { '1': '申请职位', '2': '职位变更申请', '3': '编辑职位' } as const;

function CloseSmallIcon({ size = 10, color = '#999999' }: { size?: number; color?: string }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path d="M1 1l8 8M9 1l-8 8" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

interface PositionItem {
  key: string;
  value: string;
}

let keySeed = 0;
const newItem = (value = ''): PositionItem => ({ key: `p${keySeed++}`, value });

/** 申请/变更/编辑职位（逻辑对齐小程序 apply.vue：type=1申请职位 2职位变更申请 3编辑职位；UI 对齐 Figma 职位变更） */
export default function CompanyApply() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'companyApply'>>();
  const insets = useSafeAreaInsets();
  const { cpId, type = '1', position = '', userId = null } = route.params;

  const [items, setItems] = useState<PositionItem[]>(() =>
    (type === '2' || type === '3') && position ? position.split(',').map(newItem) : [newItem()],
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: TITLES[type] });
  }, [navigation, type]);

  const onChange = (key: string, value: string) =>
    setItems(prev => prev.map(i => (i.key === key ? { ...i, value: value.trim() } : i)));
  const onAdd = () => setItems(prev => [...prev, newItem()]);
  const onRemove = (key: string) => setItems(prev => (prev.length > 1 ? prev.filter(i => i.key !== key) : prev));

  const onSubmit = async () => {
    if (submitting) return;
    const list = items.map(i => i.value.trim());
    if (list.every(v => !v)) {
      Toast.show({ type: 'error', text1: '请至少填写一个职位' });
      return;
    }
    if (list.some(v => !v)) {
      Toast.show({ type: 'error', text1: '有职位未填写，请检查或删除空行' });
      return;
    }
    setSubmitting(true);
    try {
      const data = { cpId, submitPosition: list.join(','), submitMsg: '', userId };
      if (type === '3') {
        await API.company.positionEdit(data);
        Toast.show({ type: 'success', text1: '保存成功' });
      } else if (type === '2') {
        await API.company.positionChange(data);
        Toast.show({ type: 'success', text1: '申请成功' });
      } else {
        await API.company.auth(data);
        Toast.show({ type: 'success', text1: '申请成功' });
      }
      navigation.goBack();
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  const submitText = useMemo(
    () => (submitting ? '提交中...' : type === '3' ? '保存职位' : type === '1' ? '提交申请' : '提交变更申请'),
    [submitting, type],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.tip}>
            <TipInfoIcon />
            <Text style={styles.tipText}>温馨提示：支持同时申请多个职位</Text>
          </View>
          {items.map((item, index) => (
            <View key={item.key} style={styles.card}>
              <Text style={styles.cardLabel}>职位{index + 1}</Text>
              <TextInput
                style={styles.cardInput}
                value={item.value}
                onChangeText={v => onChange(item.key, v)}
                placeholder="请输入您要申请的职位名称"
                placeholderTextColor="rgba(153, 153, 153, 0.6)"
                maxLength={20}
              />
              {index !== 0 && (
                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={styles.cardRemove} onPress={() => onRemove(item.key)}>
                  <CloseSmallIcon />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity activeOpacity={0.7} style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>+ 继续添加</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + scaleSizeH(10) }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, submitting && styles.submitBtnBusy]}
            disabled={submitting}
            onPress={onSubmit}
          >
            {submitting ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitText}>{submitText}</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>{submitText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(20),
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(16),
  },
  tipText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(76),
    paddingHorizontal: scaleSizeW(14),
    justifyContent: 'center',
    gap: scaleSizeH(5),
    marginBottom: scaleSizeH(10),
  },
  cardLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  cardInput: {
    padding: 0,
    paddingRight: scaleSizeW(24),
    fontSize: setSpText(15),
    color: '#000000',
  },
  cardRemove: {
    position: 'absolute',
    top: scaleSizeH(19),
    right: scaleSizeW(14),
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(15),
    color: PRIMARY,
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnBusy: {
    opacity: 0.6,
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
