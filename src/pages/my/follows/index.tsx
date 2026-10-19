import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { setFollow } from '@/store/follow';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const DIVIDER = '#EBEBEB';
const PAGE_SIZE = 20;

type FollowTab = 'mutual' | 'follow' | 'fans';

const TABS: { key: FollowTab; label: string }[] = [
  { key: 'mutual', label: '互关' },
  { key: 'follow', label: '关注' },
  { key: 'fans', label: '粉丝' },
];

/** 他人主页的关注/粉丝：无互关 tab（参考小红书） */
const TABS_OTHER: { key: FollowTab; label: string }[] = [
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

interface TabData {
  list: FollowUser[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  loaded: boolean;
}

const initialTabData: TabData = { list: [], total: 0, page: 0, pages: 1, loading: false, loaded: false };

/** 对齐小程序 user.vue 字段：avatar/username/currentUserIsFollow/id */
const mapUser = (u: any): FollowUser => ({
  id: String(u.id ?? u.userId ?? ''),
  avatar: u.avatar ?? '',
  name: u.username ?? u.nickname ?? '',
  company: u.cpName ?? u.companyName ?? '',
  verified: !!(u.authCompany || u.authRealCard || u.isAuth),
  isFollow: Number(u.currentUserIsFollow ?? u.isFollow ?? 0) === 1,
  isMutual: Number(u.isMutual ?? 0) === 1,
});

/** 昵称旁蓝色认证徽章（figma 互关/关注/粉丝列表 Vector） */
function VerifiedBadge() {
  return <BlueBadgeIcon size={13} />;
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

function FollowButton({ item, tab, other, onToggle }: { item: FollowUser; tab: FollowTab; other: boolean; onToggle: (item: FollowUser) => void }) {
  if (tab === 'mutual') return null;
  const label = item.isFollow ? (item.isMutual ? '互相关注' : '已关注') : tab === 'fans' ? '回关' : '关注';
  // 他人主页（参考小红书）：未关注=蓝色描边白底，已关注=灰描边灰字
  if (other) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.actionBtn, item.isFollow ? styles.otherBtnDone : styles.otherBtn]}
        onPress={() => onToggle(item)}
      >
        <Text style={[styles.actionBtnText, item.isFollow ? styles.otherBtnTextDone : styles.otherBtnText]}>{label}</Text>
      </TouchableOpacity>
    );
  }
  const filled = !item.isFollow;
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
  const token = useUserStore(s => s.token);
  const myId = useUserStore(s => s.userInfo?.wqUser?.id ?? 0);
  /** 他人模式：传 userId 进入，只显示 关注/粉丝 两个 tab */
  const targetUserId = route.params?.userId;
  const isOther = targetUserId != null && targetUserId !== myId;
  const listUserId = isOther ? targetUserId : myId;
  const tabs = isOther ? TABS_OTHER : TABS;
  const [tab, setTab] = useState<FollowTab>(() => {
    const t = route.params?.tab;
    if (isOther) return t === 'fans' ? 'fans' : 'follow';
    return t ?? 'mutual';
  });
  const [data, setData] = useState<Record<FollowTab, TabData>>({
    mutual: initialTabData,
    follow: initialTabData,
    fans: initialTabData,
  });
  const dataRef = useRef(data);
  dataRef.current = data;

  /** 对方隐私锁定（0-不公开）：当前 tab 禁止查看，仅提示 */
  const tabLocked =
    isOther &&
    (tab === 'follow'
      ? Number(route.params?.followShow ?? 1) === 0
      : tab === 'fans'
        ? Number(route.params?.fansShow ?? 1) === 0
        : false);

  useEffect(() => {
    // 他人模式：头部只显示对方昵称，tab 栏放在页面内容区
    if (isOther) {
      navigation.setOptions({ title: route.params?.nickname ?? '' });
      return;
    }
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
  }, [navigation, tab, isOther, route.params?.nickname]);

  const fetchPage = useCallback(
    async (key: FollowTab, pageNum: number) => {
      // 未登录不调用关注/粉丝接口（对齐 my/bbs/list 处理）
      if (!token) {
        setData(prev => ({ ...prev, [key]: { ...prev[key], loaded: true } }));
        return;
      }
      if (dataRef.current[key].loading) return;
      setData(prev => ({ ...prev, [key]: { ...prev[key], loading: true } }));
      try {
        const res =
          key === 'mutual'
            ? await API.user.mutualList({ pageNum, pageSize: PAGE_SIZE })
            : key === 'follow'
              ? await API.user.followList({ targetUserId: listUserId, pageNum, pageSize: PAGE_SIZE })
              : await API.user.fansList({ targetUserId: listUserId, pageNum, pageSize: PAGE_SIZE });
        const list = (res.data?.list ?? []).map(mapUser);
        const pages = res.data?.pages ?? 1;
        setData(prev => ({
          ...prev,
          [key]: {
            list: pageNum === 1 ? list : [...prev[key].list, ...list],
            total: res.data?.total ?? 0,
            page: pageNum,
            pages,
            loading: false,
            loaded: true,
          },
        }));
      } catch {
        setData(prev => ({ ...prev, [key]: { ...prev[key], loading: false, loaded: true } }));
      }
    },
    [token, listUserId],
  );

  // tab 懒加载第一页（锁定 tab 不请求）
  useEffect(() => {
    if (tabLocked) return;
    const d = dataRef.current[tab];
    if (!d.loaded && !d.loading) fetchPage(tab, 1);
  }, [tab, tabLocked, fetchPage]);

  const onEndReached = useCallback(() => {
    const d = dataRef.current[tab];
    if (d.loaded && !d.loading && d.page < d.pages) fetchPage(tab, d.page + 1);
  }, [tab, fetchPage]);

  // 下拉刷新：重新拉第一页
  const onRefresh = useCallback(() => {
    fetchPage(tab, 1);
  }, [tab, fetchPage]);

  // 关注/回关：对齐小程序 user.vue，调 /user/follow/operate 成功后本地切换
  const onToggleFollow = useCallback(
    (item: FollowUser) => {
      const next = !item.isFollow;
      API.user
        .followOperate({ targetUserId: Number(item.id), isFollow: next ? 1 : 0 })
        .then(() => {
          // 同步全局关注状态，详情页/他人主页订阅同一数据源
          setFollow(Number(item.id), next);
          setData(prev => ({
            ...prev,
            [tab]: {
              ...prev[tab],
              list: prev[tab].list.map(u =>
                u.id === item.id ? { ...u, isFollow: next, isMutual: tab === 'fans' ? u.isMutual || next : u.isMutual } : u,
              ),
            },
          }));
        })
        .catch(() => { });
    },
    [tab],
  );

  const current = data[tab];

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
        <FollowButton item={item} tab={tab} other={isOther} onToggle={onToggleFollow} />
      </View>
    ),
    [tab, isOther, onToggleFollow],
  );

  return (
    <SafeView backgroundColor="#FFFFFF">
      {!isOther && <View style={styles.divider} />}
      {isOther ? (
        <View style={styles.otherTabsRow}>
          {tabs.map(t => (
            <TouchableOpacity key={t.key} activeOpacity={0.7} style={styles.tabItem} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              <View style={[styles.tabIndicator, tab !== t.key && styles.tabIndicatorHidden]} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.subtitle}>{`${SUBTITLES[tab]}（${current.total}人）`}</Text>
      )}
      {tabLocked ? (
        <EmptyState variant="permission" title="对方未公开" style={styles.emptyBox} />
      ) : (
        <FlatList
          data={current.list}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={current.loading && current.loaded} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
          ItemSeparatorComponent={tab === 'mutual' || isOther ? undefined : RowSeparator}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            current.loaded ? <EmptyState variant="content" title="暂无内容" style={styles.emptyBox} /> : null
          }
          ListFooterComponent={<ListFooter fetching={current.loading} isLastPage={current.page >= current.pages} listLength={current.list.length} />}
        />
      )}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(30),
  },
  otherTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(40),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(8),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
  emptyBox: {
    paddingTop: scaleSizeH(80),
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
  otherBtn: {
    borderColor: PRIMARY,
  },
  otherBtnDone: {
    borderColor: '#EDECEC',
    backgroundColor: '#F6F6F6',
  },
  otherBtnText: {
    color: PRIMARY,
  },
  otherBtnTextDone: {
    color: '#999999',
  },
  separator: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: scaleSizeW(60),
  },
});
