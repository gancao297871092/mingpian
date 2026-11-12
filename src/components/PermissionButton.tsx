import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps, type GestureResponderEvent } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';

type Mode = 'direct' | 'tip';

interface PermissionButtonProps extends TouchableOpacityProps {
  /** direct=直接跳转登录页(默认), tip=先提示再跳转 */
  mode?: Mode;
  /** tip 模式下的提示标题 */
  tipTitle?: string;
  /** tip 模式下的提示内容 */
  tipContent?: string;
  /** tip 模式下的确认按钮文字 */
  confirmText?: string;
}

export default function PermissionButton({
  mode = 'direct',
  tipTitle = '提示',
  tipContent = '您还未登录，请前往登录!',
  confirmText = '去登录',
  onPress,
  children,
  ...rest
}: PermissionButtonProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useUserStore();
  const isLogin = !!token;

  const handlePress = (e: GestureResponderEvent) => {
    if (!isLogin) {
      if (mode === 'tip') {
        AppAlert.alert(tipTitle, tipContent, [
          { text: '取消', style: 'cancel' },
          {
            text: confirmText,
            onPress: () => navigation.navigate('login'),
          },
        ]);
      } else {
        navigation.navigate('login');
      }
      return;
    }
    onPress?.(e);
  };

  return (
    <TouchableOpacity {...rest} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
}
