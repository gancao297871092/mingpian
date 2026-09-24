import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { formatLikeCount } from '@/utils/format';
import { setDetailCache } from '@/utils/detailCache';
import { listDrafts } from '@/utils/draftStore';
import { formatPushTime } from '@/pages/square/bbsDetail/detailTransform';
import {
  CardBoxIcon,
  CardLikeIcon,
  CompanyIcon,
  DraftIcon,
  EntryCertIcon,
  EntryChanceIcon,
  EntryCompanyIcon,
  EntryHistoryIcon,
  EntryWorkbenchIcon,
  MessageIcon,
  MyCardIcon,
  ServiceIcon,
  SettingsIcon,
  TabCommentIcon,
  TabFavIcon,
  TabLikeIcon,
} from './myIcons';
import type { RootStackParamList } from '@/route/map';
import { FlashList } from '@shopify/flash-list';

const BLUE = '#2962D4';
const CARD_W = scaleSizeW(194);
const PAGE_SIZE = 10;

type TabKey = 'post' | 'comment' | 'fav' | 'like';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'post', label: '发布' },
  { key: 'comment', label: '评论' },
  { key: 'fav', label: '收藏' },
  { key: 'like', label: '点赞' },
];

const TAB_ICONS: Record<TabKey, (color: string) => React.ReactNode> = {
  post: () => null,
  comment: color => <TabCommentIcon color={color} />,
  fav: color => <TabFavIcon color={color} />,
  like: color => <TabLikeIcon color={color} />,
};

interface PostCardData {
  id: string;
  imageUrl: string;
  imageHeight: number;
  title: string;
  date: string;
  likeCount: number;
  raw?: any;
}

interface CommentCardData {
  id: string;
  bbsId: number;
  avatar: string;
  name: string;
  company: string;
  content: string;
  time: string;
  bbsTitle: string;
}

interface TabState {
  list: any[];
  page: number;
  pages: number;
  loading: boolean;
  loaded: boolean;
}

const initialTabState = (): Record<TabKey, TabState> => ({
  post: { list: [], page: 0, pages: 1, loading: false, loaded: false },
  comment: { list: [], page: 0, pages: 1, loading: false, loaded: false },
  fav: { list: [], page: 0, pages: 1, loading: false, loaded: false },
  like: { list: [], page: 0, pages: 1, loading: false, loaded: false },
});

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

function mapPost(bbs: any): PostCardData {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || '')
    : media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '';
  const w = media?.width ? parseInt(media.width, 10) : 194;
  const h = media?.height ? parseInt(media.height, 10) : 237;
  const imageHeight = Math.min(Math.round((194 * h) / w), 320);
  return {
    id: String(bbs.id),
    imageUrl,
    imageHeight,
    title: bbs.title || (bbs.content || '').replace(/<[^>]*>/g, '').slice(0, 50),
    date: formatPushTime(bbs.pushTime || bbs.createTime).slice(0, 5),
    likeCount: bbs.countLike || 0,
    raw: bbs,
  };
}

function mapComment(c: any): CommentCardData {
  const info = c.userInfoVo ?? {};
  return {
    id: String(c.id),
    bbsId: c.bbsId,
    avatar: info.avatar || '',
    name: info.nickname || info.username || '',
    company: info.cpName || '',
    content: c.content || '',
    time: formatPushTime(c.createTime),
    bbsTitle: c.bbsTitle || '',
  };
}

