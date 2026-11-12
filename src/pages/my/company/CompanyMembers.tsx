import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { SwipeRow } from 'react-native-swipe-list-view';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import EmptyState from '@/components/EmptyState';
import ListFooter from '@/components/ListFooter';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';
import { HistorySearchIcon } from '../myIcons';
import { ClearIcon } from '@/pages/card/cardList/icons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const PAGE_SIZE = 20;
const ACTION_W = scaleSizeW(71);

/** 企业成员（/company/user/list，对齐小程序 personManage） */
interface Member {
  /** 企业用户关系 id（操作接口的 cuId） */
  id: number;
  userId: number;
  cpId?: number;
  avatar?: string;
  realName?: string;
  position?: string;
  /** 超管 */
  isMaster?: number;
  /** 管理员 */
  isManager?: number;
  /** 客服 */
  isKf?: number;
  defaultCardId?: number;
}

interface SwipeRowHandle {
  closeRow: () => void;
}

const SwipeableRow = SwipeRow as unknown as React.ForwardRefExoticComponent<
  React.PropsWithChildren<{
    rightOpenValue?: number;
    disableRightSwipe?: boolean;
    friction?: number;
  }> &
    React.RefAttributes<SwipeRowHandle>
>;

interface Action {
  label: string;
  color: string;
  onPress: () => void;
}

function roleBadge(m: Member): { text: string; color: string } | null {
  if (m.isMaster === 1) return { text: '超管', color: '#F2722C' };
  if (m.isManager === 1) return { text: '管理员', color: '#36BE69' };
  if (m.isKf === 1) return { text: '客服', color: PRIMARY };
  return null;
}

