import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BlueBadgeIcon } from './myIcons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

type TaskTab = 'todo' | 'sent' | 'viewed';

const TABS: { key: TaskTab; label: string }[] = [
  { key: 'todo', label: '待触达' },
  { key: 'sent', label: '已发送' },
  { key: 'viewed', label: '已查看' },
];

export interface TouchTask {
  id: string;
  avatar: string;
  company: string;
  verified: boolean;
  tag: string;
  source: string;
  time: string;
  aiNote: string;
}

/** 静态 mock（接口待联调） */
const MOCK_TASKS: Record<TaskTab, TouchTask[]> = {
  todo: [
    {
      id: 'mock-1',
      avatar: '',
      company: '杭州远航包装有限公司',
      verified: true,
      tag: 'PVC颗粒供应合作',
      source: '天津华永盛合作信号',
      time: '10 分钟前',
      aiNote: '编织袋生产企业，与目标客户高度匹配',
    },
    {
      id: 'mock-2',
      avatar: '',
      company: '苏州某编织材料有限公司',
      verified: true,
      tag: '稳定供货合作',
      source: '天津华永盛合作信号',
      time: '35 分钟前',
      aiNote: '已采购类似原料，建议发送能力卡',
    },
  ],
  sent: [
    {
      id: 'mock-3',
      avatar: '',
      company: '杭州远航包装有限公司',
      verified: true,
      tag: 'PVC颗粒供应合作',
      source: '天津华永盛合作信号',
      time: '',
      aiNote: '',
    },
  ],
  viewed: [
    {
      id: 'mock-4',
      avatar: '',
      company: '杭州远航包装有限公司',
      verified: true,
      tag: 'PVC颗粒供应合作',
      source: '天津华永盛合作信号',
      time: '',
      aiNote: '',
    },
  ],
};

/** 93-95.触达待办（待触达/已发送/已查看 共用一个页面） */
export default function TouchTasks() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'touchTasks'>>();
  const [tab, setTab] = useState<TaskTab>(route.params?.tab ?? 'todo');

  const list = MOCK_TASKS[tab];

  const renderItem = useCallback(
    ({ item }: { item: TouchTask }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => navigation.navigate('touchTaskDetail', { id: item.id })}
      >
        <View style={styles.cardHead}>
          {item.avatar ? (
            <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
          {item.verified && <BlueBadgeIcon />}
        </View>
        {!!item.tag && (
          <View style={styles.tagBox}>
            <Text style={styles.tagText}>🏷 {item.tag}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>来源</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{item.source}</Text>
        </View>
        {tab === 'todo' && (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>时间</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{item.time}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>AI判断</Text>
              <Text style={[styles.metaValue, styles.metaValueDark]} numberOfLines={2}>{item.aiNote}</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    ),
    [tab, navigation],
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.tabsRow}>
        {TABS.map(t => {
          const active = tab === t.key;
          const count = MOCK_TASKS[t.key].length;
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.8}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                {t.label} <Text style={active ? styles.tabTextActive : styles.tabCount}>{count}</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FlashList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
      />
    </SafeView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(10),
  },
  tabPill: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
  },
  tabPillActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: TEXT_SUB,
  },
  tabCount: {
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(16),
  },
  separator: {
    height: scaleSizeH(10),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(30),
    height: scaleSizeW(30),
    borderRadius: scaleSizeW(15),
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginRight: scaleSizeW(5),
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  company: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  tagBox: {
    backgroundColor: '#F2F6FF',
    borderRadius: scaleSizeW(5),
    height: scaleSizeH(35),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(15),
    marginTop: scaleSizeH(12),
    alignSelf: 'stretch',
  },
  tagText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: scaleSizeH(12),
    gap: scaleSizeW(24),
  },
  metaLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  metaValue: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  metaValueDark: {
    color: '#000000',
  },
});
