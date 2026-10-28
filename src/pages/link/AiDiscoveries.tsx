import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronLeftIcon, ChevronRightIcon, DiamondIcon, FeedRemoveIcon, SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';
const PAGE_SIZE = 5;

type Tone = 'express' | 'ai';

interface DiscoveryItem {
  id: string;
  title: string;
  tone: Tone;
  /** 弱化展示（灰色标题/图标） */
  dim?: boolean;
  desc: string;
  evidence: string;
  found: number;
}

/** 静态 mock 模板（接口待联调） */
const BASE_ITEMS: Omit<DiscoveryItem, 'id' | 'found'>[] = [
  {
    title: '华东化工客户吨袋集采对接',
    tone: 'ai',
    desc: '企业画像显示具备吨袋产能与稳定交付能力，适合对接区域集采需求。',
    evidence: '依据：企业信息 · 吨袋包装制造 等3条依据',
  },
  {
    title: '包装产线节拍优化服务合作',
    tone: 'express',
    desc: '画像中的产线规模与交付节奏，适合引入节拍评估与联线优化服务',
    evidence: '依据：企业信息 · 产线规模、交付节奏 等3条依据',
  },
  {
    title: '寻找可靠的 MES / 数采方案服务商',
    tone: 'express',
    dim: true,
    desc: '对接可落地的 MES / 数采方案服务商。',
    evidence: '来源：企业动态 · 采购了一批新的自动化设备',
  },
];

const MOCK_LIST: DiscoveryItem[] = Array.from({ length: 12 }, (_, index) => ({
  ...BASE_ITEMS[index % BASE_ITEMS.length],
  id: String(index + 1),
  found: 8 + (index % 4) * 3,
}));

type Filter = 'all' | Tone;

