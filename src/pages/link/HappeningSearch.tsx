import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { NavBackButton } from '@/components/NavHeader';
import { API } from '@/api';
import type { LinkOpportunityItem } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { formatBasis } from './linkFormat';
import { ChevronRightIcon, DiamondIcon, FeedRemoveIcon, SearchIcon } from './icons';

const PRIMARY = '#2962D4';
const PURPLE = '#7B5BD6';
const TEXT_SUB = '#6C6C6C';
const PAGE_SIZE = 10;
const MAX_KEYWORD = 30;
/** 搜索历史最多保留条数（对齐原型） */
const MAX_HISTORY = 10;

interface HappeningItem {
  id: string;
  opportunityId: number;
  title: string;
  desc: string;
  evidence: string;
  stage: string;
}

/** 接口 → 卡片模型（与产业正在发生页同口径） */
function toHappeningItem(item: LinkOpportunityItem): HappeningItem {
  const opp = item.opportunity ?? ({} as LinkOpportunityItem['opportunity']);
  return {
    id: String(opp.id),
    opportunityId: opp.id,
    title: opp.title || '未命名商机',
    desc: opp.aiAnalysis || [opp.region, opp.scale].filter(Boolean).join(' · ') || 'AI 正在解读该商机',
    evidence: formatBasis((item.basisList ?? []).map(b => b.label)),
    stage: item.stage || 'AI研判',
  };
}

/**
 * 46.搜索-筛选 / 搜索结果（figma 分组10）：产业正在发生的合作机会搜索。
 * 仅关键词查询（≤30字），筛选项（地区/行业/状态/类型/时间）本期不做；
 * 搜索前展示搜索历史，搜索后展示结果列表 + 「平台帮你继续找」。
 */
