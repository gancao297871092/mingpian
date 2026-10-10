import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import StepFour from './StepFour';
import type { StepHandle } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'editCard'>;

const TIPS = [
  { title: '基本信息', content: '填写名片基础资料' },
  { title: '封面相片', content: '上传您的形象照片和更多照片' },
  { title: '价值亮点', content: '可展示专业优势、价值特点、服务亮点' },
  { title: '名片风格', content: '多元化设计您的名片样式' },
];

export default function EditCard({ navigation, route }: Props) {
  const { id } = route.params || {};
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [cardId, setCardId] = useState<number | null>(isEdit ? Number(id) : null);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const stepRef = useRef<StepHandle>(null);

  // 初始化加载
  useEffect(() => {
    if (isEdit && id) {
      loadCardDetail(Number(id));
    } else {
      initCreate();
    }
  }, [isEdit, id]);

  // 头部：左侧上一步（第2-4步），右侧下一步/完成（figma 创建名片1-4）
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft:
        step > 1
          ? () => (
              <Text style={styles.headerBtn} onPress={() => setStep(step - 1)}>
                上一步
              </Text>
            )
          : undefined,
      headerRight: () => (
        <Text style={styles.headerBtnPrimary} onPress={() => stepRef.current?.submit()}>
          {step === 4 ? '完成' : '下一步'}
        </Text>
      ),
    });
  }, [navigation, step]);

  const initCreate = async () => {
    try {
      const res = await API.card.prepare();
      if (res.code === '200' && res.data) {
        setCardId(res.data.id);
        setStepData({
          alias: res.data.alias || '',
          nameZh: res.data.nameZh || '',
          nameEn: res.data.nameEn || '',
          phone: res.data.phone || '',
          telNumber: res.data.telNumber || '',
          fax: res.data.fax || '',
          email: res.data.email || '',
          province: res.data.province || '',
          city: res.data.city || '',
          district: res.data.district || '',
          address: res.data.address || '',
          profile: res.data.profile || '',
          provinceCode: res.data.provinceCode || '',
          cityCode: res.data.cityCode || '',
          districtCode: res.data.districtCode || '',
          isShow: res.data.isShow ?? 1,
          isAuth: res.data.isAuth || 0,
          styleCode: res.data.styleCode || 'NORMAL',
          fontColor: res.data.fontColor || '#ffffff',
          backColor: res.data.backColor || 'transparent',
        });
      }
    } catch {
      // ignore
    }
  };

  const loadCardDetail = async (cid: number) => {
    try {
      const res = await API.card.detail({ cardId: cid });
      if (res.code === '200' && res.data) {
        const data = res.data;
        setCardId(data.id);
        setStepData({
          alias: data.alias || '',
          nameZh: data.nameZh || '',
          nameEn: data.nameEn || '',
          phone: data.phone || '',
          telNumber: data.telNumber || '',
          fax: data.fax || '',
          email: data.email || '',
          province: data.province || '',
          city: data.city || '',
          district: data.district || '',
          address: data.address || '',
          profile: data.profile || '',
          provinceCode: data.provinceCode || '',
          cityCode: data.cityCode || '',
          districtCode: data.districtCode || '',
          isShow: data.isShow ?? 1,
          isAuth: data.isAuth || 0,
          styleCode: data.styleCode || 'NORMAL',
          fontColor: data.fontColor || '#ffffff',
          backColor: data.backColor || 'transparent',
          mediaLinkList: data.mediaLinkList || [],
        });
      }
    } catch {
      // ignore
    }
  };

  const onStepChange = useCallback((nextStep: number, data?: any) => {
    if (data) {
      setStepData((prev) => ({ ...prev, ...data }));
    }
    setStep(nextStep);
  }, []);

  const onPublish = useCallback(async () => {
    if (!cardId) return;
    try {
      const res = await API.card.push({ cardId });
      if (res.code === '200') {
        Alert.alert('发布成功', '名片已保存并发布', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('发布失败');
    }
  }, [cardId, navigation]);

  /** 步骤标题栏：标题+副标题，右侧 n/4（figma 创建名片1-4） */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTextCol}>
        <Text style={styles.headerTitle}>{TIPS[step - 1].title}</Text>
        <Text style={styles.headerSub}>{TIPS[step - 1].content}</Text>
      </View>
      <Text style={styles.stepIndicator}>
        <Text style={styles.stepCurrent}>{step}</Text>
        <Text style={styles.stepTotal}>/4</Text>
      </Text>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOne ref={stepRef} cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 2:
        return <StepTwo ref={stepRef} cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 3:
        return <StepThree ref={stepRef} cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 4:
        return <StepFour ref={stepRef} cardId={cardId} data={stepData} onNext={onStepChange} onPublish={onPublish} />;
      default:
        return null;
    }
  };

  return (
    <SafeView backgroundColor="#F6F7FB" disableTop>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: scaleSizeW(14),
    marginBottom: scaleSizeW(20),
  },
  headerTextCol: {
    gap: scaleSizeW(11),
  },
  headerTitle: {
    fontWeight: '500',
    fontSize: setSpText(20),
    color: '#000000',
  },
  headerSub: {
    fontWeight: '400',
    fontSize: setSpText(12),
    color: '#6C6C6C',
  },
  stepIndicator: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#6C6C6C',
    marginTop: scaleSizeW(13),
  },
  stepCurrent: {
    color: '#000000',
  },
  stepTotal: {
    color: '#6C6C6C',
  },
  headerBtn: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  headerBtnPrimary: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#2962D4',
  },
});
