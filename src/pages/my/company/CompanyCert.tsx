import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useUserStore } from '@/store/user';
import { ChevronRightIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const DANGER = '#EF4444';

type VerifyMethod = 'phone' | 'face' | 'letter';

/** 对齐小程序 formType：0 法人手机号验证 1 法人人脸识别 2 授权委托书 */
const FORM_TYPE: Record<VerifyMethod, number> = { phone: 0, face: 1, letter: 2 };

const VERIFY_OPTIONS: { key: VerifyMethod; label: string }[] = [
  { key: 'phone', label: '法人手机号验证' },
  { key: 'face', label: '法人人脸识别' },
  { key: 'letter', label: '授权委托书' },
];

interface CertBase {
  cpId: number | null;
  authUrl: string;
}

/** 永久有效日期（对齐小程序 29991231 / 2999-12-31） */
const isForever = (v?: string | null) => !v || v === '29991231' || v === '2999-12-31';

/** yyyymmdd -> yyyy-mm-dd */
function formatValidDate(v?: string | null): string {
  if (!v) return '';
  const digits = String(v).replace(/\D/g, '');
  if (digits.length !== 8) return String(v);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function StepHeader({ step, title, gap = 20 }: { step: number; title: string; gap?: number }) {
  return (
    <View style={[styles.stepHeader, { marginBottom: scaleSizeH(gap) }]}>
      <View style={styles.stepTitleRow}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepCount}>
          <Text style={styles.stepCountNum}>{step}</Text>
          /3
        </Text>
      </View>
      <Text style={styles.stepSub}>让信息流通，让资源流通</Text>
    </View>
  );
}

function SelectorInner({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.selectorLabel}>选择验证方式</Text>
      <View style={styles.selectorValueRow}>
        <Text style={styles.selectorValue}>{label}</Text>
        <View style={styles.selectorChevron}>
          <ChevronRightIcon />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SelectorCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.selectorCard}>
      <SelectorInner label={label} onPress={onPress} />
    </View>
  );
}

function FormRow({ label, required, children, last }: { label: string; required?: boolean; children: React.ReactNode; last?: boolean }) {
  return (
    <>
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>
          {label}
          {required && <Text style={styles.requiredMark}>*</Text>}
        </Text>
        {children}
      </View>
      {!last && <View style={styles.formDivider} />}
    </>
  );
}

function FormInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      style={styles.formInput}
      placeholder="请输入"
      placeholderTextColor="#999999"
      textAlign="right"
      {...props}
    />
  );
}

function PhoneRight({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  return (
    <View style={styles.phoneRight}>
      <Text style={styles.phonePrefix}>+86</Text>
      <TextInput
        style={styles.phoneInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="请输入"
        placeholderTextColor="#999999"
        textAlign="right"
        keyboardType="phone-pad"
        maxLength={11}
      />
    </View>
  );
}

function Radio({ checked }: { checked: boolean }) {
  const s = scaleSizeW(20);
  return (
    <Svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      {checked ? (
        <>
          <Circle cx={10} cy={10} r={9} fill={PRIMARY} />
          <Path d="M6 10.2 9 13l5-5.6" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <Circle cx={10} cy={10} r={9} stroke="#EEEEEE" strokeWidth={1} fill="#FFFFFF" />
      )}
    </Svg>
  );
}

function VerifySheet({
  sheetRef,
  method,
  onSelect,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  method: VerifyMethod;
  onSelect: (m: VerifyMethod) => void;
}) {
  return (
    <AppBottomSheet ref={sheetRef}>
      <View style={styles.sheetCard}>
        {VERIFY_OPTIONS.map((o, i) => (
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
              {method === o.key && (
                <Svg width={scaleSizeW(18)} height={scaleSizeW(18)} viewBox="0 0 18 18" fill="none">
                  <Path d="M3.5 9.5 7.2 13 14.5 5.5" stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </AppBottomSheet>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, scaleSizeH(10)) }]}>
      {children}
    </View>
  );
}

function PrevNextButtons({ onPrev, nextText, onNext, busy }: { onPrev: () => void; nextText: string; onNext: () => void; busy?: boolean }) {
  return (
    <BottomBar>
      <View style={styles.bottomBtns}>
        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryBtn} onPress={onPrev}>
          <Text style={styles.secondaryBtnText}>上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={[styles.primaryBtnHalf, busy && styles.btnBusy]} disabled={busy} onPress={onNext}>
          <Text style={styles.primaryBtnText}>{nextText}</Text>
        </TouchableOpacity>
      </View>
    </BottomBar>
  );
}

const LICENSE_SAMPLE_URL = 'https://picsum.photos/seed/licenseSample/686/960';

function LicenseSampleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.sampleMask} onPress={onClose}>
        <ExpoImage source={{ uri: LICENSE_SAMPLE_URL }} style={styles.sampleImage} contentFit="contain" transition={150} />
      </TouchableOpacity>
    </Modal>
  );
}

