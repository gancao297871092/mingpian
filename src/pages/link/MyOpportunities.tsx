import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { InfoIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const ORANGE = '#F2722C';
const TEXT_SUB = '#6C6C6C';

type TopTab = 'pool' | 'mine';
type PoolSub = 'pending' | 'docked';
type MineSub = 'waiting' | 'toContact' | 'chatting';

interface OpportunityItem {
  id: string;
  company: string;
  sub: string;
  statusTag: string;
  statusTone: 'blue' | 'orange';
  sourceTag: string;
  timeTag: string;
  desc?: string;
  actionText?: string;
  actionTone?: 'light' | 'solid';
}

/** 静态 mock（接口待联调） */
const MOCK_POOL: Record<PoolSub, OpportunityItem[]> = {
  pending: [
    {
      id: 'p1',
      company: '杭州远航包装有限公司',
      sub: '包装制品',
      statusTag: '待接手',
      statusTone: 'blue',
      sourceTag: '对方申请',
      timeTag: '10 分钟前',
      desc: '对方正在寻找 [华东地区编织袋生产企业] 开展合作，您可能符合其合作方向。',
      actionText: '查看详情',
      actionTone: 'light',
    },
    {
      id: 'p2',
      company: '苏州智造自动化有限公司',
      sub: '智能装备',
      statusTag: '待接手',
      statusTone: 'blue',
      sourceTag: '对方申请',
      timeTag: '30 分钟前',
      desc: '对方正在寻找 [自动化产线集成商] 开展合作，您可能符合其合作方向。',
      actionText: '查看详情',
      actionTone: 'light',
    },
  ],
  docked: [
    {
      id: 'p3',
      company: '杭州远航包装有限公司',
      sub: '包装制品',
      statusTag: '张三负责',
      statusTone: 'blue',
      sourceTag: '我方触达',
      timeTag: '10 分钟前',
      desc: '来源信号：寻找视频包装材料供应商',
    },
  ],
};

/** 静态 mock（接口待联调） */
const MOCK_MINE: Record<MineSub, OpportunityItem[]> = {
  waiting: [
    {
      id: 'm1',
      company: '苏州智造自动化有限公司',
      sub: '智能装备',
      statusTag: '等待对方',
      statusTone: 'blue',
      sourceTag: '我方触达',
      timeTag: '昨天',
      desc: '你已向对方发送合作申请，等待对方查看并回应。',
      actionText: '查看申请',
      actionTone: 'solid',
    },
  ],
  toContact: [
    {
      id: 'm2',
      company: '苏州智造自动化有限公司',
      sub: '30分钟前建立连接',
      statusTag: '待联系',
      statusTone: 'orange',
      sourceTag: '我方触达',
      timeTag: '尚未发送站内消息',
      desc: '来源信号：寻找食品包装材料供应商',
      actionText: '开始沟通',
      actionTone: 'solid',
    },
  ],
  chatting: [
    {
      id: 'm3',
      company: '苏州智造自动化有限公司',
      sub: '昨天建立连接',
      statusTag: '沟通中',
      statusTone: 'blue',
      sourceTag: '对方申请',
      timeTag: '8分钟前',
      actionText: '继续沟通',
      actionTone: 'solid',
    },
    {
      id: 'm4',
      company: '杭州远航包装有限公司',
      sub: '昨天建立连接',
      statusTag: '沟通中',
      statusTone: 'blue',
      sourceTag: '我方触达',
      timeTag: '2 小时前',
      actionText: '继续沟通',
      actionTone: 'solid',
    },
  ],
};

const POOL_SUBS: { key: PoolSub; label: string }[] = [
  { key: 'pending', label: '待接手' },
  { key: 'docked', label: '已对接' },
];

const MINE_SUBS: { key: MineSub; label: string }[] = [
  { key: 'waiting', label: '等待对方' },
  { key: 'toContact', label: '待联系' },
  { key: 'chatting', label: '沟通中' },
];

const NOTICES: Record<TopTab, string> = {
  pool: '这里展示企业当前的全部合作机会，包含对方发来的申请和我方信号产生的匹配结果',
  mine: '你已发出合作申请，等待对方回应。对方同意后可进入私信沟通。',
};

const MINE_SUB_NOTICES: Record<MineSub, string> = {
  waiting: '你已发出合作申请，等待对方回应。对方同意后可进入私信沟通。',
  toContact: '双方已确认合作意向，尚未开始站内沟通。发送消息后将进入[沟通中]。',
  chatting: '正在跟进中的合作，可继续私信沟通。',
};

function OpportunityCard({ item }: { item: OpportunityItem }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.card}>
      <View style={styles.companyRow}>
        <ExpoImage source={require('@/assets/link/mock-avatar.png')} style={styles.companyAvatar} contentFit="cover" />
        <View style={styles.companyInfo}>
          <View style={styles.companyNameRow}>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
            <VerifiedBadgeIcon size={13} />
          </View>
          <Text style={styles.companySub}>{item.sub}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.tagsRow}>
        <View style={[styles.tag, item.statusTone === 'orange' ? styles.tagOrange : styles.tagBlue]}>
          <Text style={[styles.tagText, item.statusTone === 'orange' ? styles.tagTextOrange : styles.tagTextBlue]}>
            {item.statusTag}
          </Text>
        </View>
        <View style={[styles.tag, styles.tagBlue]}>
          <Text style={[styles.tagText, styles.tagTextBlue]}>{item.sourceTag}</Text>
        </View>
        <View style={[styles.tag, styles.tagGray]}>
          <Text style={[styles.tagText, styles.tagTextGray]}>{item.timeTag}</Text>
        </View>
      </View>
      {!!item.desc && <Text style={styles.cardDesc}>{item.desc}</Text>}
      {!!item.actionText && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.cardBtn, item.actionTone === 'solid' ? styles.cardBtnSolid : styles.cardBtnLight]}
          onPress={() =>
            item.actionText === '查看详情'
              ? navigation.navigate('opportunityDetail')
              : console.log('go:', item.actionText, item.id)
          }
        >
          <Text style={item.actionTone === 'solid' ? styles.cardBtnSolidText : styles.cardBtnLightText}>
            {item.actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** 56.我的商机/合作中心（figma 2793:6369 等待/待接手，2793:6427 已对接，2793:6526 等待对方，2793:6748 待联系，2793:6686 沟通中） */
export default function MyOpportunities() {
  const [topTab, setTopTab] = useState<TopTab>('pool');
  const [poolSub, setPoolSub] = useState<PoolSub>('pending');
  const [mineSub, setMineSub] = useState<MineSub>('waiting');

  const subs = topTab === 'pool' ? POOL_SUBS : MINE_SUBS;
  const activeSub = topTab === 'pool' ? poolSub : mineSub;
  const counts = useMemo(
    () =>
      topTab === 'pool'
        ? { pending: MOCK_POOL.pending.length, docked: MOCK_POOL.docked.length }
        : {
            waiting: MOCK_MINE.waiting.length,
            toContact: MOCK_MINE.toContact.length,
            chatting: MOCK_MINE.chatting.length,
          },
    [topTab],
  );
  const list: OpportunityItem[] =
    topTab === 'pool' ? MOCK_POOL[poolSub] : MOCK_MINE[mineSub];
  const notice = topTab === 'pool' ? NOTICES.pool : MINE_SUB_NOTICES[mineSub];

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 白色头部区：主 tab + 子 tab */}
        <View style={styles.headerBand}>
          <View style={styles.topTabs}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setTopTab('pool')}>
              <Text style={[styles.topTabText, topTab === 'pool' ? styles.topTabActive : styles.topTabInactive]}>
                企业合作池
              </Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setTopTab('mine')}>
              <Text style={[styles.topTabText, topTab === 'mine' ? styles.topTabActive : styles.topTabInactive]}>
                我的合作
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topDivider} />
          <View style={styles.subTabs}>
            {subs.map(item => {
              const active = activeSub === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={() =>
                    topTab === 'pool' ? setPoolSub(item.key as PoolSub) : setMineSub(item.key as MineSub)
                  }
                >
                  <Text style={[styles.subTabText, active ? styles.subTabActive : styles.subTabInactive]}>
                    {item.label} {counts[item.key as keyof typeof counts]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 说明条 */}
        <View style={styles.notice}>
          <InfoIcon />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>

        {list.map(item => (
          <OpportunityCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(20),
  },
  headerBand: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(18),
    marginBottom: scaleSizeH(9),
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
  },
  topTabText: {
    fontSize: setSpText(15),
    letterSpacing: -0.4,
  },
  topTabActive: {
    fontWeight: '500',
    color: '#000000',
  },
  topTabInactive: {
    color: TEXT_SUB,
  },
  topDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginTop: scaleSizeH(12),
    marginHorizontal: -scaleSizeW(16),
  },
  subTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingVertical: scaleSizeH(12),
  },
  subTabText: {
    fontSize: setSpText(13),
    letterSpacing: -0.4,
  },
  subTabActive: {
    color: '#000000',
  },
  subTabInactive: {
    color: TEXT_SUB,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
  },
  noticeText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(15),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  companyAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(11),
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  tag: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  tagBlue: {
    backgroundColor: '#F2F6FF',
  },
  tagOrange: {
    backgroundColor: '#FFE8DC',
  },
  tagGray: {
    backgroundColor: '#F6F7FB',
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  tagTextBlue: {
    color: PRIMARY,
  },
  tagTextOrange: {
    color: ORANGE,
  },
  tagTextGray: {
    color: TEXT_SUB,
  },
  cardDesc: {
    marginTop: scaleSizeH(12),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#333333',
  },
  cardBtn: {
    marginTop: scaleSizeH(15),
    height: scaleSizeH(35),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnLight: {
    backgroundColor: '#F2F6FF',
  },
  cardBtnLightText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  cardBtnSolid: {
    backgroundColor: PRIMARY,
  },
  cardBtnSolidText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