export default function HappeningSearch({ route, navigation }: Props) {
  const presetKeyword = route.params?.keyword ?? '';
  const [keyword, setKeyword] = useState(presetKeyword);
  /** 已生效的搜索词（点搜索/提交后才更新） */
  const [activeKeyword, setActiveKeyword] = useState('');
  const [list, setList] = useState<HappeningItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const loadingRef = useRef(false);
  const activeKeywordRef = useRef('');
  const inputRef = useRef<TextInput>(null);

  const fetchList = useCallback(async (pageNum: number, append: boolean) => {
    const kw = activeKeywordRef.current.trim();
    if (loadingRef.current || !kw) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await API.aiDiscovery.happening({ keyword: kw, pageNum, pageSize: PAGE_SIZE });
      const items = (res.data.list ?? []).map(toHappeningItem);
      setList(prev => (append ? [...prev, ...items] : items));
      setPage(res.data.pageNum || pageNum);
      setPages(Math.max(res.data.pages || 1, 1));
    } catch {
      // 拦截器已提示错误
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const doSearch = useCallback(
    (kw?: string) => {
      const text = (kw ?? keyword).trim().slice(0, MAX_KEYWORD);
      if (!text) return;
      Keyboard.dismiss();
      setKeyword(text);
      setActiveKeyword(text);
      activeKeywordRef.current = text;
      setHistory(prev => [text, ...prev.filter(h => h !== text)].slice(0, MAX_HISTORY));
      fetchList(1, false);
    },
    [keyword, fetchList],
  );

  // 带关键词进入（如从外部跳转）时直接搜索
  useEffect(() => {
    if (presetKeyword.trim()) doSearch(presetKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) fetchList(page + 1, true);
  }, [fetchList, page, pages]);

  const renderCard = ({ item }: { item: HappeningItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <DiamondIcon size={11.5} />
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <Text style={styles.cardDesc}>{item.desc}</Text>
      <View style={styles.tagRow}>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{item.stage}</Text>
        </View>
        <View style={styles.evidencePill}>
          <Text style={styles.evidenceText} numberOfLines={1}>{item.evidence}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.detailRow}
        onPress={() => navigation.navigate('opportunityDetail', { opportunityId: item.opportunityId })}
      >
        <Text style={styles.detailText}>查看详情</Text>
        <ChevronRightIcon size={10} />
      </TouchableOpacity>
    </View>
  );

  const showHistory = !activeKeyword;

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      {/* 头部：返回 + 搜索框 + 搜索按钮（对齐原型 search-toolbar） */}
      <View style={styles.header}>
        <NavBackButton onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <SearchIcon size={16} color="#8490A2" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="搜索合作机会"
            placeholderTextColor="#8490A2"
            value={keyword}
            onChangeText={setKeyword}
            maxLength={MAX_KEYWORD}
            returnKeyType="search"
            autoFocus={!presetKeyword}
            onSubmitEditing={() => doSearch()}
          />
          {!!keyword && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.clearBtn}
              onPress={() => {
                setKeyword('');
                setActiveKeyword('');
                activeKeywordRef.current = '';
                setList([]);
                inputRef.current?.focus();
              }}
            >
              <FeedRemoveIcon size={10} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => doSearch()}>
          <Text style={styles.searchSubmit}>搜索</Text>
        </TouchableOpacity>
      </View>

      {showHistory ? (
        /* 搜索历史（对齐原型 history-panel） */
        <View style={styles.historyPanel}>
          <View style={styles.historyHead}>
            <Text style={styles.historyTitle}>搜索历史</Text>
            {history.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setHistory([])}>
                <Text style={styles.historyClear}>清空</Text>
              </TouchableOpacity>
            )}
          </View>
          {history.length > 0 ? (
            <View style={styles.historyTags}>
              {history.map(h => (
                <TouchableOpacity
                  key={h}
                  activeOpacity={0.85}
                  style={styles.historyTag}
                  onPress={() => doSearch(h)}
                >
                  <Text style={styles.historyTagText} numberOfLines={1}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.historyEmpty}>暂无搜索历史</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.listBg}
          contentContainerStyle={styles.listContent}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loadingPad} size="small" color={PURPLE} />
            ) : (
              <View>
                <EmptyState variant="search" style={styles.emptyBox} />
                {/* 平台帮你继续找（对齐原型 platform-help）：无结果时引导发布信号 / 申请协助 */}
                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>还没找到完全匹配的合作方？</Text>
                  <Text style={styles.helpSub}>发布信号，平台持续为您匹配相关企业</Text>
                  <View style={styles.helpActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.helpPrimary}
                      onPress={() => navigation.navigate('createCooperationSignal', {})}
                    >
                      <Text style={styles.helpPrimaryText}>发布信号</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.helpLink}
                      onPress={() => navigation.navigate('platformAssist', {})}
                    >
                      <Text style={styles.helpLinkText}>申请平台协助</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )
          }
          ListFooterComponent={
            list.length > 0 ? (
              <ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />
            ) : null
          }
        />
      )}
    </SafeView>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'happeningSearch'>;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(8),
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(7),
    height: scaleSizeH(34),
    borderRadius: scaleSizeW(18),
    backgroundColor: '#F3F5F8',
    paddingLeft: scaleSizeW(10),
    paddingRight: scaleSizeW(8),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(13),
    color: '#17243A',
  },
  clearBtn: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    backgroundColor: '#C5CCD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSubmit: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: '#17243A',
  },
  historyPanel: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(22),
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(14),
  },
  historyTitle: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#999999',
  },
  historyClear: {
    fontSize: setSpText(12),
    color: '#999999',
  },
  historyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(8),
  },
  historyTag: {
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F3F5F8',
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    maxWidth: scaleSizeW(200),
  },
  historyTagText: {
    fontSize: setSpText(13),
    color: '#17243A',
  },
  historyEmpty: {
    paddingVertical: scaleSizeH(36),
    fontSize: setSpText(13),
    color: '#98A2B1',
    textAlign: 'center',
  },
  listBg: {
    backgroundColor: '#F3F6FB',
  },
  listContent: {
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(24),
    flexGrow: 1,
  },
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(60),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(18),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  cardTitle: {
    flex: 1,
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  cardDesc: {
    marginTop: scaleSizeH(14),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginTop: scaleSizeH(11),
  },
  tagPill: {
    borderRadius: scaleSizeW(10),
    backgroundColor: '#EFE9FF',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: PURPLE,
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
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: scaleSizeH(20),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeH(11),
  },
  detailText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  helpCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(16),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(18),
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
  },
  helpSub: {
    marginTop: scaleSizeH(6),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  helpActions: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(16),
  },
  helpPrimary: {
    height: scaleSizeH(38),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    paddingHorizontal: scaleSizeW(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpPrimaryText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  helpLink: {
    height: scaleSizeH(38),
    borderRadius: scaleSizeW(90),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: scaleSizeW(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLinkText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
});