/** 5.AI发现-方向推荐（figma 53:911）：固定头部 + 固定筛选 pill + 方向卡片分页列表 */
export default function AiDiscoveries() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState('');
  /** 已提交生效的关键词（点键盘「搜索」后才生效） */
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [list, setList] = useState<DiscoveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);
  const listRef = useRef<FlatList<DiscoveryItem>>(null);
  const keywordRef = useRef('');

  const counts = useMemo(
    () => ({
      all: MOCK_LIST.length,
      express: MOCK_LIST.filter(i => i.tone === 'express').length,
      ai: MOCK_LIST.filter(i => i.tone === 'ai').length,
    }),
    [],
  );

  /** 静态 mock 分页（接口待联调：替换为真实请求，入参 filter/keyword/pageNum） */
  const fetchList = useCallback(
    async (filterKey: Filter, pageNum: number, append: boolean, isRefresh = false, kw = '') => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      keywordRef.current = kw;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const source = MOCK_LIST.filter(item => {
          if (filterKey !== 'all' && item.tone !== filterKey) return false;
          if (!kw) return true;
          return `${item.title}${item.desc}${item.evidence}`.toLowerCase().includes(kw);
        });
        const arr = source.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
        setList(prev => (append ? [...prev, ...arr] : arr));
        setPage(pageNum);
        setPages(Math.max(Math.ceil(source.length / PAGE_SIZE), 1));
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoaded(true);
      }
    },
    [],
  );

  /** 筛选变化 / 清空关键词：回到第一页 */
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchList(filter, 1, false, false, appliedKeyword);
  }, [filter, appliedKeyword, fetchList]);

  /** 提交搜索：仅在用户点键盘「搜索」键时请求 */
  const doSearch = useCallback(() => {
    const q = keyword.trim().toLowerCase();
    Keyboard.dismiss();
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    if (q === appliedKeyword) {
      fetchList(filter, 1, false, false, q);
      return;
    }
    setAppliedKeyword(q);
  }, [keyword, appliedKeyword, filter, fetchList]);

  /** 清空输入：立即还原为未搜索状态 */
  const clearKeyword = useCallback(() => {
    setKeyword('');
    setAppliedKeyword('');
  }, []);

  const onRefresh = useCallback(
    () => fetchList(filter, 1, false, true, keywordRef.current),
    [filter, fetchList],
  );

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) {
      fetchList(filter, page + 1, true, false, keywordRef.current);
    }
  }, [filter, fetchList, page, pages]);

  /** 头部搜索按钮：展开/收起搜索框（收起时清空关键词并还原列表） */
  const toggleSearch = useCallback(() => {
    if (searching) {
      setSearching(false);
      clearKeyword();
      Keyboard.dismiss();
      return;
    }
    setSearching(true);
  }, [searching, clearKeyword]);

  const filters: { key: Filter; label: string; dot?: string }[] = [
    { key: 'all', label: `全部 ${counts.all}` },
    { key: 'express', label: `明确表达 ${counts.express}`, dot: GREEN },
    { key: 'ai', label: `AI研判 ${counts.ai}`, dot: PURPLE },
  ];

  return (
    <SafeView backgroundColor="#F6F7FB">
      {/* 固定头部 + 筛选（不跟随列表滚动） */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.navbar}>
          <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={18} />
          </TouchableOpacity>
          <View style={styles.navTitleRow}>
            <ExpoImage
              source={require('@/assets/link/ai-mascot-small.png')}
              style={styles.navMascot}
              contentFit="cover"
            />
            <Text style={styles.navTitle}>方向推荐</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.glassBtn}
            onPress={toggleSearch}
            accessibilityRole="button"
            accessibilityLabel={searching ? '关闭搜索' : '搜索方向'}
          >
            <SearchIcon />
          </TouchableOpacity>
        </View>

        {/* 搜索框（figma 34.查找聊天记录：白色胶囊输入框 + 内置清除按钮） */}
        {searching && (
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <SearchIcon size={16} color="#1A1A1A" />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索方向标题、依据…"
                placeholderTextColor="#AFB1BB"
                value={keyword}
                onChangeText={setKeyword}
                autoFocus
                returnKeyType="search"
                selectionColor={PRIMARY}
                onSubmitEditing={doSearch}
              />
              {keyword.length > 0 && (
                <View style={styles.searchActions}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.searchClear}
                    onPress={clearKeyword}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="清空搜索"
                  >
                    <FeedRemoveIcon size={8} color="#999999" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.searchSubmit}
                    onPress={doSearch}
                    accessibilityRole="button"
                    accessibilityLabel="搜索"
                  >
                    <Text style={styles.searchSubmitText}>搜索</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.filterRow}>
          {filters.map(item => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillIdle]}
                onPress={() => setFilter(item.key)}
              >
                {!!item.dot && <View style={[styles.filterDot, { backgroundColor: item.dot }]} />}
                <Text style={active ? styles.filterTextActive : styles.filterTextIdle}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={list}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, list.length === 0 && styles.contentEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              variant={appliedKeyword ? 'search' : 'content'}
              title={appliedKeyword ? '暂无搜索结果' : '暂无方向推荐'}
              style={styles.emptyBox}
            />
          ) : null
        }
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => navigation.navigate('directionDetail')}
          >
            <View style={styles.cardTitleRow}>
              <DiamondIcon size={11.5} color={item.dim ? '#B9BDCF' : PRIMARY} />
              <Text style={[styles.cardTitle, item.dim && styles.cardTitleDim]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.cardDesc}>{item.desc}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.tagPill, item.tone === 'ai' ? styles.tagPillAi : styles.tagPillExpress]}>
                <Text style={item.tone === 'ai' ? styles.tagTextAi : styles.tagTextExpress}>
                  {item.tone === 'ai' ? 'AI研判' : '明确表达'}
                </Text>
              </View>
              <View style={styles.evidencePill}>
                <Text style={styles.evidenceText} numberOfLines={1}>{item.evidence}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.foundRow}>
              <Text style={styles.foundText}>
                已发现 <Text style={styles.foundNum}>{item.found}家</Text> 可能相关企业
              </Text>
              <ChevronRightIcon size={10} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F6F7FB',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(10),
  },
  glassBtn: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  navMascot: {
    width: scaleSizeW(30),
    height: scaleSizeW(30),
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    paddingBottom: scaleSizeH(30),
  },
  contentEmpty: {
    flexGrow: 1,
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
  },
  searchRow: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(12),
  },
  searchField: {
    height: scaleSizeH(44),
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
    paddingRight: scaleSizeW(6),
  },
  searchClear: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#E9EBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSubmit: {
    paddingHorizontal: scaleSizeW(4),
    paddingVertical: scaleSizeH(6),
  },
  searchSubmitText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(12),
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  filterPillActive: {
    backgroundColor: '#000000',
  },
  filterPillIdle: {
    backgroundColor: '#FFFFFF',
  },
  filterDot: {
    width: scaleSizeW(5),
    height: scaleSizeW(5),
    borderRadius: scaleSizeW(2.5),
  },
  filterTextActive: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterTextIdle: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(15),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  cardTitleDim: {
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(12),
  },
  cardDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(13),
  },
  tagPill: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  tagPillAi: {
    backgroundColor: '#EFE9FF',
  },
  tagPillExpress: {
    backgroundColor: '#E7FFF2',
  },
  tagTextAi: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: PURPLE,
  },
  tagTextExpress: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: GREEN,
  },
  evidencePill: {
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F6F7FB',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  evidenceText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  foundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeH(13),
  },
  foundText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: TEXT_SUB,
  },
  foundNum: {
    color: '#000000',
  },
});
