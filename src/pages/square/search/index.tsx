import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import PermissionButton from '@/components/PermissionButton';
import WaterfallCard, { type WaterfallItem } from '@/components/WaterfallCard';
import { NavBackButton } from '@/components/NavHeader';
import { API } from '@/api';
import { setFollow } from '@/store/follow';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { storageUtils } from '@/utils/storage';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon } from '@/pages/my/myIcons';
import RegionFilterPanel from './RegionFilterPanel';
import TreeFilterPanel, { type TreeFilterResult } from './TreeFilterPanel';

const BLUE = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const HISTORY_KEY = 'square_search_history';
const HISTORY_LIMIT = 10;
const HOT_WORDS = ['设备集成', '工业连接器', '智能制造', '数控机床'];
const PAGE_SIZE = 10;

type PanelState = { type: 'region' } | { type: 'tree'; tab: number } | null;

type SearchType = 'all' | 'company' | 'bbs' | 'user';

const CATEGORY_TYPE: Record<string, SearchType> = {
  综合: 'all',
  企业: 'company',
  动态: 'bbs',
  用户: 'user',
};

interface CompanyItem {
  id: string;
  logo: string;
  name: string;
  verified: boolean;
  honors: string[];
  browse: number;
  des: string;
  address: string;
  km: number | null;
  keUserId?: number;
}

interface UserItem {
  id: string;
  avatar: string;
  name: string;
  official: boolean;
  fansCount: number;
  isFollow: boolean;
}

function ChevronDown({ up }: { up?: boolean }) {
  return (
    <Svg
      width={scaleSizeW(10)}
      height={scaleSizeW(6)}
      viewBox="0 0 10 6"
      style={up ? styles.chevronUp : undefined}
    >
      <Path d="M1 1L5 5L9 1" stroke="#6C6C6C" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={scaleSizeW(10)} height={scaleSizeW(10)} viewBox="0 0 10 10">
      <Path d="M1 1L9 9M9 1L1 9" stroke="#999999" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ color }: { color: string }) {
  return (
    <Svg width={scaleSizeW(14)} height={scaleSizeW(14)} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1.75 2.625H12.25L8.75 6.70833V11.0833L5.25 12.25V6.70833L1.75 2.625Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={scaleSizeW(11)} height={scaleSizeW(11)} viewBox="0 0 11 11" fill="none">
      <Path
        d="M5.5 2.2C3.3 2.2 1.4 3.6 0.6 5.5c0.8 1.9 2.7 3.3 4.9 3.3s4.1-1.4 4.9-3.3c-0.8-1.9-2.7-3.3-4.9-3.3zm0 5.5a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm0-3.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
        fill="#999999"
      />
    </Svg>
  );
}

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

/** 后端返回可能是数组或 PageInfo（{list, pages}），统一取出 */
function pickList(data: any, key: string): { list: any[]; pages: number } {
  const v = data?.[key];
  if (Array.isArray(v)) return { list: v, pages: 1 };
  if (Array.isArray(v?.list)) return { list: v.list, pages: v.pages ?? 1 };
  if (Array.isArray(data?.list)) return { list: data.list, pages: data.pages ?? 1 };
  return { list: [], pages: 1 };
}

function mapCompany(c: any): CompanyItem {
  let honors: string[] = [];
  try {
    const h = JSON.parse(c.cpHonor || '{}');
    honors = (h.records ?? []).map((r: any) => r?.honorName).filter(Boolean);
  } catch {}
  return {
    id: String(c.cpId ?? Math.random()),
    logo: c.cpLogo || '',
    name: c.cpName || '',
    verified: c.cpSource === 'AUTH_SUCCESS',
    honors,
    browse: Number(c.cpBrowse ?? 0),
    des: String(c.cpDesTxt || c.cpDes || '').replace(/<[^>]*>/g, ''),
    address: c.cpAddress || '',
    km: typeof c.km === 'number' ? c.km : null,
    keUserId: c.keUserId,
  };
}

