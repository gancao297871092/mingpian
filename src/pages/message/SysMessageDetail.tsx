import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { DIVIDER, PRIMARY, TEXT_DESC, TEXT_MAIN, TEXT_SUB } from './common';

/**
 * 系统消息详情（figma 31 卡片「查看详情」；设计稿无此页，按纯文本详情实现）
 * 进入即标记已读；带 businessType/businessId 的消息显示「查看相关业务」跳转按钮。
 */
export default function SysMessageDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'sysMessageDetail'>>();
  const msgId = route.params?.id;
  const [msg, setMsg] = useState<API.message.SysMessage | null>(route.params?.item ?? null);

  useEffect(() => {
    if (msgId == null) return;
    // 标记已读（静默）
    API.message.sysReadOne({ id: msgId }).catch(() => {});
    // 拉取详情（列表项已带全量字段时失败也无碍）
    API.message
      .sysOne({ id: msgId })
      .then(res => {
        if (res.data) setMsg(res.data);
      })
      .catch(() => {});
  }, [msgId]);

  /** 业务跳转：businessType 映射（未知类型不显示按钮） */
  const bizTarget = useCallback((): { label: string; onPress: () => void } | null => {
    if (!msg?.businessId || !msg.businessType) return null;
    const type = String(msg.businessType).toUpperCase();
    const id = msg.businessId;
    if (type.includes('BBS')) {
      return { label: '查看相关动态', onPress: () => navigation.navigate('bbsDetail', { id: String(id) }) };
    }
    if (type.includes('COMPANY')) {
      return { label: '查看相关企业', onPress: () => navigation.navigate('companyPage', { id }) };
    }
    if (type.includes('CARD')) {
      return { label: '查看相关名片', onPress: () => navigation.navigate('cardDetail', { id }) };
    }
    return null;
  }, [msg, navigation]);

  const target = bizTarget();

  return (
    <SafeView backgroundColor="#FFFFFF">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {msg ? (
          <>
            <Text style={styles.title}>{msg.msgTitle || '系统消息'}</Text>
            <Text style={styles.meta}>
              {msg.senderName || '联诚助手'}
              {msg.createTime || msg.sendTime ? ` · ${(msg.createTime || msg.sendTime || '').replace(/-/g, '/')}` : ''}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.body}>{msg.msgContent || ''}</Text>
            {target ? (
              <TouchableOpacity activeOpacity={0.85} style={styles.bizBtn} onPress={target.onPress}>
                <Text style={styles.bizBtnText}>{target.label}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <ActivityIndicator style={styles.loading} color={PRIMARY} />
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(20),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(40),
    flexGrow: 1,
  },
  loading: {
    marginTop: scaleSizeH(80),
  },
  title: {
    fontSize: setSpText(17),
    fontWeight: '600',
    lineHeight: setSpText(24),
    color: TEXT_MAIN,
  },
  meta: {
    marginTop: scaleSizeH(8),
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginVertical: scaleSizeH(16),
  },
  body: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: TEXT_DESC,
  },
  bizBtn: {
    marginTop: scaleSizeH(28),
    height: scaleSizeH(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
