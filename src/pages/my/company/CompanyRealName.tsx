import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

type VerifyType = 'phone' | 'face';

function CheckIcon({ size = 18, color = PRIMARY }: { size?: number; color?: string }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 18 18" fill="none">
      <Path d="M3.5 9.5 7.2 13 14.5 5.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 10, color = '#999999' }: { size?: number; color?: string }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <Path d="M7.5 3.5 12.5 10 7.5 16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AgreementRow({ agreed, onToggle }: { agreed: boolean; onToggle: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.agreeRow}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} hitSlop={6}>
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed && (
            <Svg width={scaleSizeW(8)} height={scaleSizeW(8)} viewBox="0 0 10 8" fill="none">
              <Path d="M1 4.2 3.8 7 9 1.2" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      </TouchableOpacity>
      <Text style={styles.agreeText}>
        我已阅读并同意
        <Text style={styles.agreeLink} onPress={() => navigation.navigate('agreement', { type: 'cardSure', title: '服务协议' })}>
          《联诚采信实名认证服务协议》
        </Text>
        ，并授权平台校验我的实名信息
      </Text>
    </View>
  );
}

function VerifyTypeSheet({
  sheetRef,
  type,
  onSelect,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  type: VerifyType;
  onSelect: (t: VerifyType) => void;
}) {
  const options: { key: VerifyType; label: string }[] = [
    { key: 'phone', label: '手机号验证' },
    { key: 'face', label: '人脸识别' },
  ];
  return (
    <AppBottomSheet ref={sheetRef}>
      <View style={styles.sheetCard}>
        {options.map((o, i) => (
          <React.Fragment key={o.key}>
            {i > 0 && <View style={styles.sheetDivider} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sheetRow}
              onPress={() => {
                onSelect(o.key);
                sheetRef.current?.dismiss();
              }}
            >
              <Text style={styles.sheetRowText}>{o.label}</Text>
              {type === o.key && <CheckIcon />}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </AppBottomSheet>
  );
}

/** 实名认证（手机号验证 / 人脸识别；人脸识别待 SDK 接入） */
export default function CompanyRealName() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setUserInfo = useUserStore(s => s.setUserInfo);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [type, setType] = useState<VerifyType>('phone');
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  /** null=加载中；0未认证 1已认证 2待审核 3未通过 */
  const [authStatus, setAuthStatus] = useState<number | null>(null);
  const [authId, setAuthId] = useState<number | null>(null);
  const [authRemark, setAuthRemark] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    API.user
      .idCardPre()
      .then(res => {
        if (res.code !== '200' || !res.data) return;
        setName(res.data.realName || '');
        setIdCard(res.data.realCard || '');
        setAuthStatus(res.data.authStatus ?? 0);
        setAuthId(res.data.auth?.id ?? null);
        setAuthRemark(res.data.auth?.authRemark || '');
      })
      .catch(() => setAuthStatus(0));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onGetCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的手机号' });
      return;
    }
    if (countdown > 0) return;
    startCountdown();
    API.common
      .msgSend({ phone: phone.trim(), id: authId })
      .then(res => {
        if (res.code === '200' && res.data) {
          setAuthCode(String(res.data));
          Toast.show({ type: 'success', text1: '验证码已发送' });
        }
      })
      .catch(() => {});
  };

  /** 1已认证 2待审核 不可操作（对齐小程序 authStatus -1/1/2 禁用） */
  const locked = authStatus === null || authStatus === 1 || authStatus === 2;
  const reviewing = authStatus === 2;
  const submitText =
    authStatus === 1 ? '已认证' : authStatus === 2 ? '待审核' : authStatus === 3 ? '重新提交' : '提交审核';

  const onSubmit = async () => {
    if (locked || submitting) return;
    if (!agreed) {
      Toast.show({ type: 'error', text1: '请先阅读并同意实名认证服务协议' });
      return;
    }
    if (type === 'face') {
      Toast.show({ type: 'info', text1: '人脸识别暂未开放，请使用手机号验证' });
      return;
    }
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入真实姓名' });
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idCard.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的身份证号' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的手机号' });
      return;
    }
    if (!authCode) {
      Toast.show({ type: 'error', text1: '请先点击获取验证码' });
      return;
    }
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: '请输入验证码' });
      return;
    }
    setSubmitting(true);
    try {
      await API.common.msgValidate({ authCode, code: code.trim() });
      await API.user.idCardVerify({
        id: authId,
        realCard: idCard.trim(),
        realName: name.trim(),
        phone: phone.trim(),
        authCode,
        code: code.trim(),
      });
      Toast.show({ type: 'success', text1: '实名认证提交成功' });
      API.user.info()
        .then(res => res.data && setUserInfo(res.data))
        .catch(() => {});
      navigation.goBack();
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {authStatus === 3 && !!authRemark && (
            <Text style={styles.rejectText}>*拒绝理由: {authRemark}</Text>
          )}
          <TouchableOpacity activeOpacity={0.7} style={styles.typeCard} onPress={() => sheetRef.current?.present()}>
            <Text style={styles.typeLabel}>选择验证方式</Text>
            <View style={styles.typeValueRow}>
              <Text style={styles.typeValue}>{type === 'phone' ? '手机号验证' : '人脸识别'}</Text>
              <View style={styles.typeChevron}>
                <ChevronRightIcon />
              </View>
            </View>
          </TouchableOpacity>
          {type === 'phone' && (
            <>
              <View style={styles.formCard}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>真实姓名</Text>
                  <TextInput
                    style={styles.formInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="请输入"
                    placeholderTextColor="#999999"
                    textAlign="right"
                    editable={!reviewing}
                  />
                </View>
                <View style={styles.formDivider} />
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>身份证号</Text>
                  <TextInput
                    style={styles.formInput}
                    value={idCard}
                    onChangeText={setIdCard}
                    placeholder="请输入"
                    placeholderTextColor="#999999"
                    textAlign="right"
                    maxLength={18}
                    editable={!reviewing}
                  />
                </View>
              </View>
              <View style={styles.formCard}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>手机号</Text>
                  <View style={styles.phoneRight}>
                    <Text style={styles.phonePrefix}>+86</Text>
                    <TextInput
                      style={styles.phoneInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="请输入"
                      placeholderTextColor="#999999"
                      textAlign="right"
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                </View>
                <View style={styles.formDivider} />
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>验证码</Text>
                  <TextInput
                    style={styles.formInput}
                    value={code}
                    onChangeText={setCode}
                    placeholder="请输入"
                    placeholderTextColor="#999999"
                    textAlign="right"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity activeOpacity={0.7} onPress={onGetCode} disabled={countdown > 0}>
                    <Text style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]}>
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          <AgreementRow agreed={agreed} onToggle={() => setAgreed(a => !a)} />
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, (locked || submitting) && styles.submitBtnDisabled]}
            disabled={locked || submitting}
            onPress={onSubmit}
          >
            {submitting ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitText}>提交中...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>{type === 'phone' ? submitText : '开始认证'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <VerifyTypeSheet sheetRef={sheetRef} type={type} onSelect={setType} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(79),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(16),
    gap: scaleSizeH(14),
    marginTop: scaleSizeH(14),
  },
  typeLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  typeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeValue: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  typeChevron: {
    marginLeft: 'auto',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    marginTop: scaleSizeH(10),
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(55),
  },
  formLabel: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  formInput: {
    flex: 1,
    padding: 0,
    marginLeft: scaleSizeW(10),
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#EDECEC',
  },
  phoneRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    flexShrink: 1,
  },
  phonePrefix: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  phoneInput: {
    padding: 0,
    minWidth: scaleSizeW(45),
    maxWidth: scaleSizeW(200),
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  codeBtn: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: PRIMARY,
    marginLeft: scaleSizeW(18),
  },
  codeBtnDisabled: {
    color: '#999999',
  },
  agreeRow: {
    flexDirection: 'row',
    marginTop: scaleSizeH(30),
    gap: scaleSizeW(5),
  },
  checkbox: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(6),
  },
  checkboxOn: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  agreeText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(22),
    color: GRAY,
  },
  agreeLink: {
    color: PRIMARY,
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(15),
  },
  submitBtnDisabled: {
    backgroundColor: '#CECECE',
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  rejectText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    color: '#F5A623',
    marginBottom: scaleSizeH(4),
  },
  submitText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(55),
  },
  sheetRowText: {
    flex: 1,
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(2),
  },
});
