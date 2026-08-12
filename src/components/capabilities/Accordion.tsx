import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionSection {
  title: string;
  content: string;
}

interface AccordionProps {
  sections?: AccordionSection[];
}

const defaultSections: AccordionSection[] = [
  { title: '什么是手风琴组件？', content: '手风琴（Accordion）组件是一种可展开/折叠的内容容器，点击标题可以展开或收起对应的内容区域。' },
  { title: '使用场景', content: '常见于 FAQ、设置页、分类筛选等需要节省页面空间的场景。' },
  { title: '实现原理', content: '通过 LayoutAnimation 或 Animated 控制内容视图的高度变化，实现平滑展开/收起动画。' },
  { title: '自定义选项', content: '可以自定义标题样式、内容样式、图标、默认展开状态等。' },
];

export default function Accordion({ sections = defaultSections }: AccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = useCallback((index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <View style={styles.container}>
      {sections.map((section, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <View key={index} style={styles.section}>
            <TouchableOpacity
              style={styles.header}
              onPress={() => toggle(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerText}>{section.title}</Text>
              <Text style={styles.arrow}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.content}>
                <Text style={styles.contentText}>{section.content}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', marginHorizontal: 16 },
  section: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e0e0e0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#f8f8f8',
  },
  headerText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  arrow: { fontSize: 12, color: '#999', marginLeft: 8 },
  content: { padding: 16, backgroundColor: '#fff' },
  contentText: { fontSize: 14, color: '#666', lineHeight: 22 },
});
