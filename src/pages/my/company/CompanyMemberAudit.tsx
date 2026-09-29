import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { MEMBER_APPLICATIONS, type MemberApplication } from '@/data/company';
import { useCompanyStore } from '@/store/company';
import { TipInfoIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';
const GRAY = '#6C6C6C';

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

/** 成员审核（加入企业申请） */
export default function CompanyMemberAudit() {
  const setMemberAuditCount = useCompanyStore(s => s.setMemberAuditCount);
  const [list, setList] = useState<MemberApplication[]>(MEMBER_APPLICATIONS);

  const mark = (id: string, status: 'approved' | 'rejected') => {
    setList(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, status } : a));
      setMemberAuditCount(next.filter(a => a.status === 'pending').length);
      return next;
    });
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.tip}>
          <TipInfoIcon />
          <Text style={styles.tipText}>请谨慎查看申请信息</Text>
        </View>
        {list.map(item => (
          <View key={item.id} style={[styles.card, item.status === 'pending' ? styles.cardPending : styles.cardDone]}>
            <View style={styles.cardMain}>
              <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" transition={150} recyclingKey={item.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}(加入企业)</Text>
                <Text style={styles.positions}>申请职位：{item.positions.join(',')}</Text>
              </View>
              {item.status !== 'pending' && (
                <Text style={styles.status}>{item.status === 'approved' ? '已通过' : '已拒绝'}</Text>
              )}
            </View>
            {item.status === 'pending' && (
              <AuditButtons onApprove={() => mark(item.id, 'approved')} onReject={() => mark(item.id, 'rejected')} />
            )}
          </View>
        ))}
      </ScrollView>
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
