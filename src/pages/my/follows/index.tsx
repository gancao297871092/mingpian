import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
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
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { usePageList } from '@/hooks/usePageList';
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

const EMPTY_TITLES: Record<FollowTab, string> = {
  mutual: '暂无互关',
  follow: '暂无关注',
  fans: '暂无粉丝',
};

interface FollowUser {
  id: string;
  userId: number;
  avatar: string;
  name: string;
  company: string;
  /** 企业/实名认证徽章 */
  verified: boolean;
  isFollow: boolean;
  isMutual: boolean;
}

function mapFollowUser(u: any): FollowUser {
  const info = u?.userInfoVo ?? u ?? {};
  const userId = Number(info.userId ?? info.id ?? 0);
  return {
    id: String(info.userId ?? info.id ?? Math.random()),
    userId,
    avatar: info.avatar || '',
    name: info.nickname || info.username || '',
    company: info.cpName || info.companyName || '',
    verified: Number(info.authCompany ?? info.verified ?? 0) === 1,
    isFollow: Number(info.isFollow ?? 0) === 1,
    isMutual: Number(info.isMutual ?? info.mutual ?? 0) === 1,
  };
}

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

  const fetcher = useCallback(
    (params: { type: FollowTab; pageNum?: number; pageSize?: number }) =>
      API.user.followList(params).then(res => ({
        ...res,
        data: { ...res.data, list: (res.data?.list ?? []).map(mapFollowUser) },
      })),
    [],
  );
  const params = useMemo(() => ({ type: tab }), [tab]);
  const { list, setList, fetching, total, refresh, loadMore, isLastPage } = usePageList(fetcher, params);

  const onToggleFollow = useCallback(
    (item: FollowUser) => {
      const next = !item.isFollow;
      const patch = (u: FollowUser): FollowUser =>
        u.id === item.id ? { ...u, isFollow: next, isMutual: tab === 'fans' ? u.isMutual || next : u.isMutual } : u;
      setList(prev => prev.map(patch));
      API.user.followOperate({ targetUserId: item.userId, isFollow: next ? 1 : 0 }).catch(() => {
        setList(prev => prev.map(u => (u.id === item.id ? item : u)));
      });
    },
    [tab, setList],
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
      <Text style={styles.subtitle}>{`${SUBTITLES[tab]}（${total}人）`}</Text>
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={fetching && list.length > 0} onRefresh={refresh} tintColor={PRIMARY} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={tab === 'mutual' ? undefined : RowSeparator}
        ListEmptyComponent={
          !fetching ? <EmptyState variant="content" title={EMPTY_TITLES[tab]} style={styles.emptyBox} /> : <View style={styles.loadingPad} />
        }
        ListFooterComponent={<ListFooter fetching={fetching} isLastPage={isLastPage} listLength={list.length} />}
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
  loadingPad: {
    height: scaleSizeH(200),
  },
  emptyBox: {
    marginTop: scaleSizeH(60),
  },
});
