import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { NavBackButton } from '@/components/NavHeader';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { COMPANY_SEARCH_RESULTS, type CompanySearchItem } from '@/data/company';
import { HistorySearchIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

function SearchBar({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <View style={styles.searchBar}>
      <HistorySearchIcon size={16} color="#AFB1BB" />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder="请至少输入企业名称的前四个字..."
        placeholderTextColor="#AFB1BB"
        returnKeyType="search"
      />
      <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={() => onChange(value.trim())}>
        <Text style={styles.searchBtnText}>搜索</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 加入企业（搜索企业并提交加入申请） */
export default function CompanyJoin() {
  const navigation = useNavigation();
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const list = useMemo(
    () => COMPANY_SEARCH_RESULTS.filter(c => !keyword || c.name.includes(keyword)),
    [keyword],
  );

  const onApply = (item: CompanySearchItem) => {
    if (applied.has(item.id)) return;
    setApplied(prev => new Set(prev).add(item.id));
    Toast.show({ type: 'success', text1: '已提交加入申请' });
  };

  const renderItem = ({ item }: { item: CompanySearchItem }) => {
    const isApplied = applied.has(item.id);
    return (
      <View style={styles.row}>
        <ExpoImage source={{ uri: item.logo }} style={styles.avatar} contentFit="cover" transition={150} recyclingKey={item.logo} />
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSub}>{item.industry} · {item.city}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.applyBtn, isApplied && styles.applyBtnDisabled]}
          onPress={() => onApply(item)}
        >
          <Text style={[styles.applyText, isApplied && styles.applyTextDisabled]}>{isApplied ? '已申请' : '申请'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop={false}>
      <View style={styles.header}>
        <NavBackButton color="#1A1A1A" onPress={() => navigation.goBack()} />
        <SearchBar value={keyword} onChange={setKeyword} />
      </View>
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(78),
    paddingHorizontal: scaleSizeW(16),
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  rowText: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  rowName: {
    fontSize: setSpText(15),
    lineHeight: setSpText(16),
    color: '#000000',
  },
  rowSub: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  applyBtn: {
    width: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSizeW(10),
  },
  applyBtnDisabled: {
    backgroundColor: '#F4F4F4',
  },
  applyText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: PRIMARY,
  },
  applyTextDisabled: {
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginLeft: scaleSizeW(77),
  },
});