const WHEEL_ITEM_H = scaleSizeH(40);
const YEARS_START = 1949;
const YEARS = Array.from({ length: 152 }, (_, i) => String(YEARS_START + i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Wheel({ data, selected, visible, onSelect }: { data: string[]; selected: number; visible: boolean; onSelect: (i: number) => void }) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => ref.current?.scrollTo({ y: selected * WHEEL_ITEM_H, animated: false }), 50);
    return () => clearTimeout(t);
  }, [visible, selected]);
  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={e => {
        const i = Math.max(0, Math.min(data.length - 1, Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H)));
        onSelect(i);
      }}
      contentContainerStyle={styles.wheelContent}
    >
      {data.map((d, i) => (
        <TouchableOpacity
          key={d}
          activeOpacity={0.7}
          style={styles.wheelItem}
          onPress={() => {
            onSelect(i);
            ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true });
          }}
        >
          <Text style={i === selected ? styles.wheelTextOn : styles.wheelText}>{d}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DatePickerModal({ visible, value, onCancel, onConfirm }: { visible: boolean; value: string; onCancel: () => void; onConfirm: (d: string) => void }) {
  const [ymd, setYmd] = useState<[number, number, number]>([2000, 1, 1]);
  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    const p = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : null;
    setYmd(p ? [p[0], p[1], p[2]] : [now.getFullYear(), now.getMonth() + 1, now.getDate()]);
  }, [visible, value]);
  const [y, m, d] = ymd;
  const maxDay = new Date(y, m, 0).getDate();
  const days = Array.from({ length: maxDay }, (_, i) => String(i + 1));
  const day = Math.min(d, maxDay);
  const confirm = () => onConfirm(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dateMask}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dateCard}>
          <View style={styles.dateBar}>
            <TouchableOpacity activeOpacity={0.7} onPress={onCancel}>
              <Text style={styles.dateCancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.dateTitle}>选择日期</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={confirm}>
              <Text style={styles.dateConfirm}>确定</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateWheels}>
            <Wheel data={YEARS} selected={Math.max(0, y - YEARS_START)} visible={visible} onSelect={i => setYmd([YEARS_START + i, m, day])} />
            <Wheel data={MONTHS} selected={m - 1} visible={visible} onSelect={i => setYmd([y, i + 1, day])} />
            <Wheel data={days} selected={day - 1} visible={visible} onSelect={i => setYmd([y, m, i + 1])} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** 第一步：主体信息（对齐小程序 stepTwo.vue） */
