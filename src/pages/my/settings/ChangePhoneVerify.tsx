import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, WhitePageTitle } from './components';
import { useSmsCode } from './useSmsCode';
import type { RootStackParamList } from '@/route/map';

/** 手机号 + 验证码表单（figma 72/73 共用） */
export function PhoneCodeForm(props: {
  phone: string;
  onPhoneChange: (v: string) => void;
  code: string;
  onCodeChange: (v: string) => void;
  countdown: number;
  onGetCode: () => void;
}) {
  const { phone, onPhoneChange, code, onCodeChange, countdown, onGetCode } = props;
  return (
    <View style={formStyles.wrap}>
      <View style={formStyles.fieldRow}>
        <Text style={formStyles.fieldLabel}>+86</Text>
        <TextInput
          style={formStyles.fieldInput}
          value={phone}
          onChangeText={onPhoneChange}
          placeholder="请输入11位手机号码"
          placeholderTextColor="#BABABA"
          keyboardType="number-pad"
          maxLength={11}
        />
      </View>
      <View style={formStyles.divider} />
      <View style={formStyles.fieldRow}>
        <Text style={formStyles.fieldLabel}>验证码</Text>
        <TextInput
          style={formStyles.fieldInput}
          value={code}
          onChangeText={onCodeChange}
          placeholder="请输入验证码"
          placeholderTextColor="#BABABA"
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity activeOpacity={0.7} disabled={countdown > 0} onPress={onGetCode}>
          <Text style={[formStyles.getCodeText, countdown > 0 && formStyles.getCodeTextDisabled]}>
            {countdown > 0 ? `${countdown} S` : '获取验证码'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={formStyles.divider} />
      <Text style={formStyles.hint}>验证码 5 分钟内有效，60 秒后可重新发送</Text>
    </View>
  );
}

const formStyles = StyleSheet.create({
  wrap: {
    marginTop: scaleSizeH(40),
    paddingHorizontal: scaleSizeW(40),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(37),
  },
  fieldLabel: {
    fontSize: setSpText(16),
    color: '#000000',
  },
  fieldInput: {
    flex: 1,
    marginLeft: scaleSizeW(21),
    fontSize: setSpText(16),
    color: '#000000',
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginTop: scaleSizeH(16),
    marginBottom: scaleSizeH(14),
  },
  getCodeText: {
    fontSize: setSpText(16),
    color: BLUE,
  },
  getCodeTextDisabled: {
    color: '#999999',
  },
  hint: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(12),
    color: '#999999',
  },
});

/** 72.手机验证码验证（scene=changePhone 换绑手机 / resetPassword 重置密码前的身份核验） */
export default function ChangePhoneVerify() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'changePhoneVerify'>>();
  const scene = route.params?.scene ?? 'changePhone';
  const originPhone = useUserStore(s => s.userInfo?.wqUser?.mobile) || '';
  const masked = originPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { authCode, countdown, sendCode } = useSmsCode(scene === 'changePhone' ? 'changePhoneOld' : 'resetPassword');

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmit = isPhoneValid && code.length >= 4 && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    let ticket = '';
    try {
      const res = await API.setting.verifyOldPhone({ phone, authCode, code });
      ticket = res.data?.ticket || '';
    } catch (e: any) {
      // TODO 联调后失败时不放行
      Toast.show({ type: 'info', text1: e?.msg || '接口未联调，先进入下一步' });
    } finally {
      setLoading(false);
    }
    if (scene === 'changePhone') {
      navigation.navigate('bindPhone', { ticket });
    } else {
      navigation.navigate('changePassword', { hasPassword: false });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeView backgroundColor="#FFFFFF">
        <WhitePageTitle title="原手机号验证" subtitle={`请输入该账号绑定的原手机号${masked}，完成手机验证`} />
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
        <TouchableOpacity style={styles.serviceLink} activeOpacity={0.7} onPress={() => navigation.navigate('helpCenter')}>
          <Text style={styles.serviceLinkText}>
            原手机号已不可用，点击<Text style={styles.serviceLinkHighlight}>联系客服</Text>
          </Text>
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
  serviceLink: {
    marginTop: scaleSizeH(20),
    alignItems: 'center',
  },
  serviceLinkText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(22),
  },
  serviceLinkHighlight: {
    color: BLUE,
  },
});
