import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { navigationRef } from '@/route/navigationRef';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

interface PrivacyConsentGateProps {
  /** 点击「同意并继续」：记录同意标记并继续 App 初始化 */
  onAgree: () => void;
}

/**
 * 首启隐私政策同意弹窗（工信部合规：用户同意前不初始化任何三方 SDK、不上报数据）。
 * 阻断式：不同意只能退出应用；点《用户协议》/《隐私政策》打开 App 内协议页，
 * 阅读期间弹窗自动隐藏，返回后重新展示。
 */
export default function PrivacyConsentGate({ onAgree }: PrivacyConsentGateProps) {
  const [viewingAgreement, setViewingAgreement] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // 协议页展示期间隐藏弹窗，返回后恢复
  useEffect(() => {
    const sub = navigationRef.addListener('state', () => {
      setViewingAgreement(navigationRef.getCurrentRoute()?.name === 'agreement');
    });
    return sub;
  }, []);

  const openAgreement = (type: 'userSure' | 'privates', title: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('agreement', { type, title });
    }
  };

  const exitApp = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS 不允许代码退出应用，保持阻断
      Toast.show({ type: 'info', text1: '请同意隐私政策后使用，或手动退出应用' });
    }
  };

  return (
    <Modal visible={!viewingAgreement} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {confirmExit ? (
            <>
              <Text style={styles.title}>确认退出？</Text>
              <Text style={styles.body}>
                不同意隐私政策将无法继续使用本 App。{'\n'}你可以重新阅读协议后再做决定。
              </Text>
              <TouchableOpacity style={styles.agreeBtn} activeOpacity={0.85} onPress={() => setConfirmExit(false)}>
                <Text style={styles.agreeBtnText}>再想想</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} activeOpacity={0.85} onPress={exitApp}>
                <Text style={styles.exitBtnText}>仍要退出</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>用户协议与隐私政策</Text>
              <Text style={styles.body}>
                感谢你使用联诚采信！我们非常重视你的个人信息和隐私保护。{'\n\n'}
                请你仔细阅读并同意
                <Text style={styles.link} onPress={() => openAgreement('userSure', '用户协议')}>
                  《用户协议》
                </Text>
                和
                <Text style={styles.link} onPress={() => openAgreement('privates', '隐私政策')}>
                  《隐私政策》
                </Text>
                ，了解我们收集、使用信息的方式。{'\n\n'}
                点击「同意并继续」即表示你已阅读并同意上述协议。
              </Text>
              <TouchableOpacity style={styles.agreeBtn} activeOpacity={0.85} onPress={onAgree}>
                <Text style={styles.agreeBtnText}>同意并继续</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitBtn}
                activeOpacity={0.85}
                onPress={() => setConfirmExit(true)}
              >
                <Text style={styles.exitBtnText}>不同意</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: scaleSizeW(315),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(16),
    paddingHorizontal: scaleSizeW(24),
    paddingTop: scaleSizeH(28),
    paddingBottom: scaleSizeH(20),
    alignItems: 'center',
  },
  title: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  body: {
    marginTop: scaleSizeH(16),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#323232',
  },
  link: {
    color: '#2962D4',
  },
  agreeBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: scaleSizeH(44),
    borderRadius: scaleSizeH(22),
    backgroundColor: '#2962D4',
    marginTop: scaleSizeH(24),
  },
  agreeBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  exitBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: scaleSizeH(44),
    marginTop: scaleSizeH(8),
  },
  exitBtnText: {
    fontSize: setSpText(14),
    color: '#999999',
  },
});
