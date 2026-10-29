import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import type { LinkLead, LinkLeadItem, LinkLeadPoolItem } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { formatRelativeTime, toTimestamp } from './linkFormat';
import { InfoIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const ORANGE = '#F2722C';
const TEXT_SUB = '#6C6C6C';
const PAGE_SIZE = 10;
/** 「已连接」细分（待联系/沟通中）需要按 contactStage 客户端过滤，一次取足 */
const CONNECTED_PAGE_SIZE = 100;

type TopTab = 'pool' | 'mine';
type PoolSub = 'pending' | 'docked';
type MineSub = 'waiting' | 'toContact' | 'chatting';

interface OpportunityItem {
  id: string;
  company: string;
  logo?: string;
  sub: string;
  statusTag: string;
  statusTone: 'blue' | 'orange';
  sourceTag: string;
  timeTag: string;
  desc?: string;
  actionText?: string;
  actionTone?: 'light' | 'solid';
  /** 来源单据：意向书 ID（source=1） */
  intentId?: number;
  /** 线索 ID（接手/沟通等后续动作） */
  leadId?: number;
  contactStage?: string;
}

/** 线索来源 → 卡片标签（合作池里是对方发来的，合作中心里是我方发出的） */
function sourceLabel(source: number | undefined, topTab: TopTab): string {
  if (source === 1) return topTab === 'pool' ? '对方申请' : '我方触达';
  if (source === 2) return '信号匹配';
  if (source === 5) return '平台匹配';
  if (source === 3) return '广场';
  if (source === 4) return '官网';
  return topTab === 'pool' ? '对方申请' : '我方触达';
}

/** 合作池卡片：本企业收到的合作机会（对方企业视角） */
function toPoolItem(item: LinkLeadPoolItem, sub: PoolSub): OpportunityItem {
  const lead: LinkLead = item.lead ?? ({} as LinkLead);
  return {
    id: String(lead.id),
    leadId: lead.id,
    company: item.targetCompanyName || lead.title || '合作企业',
    logo: item.targetCompanyLogo || undefined,
    sub: item.targetCompanyTypes || '',
    statusTag: sub === 'docked' ? (item.ownerUserName ? `${item.ownerUserName}负责` : '已对接') : '待接手',
    statusTone: 'blue',
    sourceTag: sourceLabel(lead.source, 'pool'),
    timeTag: formatRelativeTime(lead.updateTime || lead.createTime),
    desc:
      sub === 'pending'
        ? `对方希望就「${lead.title || '合作方向'}」开展合作，您可能符合其合作方向。`
        : `来源：${sourceLabel(lead.source, 'pool')} · ${lead.title || '合作机会'}`,
    actionText: '查看详情',
    actionTone: 'light',
    intentId: lead.source === 1 ? lead.sourceId : undefined,
  };
}

/** 合作中心卡片：我发出的合作申请 / 跟进中的连接 */
function toMineItem(item: LinkLeadItem, sub: MineSub): OpportunityItem {
  const lead: LinkLead = item.lead ?? ({} as LinkLead);
  const stage = item.contactStage;
  const isConnected = lead.status === 3;
  return {
    id: String(lead.id),
    leadId: lead.id,
    company: item.targetCompanyName || lead.title || '合作企业',
    logo: item.targetCompanyLogo || undefined,
    sub: isConnected ? `${stage ?? '待联系'}` : item.targetCompanyTypes || '',
    statusTag: sub === 'waiting' ? '等待对方' : sub === 'toContact' ? '待联系' : '沟通中',
    statusTone: sub === 'toContact' ? 'orange' : 'blue',
    sourceTag: sourceLabel(lead.source, 'mine'),
    timeTag: formatRelativeTime(lead.updateTime || lead.createTime),
    desc:
      sub === 'waiting'
        ? '你已向对方发送合作申请，等待对方查看并回应。'
        : sub === 'toContact'
          ? `来源：${lead.title || '合作意向书'}`
          : undefined,
    actionText: sub === 'waiting' ? '查看申请' : sub === 'toContact' ? '开始沟通' : '继续沟通',
    actionTone: 'solid',
    intentId: lead.source === 1 ? lead.sourceId : undefined,
    contactStage: stage,
  };
}

const POOL_SUBS: { key: PoolSub; label: string }[] = [
  { key: 'pending', label: '待接手' },
  { key: 'docked', label: '已对接' },
];

const MINE_SUBS: { key: MineSub; label: string }[] = [
  { key: 'waiting', label: '等待对方' },
  { key: 'toContact', label: '待联系' },
  { key: 'chatting', label: '沟通中' },
];

/** 合并多来源后的排序：更新时间倒序 */
function byUpdateDesc(a: LinkLeadItem, b: LinkLeadItem): number {
  const at = toTimestamp(a.lead?.updateTime || a.lead?.createTime) ?? 0;
  const bt = toTimestamp(b.lead?.updateTime || b.lead?.createTime) ?? 0;
  return bt - at;
}

const NOTICES: Record<TopTab, string> = {
  pool: '这里展示企业当前的全部合作机会，包含对方发来的申请和我方信号产生的匹配结果',
  mine: '你已发出合作申请，等待对方回应。对方同意后可进入私信沟通。',
};

const MINE_SUB_NOTICES: Record<MineSub, string> = {
  waiting: '你已发出合作申请，等待对方回应。对方同意后可进入私信沟通。',
  toContact: '双方已确认合作意向，尚未开始站内沟通。发送消息后将进入[沟通中]。',
  chatting: '正在跟进中的合作，可继续私信沟通。',
};

function OpportunityCard({ item }: { item: OpportunityItem }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.card}>
      <View style={styles.companyRow}>
        <ExpoImage
          source={item.logo ? { uri: item.logo } : require('@/assets/link/mock-avatar.png')}
          style={styles.companyAvatar}
          contentFit="cover"
        />
        <View style={styles.companyInfo}>
          <View style={styles.companyNameRow}>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
            <VerifiedBadgeIcon size={13} />
          </View>
          <Text style={styles.companySub}>{item.sub}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.tagsRow}>
        <View style={[styles.tag, item.statusTone === 'orange' ? styles.tagOrange : styles.tagBlue]}>
          <Text style={[styles.tagText, item.statusTone === 'orange' ? styles.tagTextOrange : styles.tagTextBlue]}>
            {item.statusTag}
          </Text>
        </View>
        <View style={[styles.tag, styles.tagBlue]}>
          <Text style={[styles.tagText, styles.tagTextBlue]}>{item.sourceTag}</Text>
        </View>
        {!!item.timeTag && (
          <View style={[styles.tag, styles.tagGray]}>
            <Text style={[styles.tagText, styles.tagTextGray]}>{item.timeTag}</Text>
          </View>
        )}
      </View>
      {!!item.desc && <Text style={styles.cardDesc}>{item.desc}</Text>}
      {!!item.actionText && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.cardBtn, item.actionTone === 'solid' ? styles.cardBtnSolid : styles.cardBtnLight]}
          onPress={() => {
            if (item.actionText === '查看详情' || item.actionText === '查看申请') {
              if (item.intentId) {
                navigation.navigate('cooperationIntentView', { intentId: item.intentId });
              } else {
                console.log('go: 线索详情', item.leadId);
              }
            } else {
              navigation.navigate('MainTabs', { screen: 'message' });
            }
          }}
        >
          <Text style={item.actionTone === 'solid' ? styles.cardBtnSolidText : styles.cardBtnLightText}>
            {item.actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** 56.我的商机/合作中心（figma 2793:6369 等待/待接手，2793:6427 已对接，2793:6526 等待对方，2793:6748 待联系，2793:6686 沟通中） */
export default function MyOpportunities() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'myOpportunities'>>();
  /** 由外部参数决定显示企业合作池还是我的合作（缺省企业合作池） */
  const topTab: TopTab = params?.tab ?? 'pool';
  const [poolSub, setPoolSub] = useState<PoolSub>('pending');
  const [mineSub, setMineSub] = useState<MineSub>('waiting');
  const [list, setList] = useState<OpportunityItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [errorText, setErrorText] = useState('');
  const loadingRef = useRef(false);

  const subs = topTab === 'pool' ? POOL_SUBS : MINE_SUBS;
  const activeSub = topTab === 'pool' ? poolSub : mineSub;
  const notice = errorText || (topTab === 'pool' ? NOTICES.pool : MINE_SUB_NOTICES[mineSub]);

  /** 两个子 tab 的计数 */
  const fetchCounts = useCallback(async (tab: TopTab) => {
    try {
      if (tab === 'pool') {
        const res = await API.lead.pool({ tab: 'pending', pageNum: 1, pageSize: 1 });
        setCounts({
          pending: res.data.counts?.pending ?? 0,
          docked: res.data.counts?.docked ?? 0,
        });
        return;
      }
      // 计数由后端 counts 下发；connected 未按 contactStage 细分，仍需拉一次已连接列表拆分（待后端细分后可去掉）
      const [allRes, connectedRes] = await Promise.all([
        API.lead.list({ tab: 'all', pageNum: 1, pageSize: 1 }),
        API.lead.list({ tab: 'connected', pageNum: 1, pageSize: CONNECTED_PAGE_SIZE }),
      ]);
      const c = allRes.data.counts ?? {};
      const connected = connectedRes.data.list ?? [];
      setCounts({
        waiting: c.response ?? 0,
        // 待联系 = 待跟进线索（信号有效回应 / 接手池线索）+ 已连接但还没发消息
        toContact:
          (c.pending ?? 0) + connected.filter(i => (i.contactStage ?? '待联系') === '待联系').length,
        // 沟通中 = 跟进中线索 + 已连接且已在私信沟通
        chatting:
          (c.following ?? 0) + connected.filter(i => i.contactStage === '沟通中').length,
      });
    } catch {
      // 拦截器已提示错误
    }
  }, []);

  /** 待联系 / 沟通中：跨 status 拉全量后客户端分页（status=1 待跟进、2 跟进中、3 已连接） */
  const fetchMineAll = useCallback(
    async (sub: Exclude<MineSub, 'waiting'>): Promise<LinkLeadItem[]> => {
      const connectedReq = API.lead.list({
        tab: 'connected',
        pageNum: 1,
        pageSize: CONNECTED_PAGE_SIZE,
      });
      if (sub === 'toContact') {
        const [todoRes, connectedRes] = await Promise.all([
          API.lead.list({ tab: 'pending', pageNum: 1, pageSize: CONNECTED_PAGE_SIZE }),
          connectedReq,
        ]);
        const todo = todoRes.data.list ?? [];
        const connected = (connectedRes.data.list ?? []).filter(
          i => (i.contactStage ?? '待联系') === '待联系',
        );
        return [...todo, ...connected].sort(byUpdateDesc);
      }
      const [followingRes, connectedRes] = await Promise.all([
        API.lead.list({ tab: 'following', pageNum: 1, pageSize: CONNECTED_PAGE_SIZE }),
        connectedReq,
      ]);
      const following = followingRes.data.list ?? [];
      const connected = (connectedRes.data.list ?? []).filter(i => i.contactStage === '沟通中');
      return [...following, ...connected].sort(byUpdateDesc);
    },
    [],
  );

  const fetchList = useCallback(
    async (tab: TopTab, sub: string, pageNum: number, append: boolean, isRefresh = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        let items: OpportunityItem[] = [];
        let totalPages = 1;
        let currentPage = pageNum;
        if (tab === 'pool') {
          const res = await API.lead.pool({
            tab: sub as PoolSub,
            pageNum,
            pageSize: PAGE_SIZE,
          });
          items = (res.data.list ?? []).map(item => toPoolItem(item, sub as PoolSub));
          totalPages = Math.max(res.data.pages || 1, 1);
          currentPage = res.data.pageNum || pageNum;
          setCounts({
            pending: res.data.counts?.pending ?? 0,
            docked: res.data.counts?.docked ?? 0,
          });
          setErrorText('');
        } else if (sub === 'waiting') {
          const res = await API.lead.list({ tab: 'response', pageNum, pageSize: PAGE_SIZE });
          items = (res.data.list ?? []).map(item => toMineItem(item, 'waiting'));
          totalPages = Math.max(res.data.pages || 1, 1);
          currentPage = res.data.pageNum || pageNum;
          setErrorText('');
        } else {
          // 待联系 / 沟通中：合并「待跟进 / 跟进中 / 已连接」后按卡片态过滤
          const all = (await fetchMineAll(sub as Exclude<MineSub, 'waiting'>)).map(item =>
            toMineItem(item, sub as MineSub),
          );
          totalPages = Math.max(Math.ceil(all.length / PAGE_SIZE), 1);
          currentPage = pageNum;
          items = all.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
          setErrorText('');
        }
        setList(prev => (append ? [...prev, ...items] : items));
        setPage(currentPage);
        setPages(totalPages);
      } catch (e) {
        const reason = e as { msg?: string; message?: string };
        const text = reason?.msg || reason?.message;
        if (tab === 'pool' && text) setErrorText(text);
        if (!append) {
          setList([]);
          setPage(1);
          setPages(1);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoaded(true);
      }
    },
    [fetchMineAll],
  );

  useFocusEffect(
    useCallback(() => {
      setLoaded(false);
      setErrorText('');
      fetchList(topTab, activeSub, 1, false);
      fetchCounts(topTab);
    }, [topTab, activeSub, fetchList, fetchCounts]),
  );

  const onRefresh = useCallback(() => {
    fetchList(topTab, activeSub, 1, false, true);
    fetchCounts(topTab);
  }, [topTab, activeSub, fetchList, fetchCounts]);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && page < pages) {
      fetchList(topTab, activeSub, page + 1, true);
    }
  }, [topTab, activeSub, fetchList, page, pages]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      {/* 白色头部区：子 tab（固定不跟随滚动；主 tab 由外部参数决定，页面内不展示切换） */}
      <View style={styles.headerBand}>
        <View style={styles.subTabs}>
          {subs.map(item => {
            const active = activeSub === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() =>
                  topTab === 'pool' ? setPoolSub(item.key as PoolSub) : setMineSub(item.key as MineSub)
                }
              >
                <Text style={[styles.subTabText, active ? styles.subTabActive : styles.subTabInactive]}>
                  {item.label} {counts[item.key] ?? 0}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <OpportunityCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, list.length === 0 && styles.contentEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.notice}>
            <InfoIcon />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        }
        ListEmptyComponent={
          loaded ? <EmptyState variant="content" title="暂无合作机会" style={styles.emptyBox} /> : null
        }
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(20),
  },
  contentEmpty: {
    flexGrow: 1,
  },
  emptyBox: {
    paddingTop: scaleSizeH(60),
  },
  headerBand: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(6),
    marginBottom: scaleSizeH(9),
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  subTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
    paddingVertical: scaleSizeH(12),
  },
  subTabText: {
    fontSize: setSpText(13),
    letterSpacing: -0.4,
  },
  subTabActive: {
    color: '#000000',
  },
  subTabInactive: {
    color: TEXT_SUB,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
  },
  noticeText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(15),
    marginHorizontal: scaleSizeW(16),
    marginBottom: scaleSizeH(10),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  companyAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F7FB',
    marginTop: scaleSizeH(11),
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  tag: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  tagBlue: {
    backgroundColor: '#F2F6FF',
  },
  tagOrange: {
    backgroundColor: '#FFE8DC',
  },
  tagGray: {
    backgroundColor: '#F6F7FB',
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '500',
  },
  tagTextBlue: {
    color: PRIMARY,
  },
  tagTextOrange: {
    color: ORANGE,
  },
  tagTextGray: {
    color: TEXT_SUB,
  },
  cardDesc: {
    marginTop: scaleSizeH(12),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#333333',
  },
  cardBtn: {
    marginTop: scaleSizeH(15),
    height: scaleSizeH(35),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnLight: {
    backgroundColor: '#F2F6FF',
  },
  cardBtnLightText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  cardBtnSolid: {
    backgroundColor: PRIMARY,
  },
  cardBtnSolidText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