/** 成员管理（figma 成员管理 1205:4972，对齐小程序 personManage：左滑 踢出/管理员/编辑职位/客服/移交超管） */
export default function CompanyMembers() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userInfo } = useUserStore();
  const myId = userInfo?.wqUser?.id ?? 0;
  const myIsMaster = userInfo?.isMaster === 1;
  const myIsManager = userInfo?.isManager === 1;

  const [list, setList] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchPage = useCallback(async (pageNum: number, name: string) => {
    setLoading(true);
    try {
      const res = await API.company.memberList({ name: name || undefined, pageNum, pageSize: PAGE_SIZE });
      if (res.code === '200') {
        const newList: Member[] = res.data?.list || [];
        setList((prev) => (pageNum === 1 ? newList : [...prev, ...newList]));
        setPage(res.data?.pageNum || pageNum);
        setPages(res.data?.pages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  // 每次进入刷新（编辑职位等操作返回后同步）
  useFocusEffect(
    useCallback(() => {
      fetchPage(1, '');
    }, [fetchPage]),
  );

  const onEndReached = useCallback(() => {
    if (loading || page >= pages) return;
    fetchPage(page + 1, keyword);
  }, [loading, page, pages, keyword, fetchPage]);

  const refresh = useCallback(() => fetchPage(1, keyword), [fetchPage, keyword]);

  /** 操作统一入口（对齐小程序 onBtn：操作成功后刷新列表） */
  const runAction = useCallback(
    async (fn: () => Promise<any>, successText?: string) => {
      try {
        const res = await fn();
        if (res.code !== '200') return;
        if (successText) Toast.show({ type: 'success', text1: successText });
        refresh();
      } catch {
        Toast.show({ type: 'error', text1: '操作失败' });
      }
    },
    [refresh],
  );

  const onEditPosition = (m: Member, closeRow: () => void) => {
    closeRow();
    navigation.navigate('companyApply', {
      cpId: m.cpId ?? userInfo?.cpId ?? '',
      type: '3',
      userId: m.userId,
      position: m.position || '',
    });
  };

  const onToggleKf = (m: Member, closeRow: () => void) => {
    closeRow();
    const params = { cuId: m.id, toUserId: m.userId };
    if (m.isKf === 1) {
      runAction(() => API.company.memberDelKf(params));
      return;
    }
    // 设客服前检查：已有客服时需确认是否移交
    (async () => {
      try {
        const check = await API.company.memberSetKfCheck(params);
        if (check.code !== '200') return;
        if (!check.data) {
          AppAlert.alert('提示', `是否将客服移交给${m.realName || '该成员'}？`, [
            { text: '取消', style: 'cancel' },
            { text: '确认', onPress: () => runAction(() => API.company.memberSetKf(params), '设置成功') },
          ]);
          return;
        }
        runAction(() => API.company.memberSetKf(params), '设置成功');
      } catch {
        Toast.show({ type: 'error', text1: '操作失败' });
      }
    })();
  };

  const buildActions = (m: Member, closeRow: () => void): Action[] => {
    // 自己：只能编辑职位
    if (myId === m.userId) {
      return [{ label: '编辑\n职位', color: '#8B5CF6', onPress: () => onEditPosition(m, closeRow) }];
    }
    const params = { cuId: m.id, toUserId: m.userId };
    if (myIsMaster) {
      return [
        {
          label: '踢出',
          color: '#EF4444',
          onPress: () => {
            closeRow();
            AppAlert.alert('踢出成员', `确认将「${m.realName || ''}」移出企业？`, [
              { text: '取消', style: 'cancel' },
              { text: '踢出', style: 'destructive', onPress: () => runAction(() => API.company.memberDel(params)) },
            ]);
          },
        },
        {
          label: m.isManager === 1 ? '取消\n管理员' : '设为\n管理员',
          color: '#36BE69',
          onPress: () => {
            closeRow();
            runAction(() => (m.isManager === 1 ? API.company.memberDelMaster(params) : API.company.memberSetMaster(params)));
          },
        },
        { label: '编辑\n职位', color: '#8B5CF6', onPress: () => onEditPosition(m, closeRow) },
        {
          label: m.isKf === 1 ? '取消\n客服' : '设为\n客服',
          color: PRIMARY,
          onPress: () => onToggleKf(m, closeRow),
        },
        {
          label: '移交\n超管',
          color: '#F2722C',
          onPress: () => {
            closeRow();
            AppAlert.alert('提示', '移交后您将失去管理员权限，确认移交吗？', [
              { text: '取消', style: 'cancel' },
              {
                text: '确认',
                onPress: async () => {
                  try {
                    const res = await API.company.memberHandOver(params);
                    if (res.code !== '200') return;
                    Toast.show({ type: 'success', text1: '移交成功' });
                    setTimeout(() => navigation.goBack(), 500);
                  } catch {
                    Toast.show({ type: 'error', text1: '操作失败' });
                  }
                },
              },
            ]);
          },
        },
      ];
    }
    if (myIsManager) {
      if (m.isManager === 1) return [];
      return [
        {
          label: '踢出',
          color: '#EF4444',
          onPress: () => {
            closeRow();
            AppAlert.alert('踢出成员', `确认将「${m.realName || ''}」移出企业？`, [
              { text: '取消', style: 'cancel' },
              { text: '踢出', style: 'destructive', onPress: () => runAction(() => API.company.memberDel(params)) },
            ]);
          },
        },
        { label: '编辑\n职位', color: '#8B5CF6', onPress: () => onEditPosition(m, closeRow) },
        {
          label: m.isKf === 1 ? '取消\n客服' : '设为\n客服',
          color: PRIMARY,
          onPress: () => onToggleKf(m, closeRow),
        },
      ];
    }
    return [];
  };

  const renderItem = ({ item }: { item: Member }) => {
    let rowRef: SwipeRowHandle | null = null;
    const closeRow = () => rowRef?.closeRow();
    const actions = buildActions(item, closeRow);
    const badge = roleBadge(item);
    const positions = (item.position || '').split(/[,，]/).filter(Boolean);
    return (
      <SwipeableRow
        ref={(ref) => {
          rowRef = ref;
        }}
        rightOpenValue={-ACTION_W * actions.length}
        disableRightSwipe
        friction={8}
      >
        <View style={styles.hiddenRow}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              activeOpacity={0.8}
              style={[styles.actionBtn, { backgroundColor: a.color }]}
              onPress={a.onPress}
            >
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.row}
          disabled={!item.defaultCardId}
          onPress={() => item.defaultCardId && navigation.navigate('cardDetail', { id: item.defaultCardId, userId: item.userId })}
        >
          <View style={styles.avatarWrap}>
            <ExpoImage
              source={{ uri: item.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
              recyclingKey={item.avatar}
            />
            {badge && (
              <View style={[styles.roleBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.roleBadgeText}>{badge.text}</Text>
              </View>
            )}
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowName}>{item.realName || ''}</Text>
            <Text style={styles.rowPosition}>
              {positions.map((p, i) => (
                <Text key={p}>{i > 0 || item.isKf === 1 ? `·${p}` : p}</Text>
              ))}
              {item.isKf === 1 && <Text style={styles.positionService}>{positions.length ? '·企业客服' : '企业客服'}</Text>}
            </Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <View style={styles.searchBar}>
          <HistorySearchIcon size={16} color="#AFB1BB" />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="输入名称搜索"
            placeholderTextColor="#AFB1BB"
            returnKeyType="search"
            onSubmitEditing={() => fetchPage(1, keyword)}
          />
          {!!keyword && (
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => {
                setKeyword('');
                fetchPage(1, '');
              }}
            >
              <ClearIcon />
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={() => fetchPage(1, keyword)}>
            <Text style={styles.searchBtnText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.hint}>左滑进行更多操作</Text>
      <FlashList
        data={list}
        keyExtractor={(item: Member) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={loaded && !loading ? <EmptyState variant="content" title="暂无内容" /> : null}
        ListFooterComponent={<ListFooter fetching={loading} isLastPage={page >= pages} listLength={list.length} />}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(16),
    paddingTop: scaleSizeH(2),
    paddingBottom: scaleSizeH(7),
    gap: scaleSizeW(17),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F4F4F4',
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(4),
    gap: scaleSizeW(6),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  searchBtn: {
    paddingHorizontal: scaleSizeW(13),
    paddingVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
  },
  searchBtnText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    lineHeight: setSpText(16),
    color: '#FFFFFF',
  },
  hint: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: GRAY,
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(8),
    marginBottom: scaleSizeH(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(78),
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    width: scaleSizeW(48),
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  roleBadge: {
    position: 'absolute',
    bottom: scaleSizeH(-3),
    left: 0,
    width: scaleSizeW(48),
    height: scaleSizeH(16),
    borderRadius: scaleSizeW(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    lineHeight: setSpText(12),
    color: '#FFFFFF',
  },
  rowText: {
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  rowName: {
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
  },
  rowPosition: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  positionService: {
    color: PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginLeft: scaleSizeW(77),
  },
  hiddenRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: ACTION_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
