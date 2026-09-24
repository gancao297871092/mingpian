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
const MAX_LEN = 100;

export default function EditBio() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userInfo, setUserInfo } = useUserStore();
  const origin = userInfo?.wqUser?.des || '';
  const [value, setValue] = useState(origin);
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== origin && !saving;

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
              .updateInfo({ des: trimmed })
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
          multiline
          autoFocus
          textAlignVertical="top"
          placeholder="点击填写兴趣爱好、生活方式等个人简介"
          placeholderTextColor="#999999"
        />
        <Text style={styles.counter}>
          {value.length}/{MAX_LEN}
        </Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
    height: scaleSizeH(200),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(10),
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(15),
    color: '#000000',
    lineHeight: scaleSizeH(22),
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#999999',
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