function mapUser(u: any): UserItem {
  return {
    id: String(u.userId ?? u.id ?? Math.random()),
    avatar: u.avatar || '',
    name: u.nickname || u.username || '',
    official: Number(u.userType) === 1,
    fansCount: Number(u.fansCount ?? 0),
    isFollow: Number(u.currentUserIsFollow ?? u.isFollow ?? 0) === 1,
  };
}

function mapBbs(bbs: any): WaterfallItem {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? (bbs.posterUrl || bbs.poster || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || ''))
    : (media?.mdUrl || bbs.posterUrl || bbs.poster || bbs.coverUrl || '');
  const w = media?.width ? parseInt(media.width, 10) : 194;
  const h = media?.height ? parseInt(media.height, 10) : 237;
  return {
    id: String(bbs.bbsId ?? bbs.id ?? Math.random()),
    imageUrl,
    imageHeight: Math.min(Math.round((194 * h) / w), 320),
    title: bbs.title || (bbs.content || '').replace(/<[^>]*>/g, '').slice(0, 50),
    avatarUrl: bbs.avatar || bbs.userInfoVo?.avatar || '',
    userName: bbs.nickname || bbs.username || bbs.userInfoVo?.nickname || bbs.userInfoVo?.username || '',
    companyName: bbs.cpName || bbs.userInfoVo?.cpName || '',
    likeCount: bbs.countLike || 0,
    isLiked: Number(bbs.userIsZan) === 1,
    hasVideo: isVideo,
    raw: bbs,
  };
}

function CompanySeparator() {
  return <View style={styles.cpDivider} />;
}

function UserSeparator() {
  return <View style={styles.userGap} />;
}

