import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CAP_CARDS, CAP_CARD_MAX, type CapCard } from '@/data/company';
import { EditPenIcon, PuzzleIcon, TrashLineIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

/** 能力卡管理 */
export default function CompanyCapCards() {
  const [list, setList] = useState<CapCard[]>(CAP_CARDS);

  const onDelete = (item: CapCard) => {
    Alert.alert('删除能力卡', `确认删除「${item.title}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setList(prev => prev.filter(c => c.id !== item.id)) },
    ]);
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>证明企业能力，常在发送合作意向书、发布信号时使用</Text>
        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardText}>
              <View style={styles.titleRow}>
                <PuzzleIcon />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              </View>
              <Text style={styles.meta}>更新于 {item.updatedAt}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={8}
                onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}
              >
                <EditPenIcon size={20} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onDelete(item)}>
                <TrashLineIcon size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {list.length < CAP_CARD_MAX && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addCard}
            onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}
          >
            <Text style={styles.addText}>+ 新增能力卡 {list.length}/{CAP_CARD_MAX}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  hint: {
    fontSize: setSpText(12),
    lineHeight: setSpText(24),
    color: GRAY,
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(20),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(76),
    paddingHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  cardText: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  title: {
    flex: 1,
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  meta: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(20),
    marginLeft: scaleSizeW(10),
  },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
});
