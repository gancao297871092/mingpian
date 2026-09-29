import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { TipInfoIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

const CURRENT_POSITION = '销售经理';

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

/** 职位变更（支持同时申请多个职位） */
export default function CompanyJobChange() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PositionItem[]>([{ key: `p${keySeed++}`, value: '' }]);

  const onAdd = () => setItems(prev => [...prev, { key: `p${keySeed++}`, value: '' }]);
  const onRemove = (key: string) => setItems(prev => prev.filter(i => i.key !== key));
  const onChange = (key: string, value: string) =>
    setItems(prev => prev.map(i => (i.key === key ? { ...i, value } : i)));

  const onSubmit = () => {
    if (!items.some(i => i.value.trim())) {
      Toast.show({ type: 'error', text1: '请输入您要申请的职位名称' });
      return;
    }
    Toast.show({ type: 'success', text1: '已提交申请' });
    navigation.goBack();
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tip}>
          <TipInfoIcon />
          <Text style={styles.tipText}>温馨提示：支持同时申请多个职位</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>职位1</Text>
          <Text style={styles.cardValue}>{CURRENT_POSITION}</Text>
        </View>
        {items.map((item, index) => (
          <View key={item.key} style={styles.card}>
            <Text style={styles.cardLabel}>职位{index + 2}</Text>
            <TextInput
              style={styles.cardInput}
              value={item.value}
              onChangeText={t => onChange(item.key, t)}
              placeholder="请输入您要申请的职位名称"
              placeholderTextColor="rgba(153, 153, 153, 0.6)"
            />
            {items.length > 1 && (
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
        <TouchableOpacity activeOpacity={0.8} style={styles.submitBtn} onPress={onSubmit}>
          <Text style={styles.submitText}>提交申请</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
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
  cardValue: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  cardInput: {
    padding: 0,
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
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
    lineHeight: setSpText(20),
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
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
