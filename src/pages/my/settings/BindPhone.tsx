import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { KAV_BEHAVIOR } from '@/utils/keyboard';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
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
  const isInitialBind = route.params?.mode === 'bind';
  const pendingRef = useRef(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { authCode, sentPhone, sending, countdown, sendCode } = useSmsCode(isInitialBind ? undefined : 'changePhoneNew');

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmit = (isInitialBind || !!ticket) && isPhoneValid && phone === sentPhone && !!authCode && code.length >= 4 && !loading && !sending;

  const onSubmit = async () => {
    if (!canSubmit || pendingRef.current) return;
    pendingRef.current = true;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = isInitialBind
        ? await API.auth.mobileBind({ phone, authCode, code })
        : await API.setting.changePhone({ ticket, newPhone: phone, authCode, code });
      if (res.code !== '200') return;
      // 仅在接口确认成功后更新绑定状态，返回账号与安全时立即显示新号码。
      const { userInfo, setUserInfo } = useUserStore.getState();
      if (userInfo?.wqUser) {
        setUserInfo({ ...userInfo, wqUser: { ...userInfo.wqUser, mobile: phone } });
      }
      Toast.show({ type: 'success', text1: isInitialBind ? '绑定成功' : '手机号更换成功' });
      navigation.popTo('accountSecurity');
    } catch (e: any) {
      // 票据失效时退回第一步重新验证；其他业务错误由拦截器提示并留在本页。
      if (!isInitialBind && e?.msg === '请先完成原手机号验证') {
        navigation.popTo('changePhoneVerify', { scene: 'changePhone' });
      } else if (!e?.msg) {
        Toast.show({ type: 'error', text1: isInitialBind ? '绑定失败，请重试' : '换绑失败，请重试' });
      }
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <SafeView backgroundColor="#FFFFFF">
      <KeyboardAvoidingView style={styles.page} behavior={KAV_BEHAVIOR}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.page}>
              <WhitePageTitle title={isInitialBind ? '新手机号绑定' : '绑定手机号'} subtitle="请输入手机号并完成验证码验证" />
              <PhoneCodeForm
                phone={phone}
                onPhoneChange={value => {
                  setPhone(value.replace(/\D/g, ''));
                  setCode('');
                }}
                code={code}
                onCodeChange={value => setCode(value.replace(/\D/g, ''))}
                countdown={countdown}
                onGetCode={() => {
                  if (phone === useUserStore.getState().userInfo?.wqUser?.mobile) {
                    Toast.show({ type: 'info', text1: '新手机号不能与当前手机号相同' });
                    return;
                  }
                  sendCode(phone);
                }}
                sending={sending}
                disabled={loading || sending}
              />
              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                activeOpacity={0.85}
                disabled={!canSubmit}
                onPress={onSubmit}
              >
                <Text style={styles.submitText}>{loading ? (isInitialBind ? '绑定中…' : '更换中…') : '确定'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: scaleSizeH(32) },
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
