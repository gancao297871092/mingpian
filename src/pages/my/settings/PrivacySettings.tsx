import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, SectionTitle, SettingCard, SettingDivider, SettingRow } from './components';
import { AiConnectIcon, AiInfoIcon } from './subIcons';

type UserSwitchKey = 'bbsShow' | 'isLikePrivate' | 'isFavoritePrivate' | 'isFollowShow' | 'isFansShow';
type AiField = 'aiConnectDefault' | 'aiAnalyzeBbs' | 'aiRecommendOpp';

/** 80/81.隐私与权限（资料公开范围对齐小程序 privacy.vue，状态存于 userInfo） */
export default function PrivacySettings() {
  const { userInfo, setUserInfo } = useUserStore();
  const wqUser = userInfo?.wqUser;

  /** 个人公开开关：乐观切换，失败回滚（POST /user/info/base/update） */
  const onUserSwitch = async (key: UserSwitchKey) => {
    if (!userInfo || !wqUser) return;
    const prev = wqUser[key];
    const next = Number(prev) === 1 ? 0 : 1;
    setUserInfo({ ...userInfo, wqUser: { ...wqUser, [key]: next } });
    try {
      const res = await API.user.baseUpdate({ [key]: next });
      if (res.code !== '200') throw new Error(res.msg || 'error');
    } catch {
      setUserInfo({ ...userInfo, wqUser: { ...wqUser, [key]: prev } });
    }
  };

  /** 企业名片公开开关：乐观切换，失败回滚（GET /company/bbs/show） */
  const onCpSwitch = async () => {
    if (!userInfo) return;
    const prev = userInfo.isCpShow;
    const next = Number(prev) === 1 ? 0 : 1;
    setUserInfo({ ...userInfo, isCpShow: next });
    try {
      const res = await API.company.bbsShow(next);
      if (res.code !== '200') throw new Error(res.msg || 'error');
    } catch {
      setUserInfo({ ...userInfo, isCpShow: prev });
    }
  };

  /** AI 开关（1开 默认开）：乐观切换，失败回滚（POST /user/info/base/update） */
  const aiOn = (key: AiField) => Number(wqUser?.[key] ?? 1) === 1;
  const onAiSwitch = async (key: AiField) => {
    if (!userInfo || !wqUser) return;
    const prev = wqUser[key];
    const next = aiOn(key) ? 0 : 1;
    setUserInfo({ ...userInfo, wqUser: { ...wqUser, [key]: next } });
    try {
      const res = await API.user.baseUpdate({ [key]: next });
      if (res.code !== '200') throw new Error(res.msg || 'error');
    } catch {
      setUserInfo({ ...userInfo, wqUser: { ...wqUser, [key]: prev } });
    }
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SectionTitle title="资料公开范围" right="关闭后仅自己可见" />
        <SettingCard>
          <SettingRow label="企业名片" switchValue={Number(userInfo?.isCpShow) === 1} onSwitchChange={onCpSwitch} />
          <SettingDivider />
          <SettingRow label="我的动态" switchValue={Number(wqUser?.bbsShow) === 1} onSwitchChange={() => onUserSwitch('bbsShow')} />
          <SettingDivider />
          <SettingRow label="我的点赞" switchValue={Number(wqUser?.isLikePrivate) === 1} onSwitchChange={() => onUserSwitch('isLikePrivate')} />
          <SettingDivider />
          <SettingRow label="我的收藏" switchValue={Number(wqUser?.isFavoritePrivate) === 1} onSwitchChange={() => onUserSwitch('isFavoritePrivate')} />
          <SettingDivider />
          <SettingRow label="我的关注" switchValue={Number(wqUser?.isFollowShow) === 1} onSwitchChange={() => onUserSwitch('isFollowShow')} />
          <SettingDivider />
          <SettingRow label="我的粉丝" switchValue={Number(wqUser?.isFansShow) === 1} onSwitchChange={() => onUserSwitch('isFansShow')} />
        </SettingCard>

        <SectionTitle title="AI 产业连接" right="默认策略" />
        <View style={[styles.aiCard, aiOn('aiConnectDefault') && styles.aiCardOn]}>
          <View style={styles.aiHeader}>
            <AiConnectIcon />
            <Text style={styles.aiTitle}>AI 产业连接</Text>
            <Switch
              value={aiOn('aiConnectDefault')}
              onValueChange={() => onAiSwitch('aiConnectDefault')}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
              style={styles.aiSwitch}
            />
          </View>
          <View style={[styles.aiStatus, aiOn('aiConnectDefault') ? styles.aiStatusOn : styles.aiStatusOff]}>
            <AiInfoIcon />
            <Text style={[styles.aiStatusText, aiOn('aiConnectDefault') ? styles.aiStatusTextOn : styles.aiStatusTextOff]}>
              {aiOn('aiConnectDefault')
                ? '已开启：新发动态默认参与分析；单条仍可在发布时单独关闭。'
                : '已关闭：新内容默认不公开到「正在发生」；匹配与画像更新仍会继续。'}
            </Text>
          </View>
          <Text style={styles.aiDesc}>{'控制新发动态的默认开关；\n单条可在发布时单独调整，不会改这里的默认值'}</Text>
        </View>

        <View style={styles.gap} />
        <SettingCard>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>分析我的公开动态</Text>
              <Text style={styles.switchDesc}>识别明确的企业需求、能力、人才与服务</Text>
            </View>
            <Switch
              value={aiOn('aiAnalyzeBbs')}
              onValueChange={() => onAiSwitch('aiAnalyzeBbs')}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingDivider />
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>为我推荐企业与机会</Text>
              <Text style={styles.switchDesc}>根据公开内容匹配可能相关的企业</Text>
            </View>
            <Switch
              value={aiOn('aiRecommendOpp')}
              onValueChange={() => onAiSwitch('aiRecommendOpp')}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingCard>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  gap: {
    height: scaleSizeH(20),
  },
  aiCard: {
    marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    padding: scaleSizeW(14),
  },
  aiCardOn: {
    backgroundColor: '#F2F6FF',
    borderWidth: 1,
    borderColor: BLUE,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  aiTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  aiSwitch: {
    marginLeft: 'auto',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(9),
    marginTop: scaleSizeH(12),
  },
  aiStatusOn: {
    backgroundColor: BLUE,
  },
  aiStatusOff: {
    backgroundColor: '#F2F6FF',
  },
  aiStatusText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: scaleSizeH(16),
  },
  aiStatusTextOn: {
    color: '#FFFFFF',
  },
  aiStatusTextOff: {
    color: BLUE,
  },
  aiDesc: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(12),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
    gap: scaleSizeW(10),
  },
  switchTextWrap: {
    flex: 1,
    gap: scaleSizeH(10),
  },
  switchLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  switchDesc: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
  },
});
