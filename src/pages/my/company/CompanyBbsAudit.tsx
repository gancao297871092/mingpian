import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { AUDIT_POSTS, type AuditPost } from '@/data/company';

const PRIMARY = '#2962D4';
const DANGER = '#EF4444';
const GRAY = '#6C6C6C';

/** 动态审核（企业成员动态内容审核） */
export default function CompanyBbsAudit() {
  const [list, setList] = useState<AuditPost[]>(AUDIT_POSTS);

  const mark = (id: string, status: 'approved' | 'rejected') => {
    setList(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.textCol}>
                <Text style={styles.postText}>{item.content}</Text>
                <View style={styles.authorRow}>
                  <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" transition={150} recyclingKey={item.avatar} />
                  <Text style={styles.authorText}>{item.author}·发布于{item.time}</Text>
                </View>
              </View>
              <View>
                <ExpoImage source={{ uri: item.image }} style={styles.postImage} contentFit="cover" transition={150} recyclingKey={item.image} />
                {item.status === 'approved' && (
                  <View style={styles.statusTag}>
                    <Text style={styles.statusTagText}>已通过</Text>
                  </View>
                )}
                {item.status === 'rejected' && (
                  <View style={styles.statusTag}>
                    <Text style={styles.statusTagText}>已拒绝</Text>
                  </View>
                )}
              </View>
            </View>
            {item.status === 'pending' && (
              <View style={styles.btnRow}>
                <TouchableOpacity activeOpacity={0.8} style={[styles.btn, styles.btnApprove]} onPress={() => mark(item.id, 'approved')}>
                  <Text style={styles.btnText}>通过</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={[styles.btn, styles.btnReject]} onPress={() => mark(item.id, 'rejected')}>
                  <Text style={styles.btnText}>拒绝</Text>
                </TouchableOpacity>
              </View>
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
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(40),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginTop: scaleSizeH(10),
  },
  cardMain: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  textCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: scaleSizeH(20),
  },
  postText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  authorText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  postImage: {
    width: scaleSizeW(67),
    height: scaleSizeH(90),
    borderRadius: scaleSizeW(4),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  statusTag: {
    position: 'absolute',
    bottom: scaleSizeH(5),
    left: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusTagText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(14),
    color: '#FFFFFF',
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