function Step1({ onNext }: { onNext: (d: CertBase) => void }) {
  const [id, setId] = useState<number | null>(null);
  const [cpId, setCpId] = useState<number | null>(null);
  const [license, setLicense] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [longTerm, setLongTerm] = useState(false);
  const [validToDate, setValidToDate] = useState('');
  const [dateVisible, setDateVisible] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleVisible, setSampleVisible] = useState(false);

  const fill = useCallback((d: any) => {
    if (!d) return;
    setId(d.id ?? null);
    setCpId(d.cpId ?? null);
    if (d.businessUrl !== undefined) setLicense(d.businessUrl || '');
    setName(d.companyName || '');
    setCode(d.creditCode || '');
    setLocation(d.businessAddress || '');
    const forever = isForever(d.validToDate);
    setLongTerm(forever);
    setValidToDate(forever ? '' : formatValidDate(d.validToDate));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.company.certStepOne();
        if (res.code !== '200' || !res.data) return;
        const r2 = await API.company.certStepTwo(res.data);
        if (r2.code !== '200') return;
        fill(r2.data);
      } catch {
        // 拦截器已提示
      }
    })();
  }, [fill]);

  const clearLicense = () => {
    setLicense('');
    setName('');
    setCode('');
    setValidToDate('');
    setLocation('');
  };

  const pickLicense = async () => {
    if (ocrLoading) return;
    try {
      const img = await ImagePicker.openPicker({ mediaType: 'photo' });
      if (!img.path) return;
      setOcrLoading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: img.path,
        type: img.mime || 'image/jpeg',
        name: img.filename || 'license.jpg',
      } as any);
      const res = await API.file.upload(formData);
      if (res.code !== '200' || !res.data) return;
      const businessLicense = (res.data as any).mdUrl || (res.data as any).url || res.data;
      const ocr = await API.company.certOcr({ id: cpId, businessLicense });
      if (ocr.code !== '200') return;
      fill({ ...(ocr.data || {}), businessUrl: businessLicense });
      Toast.show({ type: 'success', text1: '上传成功' });
    } catch {
      // 用户取消或拦截器已提示
    } finally {
      setOcrLoading(false);
    }
  };

  const onSelectDateType = (forever: boolean) => {
    setLongTerm(forever);
    if (!forever) setValidToDate('');
  };

  const submit = async () => {
    if (submitting) return;
    if (!name.trim() || !code.trim() || !location.trim()) {
      Toast.show({ type: 'error', text1: '请上传营业执照进行识别,并确认数据是否正确！' });
      return;
    }
    if (!longTerm && !validToDate) {
      Toast.show({ type: 'error', text1: '请选择证件期限' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.company.certBusiness({
        id,
        cpId,
        businessUrl: license,
        companyName: name.replace(/ /g, ''),
        creditCode: code.trim(),
        businessAddress: location.trim(),
        companyType: 1,
        dateType: longTerm ? 2 : 1,
        validToDate: longTerm ? '2999-12-31' : validToDate,
      });
      if (res.code !== '200') return;
      onNext({ cpId, authUrl: res.data?.authUrl || '' });
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader step={1} title="主体信息" />
        <View style={styles.rowCard}>
          <Text style={styles.rowCardLabel}>主体归属地</Text>
          <Text style={styles.rowCardValue}>大陆 企业</Text>
        </View>
        <Text style={styles.note}>*认证成功后主体归属地不可修改（目前仅支持认证国内企业）</Text>
        <TouchableOpacity activeOpacity={0.7} style={[styles.licenseCard, styles.mt20]} onPress={pickLicense}>
          <Text style={styles.rowCardLabel}>营业执照/组织机构代码证</Text>
          {ocrLoading ? (
            <ActivityIndicator size="small" color={PRIMARY} style={styles.licenseRight} />
          ) : license ? (
            <View style={styles.licenseThumbWrap}>
              <ExpoImage source={{ uri: license }} style={styles.licenseThumb} contentFit="cover" transition={150} />
              <TouchableOpacity activeOpacity={0.8} hitSlop={8} style={styles.licenseDel} onPress={clearLicense}>
                <Text style={styles.licenseDelText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.rowCardValue}>上传图片</Text>
          )}
          <ChevronRightIcon />
        </TouchableOpacity>
        <Text style={styles.note}>
          请上传最新版三证合一的营业执照清晰正面图{' '}
          <Text style={styles.noteLink} onPress={() => setSampleVisible(true)}>查看示例</Text>
        </Text>
        <Text style={styles.noteDanger}>资料上传后会自动识别主体信息，内容仅供参考，建议再仔细核对</Text>
        <View style={[styles.formCard, styles.mt40]}>
          <FormRow label="主体名称">
            <FormInput value={name} onChangeText={setName} placeholder="请输入主体名称" />
          </FormRow>
          <FormRow label="社会信用代码">
            <FormInput value={code} onChangeText={setCode} placeholder="请输入社会信用代码" maxLength={18} />
          </FormRow>
          <FormRow label="证件期限">
            <View style={styles.radioGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.radioItem} onPress={() => onSelectDateType(false)}>
                <Radio checked={!longTerm} />
                <Text style={styles.radioText}>期限内有效</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.radioItem} onPress={() => onSelectDateType(true)}>
                <Radio checked={longTerm} />
                <Text style={styles.radioText}>永久有效</Text>
              </TouchableOpacity>
            </View>
          </FormRow>
          {!longTerm && (
            <FormRow label="期限有效">
              <TouchableOpacity activeOpacity={0.7} style={styles.dateRight} onPress={() => setDateVisible(true)}>
                <Text style={[styles.dateText, !validToDate && styles.datePlaceholder]}>{validToDate || '请选择'}</Text>
                <ChevronRightIcon />
              </TouchableOpacity>
            </FormRow>
          )}
          <FormRow label="所在地" last>
            <FormInput value={location} onChangeText={setLocation} placeholder="请输入所在地" />
          </FormRow>
        </View>
      </ScrollView>
      <BottomBar>
        <TouchableOpacity activeOpacity={0.8} style={[styles.primaryBtn, submitting && styles.btnBusy]} disabled={submitting} onPress={submit}>
          <Text style={styles.primaryBtnText}>下一步</Text>
        </TouchableOpacity>
        <Text style={styles.agreeNote}>
          点击下一步，即同意
          <Text style={styles.noteLink} onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}>《联诚采信企业认证服务协议》</Text>
        </Text>
      </BottomBar>
      <LicenseSampleModal visible={sampleVisible} onClose={() => setSampleVisible(false)} />
      <DatePickerModal
        visible={dateVisible}
        value={validToDate}
        onCancel={() => setDateVisible(false)}
        onConfirm={d => {
          setValidToDate(d);
          setDateVisible(false);
        }}
      />
    </View>
  );
}

