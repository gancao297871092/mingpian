import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const DIVIDER = '#EBEBEB';

type FollowTab = 'mutual' | 'follow' | 'fans';

const TABS: { key: FollowTab; label: string }[] = [
  { key: 'mutual', label: '互关' },
  { key: 'follow', label: '关注' },
  { key: 'fans', label: '粉丝' },
];

const SUBTITLES: Record<FollowTab, string> = {
  mutual: '我的互关',
  follow: '我的关注',
  fans: '关注我的人',
};

interface FollowUser {
  id: string;
  avatar: string;
  name: string;
  company: string;
  /** 企业/实名认证徽章 */
  verified: boolean;
  isFollow: boolean;
  isMutual: boolean;
}

/** 静态 mock（接口待联调） */
const MOCK_USERS: Record<FollowTab, FollowUser[]> = {
  mutual: [
    { id: 'm1', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: true, isFollow: true, isMutual: true },
    { id: 'm2', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: false, isFollow: true, isMutual: true },
    { id: 'm3', avatar: '', name: '苏州自动化集成', company: '', verified: false, isFollow: true, isMutual: true },
    { id: 'm4', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: true, isFollow: true, isMutual: true },
    { id: 'm5', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: false, isFollow: true, isMutual: true },
    { id: 'm6', avatar: '', name: '苏州自动化集成', company: '', verified: false, isFollow: true, isMutual: true },
  ],
  follow: [
    { id: 'f1', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: false, isFollow: true, isMutual: false },
    { id: 'f2', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: true, isFollow: true, isMutual: false },
    { id: 'f3', avatar: '', name: '华北设备服务', company: '', verified: false, isFollow: true, isMutual: false },
  ],
  fans: [
    { id: 'fa1', avatar: '', name: '华北设备服务', company: '云南赣云供应链管理有限公司', verified: false, isFollow: false, isMutual: false },
    { id: 'fa2', avatar: '', name: '华北设备服务', company: '', verified: false, isFollow: true, isMutual: true },
    { id: 'fa3', avatar: '', name: '苏州自动化集成', company: '', verified: false, isFollow: true, isMutual: true },
  ],
};

/** 昵称旁蓝色认证徽章（figma 互关/关注/粉丝列表 Vector） */
function VerifiedBadge() {
  return <BlueBadgeIcon size={13} />;
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

function FollowButton({ item, tab, onToggle }: { item: FollowUser; tab: FollowTab; onToggle: (item: FollowUser) => void }) {
  if (tab === 'mutual') return null;
  const filled = !item.isFollow;
  const label = item.isFollow ? (item.isMutual ? '互相关注' : '已关注') : tab === 'fans' ? '回关' : '关注';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.actionBtn, filled && styles.actionBtnFilled]}
      onPress={() => onToggle(item)}
    >
      <Text style={[styles.actionBtnText, filled && styles.actionBtnTextFilled]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Follows() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'follows'>>();
  const [tab, setTab] = useState<FollowTab>(route.params?.tab ?? 'mutual');
  const [lists, setLists] = useState<Record<FollowTab, FollowUser[]>>(MOCK_USERS);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} activeOpacity={0.7} style={styles.tabItem} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              <View style={[styles.tabIndicator, tab !== t.key && styles.tabIndicatorHidden]} />
            </TouchableOpacity>
          ))}
        </View>
      ),
    });
  }, [navigation, tab]);

  const list = lists[tab];

  // 本地联动：纯本地切换关注状态（接口待联调）
  const onToggleFollow = useCallback(
    (item: FollowUser) => {
      const next = !item.isFollow;
      setLists(prev => ({
        ...prev,
        [tab]: prev[tab].map(u =>
          u.id === item.id ? { ...u, isFollow: next, isMutual: tab === 'fans' ? u.isMutual || next : u.isMutual } : u,
        ),
      }));
    },
    [tab],
  );

  const renderItem = useCallback(
    ({ item }: { item: FollowUser }) => (
      <View style={styles.row}>
        {item.avatar ? (
          <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <View style={styles.rowText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.verified && <VerifiedBadge />}
          </View>
          {!!item.company && <Text style={styles.company} numberOfLines={1}>{item.company}</Text>}
        </View>
        <FollowButton item={item} tab={tab} onToggle={onToggleFollow} />
      </View>
    ),
    [tab, onToggleFollow],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      <View style={styles.divider} />
      <Text style={styles.subtitle}>{`${SUBTITLES[tab]}（${list.length}人）`}</Text>
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={tab === 'mutual' ? undefined : RowSeparator}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(30),
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: setSpText(17),
    color: TEXT_SUB,
  },
  tabTextActive: {
    color: '#000000',
  },
  tabIndicator: {
    width: scaleSizeW(24),
    height: scaleSizeW(2),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    marginTop: scaleSizeH(5),
  },
  tabIndicatorHidden: {
    opacity: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  subtitle: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
    marginLeft: scaleSizeW(16),
    marginTop: scaleSizeH(19),
    marginBottom: scaleSizeH(16),
  },
  listContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeH(10),
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  rowText: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  name: {
    fontSize: setSpText(15),
    color: '#000000',
    flexShrink: 1,
  },
  company: {
    fontSize: setSpText(13),
    lineHeight: setSpText(19),
    color: TEXT_SUB,
  },
  actionBtn: {
    minWidth: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: '#EDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(12),
  },
  actionBtnFilled: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  actionBtnText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: '#000000',
  },
  actionBtnTextFilled: {
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: scaleSizeW(60),
  },
});
