import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';
import { WhitePageTitle } from './components';
import { WechatAccountCard, WechatPrimaryButton, useCurrentAccount } from './WechatAuth';
import type { RootStackParamList } from '@/route/map';

/** 91.成功绑定微信 */
export default function WechatBindSuccess() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const current = useCurrentAccount();

  return (
    <SafeView backgroundColor="#FFFFFF">
      <WhitePageTitle title="微信已绑定至当前登录账号" subtitle={`已成功绑定至 ${current.name}。`} />
      <View style={styles.cardWrap}>
        <WechatAccountCard avatar={current.avatar} name={current.name} desc="授权后可绑定至当前账号" tag="已绑定" tagType="blue" />
      </View>
      <Text style={styles.note}>原账号 wildfire 仍可通过xx、xx方式登录。</Text>
      <View style={styles.buttons}>
        <WechatPrimaryButton label="完成" onPress={() => navigation.popTo('accountSecurity')} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginTop: scaleSizeH(30),
  },
  note: {
    marginTop: scaleSizeH(20),
    textAlign: 'center',
    fontSize: setSpText(12),
    color: '#B9B9B9',
  },
  buttons: {
    marginTop: scaleSizeH(52),
  },
});
