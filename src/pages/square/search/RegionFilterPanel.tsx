import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import areaData from '@/data/area.json';

const BLUE = '#2962D4';

interface RegionNode {
  code: string;
  name: string;
  checked: 0 | 1 | 2;
  children?: RegionNode[];
}

function buildTree(): RegionNode[] {
  const wrap = (list: any[]): RegionNode[] =>
    list.map(o => ({
      code: String(o.code),
      name: o.name,
      checked: 0,
      children: o.children ? wrap(o.children) : undefined,
    }));
  return wrap(areaData as any[]);
}

function setSubtree(node: RegionNode, v: 0 | 1 | 2) {
  node.checked = v;
  node.children?.forEach(c => setSubtree(c, v));
}

function refresh(node: RegionNode): 0 | 1 | 2 {
  if (!node.children?.length) return node.checked;
  const states = node.children.map(refresh);
  node.checked = states.every(s => s === 2) ? 2 : states.every(s => s === 0) ? 0 : 1;
  return node.checked;
}

function collectNames(nodes: RegionNode[], out: string[]) {
  for (const n of nodes) {
    if (n.checked === 2) out.push(n.name);
    else if (n.checked === 1 && n.children) collectNames(n.children, out);
  }
}

function Checkbox({ state }: { state: 0 | 1 | 2 }) {
  return (
    <View style={[styles.checkbox, state !== 0 && styles.checkboxActive]}>
      {state === 2 && <View style={styles.checkboxInner} />}
      {state === 1 && <View style={[styles.checkboxInner, styles.checkboxInnerHalf]} />}
    </View>
  );
}

export interface RegionFilterPanelProps {
  onClose: () => void;
  onConfirm: (label: string, names: string[]) => void;
}

export default function RegionFilterPanel({ onClose, onConfirm }: RegionFilterPanelProps) {
  const [options] = useState<RegionNode[]>(buildTree);
  const [path, setPath] = useState<string[]>(() => {
    const p = options[0];
    return p ? [p.code, p.children?.[0]?.code ?? ''] : [];
  });
  const [, forceUpdate] = useState(0);

  const provinces = options;
  const cities = useMemo(
    () => provinces.find(p => p.code === path[0])?.children ?? [],
    [provinces, path],
  );
  const districts = useMemo(
    () => cities.find(c => c.code === path[1])?.children ?? [],
    [cities, path],
  );

  const pickLevel = (item: RegionNode, level: 0 | 1) => {
    if (level === 0) setPath([item.code, item.children?.[0]?.code ?? '']);
    else setPath([path[0], item.code]);
  };

  const toggleCheck = (item: RegionNode) => {
    setSubtree(item, item.checked === 2 ? 0 : 2);
    options.forEach(refresh);
    forceUpdate(v => v + 1);
  };

  const onReset = () => {
    options.forEach(o => setSubtree(o, 0));
    forceUpdate(v => v + 1);
  };

  const onOk = () => {
    const names: string[] = [];
    collectNames(options, names);
    const label = names.length === 0 ? '地区' : names.length <= 2 ? names.join('、') : `${names.slice(0, 2).join('、')}等${names.length}`;
    onConfirm(label, names);
    onClose();
  };

  const renderRow = (item: RegionNode, level: 0 | 1 | 2, selected: boolean) => (
    <View key={item.code} style={[styles.row, selected && styles.rowSelected]}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.rowNameBtn}
        disabled={level === 2}
        onPress={() => level !== 2 && pickLevel(item, level as 0 | 1)}
      >
        <Text style={[styles.rowText, selected && styles.rowTextSelected]} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => toggleCheck(item)}>
        <Checkbox state={item.checked} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.panel}>
      <View style={styles.columns}>
        <ScrollView style={[styles.column, styles.columnFirst]} showsVerticalScrollIndicator={false}>
          {provinces.map(p => renderRow(p, 0, p.code === path[0]))}
        </ScrollView>
        <View style={styles.columnDivider} />
        <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
          {cities.map(c => renderRow(c, 1, c.code === path[1]))}
        </ScrollView>
        <View style={styles.columnDivider} />
        <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
          {districts.map(d => renderRow(d, 2, false))}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.7} style={[styles.footerBtn, styles.resetBtn]} onPress={onReset}>
          <Text style={styles.resetText}>重置</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={[styles.footerBtn, styles.okBtn]} onPress={onOk}>
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
  columns: {
    flexDirection: 'row',
    height: scaleSizeH(280),
  },
  column: {
    flex: 1,
  },
  columnFirst: {
    backgroundColor: '#F6F7FB',
  },
  columnDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },
  row: {
    height: scaleSizeH(49),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(10),
  },
  rowSelected: {
    backgroundColor: '#FFFFFF',
  },
  rowNameBtn: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  rowText: {
    fontSize: setSpText(13),
    color: '#6C6C6C',
  },
  rowTextSelected: {
    color: BLUE,
    fontWeight: '500',
  },
  checkbox: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(4),
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: BLUE,
  },
  checkboxInner: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    borderRadius: scaleSizeW(2),
    backgroundColor: BLUE,
  },
  checkboxInnerHalf: {
    opacity: 0.35,
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
