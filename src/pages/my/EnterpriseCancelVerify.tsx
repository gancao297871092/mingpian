import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { AppAlert } from '@/components/AppAlert';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { WhitePageTitle } from './settings/components';
import { PhoneCodeForm } from './settings/ChangePhoneVerify';
import { useSmsCode } from './settings/useSmsCode';
import type { RootStackParamList } from '@/route/map';

const RED = '#EF4444';

/** 解散企业-身份验证（figma 分组11 身份验证版式，按钮「确认解散」红色） */
export default function EnterpriseCancelVerify() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const originPhone = useUserStore(s => s.userInfo?.wqUser?.mobile) || '';
  const masked = originPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const { authCode, countdown, sendCode } = useSmsCode('dissolveEnterprise');
  const [submitting, setSubmitting] = useState(false);

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmit = isPhoneValid && code.length >= 4;

  /** 确认解散：超管 + 短信校验 → 进入 3 天冷静期 → 弹提示回企业管理 */
  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const res = await API.company.dissolveApply({ authCode, code, phone });
      if (res.code !== '200') return;
      AppAlert.alert('你的企业已进入解散流程', '解散操作将在3天后生效，期间你可以撤销该操作', [
        {
          text: '知道了',
          onPress: () => {
            // 刷新用户信息（角标等），回企业管理展示冷静期态
            API.user
              .info()
              .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
              .catch(() => {});
            navigation.popTo('companyManage');
          },
        },
      ]);
    } catch {
      // 非 200（验证码错误/非超管等）由 request 拦截器统一弹错
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeView backgroundColor="#FFFFFF">
        <WhitePageTitle title="身份验证" subtitle={`请输入该账号绑定的手机号${masked}，完成手机验证`} />
        <PhoneCodeForm
          phone={phone}
          onPhoneChange={setPhone}
          code={code}
          onCodeChange={setCode}
          countdown={countdown}
          onGetCode={() => isPhoneValid && sendCode(phone)}
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit || submitting}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>确认解散</Text>
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
    backgroundColor: RED,
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
