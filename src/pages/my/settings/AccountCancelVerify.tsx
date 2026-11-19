import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { resetToLogin } from '@/route/navigationRef';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, WhitePageTitle } from './components';
import { PhoneCodeForm } from './ChangePhoneVerify';
import { useSmsCode } from './useSmsCode';
import type { RootStackParamList } from '@/route/map';

const RED = '#EF4444';

/** 注销账号-身份验证（figma 分组11「身份验证」3448:6818 +「重要说明」弹窗 3448:7124） */
export default function AccountCancelVerify() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const originPhone = useUserStore(s => s.userInfo?.wqUser?.mobile) || '';
  const masked = originPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const { authCode, countdown, sendCode } = useSmsCode('cancelAccount');
  const sheetRef = useRef<BottomSheetModal>(null);
  const [submitting, setSubmitting] = useState(false);

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const canSubmit = isPhoneValid && code.length >= 4;

  const onSubmit = () => {
    if (!canSubmit) return;
    sheetRef.current?.present();
  };

  /** 确认注销：短信一次性校验 → 复检三项 → 服务端清理并踢下线 → 本地清登录态回登录页 */
  const onConfirmCancel = async () => {
    if (submitting) return;
    sheetRef.current?.dismiss();
    setSubmitting(true);
    try {
      const res = await API.user.cancelSubmit({ authCode, code, phone });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: '注销申请已提交，账号将在 5 秒后自动注销' });
      useUserStore.getState().logout();
      resetToLogin();
    } catch {
      // 非 200（验证码错误/条件未通过等）由 request 拦截器统一弹错
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
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>注销</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceLink} activeOpacity={0.7} onPress={() => navigation.navigate('helpCenter')}>
          <Text style={styles.serviceLinkText}>
            原手机号已不可用，点击<Text style={styles.serviceLinkHighlight}>联系客服</Text>
          </Text>
        </TouchableOpacity>

        {/* 重要说明弹窗（figma 分组11「弹窗」3448:7124） */}
        <AppBottomSheet ref={sheetRef}>
          <Text style={styles.sheetTitle}>重要说明</Text>
          <Text style={styles.sheetDesc}>账号注销后不可恢复，请确认你已了解以下影响：</Text>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetCardText}>
              {'  - 无法再登录联诚采信，也无法继续使用该账号访问名片、企业、消息等功能\n  - \n  - 动态、关系、合作权限等将按规则删除、匿名或关闭，请提前完成交接\n  - \n  - 同手机号重新注册不会恢复原账号任何数据与权益'}
            </Text>
          </View>
          <View style={styles.sheetBtnRow}>
            <TouchableOpacity style={styles.sheetBtnSecondary} activeOpacity={0.85} onPress={() => sheetRef.current?.dismiss()}>
              <Text style={styles.sheetBtnSecondaryText}>再想想</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetBtnPrimary} activeOpacity={0.85} onPress={onConfirmCancel}>
              <Text style={styles.sheetBtnPrimaryText}>确认注销</Text>
            </TouchableOpacity>
          </View>
        </AppBottomSheet>
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
  sheetTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
    lineHeight: scaleSizeH(23),
  },
  sheetDesc: {
    marginTop: scaleSizeH(5),
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#6E6F74',
    lineHeight: scaleSizeH(16),
  },
  sheetCard: {
    marginTop: scaleSizeH(14),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  sheetCardText: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(19),
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(20),
  },
  sheetBtnSecondary: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnSecondaryText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  sheetBtnPrimary: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnPrimaryText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