/** 第二步：对公认证（对齐小程序 stepFour.vue；人脸识别 app 端暂未实现） */
function Step2({ cpId, authUrl, method, onOpenSheet, onPrev, onNext }: { cpId: number | null; authUrl: string; method: VerifyMethod; onOpenSheet: () => void; onPrev: () => void; onNext: () => void }) {
  const [legalPerson, setLegalPerson] = useState('');
  const [legalPersonCertCode, setLegalPersonCertCode] = useState('');
  const [legalPhone, setLegalPhone] = useState('');
  const [code, setCode] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authRemark, setAuthRemark] = useState('');
  const [docxName, setDocxName] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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

  const methodLabel = VERIFY_OPTIONS.find(o => o.key === method)?.label ?? '';

  const onGetCode = async () => {
    if (countdown > 0) return;
    if (!/^(\+86)?1[3-9]\d{9}$/.test(legalPhone.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的手机号码' });
      return;
    }
    if (!legalPerson.trim()) {
      Toast.show({ type: 'error', text1: '发送验证码前，请先填写法人姓名！' });
      return;
    }
    if (!legalPersonCertCode.trim()) {
      Toast.show({ type: 'error', text1: '发送验证码前，请先填写身份证账号！' });
      return;
    }
    try {
      const res = await API.company.certSendCode({
        phone: legalPhone.trim(),
        legalPerson: legalPerson.trim(),
        legalPersonCertCode: legalPersonCertCode.trim(),
        legalPhone: legalPhone.trim(),
        cpId,
        id: cpId,
        formType: 0,
      });
      if (res.code !== '200') return;
      setAuthCode(String(res.data ?? ''));
      startCountdown();
    } catch {
      // 拦截器已提示
    }
  };

  const onUploadDocx = async () => {
    if (uploading) return;
    try {
      const img = await ImagePicker.openPicker({ mediaType: 'photo' });
      if (!img.path) return;
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: img.path,
        type: img.mime || 'image/jpeg',
        name: img.filename || 'auth.jpg',
      } as any);
      const res = await API.file.upload(formData);
      if (res.code !== '200' || !res.data) return;
      setAuthRemark((res.data as any).mdUrl || (res.data as any).url || res.data);
      setDocxName(img.filename || '委托书图片');
      Toast.show({ type: 'success', text1: '上传成功' });
    } catch {
      // 用户取消或拦截器已提示
    } finally {
      setUploading(false);
    }
  };

  const onViewTemplate = () => {
    if (!authUrl) {
      Toast.show({ type: 'info', text1: '文件地址为空' });
      return;
    }
    Linking.openURL(authUrl).catch(() => Toast.show({ type: 'error', text1: '打开失败' }));
  };

  const submit = async () => {
    if (submitting) return;
    if (method !== 'letter') {
      if (!legalPerson.trim()) {
        Toast.show({ type: 'error', text1: '请输入法人姓名' });
        return;
      }
      if (!legalPersonCertCode.trim()) {
        Toast.show({ type: 'error', text1: '请输入身份证账号' });
        return;
      }
    }
    if (method === 'face') {
      Toast.show({ type: 'info', text1: '人脸认证暂未开放，请选择其他验证方式' });
      return;
    }
    if (method === 'phone') {
      if (!legalPhone.trim()) {
        Toast.show({ type: 'error', text1: '请输入手机号' });
        return;
      }
      if (!code.trim()) {
        Toast.show({ type: 'error', text1: '请输入验证码' });
        return;
      }
      if (!authCode) {
        Toast.show({ type: 'error', text1: '请点击发送验证码' });
        return;
      }
    }
    if (method === 'letter' && !authRemark) {
      Toast.show({ type: 'error', text1: '请上传委托书' });
      return;
    }
    setSubmitting(true);
    try {
      if (method === 'phone') {
        const res = await API.company.certValidateCode({
          cpId,
          id: cpId,
          formType: 0,
          legalPerson: legalPerson.trim(),
          legalPersonCertCode: legalPersonCertCode.trim(),
          legalPhone: legalPhone.trim(),
          code: code.trim(),
          authCode,
        });
        if (res.code !== '200') return;
      }
      if (method === 'letter') {
        const res = await API.company.certAuthPng({
          cpId,
          id: cpId,
          formType: 2,
          legalPerson: legalPerson.trim(),
          legalPersonCertCode: legalPersonCertCode.trim(),
          authRemark,
          docxName,
        });
        if (res.code !== '200') return;
      }
      onNext();
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader step={2} title="对公认证" gap={18} />
        {method === 'letter' ? (
          <View style={styles.letterCard}>
            <SelectorInner label={methodLabel} onPress={onOpenSheet} />
            <View style={styles.letterDivider} />
            <Text style={styles.letterNote}>
              请预览下载授权委托书，打印后按要求填写并加盖实体彩色公章，提供彩色拍照或扫描图，不支持电子章、合同章、财务章等专用章
            </Text>
            <View style={styles.letterBtns}>
              <TouchableOpacity activeOpacity={0.8} style={styles.letterBtnOutline} disabled={uploading} onPress={onUploadDocx}>
                {uploading ? <ActivityIndicator size="small" color="#000000" /> : <Text style={styles.letterBtnOutlineText}>上传委托书</Text>}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={styles.letterBtnFill} onPress={onViewTemplate}>
                <Text style={styles.letterBtnFillText}>查看委托书(模板)</Text>
              </TouchableOpacity>
            </View>
            {!!docxName && <Text style={styles.letterFile} numberOfLines={1}>已上传: {docxName}</Text>}
          </View>
        ) : (
          <>
            <SelectorCard label={methodLabel} onPress={onOpenSheet} />
            <View style={styles.formCard}>
              <FormRow label="法人姓名">
                <FormInput value={legalPerson} onChangeText={setLegalPerson} placeholder="请输入法人姓名" />
              </FormRow>
              <FormRow label="身份证号" last={method === 'face'}>
                <FormInput value={legalPersonCertCode} onChangeText={setLegalPersonCertCode} placeholder="请输入身份证账号" maxLength={18} />
              </FormRow>
              {method === 'phone' && (
                <>
                  <FormRow label="手机号">
                    <PhoneRight value={legalPhone} onChangeText={setLegalPhone} />
                  </FormRow>
                  <FormRow label="验证码" last>
                    <FormInput value={code} onChangeText={setCode} placeholder="请输入短信验证码" keyboardType="number-pad" maxLength={6} />
                    <TouchableOpacity activeOpacity={0.7} onPress={onGetCode} disabled={countdown > 0}>
                      <Text style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]}>
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </Text>
                    </TouchableOpacity>
                  </FormRow>
                </>
              )}
              {method === 'face' && (
                <FormRow label="人脸识别" last>
                  <TouchableOpacity activeOpacity={0.7} style={styles.faceBtn} onPress={() => Toast.show({ type: 'info', text1: '人脸认证暂未开放' })}>
                    <Text style={styles.faceBtnText}>开始验证</Text>
                  </TouchableOpacity>
                </FormRow>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <PrevNextButtons onPrev={onPrev} nextText="下一步" onNext={submit} busy={submitting} />
    </View>
  );
}

/** 第三步：联系人信息（对齐小程序 stepThree.vue，预填当前用户信息） */
function Step3({ cpId, formType, onPrev }: { cpId: number | null; formType: number; onPrev: () => void }) {
  const navigation = useNavigation();
  const wqUser = useUserStore(s => s.userInfo?.wqUser);
  const [name, setName] = useState(wqUser?.realName ?? '');
  const [email, setEmail] = useState(wqUser?.email ?? '');
  const [phone, setPhone] = useState(wqUser?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入运用者姓名' });
      return;
    }
    if (email.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的邮箱地址' });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: '请输入手机号' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.company.certLink({
        cpId,
        id: cpId,
        formType,
        linkPerson: name.trim(),
        linkEmail: email.trim(),
        linkPhone: phone.trim(),
      });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: formType === 2 ? '已提交审核' : '企业认证成功！' });
      navigation.goBack();
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader step={3} title="联系人信息" gap={18} />
        <View style={[styles.formCard, styles.mt0]}>
          <FormRow label="企业联系人姓名" required>
            <FormInput value={name} onChangeText={setName} placeholder="请填写负责本企业账号的联系人姓名" />
          </FormRow>
          <FormRow label="联系邮箱" required>
            <FormInput value={email} onChangeText={setEmail} placeholder="用于后续接收企业认证及业务沟通邮件" keyboardType="email-address" autoCapitalize="none" />
          </FormRow>
          <FormRow label="手机号" required last>
            <PhoneRight value={phone} onChangeText={setPhone} />
          </FormRow>
        </View>
        <Text style={styles.note}>*邮箱用于后续接收企业认证及业务沟通邮件</Text>
      </ScrollView>
      <PrevNextButtons onPrev={onPrev} nextText={formType === 2 ? '提交' : '完成'} onNext={submit} busy={submitting} />
    </View>
  );
}

