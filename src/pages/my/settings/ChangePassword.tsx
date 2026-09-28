import React, { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE } from './components';
import type { RootStackParamList } from '@/route/map';

function isWeakPassword(pwd: string) {
  if (/^(.)\1+$/.test(pwd)) return true;
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const lower = pwd.toLowerCase();
  return sequences.some(seq => seq.includes(lower.slice(0, 4)) && lower.length >= 4);
}

function validatePassword(pwd: string) {
  if (pwd.length < 8 || pwd.length > 20) return false;
  const kinds = [/[a-zA-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(re => re.test(pwd)).length;
  return kinds >= 2 && !isWeakPassword(pwd);
}

/** 75.修改密码 */
export default function ChangePassword() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'changePassword'>>();
  const hasPassword = route.params?.hasPassword ?? true;
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit =
    (!hasPassword || oldPwd.length > 0) && validatePassword(newPwd) && newPwd === confirmPwd && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await API.setting.updatePassword({ oldPassword: hasPassword ? oldPwd : undefined, newPassword: newPwd });
      Toast.show({ type: 'success', text1: hasPassword ? '密码修改成功' : '密码设置成功' });
      navigation.popTo('accountSecurity');
    } catch (e: any) {
      // TODO 联调后失败时不放行
      Toast.show({ type: 'info', text1: e?.msg || '接口未联调，模拟修改成功' });
      navigation.popTo('accountSecurity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeView backgroundColor="#F6F7FB">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {hasPassword && (
            <>
              <Text style={styles.sectionLabel}>当前密码</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  value={oldPwd}
                  onChangeText={setOldPwd}
                  placeholder="请输入当前密码"
                  placeholderTextColor="rgba(108,108,108,0.78)"
                  secureTextEntry
                  maxLength={20}
                />
              </View>
            </>
          )}
          <Text style={[styles.sectionLabel, styles.sectionLabelGap]}>{hasPassword ? '设置新密码' : '设置密码'}</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="请输入新密码"
              placeholderTextColor="rgba(108,108,108,0.78)"
              secureTextEntry
              maxLength={20}
            />
          </View>
          <View style={[styles.inputCard, styles.inputCardGap]}>
            <TextInput
              style={styles.input}
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="请再次输入密码"
              placeholderTextColor="rgba(108,108,108,0.78)"
              secureTextEntry
              maxLength={20}
            />
          </View>
          {confirmPwd.length > 0 && newPwd !== confirmPwd && <Text style={styles.errorText}>两次输入的密码不一致</Text>}
          <Text style={styles.hint}>
            8-20 位字符，须包含字母、数字、符号中的至少 2 种。 请避免连续字符（1234、abcd、qwer）或重复字符（1111、aaaa）等常见弱密码。
          </Text>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>完成</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(40),
  },
  sectionLabel: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(14),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
  },
  sectionLabelGap: {
    marginTop: scaleSizeH(20),
  },
  inputCard: {
    marginHorizontal: scaleSizeW(16),
    height: scaleSizeH(55),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  inputCardGap: {
    marginTop: scaleSizeH(10),
  },
  input: {
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  errorText: {
    fontSize: setSpText(12),
    color: '#EF4444',
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(8),
  },
  hint: {
    fontSize: setSpText(12),
    color: '#999999',
    lineHeight: scaleSizeH(20),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
  },
  submitBtn: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(27),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
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
