import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  type LayoutChangeEvent,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

export type AgreementType = 'userSure' | 'privates';

interface AgreementSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 点击「同意并继续」：勾选协议并关闭弹窗 */
  onAgree: () => void;
  /** 弹窗 dismiss 动画结束后触发：接着执行被拦截的登录动作。
   *  iOS 上 RN Modal 是一个 presented VC，未 dismiss 完就 present 一键登录授权页会报「vc已有present界面」。 */
  onAgreeDismissed: () => void;
  /** 弹窗关闭后的导航等操作；不会表示用户已同意。 */
  onDismiss?: () => void;
  /** 点击《用户协议》/《隐私政策》：打开 App 内协议页 */
  onOpenAgreement: (type: AgreementType) => void;
}

const WINDOW_HEIGHT = Dimensions.get('window').height;

/**
 * 登录页协议同意半屏弹窗（原型：请阅读并同意以下条款）。
 * 阴影遮罩原地淡入，仅白色面板从底部滑出；点遮罩关闭（不继续登录）。
 */
export default function AgreementSheet({
  visible,
  onClose,
  onAgree,
  onAgreeDismissed,
  onDismiss,
  onOpenAgreement,
}: AgreementSheetProps) {
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  /** 是否因点「同意并继续」而关闭（区别于点遮罩/协议链接关闭） */
  const agreedDismissRef = useRef(false);

  const handleAgreePress = () => {
    if (agreedDismissRef.current) return;
    agreedDismissRef.current = true;
    onAgree();
  };

  // 消费一次待继续动作；iOS 必须等原生 VC 完全 dismiss 后才可打开授权页。
  const handleDismiss = useCallback(() => {
    if (agreedDismissRef.current) {
      agreedDismissRef.current = false;
      onAgreeDismissed();
    }
    onDismiss?.();
  }, [onAgreeDismissed, onDismiss]);

  useEffect(() => {
    // Android 不提供 Modal.onDismiss；visible=false 提交后继续原操作。
    if (Platform.OS === 'android' && !visible) handleDismiss();
  }, [visible, handleDismiss]);

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  // 面板滑动距离：未测量前用屏高兜底（保证初始在屏幕外、无闪现）
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || WINDOW_HEIGHT, 0],
  });

  const onSheetLayout = (e: LayoutChangeEvent) => {
    setSheetHeight(e.nativeEvent.layout.height);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={handleDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessible={false}
        />
        <Animated.View style={{ transform: [{ translateY }] }} onLayout={onSheetLayout}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + scaleSizeH(24) }]}>
            <Text style={styles.title}>请阅读并同意以下条款</Text>
            <Text style={styles.body}>
              我已阅读并同意
              <Text style={styles.link} onPress={() => onOpenAgreement('userSure')}>
                《用户协议》
              </Text>
              和
              <Text style={styles.link} onPress={() => onOpenAgreement('privates')}>
                《隐私政策》
              </Text>
            </Text>
            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleAgreePress}>
              <Text style={styles.buttonText}>同意并继续</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(24),
    paddingTop: scaleSizeH(30),
    alignItems: 'center',
  },
  title: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  body: {
    marginTop: scaleSizeH(24),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#323232',
    textAlign: 'center',
  },
  link: {
    color: '#2962D4',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: '#2962D4',
    marginTop: scaleSizeH(40),
  },
  buttonText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
