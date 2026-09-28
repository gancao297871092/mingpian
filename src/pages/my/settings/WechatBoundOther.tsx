import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH } from '@/utils/screenUtils';
import { WhitePageTitle } from './components';
import {
  WechatAccountCard,
  WechatPrimaryButton,
  WechatSecondaryButton,
  useCurrentAccount,
} from './WechatAuth';
import type { RootStackParamList } from '@/route/map';

/** 90.微信已绑定其他账号 */
export default function WechatBoundOther() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const current = useCurrentAccount();
  const [other, setOther] = React.useState<{ nickname?: string; avatar?: string }>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    API.setting
      .wechatBindInfo({ code: '' })
      .then(res => res.data && setOther({ nickname: res.data.otherNickname, avatar: res.data.otherAvatar }))
      .catch(() => {
        // TODO 联调后处理失败兜底
        setOther({ nickname: 'wildfire' });
      });
  }, []);

  const onRebind = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await API.setting.wechatBind({ code: '', rebind: 1 });
    } catch {
      // TODO 联调后失败时不放行
    } finally {
      setLoading(false);
    }
    navigation.navigate('wechatBindSuccess');
  };

  return (
    <SafeView backgroundColor="#FFFFFF">
      <WhitePageTitle title="该微信已绑定其他账号" subtitle="是否将微信换绑至当前登录账号？" />
      <View style={styles.cards}>
        <WechatAccountCard avatar={other.avatar} name={other.nickname || '原账号'} desc="原账号 · 当前绑定微信" tag="当前绑定" />
        <WechatAccountCard avatar={current.avatar} name={current.name} desc="当前登录账号" tag="当前登录" />
      </View>
      <View style={styles.buttons}>
        <WechatPrimaryButton label="换绑" onPress={onRebind} />
        <WechatSecondaryButton label="暂不换绑" onPress={() => navigation.goBack()} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  cards: {
    marginTop: scaleSizeH(30),
  },
  buttons: {
    marginTop: scaleSizeH(53),
    gap: scaleSizeH(10),
  },
});
