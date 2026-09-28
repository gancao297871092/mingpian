import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, SettingCard, SettingDivider, SettingRow } from './components';
import { CertBadgeIcon, WechatIcon } from './subIcons';
import type { RootStackParamList } from '@/route/map';

function maskPhone(phone?: string) {
  if (!phone) return '未绑定';
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '+86 $1****$2');
}

export default function AccountSecurity() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userInfo = useUserStore(s => s.userInfo);
  const [info, setInfo] = useState<API.setting.AccountSecurityInfo>({});
  const [phoneTipVisible, setPhoneTipVisible] = useState(false);

  const load = useCallback(() => {
    API.setting
      .accountSecurity()
      .then(res => res.data && setInfo(res.data))
      .catch(() => {
        // TODO 联调后处理失败兜底
        setInfo({
          phone: userInfo?.wqUser?.phone,
          hasPassword: false,
          wechatBound: false,
          authReal: userInfo?.wqUser?.authRealCard,
          authPosition: userInfo?.wqUser?.authPosition,
          authCompany: userInfo?.wqUser?.authCompany,
        });
      });
  }, [userInfo]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onWechat = () => {
    if (info.wechatBound) {
      Toast.show({ type: 'info', text1: '微信已绑定' });
      return;
    }
    navigation.navigate('wechatAuth', {});
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SettingCard>
          <SettingRow label="手机号" value={maskPhone(info.phone)} onPress={() => setPhoneTipVisible(true)} />
          <SettingDivider />
          <SettingRow
            label="登录密码"
            value={info.hasPassword ? '已设置' : '未设置'}
            onPress={() => navigation.navigate('verifyIdentity', { scene: 'resetPassword' })}
          />
        </SettingCard>
        <View style={styles.gap} />
        <SettingCard>
          <SettingRow
            label="微信账号"
            icon={<WechatIcon />}
            value={info.wechatBound ? info.wechatNickname || '已绑定' : '未绑定'}
            onPress={onWechat}
          />
        </SettingCard>
        <View style={styles.gap} />
        <SettingCard>
          <SettingRow
            label="认证中心"
            icon={<CertBadgeIcon />}
            onPress={() => navigation.navigate('certificationCenter')}
          />
        </SettingCard>
      </ScrollView>

      <Modal visible={phoneTipVisible} transparent animationType="fade" onRequestClose={() => setPhoneTipVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>更换绑定的手机号？</Text>
            <Text style={styles.modalDesc}>每个帐号，30天内只能更换一次手机号。</Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => {
                setPhoneTipVisible(false);
                navigation.navigate('changePhoneVerify', { scene: 'changePhone' });
              }}
            >
              <Text style={styles.modalPrimaryText}>继续更换</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} activeOpacity={0.85} onPress={() => setPhoneTipVisible(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(40),
  },
  gap: {
    height: scaleSizeH(10),
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: scaleSizeW(300),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(20),
    padding: scaleSizeW(14),
  },
  modalTitle: {
    fontSize: setSpText(16),
    fontWeight: '600',
    color: '#000000',
    lineHeight: scaleSizeH(22),
    paddingHorizontal: scaleSizeW(8),
    marginTop: scaleSizeH(8),
  },
  modalDesc: {
    fontSize: setSpText(16),
    color: '#000000',
    lineHeight: scaleSizeH(24),
    paddingHorizontal: scaleSizeW(8),
    marginTop: scaleSizeH(10),
    marginBottom: scaleSizeH(18),
  },
  modalPrimaryBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalCancelBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: 'rgba(120,120,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(10),
  },
  modalCancelText: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#000000',
  },
});
