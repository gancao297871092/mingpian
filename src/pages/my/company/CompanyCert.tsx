import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useSmsCode } from '../settings/useSmsCode';
import { ChevronRightIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const DANGER = '#EF4444';

type VerifyMethod = 'phone' | 'face' | 'letter';

const VERIFY_OPTIONS: { key: VerifyMethod; label: string }[] = [
  { key: 'phone', label: '法人手机号验证' },
  { key: 'face', label: '法人人脸识别' },
  { key: 'letter', label: '授权委托书' },
];

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

function PrevNextButtons({ onPrev, nextText, onNext }: { onPrev: () => void; nextText: string; onNext: () => void }) {
  return (
    <BottomBar>
      <View style={styles.bottomBtns}>
        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryBtn} onPress={onPrev}>
          <Text style={styles.secondaryBtnText}>上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtnHalf} onPress={onNext}>
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

function Step1({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [longTerm, setLongTerm] = useState(false);
  const [license, setLicense] = useState('');
  const [sampleVisible, setSampleVisible] = useState(false);

  const pickLicense = async () => {
    try {
      const img = await ImagePicker.openPicker({ mediaType: 'photo' });
      if (img.path) {
        setLicense(img.path);
        Toast.show({ type: 'success', text1: '上传成功' });
      }
    } catch {
      // 用户取消
    }
  };

  const submit = () => {
    if (!license) {
      Toast.show({ type: 'error', text1: '请上传营业执照' });
      return;
    }
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入主体名称' });
      return;
    }
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: '请输入社会信用代码' });
      return;
    }
    onNext();
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
        <TouchableOpacity activeOpacity={0.7} style={[styles.rowCard, styles.mt20]} onPress={pickLicense}>
          <Text style={styles.rowCardLabel}>营业执照/组织机构代码证</Text>
          <Text style={styles.rowCardValue}>{license ? '重新上传' : '上传图片'}</Text>
          <ChevronRightIcon />
        </TouchableOpacity>
        <Text style={styles.note}>
          请上传最新版三证合一的营业执照清晰正面图{' '}
          <Text style={styles.noteLink} onPress={() => setSampleVisible(true)}>查看示例</Text>
        </Text>
        <Text style={styles.noteDanger}>资料上传后会自动识别主体信息，内容仅供参考，建议再仔细核对</Text>
        <View style={[styles.formCard, styles.mt40]}>
          <FormRow label="主体名称">
            <FormInput value={name} onChangeText={setName} />
          </FormRow>
          <FormRow label="社会信用代码">
            <FormInput value={code} onChangeText={setCode} maxLength={18} />
          </FormRow>
          <FormRow label="证件期限">
            <View style={styles.radioGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.radioItem} onPress={() => setLongTerm(false)}>
                <Radio checked={!longTerm} />
                <Text style={styles.radioText}>期限内有效</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.radioItem} onPress={() => setLongTerm(true)}>
                <Radio checked={longTerm} />
                <Text style={styles.radioText}>永久有效</Text>
              </TouchableOpacity>
            </View>
          </FormRow>
          <FormRow label="所在地" last>
            <FormInput value={location} onChangeText={setLocation} />
          </FormRow>
        </View>
      </ScrollView>
      <BottomBar>
        <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} onPress={submit}>
          <Text style={styles.primaryBtnText}>下一步</Text>
        </TouchableOpacity>
        <Text style={styles.agreeNote}>
          点击下一步，即同意
          <Text style={styles.noteLink} onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}>《联诚采信企业认证服务协议》</Text>
        </Text>
      </BottomBar>
      <LicenseSampleModal visible={sampleVisible} onClose={() => setSampleVisible(false)} />
    </View>
  );
}

function Step2({ method, onOpenSheet, onPrev, onNext }: { method: VerifyMethod; onOpenSheet: () => void; onPrev: () => void; onNext: () => void }) {
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const { countdown, sendCode } = useSmsCode('companyCert');

  const methodLabel = VERIFY_OPTIONS.find(o => o.key === method)?.label ?? '';

  const onGetCode = () => {
    if (!/^1\d{10}$/.test(phone)) {
      Toast.show({ type: 'error', text1: '请输入正确的手机号' });
      return;
    }
    sendCode(phone);
  };

  const submit = () => {
    if (method !== 'letter') {
      if (!name.trim()) {
        Toast.show({ type: 'error', text1: '请输入法人姓名' });
        return;
      }
      if (!/^\d{17}[\dXx]$/.test(idCard.trim())) {
        Toast.show({ type: 'error', text1: '请输入正确的身份证号' });
        return;
      }
      if (method === 'phone') {
        if (!/^1\d{10}$/.test(phone)) {
          Toast.show({ type: 'error', text1: '请输入正确的手机号' });
          return;
        }
        if (!code.trim()) {
          Toast.show({ type: 'error', text1: '请输入验证码' });
          return;
        }
      }
    }
    onNext();
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
              <TouchableOpacity activeOpacity={0.8} style={styles.letterBtnOutline} onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}>
                <Text style={styles.letterBtnOutlineText}>上传委托书</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={styles.letterBtnFill} onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}>
                <Text style={styles.letterBtnFillText}>查看委托书(模板)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <SelectorCard label={methodLabel} onPress={onOpenSheet} />
            <View style={styles.formCard}>
              <FormRow label="法人姓名">
                <FormInput value={name} onChangeText={setName} />
              </FormRow>
              <FormRow label="身份证号" last={method === 'face'}>
                <FormInput value={idCard} onChangeText={setIdCard} maxLength={18} />
              </FormRow>
              {method === 'phone' && (
                <>
                  <FormRow label="手机号">
                    <PhoneRight value={phone} onChangeText={setPhone} />
                  </FormRow>
                  <FormRow label="验证码" last>
                    <FormInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
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
                  <TouchableOpacity activeOpacity={0.7} style={styles.faceBtn} onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}>
                    <Text style={styles.faceBtnText}>开始验证</Text>
                  </TouchableOpacity>
                </FormRow>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <PrevNextButtons onPrev={onPrev} nextText="下一步" onNext={submit} />
    </View>
  );
}

function Step3({ onPrev }: { onPrev: () => void }) {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const submit = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入企业联系人姓名' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Toast.show({ type: 'error', text1: '请输入正确的联系邮箱' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      Toast.show({ type: 'error', text1: '请输入正确的手机号' });
      return;
    }
    Toast.show({ type: 'success', text1: '提交成功，请等待审核' });
    navigation.goBack();
  };

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepHeader step={3} title="联系人信息" gap={18} />
        <View style={[styles.formCard, styles.mt0]}>
          <FormRow label="企业联系人姓名" required>
            <FormInput value={name} onChangeText={setName} />
          </FormRow>
          <FormRow label="联系邮箱" required>
            <FormInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </FormRow>
          <FormRow label="手机号" required last>
            <PhoneRight value={phone} onChangeText={setPhone} />
          </FormRow>
        </View>
        <Text style={styles.note}>*邮箱用于后续接收企业认证及业务沟通邮件</Text>
      </ScrollView>
      <PrevNextButtons onPrev={onPrev} nextText="提交" onNext={submit} />
    </View>
  );
}

/** 企业认证（创建企业三步：主体信息 / 对公认证 / 联系人信息） */
export default function CompanyCert() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<VerifyMethod>('letter');

  const openSheet = () => sheetRef.current?.present();

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 2 && <Step2 method={method} onOpenSheet={openSheet} onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3 onPrev={() => setStep(2)} />}
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
});
