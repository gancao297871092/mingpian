import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';
const MAX_LEN = 20;
const INVALID_CHARS = /[@<>/]/;

export default function EditName() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userInfo, setUserInfo } = useUserStore();
  const origin = userInfo?.wqUser?.username || userInfo?.wqUser?.nickname || '';
  const [value, setValue] = useState(origin);
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= MAX_LEN && !INVALID_CHARS.test(trimmed);
  const canSave = valid && trimmed !== origin && !saving;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canSave}
          onPress={() => {
            if (!canSave) return;
            setSaving(true);
            API.user
              .updateInfo({ username: trimmed })
              .then(() => {
                Toast.show({ type: 'success', text1: '已保存' });
                API.user.info().then(res => res.data && setUserInfo(res.data)).catch(() => {});
                navigation.goBack();
              })
              .catch(err => Toast.show({ type: 'error', text1: err?.msg || '保存失败' }))
              .finally(() => setSaving(false));
          }}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, canSave, trimmed, setUserInfo]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          maxLength={MAX_LEN}
          placeholder="请输入昵称"
          placeholderTextColor="#999999"
          autoFocus
        />
        <Text style={styles.counter}>
          {value.length}/{MAX_LEN}
        </Text>
      </View>
      <Text style={styles.hint}>请设置2-20个字符，不包括@&lt;&gt;/等无效字符。</Text>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
    height: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(14),
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  counter: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#999999',
    marginLeft: scaleSizeW(10),
  },
  hint: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
  },
  saveText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: BLUE,
    marginRight: scaleSizeW(4),
  },
  saveTextDisabled: {
    opacity: 0.3,
  },
});
