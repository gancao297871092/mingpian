import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CATEGORY_TREE, type TreeNode } from './filterData';

const BLUE = '#2962D4';

export interface TreeFilterResult {
  industry?: string;
  honor?: string;
  category?: string;
}

export interface TreeFilterPanelProps {
  initialTab: number;
  value: TreeFilterResult;
  /** 行业/荣誉树（页面挂载时预取传入，对齐小程序加载时机） */
  industryData: TreeNode[];
  honorData: TreeNode[];
  onClose: () => void;
  onConfirm: (result: TreeFilterResult) => void;
}

interface TabDef {
  key: 'industry' | 'honor' | 'category';
  label: string;
  data: TreeNode[];
}

function normalizeTree(list: any[]): TreeNode[] {
  return (list ?? [])
    .map(o => {
      // 后端二级节点 name 为空串、用 honorName 标识（空串 ?? 不生效，须用 || 回退）
      const name = String(o?.name || o?.honorName || '');
      return {
        name,
        children: Array.isArray(o.children) && o.children.length ? normalizeTree(o.children) : undefined,
      };
    })
    .filter(n => n.name);
}

/** 在树中反查从根到 name 的整条路径（重开弹窗回显链路用） */
function findPath(data: TreeNode[], name: string): TreeNode[] | null {
  for (const node of data) {
    if (node.name === name) return [node];
    if (node.children?.length) {
      const sub = findPath(node.children, name);
      if (sub) return [node, ...sub];
    }
  }
  return null;
}

/** 行业/荣誉树预取 hook：模块级缓存，搜索页挂载时调用一次即完成加载 */
let treesCache: { industry: TreeNode[]; honor: TreeNode[] } | null = null;
let treesPromise: Promise<{ industry: TreeNode[]; honor: TreeNode[] }> | null = null;

export function useFilterTrees() {
  const [trees, setTrees] = useState<{ industry: TreeNode[]; honor: TreeNode[] }>(
    () => treesCache ?? { industry: [], honor: [] },
  );
  useEffect(() => {
    if (treesCache) return;
    if (!treesPromise) {
      treesPromise = Promise.all([
        API.common.companyIndustry().then(res => normalizeTree(res.data ?? [])).catch(() => []),
        API.common.companyHonors().then(res => normalizeTree(res.data ?? [])).catch(() => []),
      ]).then(([industry, honor]) => {
        treesCache = { industry, honor };
        return treesCache;
      });
    }
    let mounted = true;
    treesPromise.then(t => {
      if (mounted) setTrees(t);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return trees;
}

/** 筛选树面板（交互对齐小程序 selectTree.vue）：
 *  - 叶子点击仅选中（再点取消），不立即生效
 *  - 确认一次性抛出 行业/荣誉/分类 三个值
 *  - 重置清空全部（分类恢复综合），面板不关闭
 *  - 各 tab 级联路径独立缓存，切 tab 回显 */
export default function TreeFilterPanel({ initialTab, value, industryData, honorData, onClose, onConfirm }: TreeFilterPanelProps) {
  const [active, setActive] = useState(initialTab);
  // 面板打开状态下点击其他筛选项：同步切换内部 tab
  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);
  const tabs = useMemo<TabDef[]>(
    () => [
      { key: 'industry', label: '行业', data: industryData },
      { key: 'honor', label: '荣誉', data: honorData },
      { key: 'category', label: '分类', data: CATEGORY_TREE },
    ],
    [industryData, honorData],
  );
  /** 草稿：确认前不对外生效 */
  const [draft, setDraft] = useState<TreeFilterResult>({ ...value, category: value.category ?? '综合' });
  const [paths, setPaths] = useState<Record<number, TreeNode[]>>({});

  // 数据就绪或外部值变化时：按已确认值反查整条链路回显（对齐小程序 selectedPaths 缓存语义）
  useEffect(() => {
    const dataMap: Record<number, TreeNode[]> = {
      0: industryData,
      1: honorData,
      2: CATEGORY_TREE,
    };
    const next: Record<number, TreeNode[]> = {};
    tabs.forEach((t, i) => {
      const name = value[t.key];
      if (name && dataMap[i]?.length) {
        const p = findPath(dataMap[i], name);
        if (p) next[i] = p;
      }
    });
    setPaths(prev => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryData, honorData, value]);

  const tab = tabs[active];
  const selectedName = draft[tab.key];
  const path = useMemo(() => paths[active] ?? [], [paths, active]);

  // 各级列数据：第 0 列为根列表，其后为路径节点的 children
  const columns: TreeNode[][] = useMemo(() => {
    const cols: TreeNode[][] = [tab.data];
    path.forEach(node => {
      if (node.children?.length) cols.push(node.children);
    });
    return cols;
  }, [tab.data, path]);

  const onPick = (node: TreeNode, level: number) => {
    // 对齐小程序 handleLevelClick：任意层级点击都记入草稿（确认时取最后点击的层级生效）
    const next = [...path.slice(0, level), node];
    setPaths(prev => ({ ...prev, [active]: next }));
    setDraft(prev => ({ ...prev, [tab.key]: node.name }));
  };

  // 重置：清空全部筛选（分类恢复综合），面板保持打开
  const onReset = () => {
    setPaths({});
    setDraft({ category: '综合' });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.body}>
        <View style={styles.tabColumn}>
          {tabs.map((t, i) => {
            const isActive = i === active;
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.7}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActive(i)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.columnsScroll}>
          <View style={styles.columnsRow}>
            {columns.map((list, level) => (
              <ScrollView
                key={`${tab.key}-${level}`}
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {list.map(node => {
                  const inPath = path[level]?.name === node.name;
                  const isLeafSelected = !node.children?.length && selectedName === node.name;
                  const highlight = inPath || isLeafSelected;
                  return (
                    <TouchableOpacity
                      key={node.name}
                      activeOpacity={0.7}
                      style={styles.row}
                      onPress={() => onPick(node, level)}
                    >
                      <Text style={[styles.rowText, highlight && styles.rowTextActive]} numberOfLines={1}>
                        {node.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.7} style={[styles.footerBtn, styles.resetBtn]} onPress={onReset}>
          <Text style={styles.resetText}>重置</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.footerBtn, styles.okBtn]}
          onPress={() => {
            onConfirm(draft);
            onClose();
          }}
        >
          <Text style={styles.okText}>确认</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: scaleSizeW(20),
    borderBottomRightRadius: scaleSizeW(20),
    overflow: 'hidden',
  },
  body: {
    flexDirection: 'row',
    height: scaleSizeH(280),
  },
  tabColumn: {
    width: scaleSizeW(75),
    backgroundColor: '#F6F7FB',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  tabItem: {
    height: scaleSizeH(49),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(4),
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: setSpText(13),
    color: '#6C6C6C',
  },
  tabTextActive: {
    color: BLUE,
    fontWeight: '500',
  },
  columnsScroll: {
    flex: 1,
  },
  columnsRow: {
    flexDirection: 'row',
  },
  column: {
    width: scaleSizeW(128),
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  row: {
    height: scaleSizeH(49),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  rowText: {
    fontSize: setSpText(13),
    color: '#6C6C6C',
  },
  rowTextActive: {
    color: BLUE,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerBtn: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  resetText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  okBtn: {
    backgroundColor: BLUE,
  },
  okText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
