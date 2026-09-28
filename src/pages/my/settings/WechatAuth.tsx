import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, WhitePageTitle } from './components';
import type { RootStackParamList } from '@/route/map';

const DEFAULT_WECHAT_AVATAR = require('@/assets/my/settings/wechat-avatar.png');

interface AccountCardProps {
  avatar?: string;
  name: string;
  desc: string;
  tag?: string;
  tagType?: 'gray' | 'blue';
}

export function WechatAccountCard({ avatar, name, desc, tag, tagType = 'gray' }: AccountCardProps) {
  return (
    <View style={styles.accountCard}>
      <Image source={avatar ? { uri: avatar } : DEFAULT_WECHAT_AVATAR} style={styles.accountAvatar} />
      <View style={styles.accountTextWrap}>
        <Text style={styles.accountName}>{name}</Text>
        <Text style={styles.accountDesc}>{desc}</Text>
      </View>
      {!!tag && (
        <View style={[styles.accountTag, tagType === 'blue' && styles.accountTagBlue]}>
          <Text style={[styles.accountTagText, tagType === 'blue' && styles.accountTagTextBlue]}>{tag}</Text>
        </View>
      )}
    </View>
  );
}

export function WechatPrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function WechatSecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** 89.微信授权 */
export default function WechatAuth() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [info, setInfo] = React.useState<API.setting.WechatBindInfo>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    API.setting
      .wechatBindInfo({ code: '' })
      .then(res => res.data && setInfo(res.data))
      .catch(() => {
        // TODO 联调后处理失败兜底
        setInfo({ nickname: '华北设备服务' });
      });
  }, []);

  const onConfirm = async () => {
    if (loading) return;
    setLoading(true);
    let boundOther = false;
    try {
      await API.setting.wechatBind({ code: '' });
      boundOther = !!info.boundOther;
    } catch {
      // TODO 联调后按真实结果跳转
    } finally {
      setLoading(false);
    }
    if (boundOther) {
      navigation.navigate('wechatBoundOther', {});
    } else {
      navigation.navigate('wechatBindSuccess');
    }
  };

  return (
    <SafeView backgroundColor="#FFFFFF">
      <WhitePageTitle title="确认微信授权" subtitle="联诚采信将获取你的微信公开身份信息，用于绑定微信账号。" />
      <View style={styles.cardWrap}>
        <WechatAccountCard avatar={info.avatar} name={info.nickname || '微信用户'} desc="授权后可绑定至当前账号" />
      </View>
      <View style={styles.buttons}>
        <WechatPrimaryButton label="确认授权" onPress={onConfirm} />
        <WechatSecondaryButton label="取消" onPress={() => navigation.goBack()} />
      </View>
    </SafeView>
  );
}

export function useCurrentAccount() {
  const userInfo = useUserStore(s => s.userInfo);
  return {
    avatar: userInfo?.wqUser?.avatar,
    name: userInfo?.wqUser?.nickname || userInfo?.wqUser?.username || '当前账号',
  };
}

const styles = StyleSheet.create({
  cardWrap: {
    marginTop: scaleSizeH(30),
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleSizeW(16),
    height: scaleSizeH(88),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    gap: scaleSizeW(13),
  },
  accountAvatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  accountTextWrap: {
    gap: scaleSizeH(6),
  },
  accountName: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  accountDesc: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(19),
  },
  accountTag: {
    marginLeft: 'auto',
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  accountTagBlue: {
    borderColor: BLUE,
  },
  accountTagText: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(12),
  },
  accountTagTextBlue: {
    color: BLUE,
  },
  buttons: {
    marginTop: scaleSizeH(53),
    gap: scaleSizeH(10),
  },
  primaryBtn: {
    marginHorizontal: scaleSizeW(40),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    marginHorizontal: scaleSizeW(40),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
});
