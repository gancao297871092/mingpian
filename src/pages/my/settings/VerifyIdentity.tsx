import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import { SettingRow, WhitePageTitle } from './components';
import { VerifyPhoneIcon, VerifyPwdIcon } from './subIcons';
import type { RootStackParamList } from '@/route/map';

export default function VerifyIdentity() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeView backgroundColor="#FFFFFF">
      <WhitePageTitle title="身份验证" subtitle="请先进行身份验证" />
      <View style={styles.list}>
        <View style={styles.optionCard}>
          <SettingRow
            label="手机验证码验证"
            icon={<VerifyPhoneIcon />}
            onPress={() => navigation.navigate('changePhoneVerify', {})}
          />
        </View>
        <View style={styles.optionCard}>
          <SettingRow
            label="原登录密码"
            icon={<VerifyPwdIcon />}
            onPress={() => navigation.navigate('changePassword', { hasPassword: true })}
          />
        </View>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: scaleSizeH(30),
    gap: scaleSizeH(10),
  },
  optionCard: {
    marginHorizontal: scaleSizeW(16),
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
