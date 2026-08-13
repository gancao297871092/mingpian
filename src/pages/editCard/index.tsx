import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import StepFour from './StepFour';

type Props = NativeStackScreenProps<RootStackParamList, 'editCard'>;

const TIPS = [
  { title: '基本信息', content: '填写名片基础资料' },
  { title: '封面相片', content: '上传您的形象照片和更多照片' },
  { title: '价值亮点', content: '可展示专业优势、价值特点、服务亮点' },
  { title: '名片风格', content: '多元化设计您的名片样式' },
];

export default function EditCard({ route }: Props) {
  const navigation = useNavigation();
  const { id } = route.params || {};
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [cardId, setCardId] = useState<number | null>(isEdit ? Number(id) : null);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 初始化加载
  useEffect(() => {
    if (isEdit && id) {
      loadCardDetail(Number(id));
    } else {
      initCreate();
    }
  }, [isEdit, id]);

  const initCreate = async () => {
    try {
      setIsLoading(true);
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
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const loadCardDetail = async (cid: number) => {
    try {
      setIsLoading(true);
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
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
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
    } catch (e) {
      Alert.alert('发布失败', '请稍后重试');
    }
  }, [cardId, navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{TIPS[step - 1].title}</Text>
        <Text style={styles.headerSub}>{TIPS[step - 1].content}</Text>
      </View>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepCurrent}>{step}</Text>
        <Text style={styles.stepTotal}>/4</Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOne cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 2:
        return <StepTwo cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 3:
        return <StepThree cardId={cardId} data={stepData} onNext={onStepChange} />;
      case 4:
        return <StepFour cardId={cardId} data={stepData} onNext={onStepChange} onPublish={onPublish} />;
      default:
        return null;
    }
  };

  return (
    <SafeView backgroundColor="#fff" disableTop>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.divider} />
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
    paddingHorizontal: scaleSizeW(15),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scaleSizeW(16),
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: scaleSizeW(22),
    color: '#040719',
  },
  headerSub: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(14),
    color: '#999999',
    marginTop: scaleSizeW(3),
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stepCurrent: {
    fontWeight: '800',
    fontSize: scaleSizeW(18),
    color: '#040719',
  },
  stepTotal: {
    fontWeight: '600',
    fontSize: scaleSizeW(14),
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginBottom: scaleSizeW(12),
  },
});
