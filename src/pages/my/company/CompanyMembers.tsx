import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';
import { SwipeRow } from 'react-native-swipe-list-view';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { COMPANY_MEMBERS, type CompanyMember } from '@/data/company';
import { useCompanyStore } from '@/store/company';
import { HistorySearchIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const ACTION_W = scaleSizeW(71);

interface SwipeRowHandle {
  closeRow: () => void;
}

const SwipeableRow = SwipeRow as unknown as React.ForwardRefExoticComponent<
  React.PropsWithChildren<{
    rightOpenValue?: number;
    disableRightSwipe?: boolean;
    friction?: number;
  }> & React.RefAttributes<SwipeRowHandle>
>;

interface Action {
  label: string;
  color: string;
  onPress: () => void;
}

function SearchBar() {
  const setMemberKeyword = useCompanyStore(s => s.setMemberKeyword);
  const [text, setText] = useState('');
  return (
    <View style={styles.searchBar}>
      <HistorySearchIcon size={16} color="#AFB1BB" />
      <TextInput
        style={styles.searchInput}
        value={text}
        onChangeText={t => {
          setText(t);
          setMemberKeyword(t);
        }}
        placeholder="输入名称搜索"
        placeholderTextColor="#AFB1BB"
        returnKeyType="search"
        onSubmitEditing={() => setMemberKeyword(text)}
      />
      <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={() => setMemberKeyword(text)}>
        <Text style={styles.searchBtnText}>搜索</Text>
      </TouchableOpacity>
    </View>
  );
}

function roleBadge(member: CompanyMember): { text: string; color: string } | null {
  if (member.isSuper) return { text: '超管', color: '#F2722C' };
  if (member.isAdmin) return { text: '管理员', color: '#36BE69' };
  if (member.isService) return { text: '客服', color: PRIMARY };
  return null;
}

/** 成员管理（左滑出操作：踢出/管理员/编辑职位/客服/移交超管） */
export default function CompanyMembers() {
  const navigation = useNavigation();
  const keyword = useCompanyStore(s => s.memberKeyword);
  const [members, setMembers] = useState<CompanyMember[]>(COMPANY_MEMBERS);

  const list = useMemo(
    () => members.filter(m => !keyword || m.name.includes(keyword)),
    [members, keyword],
  );

  const buildActions = (member: CompanyMember, closeRow: () => void): Action[] => {
    if (member.isSuper) {
      return [{ label: '编辑\n职位', color: '#8B5CF6', onPress: () => Toast.show({ type: 'info', text1: '功能开发中' }) }];
    }
    return [
      {
        label: '踢出',
        color: '#EF4444',
        onPress: () => {
          closeRow();
          Alert.alert('踢出成员', `确认将「${member.name}」移出企业？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '踢出',
              style: 'destructive',
              onPress: () => setMembers(prev => prev.filter(m => m.id !== member.id)),
            },
          ]);
        },
      },
      {
        label: member.isAdmin ? '取消\n管理员' : '设为\n管理员',
        color: '#36BE69',
        onPress: () => {
          setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, isAdmin: !m.isAdmin } : m)));
          closeRow();
        },
      },
      {
        label: '编辑\n职位',
        color: '#8B5CF6',
        onPress: () => Toast.show({ type: 'info', text1: '功能开发中' }),
      },
      {
        label: member.isService ? '取消\n客服' : '设为\n客服',
        color: PRIMARY,
        onPress: () => {
          setMembers(prev =>
            prev.map(m =>
              m.id === member.id
                ? {
                    ...m,
                    isService: !m.isService,
                    positions: m.isService
                      ? m.positions.filter(p => p !== '企业客服')
                      : [...m.positions, '企业客服'],
                  }
                : m,
            ),
          );
          closeRow();
        },
      },
      {
        label: '移交\n超管',
        color: '#F2722C',
        onPress: () => {
          closeRow();
          Alert.alert('移交超管', `确认将超级管理员移交给「${member.name}」？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '确认',
              onPress: () =>
                setMembers(prev => prev.map(m => ({ ...m, isSuper: m.id === member.id, isAdmin: m.id === member.id ? false : m.isAdmin }))),
            },
          ]);
        },
      },
    ];
  };

  const renderItem = ({ item }: { item: CompanyMember }) => {
    let rowRef: SwipeRowHandle | null = null;
    const actions = buildActions(item, () => rowRef?.closeRow());
    const badge = roleBadge(item);
    return (
      <SwipeableRow
        ref={ref => {
          rowRef = ref;
        }}
        rightOpenValue={-ACTION_W * actions.length}
        disableRightSwipe
        friction={8}
      >
        <View style={styles.hiddenRow}>
          {actions.map(a => (
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
        <View style={styles.row}>
          <View style={styles.avatarWrap}>
            <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" transition={150} recyclingKey={item.avatar} />
            {badge && (
              <View style={[styles.roleBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.roleBadgeText}>{badge.text}</Text>
              </View>
            )}
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowPosition}>
              {item.positions.map((p, i) => (
                <Text key={p} style={p === '企业客服' && styles.positionService}>
                  {i > 0 ? `·${p}` : p}
                </Text>
              ))}
            </Text>
          </View>
        </View>
      </SwipeableRow>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <SearchBar />
      </View>
      <Text style={styles.hint}>左滑进行更多操作</Text>
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
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