function PostCard({ item, onPress }: { item: PostCardData; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.postCard} onPress={onPress}>
      {!!item.imageUrl && (
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={[styles.postImage, { height: scaleSizeH(item.imageHeight) }]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={item.imageUrl}
        />
      )}
      <View style={styles.postBody}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.postMeta}>
          <Text style={styles.postDate}>{item.date}</Text>
          <View style={styles.postLike}>
            <CardLikeIcon />
            <Text style={styles.postDate}>{formatLikeCount(item.likeCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CommentCard({ item, onPress }: { item: CommentCardData; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.commentCard} onPress={onPress}>
      <View style={styles.commentHead}>
        <ExpoImage source={{ uri: item.avatar }} style={styles.commentAvatar} contentFit="cover" transition={150} />
        <View style={styles.commentHeadText}>
          <Text style={styles.commentName} numberOfLines={1}>{item.name}</Text>
          {!!item.company && <Text style={styles.commentCompany} numberOfLines={1}>{item.company}</Text>}
        </View>
        <Text style={styles.commentTime}>{item.time}</Text>
      </View>
      <Text style={styles.commentContent} numberOfLines={2}>{item.content}</Text>
      {!!item.bbsTitle && (
        <View style={styles.commentOrigin}>
          <Text style={styles.commentOriginText} numberOfLines={1}>{item.bbsTitle}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function My() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token, userInfo, setUserInfo, logout } = useUserStore();
  const wqUser = userInfo?.wqUser;
  const myId = wqUser?.id ?? 0;

  const [activeTab, setActiveTab] = useState<TabKey>('post');
  const [tabData, setTabData] = useState<Record<TabKey, TabState>>(initialTabState);
  const [refreshing, setRefreshing] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabDataRef = useRef(tabData);
  tabDataRef.current = tabData;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchTab = useCallback(
    async (tab: TabKey, pageNum: number): Promise<{ list: any[]; pages: number }> => {
      if (tab === 'post') {
        const res = await API.my.bbsList({ pageNum, pageSize: PAGE_SIZE });
        return { list: (res.data?.list ?? []).map(mapPost), pages: res.data?.pages ?? 1 };
      }
      if (tab === 'fav' || tab === 'like') {
        const res = await API.my.likeFavoritesList({ targetUserId: myId, type: tab === 'fav' ? 2 : 1, pageNum, pageSize: PAGE_SIZE });
        return { list: (res.data?.list ?? []).map(mapPost), pages: res.data?.pages ?? 1 };
      }
      const res = await API.interaction.commentList({ pageNum, pageSize: 20 });
      return { list: (res.data?.list ?? []).map(mapComment), pages: res.data?.pages ?? 1 };
    },
    [myId],
  );

  const loadTab = useCallback(
    (tab: TabKey, pageNum: number) => {
      const state = tabDataRef.current[tab];
      if (state.loading) return;
      setTabData(prev => ({ ...prev, [tab]: { ...prev[tab], loading: true } }));
      fetchTab(tab, pageNum)
        .then(({ list, pages }) => {
          setTabData(prev => ({
            ...prev,
            [tab]: {
              list: pageNum === 1 ? list : [...prev[tab].list, ...list],
              page: pageNum,
              pages,
              loading: false,
              loaded: true,
            },
          }));
        })
        .catch(() => {
          setTabData(prev => ({ ...prev, [tab]: { ...prev[tab], loading: false, loaded: true } }));
        });
    },
    [fetchTab],
  );

  useEffect(() => {
    if (!tabData[activeTab].loaded) loadTab(activeTab, 1);
  }, [activeTab, tabData, loadTab]);

  // 每次进入页面刷新资料与草稿数
  useFocusEffect(
    useCallback(() => {
      setDraftCount(listDrafts().length);
      if (token) {
        API.user.info()
          .then(res => res.data && setUserInfo(res.data))
          .catch(() => { });
      }
    }, [token, setUserInfo]),
  );

  // 无系统头：状态栏直接压在渐变背景上，需白色图标
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTab(activeTabRef.current, 1);
    if (token) {
      API.user.info()
        .then(res => res.data && setUserInfo(res.data))
        .catch(() => { })
        .finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [token, setUserInfo, loadTab]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      scrollY.setValue(contentOffset.y);
      if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 200) {
        const tab = activeTabRef.current;
        const state = tabDataRef.current[tab];
        if (!state.loading && state.loaded && state.page < state.pages) {
          loadTab(tab, state.page + 1);
        }
      }
    },
    [scrollY, loadTab],
  );

  const openDetail = useCallback(
    (item: PostCardData) => {
      if (item.raw) setDetailCache(item.id, item.raw);
      navigation.navigate('bbsDetail', { id: item.id });
    },
    [navigation],
  );

  // 瀑布流双列（按累计高度均衡）
  const postColumns = useMemo(() => {
    const source: PostCardData[] = tabData[activeTab].list;
    const cols: PostCardData[][] = [[], []];
    const heights = [0, 0];
    source.forEach(card => {
      const i = heights[0] <= heights[1] ? 0 : 1;
      cols[i].push(card);
      heights[i] += card.imageHeight + 88;
    });
    return cols;
  }, [tabData, activeTab]);

  const stickyOpacity = scrollY.interpolate({
    inputRange: [Math.max(headerH - 60, 0), Math.max(headerH - 20, 1)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onSettings = () => {
    Alert.alert('设置', '', [
      { text: '取消', style: 'cancel' },
      { text: '退出登录', style: 'destructive', onPress: logout },
    ]);
  };

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  const stats: { num: string | number; label: string }[] = [
    { num: userInfo?.likeCount ?? 0, label: '获赞' },
    { num: '-', label: '互关' },
    { num: userInfo?.followCount ?? 0, label: '关注' },
    { num: userInfo?.fansCount ?? 0, label: '粉丝' },
  ];

  const entries: { label: string; icon: React.ReactNode; badge?: number; onPress: () => void }[] = [
    { label: '企业管理', icon: <EntryCompanyIcon />, onPress: todo },
    { label: '我的商机', icon: <EntryChanceIcon />, badge: 2, onPress: todo },
    { label: '业务员工作台', icon: <EntryWorkbenchIcon />, badge: 2, onPress: todo },
    { label: '认证中心', icon: <EntryCertIcon />, onPress: todo },
    { label: '浏览记录', icon: <EntryHistoryIcon />, onPress: todo },
  ];

  const regionText = [wqUser?.province, wqUser?.city].filter(Boolean).join('·');

  const renderTabContent = () => {
    const state = tabData[activeTab];
    if (!state.loaded && state.loading) {
      return <View style={styles.contentPad} />;
    }
    if (state.loaded && state.list.length === 0 && !(activeTab === 'post' && draftCount > 0)) {
      return <EmptyState variant="content" title="暂无内容" style={styles.emptyBox} />;
    }
    if (activeTab === 'comment') {
      return (
        <View style={styles.commentList}>
          {(state.list as CommentCardData[]).map(item => (
            <CommentCard key={item.id} item={item} onPress={() => navigation.navigate('bbsDetail', { id: String(item.bbsId) })} />
          ))}
          <ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />
        </View>
      );
    }
    return (
      <View style={styles.waterfallWrap}>
        {activeTab === 'post' && draftCount > 0 && (
          <TouchableOpacity activeOpacity={0.9} style={styles.draftCard} onPress={() => navigation.navigate('draftBox')}>
            <View style={styles.draftBadge}>
              <DraftIcon />
              <Text style={styles.draftBadgeText}>草稿箱 · {draftCount}</Text>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.waterfallRow}>
          {postColumns.map((col, ci) => (
            <View key={ci} style={styles.waterfallCol}>
              {col.map(item => (
                <PostCard key={item.id} item={item} onPress={() => openDetail(item)} />
              ))}
            </View>
          ))}
        </View>
        <ListFooter fetching={state.loading} isLastPage={state.page >= state.pages} listLength={state.list.length} />
      </View>
    );
  };

  return (
    <SafeView backgroundColor="#F6F7FB" disableTop={true}>
      <View
        style={{
          height: insets.top, overflow: 'hidden', width: '100%',
          zIndex: 2, backgroundColor: 'red'
        }} >
        <ExpoImage
          source={require('@/assets/my/my/header_bg.png')}
          style={{
            height: scaleSizeH(332),
            width: '100%',

          }}
        />
      </View>
      <FlatList
        data={[]}
        style={{
          flex: 1,
          backgroundColor: 'transparent'
        }}
        ListHeaderComponent={() => {
          return <View style={{ position: 'relative' }}>
            <ExpoImage
              source={require('@/assets/my/my/header_bg.png')}
              style={{
                height: scaleSizeH(332) - insets.top,
                width: '100%',
                position: 'absolute',
                top: 0
              }}
            />
            <View style={styles.headerIcons}>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={onSettings}>
                <SettingsIcon />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={todo}>
                <MessageIcon />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={todo}>
                <ServiceIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.profileRow}>
              <ExpoImage
                source={{ uri: wqUser?.avatar || 'https://i.pravatar.cc/100?img=8' }}
                style={styles.avatar}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.profileText}>
                <Text style={styles.nickname}>{wqUser?.nickname || wqUser?.username || '未登录'}</Text>
                {!!wqUser?.cpName && (
                  <View style={styles.companyRow}>
                    <Text style={styles.companyText} numberOfLines={1}>{wqUser.cpName}</Text>
                    <CompanyIcon />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.entryCards}>
              <TouchableOpacity activeOpacity={0.8} style={styles.entryCard} onPress={() => navigation.navigate('editCard', {})}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MyCardIcon />
                    <Text style={styles.entryCardTitle}>我的名片</Text>
                  </View>
                  <Text style={styles.entryCardSub}>个人名片3/5 · 企业名片</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={styles.entryCard} onPress={todo}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CardBoxIcon />
                    <Text style={styles.entryCardTitle}>名片夹</Text>
                  </View>
                  <Text style={styles.entryCardSub}>已存3张名片</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.statsRow}>
                {stats.map(s => (
                  <View key={s.label} style={styles.statItem}>
                    <Text style={styles.statNum}>{s.num}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
                <TouchableOpacity activeOpacity={0.7} style={styles.editBtn} onPress={() => navigation.navigate('editProfile')}>
                  <Text style={styles.editBtnText}>编辑主页</Text>
                </TouchableOpacity>
              </View>
              {!!wqUser?.des && <Text style={styles.signature}>{wqUser.des}</Text>}
              <View style={styles.chipsRow}>
                {!!regionText && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{regionText}</Text>
                  </View>
                )}
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{regionText}</Text>
                </View>
                {wqUser?.authRealCard && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>已实名</Text>
                  </View>
                )}
              </View>
              <View style={styles.entriesRow}>
                {entries.map(e => (
                  <TouchableOpacity key={e.label} activeOpacity={0.7} style={styles.entryItem} onPress={e.onPress}>
                    <View style={{ position: 'relative' }}>
                      {e.icon}
                      {!!e.badge && (
                        <View style={styles.entryBadge}>
                          <Text style={styles.entryBadgeText}>{e.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.entryText}>{e.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }}
        renderItem={() => <View>
          
        </View>}
      >

      </FlatList>

      {/* <ScrollView
          style={styles.flex1}
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        >
          <View onLayout={e => setHeaderH(e.nativeEvent.layout.height)}>
 
          
          </View>

          <View style={styles.tabBar}>
            {TABS.map(t => {
              const active = t.key === activeTab;
              return (
                <TouchableOpacity key={t.key} activeOpacity={0.7} style={styles.tabItem} onPress={() => setActiveTab(t.key)}>
                  {TAB_ICONS[t.key](active ? '#000000' : '#6C6C6C')}
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  {active && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {renderTabContent()}
        </ScrollView> */}

      {/* 吸顶后的顶部栏（101：昵称 + 图标） */}
      <Animated.View style={[styles.stickyBar, { opacity: stickyOpacity }]} pointerEvents="none">
        <Text style={styles.stickyName}>{wqUser?.nickname || wqUser?.username || ''}</Text>
        <View style={styles.stickyIcons}>
          <ServiceIcon color="#000000" />
          <MessageIcon color="#000000" />
          <SettingsIcon color="#000000" />
        </View>
      </Animated.View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  pageBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F6F7FB',
  },
  headerBg: {
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(70),
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(6)
  },
  headerIconBtn: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
    borderRadius: scaleSizeW(16.5),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
  },
  avatar: {
    width: scaleSizeW(80),
    height: scaleSizeW(80),
    borderRadius: scaleSizeW(40),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  profileText: {
    marginLeft: scaleSizeW(10),
    flex: 1,
  },
  nickname: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: scaleSizeH(24),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    marginTop: scaleSizeH(8),
  },
  companyText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#5CE991',
  },
  entryCards: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(24),
  },
  entryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    height: scaleSizeH(53),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: scaleSizeW(13),
  },
  entryCardTitle: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: scaleSizeW(4),
  },
  entryCardSub: {
    fontSize: setSpText(10),
    color: 'rgba(255,255,255,0.7)',
    marginTop: scaleSizeH(2),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    marginTop: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(16),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(27),
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
    lineHeight: scaleSizeH(24),
  },
  statLabel: {
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
    marginTop: scaleSizeH(2),
  },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeH(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F3F3F1',
  },
  editBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  signature: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(24),
    marginTop: scaleSizeH(10),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  chip: {
    backgroundColor: '#F3F3F1',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
  },
  chipText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
  },
  entriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  entryItem: {
    alignItems: 'center',
    gap: scaleSizeH(2),
  },
  entryText: {
    fontSize: setSpText(12),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  entryBadge: {
    position: 'absolute',
    top: -scaleSizeH(3),
    right: -scaleSizeW(8),
    height: scaleSizeH(14),
    minWidth: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(4),
    borderRadius: scaleSizeW(7),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: scaleSizeW(20),
    borderBottomRightRadius: scaleSizeW(20),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingVertical: scaleSizeH(12),
  },
  tabText: {
    fontSize: setSpText(15),
    color: '#6C6C6C',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: scaleSizeW(3),
    width: scaleSizeW(24),
    height: 2,
    borderRadius: 2,
    backgroundColor: BLUE,
  },
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(46),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stickyName: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
  },
  stickyIcons: {
    flexDirection: 'row',
    gap: scaleSizeW(20),
  },
  contentPad: {
    height: scaleSizeH(200),
  },
  emptyBox: {
    marginTop: scaleSizeH(60),
  },
  waterfallWrap: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
  },
  waterfallRow: {
    flexDirection: 'row',
    gap: scaleSizeW(4),
  },
  waterfallCol: {
    width: CARD_W,
    gap: scaleSizeH(4),
  },
  postCard: {
    width: CARD_W,
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  postImage: {
    width: CARD_W,
  },
  postBody: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(10),
  },
  postTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#333333',
    lineHeight: scaleSizeH(21),
    minHeight: scaleSizeH(42),
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(8),
  },
  postDate: {
    fontSize: setSpText(12),
    color: '#616161',
  },
  postLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  draftCard: {
    width: CARD_W,
    height: scaleSizeH(146),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#E8EFFF',
    marginBottom: scaleSizeH(4),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: scaleSizeW(10),
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(4),
  },
  draftBadgeText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#000000',
  },
  commentList: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
    gap: scaleSizeH(10),
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(12),
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    borderRadius: scaleSizeW(17),
    backgroundColor: '#F5F5F5',
  },
  commentHeadText: {
    flex: 1,
    marginLeft: scaleSizeW(8),
  },
  commentName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  commentCompany: {
    fontSize: setSpText(11),
    color: '#6C6C6C',
    marginTop: scaleSizeH(2),
  },
  commentTime: {
    fontSize: setSpText(12),
    color: '#999999',
  },
  commentContent: {
    fontSize: setSpText(14),
    color: '#333333',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(8),
  },
  commentOrigin: {
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(6),
    marginTop: scaleSizeH(8),
  },
  commentOriginText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
  },
});
