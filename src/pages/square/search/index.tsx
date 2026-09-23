import React, { useCallback, useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { NavBackButton } from '@/components/NavHeader';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { storageUtils } from '@/utils/storage';
import RegionFilterPanel from './RegionFilterPanel';
import TreeFilterPanel, { type TreeFilterResult } from './TreeFilterPanel';

const BLUE = '#2962D4';
const HISTORY_KEY = 'square_search_history';
const HISTORY_LIMIT = 10;
const HOT_WORDS = ['设备集成', '工业连接器', '智能制造', '数控机床'];

type PanelState = { type: 'region' } | { type: 'tree'; tab: number } | null;

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

export default function SearchPage() {
  const navigation = useNavigation();
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
  const [treeValue, setTreeValue] = useState<TreeFilterResult>({});
  const [filterRowH, setFilterRowH] = useState(0);

  const persistHistory = useCallback((list: string[]) => {
    setHistory(list);
    storageUtils.setObject(HISTORY_KEY, list);
  }, []);

  // 无搜索结果页，先记录历史并收起键盘
  const doSearch = useCallback(
    (word: string) => {
      const kw = word.trim();
      if (!kw) return;
      persistHistory([kw, ...history.filter(h => h !== kw)].slice(0, HISTORY_LIMIT));
      setKeyword(kw);
      setSearched(true);
      setFilterVisible(true);
      Keyboard.dismiss();
    },
    [history, persistHistory],
  );

  const removeHistory = useCallback(
    (word: string) => persistHistory(history.filter(h => h !== word)),
    [history, persistHistory],
  );

  const togglePanel = useCallback((next: PanelState) => {
    Keyboard.dismiss();
    setPanel(prev => (JSON.stringify(prev) === JSON.stringify(next) ? null : next));
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

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {searched ? (
            <EmptyState variant="search" title="暂无搜索结果" style={styles.resultEmpty} />
          ) : (
            <>
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
            </>
          )}
        </ScrollView>

        {panel && (
          <View style={[styles.panelOverlay, { top: filterRowH }]}>
            <Pressable style={styles.panelBackdrop} onPress={() => setPanel(null)} />
            {panel.type === 'region' ? (
              <RegionFilterPanel
                onClose={() => setPanel(null)}
                onConfirm={label => setRegionLabel(label)}
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
    opacity: 0.5,
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
    color: '#6C6C6C',
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
    color: '#6C6C6C',
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
    color: '#6C6C6C',
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
});
