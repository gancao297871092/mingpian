import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, WhitePageTitle } from './components';
import { PhoneCodeForm } from './ChangePhoneVerify';
import { useSmsCode } from './useSmsCode';
import type { RootStackParamList } from '@/route/map';

/** 73.绑定手机号（输入新手机号完成换绑/绑定） */
export default function BindPhone() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'bindPhone'>>();
  const ticket = route.params?.ticket || '';
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { authCode, countdown, sendCode } = useSmsCode('changePhoneNew');

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmit = isPhoneValid && code.length >= 4 && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await API.setting.changePhone({ ticket, phone, authCode, code });
      Toast.show({ type: 'success', text1: '手机号更换成功' });
    } catch (e: any) {
      // TODO 联调后失败时不放行
      Toast.show({ type: 'info', text1: e?.msg || '接口未联调，模拟更换成功' });
    } finally {
      setLoading(false);
    }
    navigation.popTo('accountSecurity');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeView backgroundColor="#FFFFFF">
        <WhitePageTitle title="绑定手机号" subtitle="请输入手机号并完成验证码验证" />
        <PhoneCodeForm
          phone={phone}
          onPhoneChange={setPhone}
          code={code}
          onCodeChange={setCode}
          countdown={countdown}
          onGetCode={() => isPhoneValid && sendCode(phone)}
        />
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>确定</Text>
        </TouchableOpacity>
      </SafeView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  submitBtn: {
    marginHorizontal: scaleSizeW(40),
    marginTop: scaleSizeH(50),
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