export default function SearchPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  // 是否已执行搜索：搜索前筛选置灰、展示历史/热门；搜索后展示结果区与筛选下拉
  const [searched, setSearched] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [history, setHistory] = useState<string[]>(
    () => storageUtils.getObject<string[]>(HISTORY_KEY) ?? [],
  );
  const [editing, setEditing] = useState(false);
  const [panel, setPanel] = useState<PanelState>(null);
  const [regionLabel, setRegionLabel] = useState('地区');
  const [regionNames, setRegionNames] = useState<string[]>([]);
  const [regionCodes, setRegionCodes] = useState<string[]>([]);
  const [treeValue, setTreeValue] = useState<TreeFilterResult>({});
  const [filterRowH, setFilterRowH] = useState(0);

  const searchType: SearchType = CATEGORY_TYPE[treeValue.category ?? '综合'] ?? 'all';
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [bbsItems, setBbsItems] = useState<WaterfallItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const keywordRef = useRef('');
  const loadingRef = useRef(false);

  const persistHistory = useCallback((list: string[]) => {
    setHistory(list);
    storageUtils.setObject(HISTORY_KEY, list);
  }, []);

  const runSearch = useCallback(
    async (pageNum: number) => {
      const kw = keywordRef.current;
      if (!kw || loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await API.square.search({
          keyword: kw,
          searchType,
          industry: treeValue.industry,
          honors: treeValue.honor,
          cityStr: regionNames.length ? regionNames.join(',') : undefined,
          pageNum,
          pageSize: PAGE_SIZE,
        });
        const d = res.data ?? {};
        const cpPick = pickList(d, 'cpList');
        const bbsPick = pickList(d, 'bbsList');
        const userPick = pickList(d, 'userList');
        setPageInfo({ page: pageNum, pages: Math.max(cpPick.pages, bbsPick.pages, userPick.pages, 1) });
        if (searchType === 'all' || searchType === 'company') {
          const list = cpPick.list.map(mapCompany);
          setCompanies(prev => (pageNum === 1 ? list : [...prev, ...list]));
        }
        if (searchType === 'all' || searchType === 'bbs') {
          const list = bbsPick.list.map(mapBbs);
          setBbsItems(prev => (pageNum === 1 ? list : [...prev, ...list]));
        }
        if (searchType === 'user') {
          const list = userPick.list.map(mapUser);
          setUsers(prev => (pageNum === 1 ? list : [...prev, ...list]));
        }
        setLoaded(true);
      } catch {
        setLoaded(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [searchType, treeValue.industry, treeValue.honor, regionNames],
  );

  // 已搜索状态下：分类/筛选变更自动重新搜索
  useEffect(() => {
    if (searched) runSearch(1);
  }, [searched, runSearch]);

  // 记录历史并执行搜索（与小程序一致：关键词去重后插到最新）
  const doSearch = useCallback(
    (word: string) => {
      const kw = word.trim();
      if (!kw) return;
      persistHistory([kw, ...history.filter(h => h !== kw)].slice(0, HISTORY_LIMIT));
      keywordRef.current = kw;
      setKeyword(kw);
      setFilterVisible(true);
      Keyboard.dismiss();
      // 首次搜索由 searched 置位触发 effect；再次搜索直接请求
      if (searched) runSearch(1);
      else setSearched(true);
    },
    [history, persistHistory, searched, runSearch],
  );

  const onLoadMore = useCallback(() => {
    if (searchType === 'all') return;
    if (!loading && loaded && pageInfo.page < pageInfo.pages) runSearch(pageInfo.page + 1);
  }, [searchType, loading, loaded, pageInfo, runSearch]);

  const removeHistory = useCallback(
    (word: string) => persistHistory(history.filter(h => h !== word)),
    [history, persistHistory],
  );

  const togglePanel = useCallback((next: PanelState) => {
    Keyboard.dismiss();
    setPanel(prev => (JSON.stringify(prev) === JSON.stringify(next) ? null : next));
  }, []);

  // 动态点赞：乐观更新，失败回滚（对齐广场首页）
  const onToggleBbsLike = useCallback((id: string) => {
    let next = false;
    let likeCount = 0;
    setBbsItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        next = !item.isLiked;
        likeCount = item.likeCount + (next ? 1 : -1);
        return { ...item, isLiked: next, likeCount };
      }),
    );
    API.bbs
      .like({ bbsId: Number(id), status: next ? 1 : 0 })
      .then(() => useBbsInteractionStore.getState().setLike(id, { isLiked: next, likeCount }))
      .catch(() => {
        setBbsItems(prev =>
          prev.map(item => (item.id === id ? { ...item, isLiked: !next, likeCount: item.likeCount + (next ? -1 : 1) } : item)),
        );
      });
  }, []);

  // 用户关注/取关（对齐小程序 user.vue：/user/follow/operate 成功后本地切换）
  const onToggleFollowUser = useCallback((item: UserItem) => {
    const next = !item.isFollow;
    API.user
      .followOperate({ targetUserId: Number(item.id), isFollow: next ? 1 : 0 })
      .then(() => {
        setFollow(Number(item.id), next);
        setUsers(prev => prev.map(u => (u.id === item.id ? { ...u, isFollow: next } : u)));
      })
      .catch(() => {});
  }, []);

  const filterTabs: { key: string; label: string; active: boolean; onPress: () => void }[] = [
    {
      key: 'region',
      label: regionLabel,
      active: panel?.type === 'region',
      onPress: () => togglePanel({ type: 'region' }),
    },
    {
      key: 'industry',
      label: treeValue.industry ?? '行业',
      active: panel?.type === 'tree' && panel.tab === 0,
      onPress: () => togglePanel({ type: 'tree', tab: 0 }),
    },
    {
      key: 'honor',
      label: treeValue.honor ?? '荣誉',
      active: panel?.type === 'tree' && panel.tab === 1,
      onPress: () => togglePanel({ type: 'tree', tab: 1 }),
    },
    {
      key: 'category',
      label: treeValue.category ?? '综合',
      active: panel?.type === 'tree' && panel.tab === 2,
      onPress: () => togglePanel({ type: 'tree', tab: 2 }),
    },
  ];

  const renderTag = (word: string, onPress: () => void, closable = false) => (
    <TouchableOpacity key={word} activeOpacity={0.7} style={styles.tag} onPress={onPress}>
      <Text style={styles.tagText} numberOfLines={1}>
        {word}
      </Text>
      {closable && (
        <View style={styles.tagClose}>
          <CloseIcon />
        </View>
      )}
    </TouchableOpacity>
  );

  /** 综合结果底部：相关动态横滑区（查看更多 → 切到动态分类） */
  const bbsSection =
    searchType === 'all' && bbsItems.length > 0 ? (
      <View style={styles.bbsSection}>
        <View style={styles.bbsSectionHead}>
          <Text style={styles.bbsSectionTitle}>“{keyword}”相关动态</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.moreBtn}
            onPress={() => setTreeValue(prev => ({ ...prev, category: '动态' }))}
          >
            <Text style={styles.moreText}>查看更多</Text>
            <Text style={styles.moreChevron}>›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bbsRow}>
          {bbsItems.map(item => (
            <WaterfallCard
              key={item.id}
              item={item}
              onToggleLike={onToggleBbsLike}
              onPress={id => navigation.navigate('bbsDetail', { id })}
            />
          ))}
        </ScrollView>
      </View>
    ) : null;

  const renderCompanyRow = ({ item }: { item: CompanyItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.cpRow}
      onPress={() => navigation.navigate('companyPage', { id: item.id, userId: item.keUserId })}
    >
      {item.logo ? (
        <ExpoImage source={{ uri: item.logo }} style={styles.cpLogo} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cpLogo, styles.logoPlaceholder]} />
      )}
      <View style={styles.cpBody}>
        <View style={styles.cpNameRow}>
          <Text style={styles.cpName} numberOfLines={1}>{item.name}</Text>
          {item.verified && <BlueBadgeIcon size={14} />}
          <View style={styles.cpBrowseRow}>
            <EyeIcon />
            <Text style={styles.cpBrowseText}>{item.browse}</Text>
          </View>
        </View>
        {item.honors.length > 0 && (
          <View style={styles.cpChipsRow}>
            {item.honors.slice(0, 3).map(h => (
              <View key={h} style={styles.cpChip}>
                <Text style={styles.cpChipText} numberOfLines={1}>{h}</Text>
              </View>
            ))}
          </View>
        )}
        {!!item.des && <Text style={styles.cpDes} numberOfLines={2}>{item.des}</Text>}
        {(!!item.address || item.km != null) && (
          <View style={styles.cpAddrRow}>
            <Text style={styles.cpAddr} numberOfLines={1}>{item.address}</Text>
            {item.km != null && item.km >= 0 && <Text style={styles.cpKm}>{item.km.toFixed(2)}km</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderUserRow = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.userRow}
      onPress={() => navigation.navigate('userHome', { userId: Number(item.id) })}
    >
      {item.avatar ? (
        <ExpoImage source={{ uri: item.avatar }} style={styles.userAvatar} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.userAvatar, styles.logoPlaceholder]} />
      )}
      <View style={styles.userBody}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name}
          {item.official ? '（官方账号）' : ''}
        </Text>
        <Text style={styles.userFans}>粉丝 {item.fansCount}</Text>
      </View>
      <PermissionButton
        activeOpacity={0.8}
        style={[styles.followBtn, item.isFollow && styles.followBtnDone]}
        onPress={() => onToggleFollowUser(item)}
      >
        <Text style={[styles.followBtnText, item.isFollow && styles.followBtnTextDone]}>
          {item.isFollow ? '已关注' : '关注'}
        </Text>
      </PermissionButton>
    </TouchableOpacity>
  );

  const emptyResult = loaded && !loading ? (
    searchType === 'all' && bbsItems.length > 0 ? (
      bbsSection
    ) : (
      <EmptyState variant="search" title="暂无搜索结果" style={styles.resultEmpty} />
    )
  ) : null;

  const renderResult = () => {
    if (!loaded && loading) {
      return <ActivityIndicator style={styles.loading} color={BLUE} />;
    }
    if (searchType === 'bbs') {
      return (
        <FlashList
          data={bbsItems}
          keyExtractor={(item: WaterfallItem) => item.id}
          masonry
          numColumns={2}
          renderItem={({ item }: { item: WaterfallItem }) => (
            <WaterfallCard
              item={item}
              onToggleLike={onToggleBbsLike}
              onPress={id => navigation.navigate('bbsDetail', { id })}
            />
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={emptyResult}
          ListFooterComponent={
            <ListFooter fetching={loading} isLastPage={pageInfo.page >= pageInfo.pages} listLength={bbsItems.length} />
          }
          contentContainerStyle={styles.bbsListContent}
        />
      );
    }
    if (searchType === 'user') {
      return (
        <FlashList
          data={users}
          keyExtractor={(item: UserItem) => item.id}
          renderItem={renderUserRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={UserSeparator}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={emptyResult}
          ListFooterComponent={
            <ListFooter fetching={loading} isLastPage={pageInfo.page >= pageInfo.pages} listLength={users.length} />
          }
        />
      );
    }
    return (
      <FlashList
        data={companies}
        keyExtractor={(item: CompanyItem) => item.id}
        renderItem={renderCompanyRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={CompanySeparator}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={emptyResult}
        ListFooterComponent={
          searchType === 'all' ? (
            companies.length > 0 ? bbsSection : null
          ) : (
            <ListFooter fetching={loading} isLastPage={pageInfo.page >= pageInfo.pages} listLength={companies.length} />
          )
        }
      />
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/tab-icons/search-icon.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜企业、机会、经验"
            placeholderTextColor="#999999"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(keyword)}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.searchBtn} onPress={() => doSearch(keyword)}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!searched}
          style={[styles.filterBtn, !searched && styles.filterBtnDisabled]}
          onPress={() => {
            Keyboard.dismiss();
            setFilterVisible(true);
            setPanel(prev => (prev?.type === 'tree' && prev.tab === 0 ? null : { type: 'tree', tab: 0 }));
          }}
        >
          <FilterIcon color={searched ? '#000000' : '#999999'} />
          <Text style={[styles.filterBtnText, !searched && styles.filterBtnTextDisabled]}>筛选</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {searched && filterVisible && (
          <View
            style={styles.filterRow}
            onLayout={e => setFilterRowH(e.nativeEvent.layout.height)}
          >
            {filterTabs.map(t => (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.7}
                style={styles.filterTab}
                onPress={t.onPress}
              >
                <Text style={[styles.filterText, t.active && styles.filterTextActive]} numberOfLines={1}>
                  {t.label}
                </Text>
                <ChevronDown up={t.active} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searched ? (
          <View style={styles.flex1}>{renderResult()}</View>
        ) : (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>历史记录</Text>
                  {!editing ? (
                    <TouchableOpacity activeOpacity={0.7} hitSlop={6} onPress={() => setEditing(true)}>
                      <Text style={styles.sectionActionText}>编辑</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.sectionActions}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={6}
                        onPress={() => {
                          persistHistory([]);
                          setEditing(false);
                        }}
                      >
                        <Text style={styles.sectionActionText}>全部删除</Text>
                      </TouchableOpacity>
                      <Text style={styles.sectionActionText}>  |  </Text>
                      <TouchableOpacity activeOpacity={0.7} hitSlop={6} onPress={() => setEditing(false)}>
                        <Text style={styles.sectionDoneText}>完成</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={styles.tagWrap}>
                  {history.map(w =>
                    renderTag(w, () => (editing ? removeHistory(w) : doSearch(w)), editing),
                  )}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>热门搜索</Text>
              </View>
              <View style={styles.tagWrap}>{HOT_WORDS.map(w => renderTag(w, () => doSearch(w)))}</View>
            </View>
          </ScrollView>
        )}

        {panel && (
          <View style={[styles.panelOverlay, { top: filterRowH }]}>
            <Pressable style={styles.panelBackdrop} onPress={() => setPanel(null)} />
            {panel.type === 'region' ? (
              <RegionFilterPanel
                onClose={() => setPanel(null)}
                selectedCodes={regionCodes}
                onConfirm={(_label, names, codes) => {
                  // 回显对齐小程序：地区(选中数量)，未选恢复默认
                  setRegionLabel(names.length > 0 ? `地区(${names.length})` : '地区');
                  setRegionNames(names);
                  setRegionCodes(codes);
                }}
              />
            ) : (
              <TreeFilterPanel
                initialTab={panel.tab}
                value={treeValue}
                onClose={() => setPanel(null)}
                onConfirm={setTreeValue}
              />
            )}
          </View>
        )}
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(6),
    gap: scaleSizeW(10),
  },
  searchBar: {
    flex: 1,
    height: scaleSizeH(44),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(90),
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(6),
  },
  searchIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  searchInput: {
    flex: 1,
    marginLeft: scaleSizeW(7),
    padding: 0,
    fontSize: setSpText(14),
    color: '#000000',
  },
  searchBtn: {
    paddingHorizontal: scaleSizeW(13),
    paddingVertical: scaleSizeH(6),
    backgroundColor: BLUE,
    borderRadius: scaleSizeW(90),
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  filterBtnDisabled: {
    opacity: 0.8,
  },
  filterBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  filterBtnTextDisabled: {
    color: '#999999',
  },
  resultEmpty: {
    marginTop: scaleSizeH(120),
  },
  loading: {
    marginTop: scaleSizeH(80),
  },
  body: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    maxWidth: scaleSizeW(120),
  },
  filterText: {
    fontSize: setSpText(13),
    color: TEXT_SUB,
  },
  filterTextActive: {
    color: '#000000',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  section: {
    marginTop: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  sectionDoneText: {
    fontSize: setSpText(12),
    color: '#000000',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(12),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: '#F5F5F5',
    borderRadius: scaleSizeW(90),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    maxWidth: scaleSizeW(180),
  },
  tagText: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  tagClose: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  listContent: {
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(30),
  },
  bbsListContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
    paddingBottom: scaleSizeH(30),
    backgroundColor: '#F5F5F5',
  },
  cpRow: {
    flexDirection: 'row',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
    gap: scaleSizeW(12),
  },
  cpLogo: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  logoPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  cpBody: {
    flex: 1,
    gap: scaleSizeH(6),
  },
  cpNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  cpName: {
    fontSize: setSpText(15),
    color: '#000000',
    flexShrink: 1,
  },
  cpBrowseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
    marginLeft: 'auto',
  },
  cpBrowseText: {
    fontSize: setSpText(10),
    color: '#999999',
  },
  cpChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(5),
  },
  cpChip: {
    backgroundColor: '#F2F6FF',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
    paddingVertical: scaleSizeH(2),
  },
  cpChipText: {
    fontSize: setSpText(10),
    lineHeight: setSpText(14),
    color: BLUE,
  },
  cpDes: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: TEXT_SUB,
  },
  cpAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  cpAddr: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: '#999999',
  },
  cpKm: {
    fontSize: setSpText(10),
    color: '#999999',
  },
  cpDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginLeft: scaleSizeW(76),
  },
  bbsSection: {
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(10),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(14),
  },
  bbsSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
  },
  bbsSectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  moreText: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  moreChevron: {
    fontSize: setSpText(12),
    color: '#999999',
  },
  bbsRow: {
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(12),
    gap: scaleSizeW(10),
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    gap: scaleSizeW(12),
  },
  userGap: {
    height: scaleSizeH(20),
  },
  userAvatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  userBody: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  userName: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  userFans: {
    fontSize: setSpText(13),
    lineHeight: setSpText(19),
    color: TEXT_SUB,
  },
  followBtn: {
    minWidth: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(12),
  },
  followBtnDone: {
    borderColor: '#EDECEC',
  },
  followBtnText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: BLUE,
  },
  followBtnTextDone: {
    color: '#000000',
  },
});
