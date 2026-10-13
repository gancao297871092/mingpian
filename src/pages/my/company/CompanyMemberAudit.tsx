import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useCompanyStore } from '@/store/company';
import { TipInfoIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';
const GRAY = '#6C6C6C';
const PAGE_SIZE = 20;

/** 审核项（/company/auth/list，对齐小程序 persionExamine） */
interface AuthItem {
  id: number;
  avatar?: string;
  realName?: string;
  /** 0加入企业 1更改职位 */
  isChange?: number;
  submitPosition?: string;
  submitMsg?: string;
  /** 0已拒绝 1已通过 2待审核（后端拒绝也可能返回 3） */
  checkStatus?: number;
}

const isPending = (s?: number) => s === 2;
const isApproved = (s?: number) => s === 1;

function AuditButtons({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <View style={styles.btnRow}>
      <TouchableOpacity activeOpacity={0.8} style={[styles.btn, styles.btnApprove]} onPress={onApprove}>
        <Text style={styles.btnText}>通过</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} style={[styles.btn, styles.btnReject]} onPress={onReject}>
        <Text style={styles.btnText}>拒绝</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 成员审核（figma 成员审核 1205:5057，对齐小程序 persionExamine：加入企业/更改职位申请） */
export default function CompanyMemberAudit() {
  const setMemberAuditCount = useCompanyStore((s) => s.setMemberAuditCount);
  const [list, setList] = useState<AuthItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const res = await API.company.authList({ pageNum, pageSize: PAGE_SIZE });
        if (res.code === '200') {
          const newList: AuthItem[] = res.data?.list || [];
          const next = pageNum === 1 ? newList : [...list, ...newList];
          setList(next);
          setPage(res.data?.pageNum || pageNum);
          setPages(res.data?.pages || 1);
          if (pageNum === 1) {
            setMemberAuditCount(next.filter((a) => isPending(a.checkStatus)).length);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [list, setMemberAuditCount],
  );

  // 每次进入刷新
  useFocusEffect(
    useCallback(() => {
      fetchPage(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onEndReached = useCallback(() => {
    if (loading || page >= pages) return;
    fetchPage(page + 1);
  }, [loading, page, pages, fetchPage]);

  /** 审核操作（对齐小程序 onExamine：确认后调 /company/auth/check 并更新状态角标） */
  const mark = (item: AuthItem, status: 0 | 1) => {
    Alert.alert('提示', `确认${status === 1 ? '通过' : '拒绝'}审核?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        style: status === 0 ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const res = await API.company.authCheck({ authId: item.id, status });
            if (res.code !== '200') return;
            setList((prev) => {
              const next = prev.map((a) => (a.id === item.id ? { ...a, checkStatus: status } : a));
              setMemberAuditCount(next.filter((a) => isPending(a.checkStatus)).length);
              return next;
            });
            Toast.show({ type: 'success', text1: status === 1 ? '已通过' : '已拒绝' });
          } catch {
            Toast.show({ type: 'error', text1: '操作失败' });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AuthItem }) => {
    const pending = isPending(item.checkStatus);
    return (
      <View style={[styles.card, pending ? styles.cardPending : styles.cardDone]}>
        <View style={styles.cardMain}>
          <ExpoImage
            source={{ uri: item.avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={150}
            recyclingKey={item.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.name}>
              {item.realName || ''}
              <Text style={styles.nameType}>（{item.isChange ? '更改职位' : '加入企业'}）</Text>
            </Text>
            <Text style={styles.positions}>申请职位：{item.submitPosition || ''}</Text>
          </View>
          {!pending && (
            <Text style={[styles.status, isApproved(item.checkStatus) && styles.statusApproved]}>
              {isApproved(item.checkStatus) ? '已通过' : '已拒绝'}
            </Text>
          )}
        </View>
        {!!item.submitMsg && (
          <View style={styles.msgBubble}>
            <Text style={styles.msgText}>申请消息:{item.submitMsg}</Text>
          </View>
        )}
        {pending && <AuditButtons onApprove={() => mark(item, 1)} onReject={() => mark(item, 0)} />}
      </View>
    );
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <FlashList
        data={list}
        keyExtractor={(item: AuthItem) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.tip}>
            <TipInfoIcon />
            <Text style={styles.tipText}>请谨慎查看申请信息</Text>
          </View>
        }
        ListEmptyComponent={loaded && !loading ? <EmptyState variant="content" title="暂无内容" /> : null}
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(16),
  },
  tipText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    marginBottom: scaleSizeH(10),
  },
  cardPending: {
    padding: scaleSizeW(14),
  },
  cardDone: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(12),
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  info: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  name: {
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
    fontWeight: '500',
  },
  nameType: {
    fontSize: setSpText(12),
    fontWeight: '400',
  },
  positions: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  status: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  statusApproved: {
    color: '#3EC06F',
  },
  msgBubble: {
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(8),
    marginTop: scaleSizeH(11),
  },
  msgText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: GRAY,
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(14),
  },
  btn: {
    width: scaleSizeW(166),
    paddingVertical: scaleSizeH(8),
    borderRadius: scaleSizeW(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApprove: {
    backgroundColor: PRIMARY,
  },
  btnReject: {
    backgroundColor: DANGER,
  },
  btnText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: '#FFFFFF',
  },
});
