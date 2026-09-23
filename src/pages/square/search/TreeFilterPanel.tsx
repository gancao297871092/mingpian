import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { TREE_TABS, type TreeNode } from './filterData';

const BLUE = '#2962D4';

export interface TreeFilterResult {
  industry?: string;
  honor?: string;
  category?: string;
}

export interface TreeFilterPanelProps {
  initialTab: number;
  value: TreeFilterResult;
  onClose: () => void;
  onConfirm: (result: TreeFilterResult) => void;
}

export default function TreeFilterPanel({ initialTab, value, onClose, onConfirm }: TreeFilterPanelProps) {
  const [active, setActive] = useState(initialTab);
  const [paths, setPaths] = useState<Record<number, TreeNode[]>>({});

  const tab = TREE_TABS[active];
  const selectedName = value[tab.key];
  const path = paths[active] ?? [];

  // 各级列数据：第 0 列为根列表，其后为路径节点的 children
  const columns: TreeNode[][] = [tab.data];
  path.forEach(node => {
    if (node.children?.length) columns.push(node.children);
  });

  const onPick = (node: TreeNode, level: number) => {
    const next = [...path.slice(0, level), node];
    setPaths(prev => ({ ...prev, [active]: next }));
    if (!node.children?.length) {
      // 叶子节点：选中该项（再次点击取消）
      const isSame = selectedName === node.name;
      onConfirm({ ...value, [tab.key]: isSame ? undefined : node.name });
    }
  };

  const onReset = () => {
    setPaths({});
    onConfirm({ ...value, [tab.key]: undefined });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.body}>
        <View style={styles.tabColumn}>
          {TREE_TABS.map((t, i) => {
            const isActive = i === active;
            const hasValue = !!value[t.key];
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.7}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActive(i)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                  {hasValue ? value[t.key] : t.label}
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
        <TouchableOpacity activeOpacity={0.7} style={[styles.footerBtn, styles.okBtn]} onPress={onClose}>
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
