import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { formatRelativeTime } from '@/pages/link/linkFormat';
import { BlueBadgeIcon } from './myIcons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const PAGE_SIZE = 10;

type TaskTab = 'todo' | 'sent' | 'viewed';

const TABS: { key: TaskTab; label: string; progressTab: string }[] = [
  { key: 'todo', label: '待触达', progressTab: 'pending' },
  { key: 'sent', label: '已发送', progressTab: 'sent' },
  { key: 'viewed', label: '已查看', progressTab: 'viewed' },
];

/** 任务来源 → 来源标签（wq_sales_task.task_source） */
const SOURCE_LABEL: Record<number, string> = {
  1: '合作信号',
  2: '企业认领',
  3: '手动分配',
  4: 'AI商机',
};

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

/** 接口 → 卡片模型（list 项：task 实体 + targetCompanyName/Logo/Types） */
function toTask(item: any): TouchTask {
  const t = item?.task ?? {};
  return {
    id: String(t.id),
    avatar: item?.targetCompanyLogo || '',
    company: item?.targetCompanyName || t.targetName || '目标客户',
    verified: true,
    tag: t.opportunityName || '',
    source: SOURCE_LABEL[t.taskSource] ?? '合作信号',
    time: formatRelativeTime(t.createTime),
    aiNote: t.aiJudgement || '',
  };
}

/** 93-95.触达待办（待触达/已发送/已查看 共用一个页面） */
export default function TouchTasks() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'touchTasks'>>();
  const [tab, setTab] = useState<TaskTab>(route.params?.tab ?? 'todo');
  const [list, setList] = useState<TouchTask[]>([]);
  const [counts, setCounts] = useState<Record<TaskTab, number>>({ todo: 0, sent: 0, viewed: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(async (activeTab: TaskTab, pageNum: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const progressTab = TABS.find(t => t.key === activeTab)?.progressTab ?? 'all';
    try {
      const res = await API.salesTask.list({ progressTab, pageNum, pageSize: PAGE_SIZE });
      const items = (res.data.list ?? []).map(toTask);
      setList(prev => (append ? [...prev, ...items] : items));
      setPage(res.data.pageNum || pageNum);
      setPages(Math.max(res.data.pages || 1, 1));
    } catch {
      // 拦截器已提示错误
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  /** 三个 pill 计数：count 接口一次拿全（pending/sent/total → viewed = total - pending - sent） */
  const fetchCounts = useCallback(async () => {
    try {
      const res = await API.salesTask.count();
      const d = res.data ?? {};
      const pending = d.pending ?? 0;
      const sent = d.sent ?? 0;
      const total = d.total ?? 0;
      setCounts({ todo: pending, sent, viewed: Math.max(total - pending - sent, 0) });
    } catch {
      // 拦截器已提示错误
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    fetchList(tab, 1, false);
  }, [tab, fetchList]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) fetchList(tab, page + 1, true);
  }, [fetchList, page, pages, tab]);

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
            {!!item.aiNote && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>AI判断</Text>
                <Text style={[styles.metaValue, styles.metaValueDark]} numberOfLines={2}>{item.aiNote}</Text>
              </View>
            )}
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
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.8}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                {t.label} <Text style={active ? styles.tabTextActive : styles.tabCount}>{counts[t.key]}</Text>
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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingPad} size="small" color={PRIMARY} />
          ) : loaded ? (
            <EmptyState variant="content" title="暂无任务" style={styles.emptyBox} />
          ) : null
        }
        ListFooterComponent={
          list.length > 0 ? (
            <ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />
          ) : null
        }
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
  loadingPad: {
    paddingVertical: scaleSizeH(60),
  },
  emptyBox: {
    paddingTop: scaleSizeH(80),
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