/** 企业认证（创建企业三步：主体信息 / 对公认证 / 联系人信息，对齐小程序 enterprise 流程） */
export default function CompanyCert() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<VerifyMethod>('phone');
  const [cert, setCert] = useState<CertBase>({ cpId: null, authUrl: '' });

  const openSheet = () => sheetRef.current?.present();

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 1 && <Step1 onNext={d => { setCert(d); setStep(2); }} />}
        {step === 2 && (
          <Step2 cpId={cert.cpId} authUrl={cert.authUrl} method={method} onOpenSheet={openSheet} onPrev={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && <Step3 cpId={cert.cpId} formType={FORM_TYPE[method]} onPrev={() => setStep(2)} />}
      </KeyboardAvoidingView>
      <VerifySheet sheetRef={sheetRef} method={method} onSelect={setMethod} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(20),
  },
  mt0: {
    marginTop: 0,
  },
  mt20: {
    marginTop: scaleSizeH(20),
  },
  mt40: {
    marginTop: scaleSizeH(40),
  },
  stepHeader: {
    marginTop: scaleSizeH(14),
    gap: scaleSizeH(11),
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  stepTitle: {
    fontSize: setSpText(20),
    fontWeight: '500',
    lineHeight: setSpText(26),
    color: '#000000',
  },
  stepCount: {
    marginLeft: 'auto',
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  stepCountNum: {
    color: '#000000',
  },
  stepSub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(14),
    gap: scaleSizeW(6),
  },
  rowCardLabel: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  rowCardValue: {
    marginLeft: 'auto',
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  licenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    minHeight: scaleSizeH(55),
    paddingVertical: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    gap: scaleSizeW(6),
  },
  licenseRight: {
    marginLeft: 'auto',
  },
  licenseThumbWrap: {
    marginLeft: 'auto',
  },
  licenseThumb: {
    width: scaleSizeW(68),
    height: scaleSizeW(68),
    borderRadius: scaleSizeW(16),
    backgroundColor: '#F3F3F3',
  },
  licenseDel: {
    position: 'absolute',
    top: scaleSizeH(-6),
    right: scaleSizeW(-6),
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F84141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseDelText: {
    fontSize: setSpText(13),
    lineHeight: setSpText(15),
    color: '#FFFFFF',
  },
  note: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: GRAY,
    marginTop: scaleSizeH(10),
  },
  noteDanger: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: DANGER,
    marginTop: scaleSizeH(10),
  },
  noteLink: {
    color: PRIMARY,
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
  requiredMark: {
    color: DANGER,
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
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginLeft: 'auto',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  radioText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  dateRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  dateText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  datePlaceholder: {
    color: '#A3A3A3',
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(79),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(16),
  },
  selectorLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(14),
  },
  selectorValue: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  selectorChevron: {
    marginLeft: 'auto',
  },
  letterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(18),
  },
  letterDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: scaleSizeH(21),
  },
  letterNote: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: DANGER,
    marginTop: scaleSizeH(11),
  },
  letterBtns: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(15),
  },
  letterBtnOutline: {
    flex: 1,
    height: scaleSizeH(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnOutlineText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: '#000000',
  },
  letterBtnFill: {
    flex: 1,
    height: scaleSizeH(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnFillText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
  letterFile: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: PRIMARY,
    marginTop: scaleSizeH(12),
    textDecorationLine: 'underline',
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
  faceBtn: {
    marginLeft: 'auto',
  },
  faceBtnText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(20),
    color: PRIMARY,
  },
  bottomBar: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
  },
  bottomBtns: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  primaryBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnHalf: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBusy: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  agreeNote: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: GRAY,
    textAlign: 'center',
    marginTop: scaleSizeH(12),
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
    lineHeight: setSpText(18),
    color: '#000000',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginHorizontal: scaleSizeW(2),
  },
  sampleMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSizeW(24),
  },
  sampleImage: {
    width: '100%',
    height: '80%',
    borderRadius: scaleSizeW(10),
  },
  wheel: {
    flex: 1,
    height: WHEEL_ITEM_H * 5,
  },
  wheelContent: {
    paddingVertical: WHEEL_ITEM_H * 2,
  },
  wheelItem: {
    height: WHEEL_ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: setSpText(14),
    color: '#999999',
  },
  wheelTextOn: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#000000',
  },
  dateMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(14),
    borderTopRightRadius: scaleSizeW(14),
    paddingBottom: scaleSizeH(20),
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(48),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  dateCancel: {
    fontSize: setSpText(14),
    color: GRAY,
  },
  dateConfirm: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  dateWheels: {
    flexDirection: 'row',
    paddingHorizontal: scaleSizeW(24),
  },
});
