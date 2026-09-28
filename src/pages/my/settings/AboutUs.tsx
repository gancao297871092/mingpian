import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { SettingCard, SettingDivider, SettingRow } from './components';
import type { RootStackParamList } from '@/route/map';

const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

/** 83.关于我们 */
export default function AboutUs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Image source={require('@/assets/my/settings/app-logo.png')} style={styles.logo} />
          <Text style={styles.appName}>联诚采信</Text>
          <Text style={styles.version}>version 1.0.1</Text>
          <Text style={styles.record} onPress={todo}>
            {'备案号123456号-10A >'}
          </Text>
        </View>

        <SettingCard>
          <SettingRow label="版本更新" onPress={() => Toast.show({ type: 'success', text1: '已是最新版本' })} />
        </SettingCard>
        <View style={styles.gap} />
        <SettingCard>
          <SettingRow label="用户协议" onPress={() => navigation.navigate('agreement', { type: 'userSure' })} />
          <SettingDivider />
          <SettingRow label="隐私政策" onPress={() => navigation.navigate('agreement', { type: 'privates' })} />
          <SettingDivider />
          <SettingRow label="实名认证服务协议" onPress={todo} />
          <SettingDivider />
          <SettingRow label="企业认证服务协议" onPress={todo} />
          <SettingDivider />
          <SettingRow label="社区规范" onPress={todo} />
          <SettingDivider />
          <SettingRow label="联系我们" onPress={() => navigation.navigate('helpCenter')} />
        </SettingCard>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  brand: {
    alignItems: 'center',
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(30),
    gap: scaleSizeH(5),
  },
  logo: {
    width: scaleSizeW(78),
    height: scaleSizeW(78),
    borderRadius: scaleSizeW(20),
    marginBottom: scaleSizeH(15),
  },
  appName: {
    fontSize: setSpText(17),
    color: '#000000',
  },
  version: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
  },
  record: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
  },
  gap: {
    height: scaleSizeH(20),
  },
});
