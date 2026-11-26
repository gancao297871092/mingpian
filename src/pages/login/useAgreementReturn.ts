import { useCallback, useEffect, useRef } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/map';
import type { AgreementType } from '@/components/AgreementSheet';

/** 从提示弹窗阅读协议，关闭完成后导航，返回原登录页时恢复提示。 */
export function useAgreementReturn(
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate' | 'addListener'>,
  setVisible: (visible: boolean) => void,
) {
  const pendingType = useRef<AgreementType | null>(null);
  const restoreOnReturn = useRef(false);

  useEffect(() => navigation.addListener('focus', () => {
    if (!restoreOnReturn.current) return;
    restoreOnReturn.current = false;
    setVisible(true);
  }), [navigation, setVisible]);

  const openAgreement = useCallback((type: AgreementType) => {
    if (pendingType.current) return;
    pendingType.current = type;
    setVisible(false);
  }, [setVisible]);

  const onDismiss = useCallback(() => {
    const type = pendingType.current;
    if (!type) return;
    pendingType.current = null;
    restoreOnReturn.current = true;
    navigation.navigate('agreement', { type });
  }, [navigation]);

  return { openAgreement, onDismiss };
}
