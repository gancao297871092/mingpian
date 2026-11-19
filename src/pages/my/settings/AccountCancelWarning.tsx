import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { API } from '@/api';
import { BLUE } from './components';
import { CancelCheckTickIcon, CancelWarnIcon } from './cancelIcons';
import type { RootStackParamList } from '@/route/map';

const RED = '#EF4444';

/** 注销影响说明（figma 分组11 注销账号页 6 条） */
const CANCEL_NOTES = [
  '无法登录联诚采信，也无法使用该账号访问名片、企业、消息等功能',
  '已完成的实名认证、职位认证、企业相关认证将解除，认证材料按法规存档',
  '动态、关系、名片及分享链等将删除、解除或失效',
  '私信与会话将关闭，内容按策略删除或匿名',
  '合作关系终止：合作中心认领的合作、合作信号及个人沟通权限将被关闭，请提前交接',
  '注销不豁免注销前账号行为与法律责任；未结纠纷时平台可中止注销',
];

/**
 * 注销账号-重要提醒（figma 分组11「注销账号」3447:6673）
 * 下一步前调 /user/cancel/check：allPassed=1 → 身份验证，否则 → 条件检测页展示未通过项。
 */
export default function AccountCancelWarning() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);
  const [checking, setChecking] = useState(false);

  const onNext = async () => {
    if (!agreed || checking) return;
    setChecking(true);
    try {
      const res = await API.user.cancelCheck();
      if (res.code === '200' && res.data) {
        const { allPassed, ...passed } = res.data;
        if (allPassed === 1) {
          navigation.navigate('accountCancelVerify');
        } else {
          navigation.navigate('accountCancelCheck', passed);
        }
      }
    } catch {
      // 非 200 由 request 拦截器统一弹错
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeView backgroundColor="#FFFFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 顶部红色提示条 */}
        <View style={styles.tipBar}>
          <CancelWarnIcon size={16} />
          <Text style={styles.tipBarText}>重要提醒，注销前请认真阅读以下内容</Text>
        </View>
        <Text style={styles.tipDesc}>
          注销前请认真阅读以下重要提醒。账号注销后，你将无法再使用该账号，包括但不限于：
        </Text>
        {/* 注销影响说明卡 */}
        <View style={styles.noteCard}>
          {CANCEL_NOTES.map((note, i) => (
            <View key={i} style={[styles.noteRow, i > 0 && styles.noteRowGap]}>
              <View style={styles.noteDot} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部：协议勾选 + 下一步 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : scaleSizeH(16) }]}>
        <View style={styles.agreeRow}>
          <TouchableOpacity
            style={[styles.checkbox, agreed && styles.checkboxChecked]}
            activeOpacity={0.8}
            onPress={() => setAgreed(v => !v)}
          >
            {agreed && <CancelCheckTickIcon size={12} />}
          </TouchableOpacity>
          <Text style={styles.agreeText}>
            我已阅读并知晓
            <Text
              style={styles.agreeLink}
              onPress={() => navigation.navigate('agreement', { type: 'cancelNotice', title: '账号注销须知' })}
            >
              《联诚采信账号注销须知》
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, (!agreed || checking) && styles.nextBtnDisabled]}
          activeOpacity={0.85}
          disabled={!agreed || checking}
          onPress={onNext}
        >
          <Text style={styles.nextBtnText}>下一步</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(15),
    paddingBottom: scaleSizeH(24),
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: scaleSizeW(8),
    paddingVertical: scaleSizeH(5),
    paddingHorizontal: scaleSizeW(12),
  },
  tipBarText: {
    marginLeft: scaleSizeW(4),
    fontSize: setSpText(12),
    color: RED,
  },
  tipDesc: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(16),
  },
  noteCard: {
    marginTop: scaleSizeH(19),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(20),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteRowGap: {
    marginTop: scaleSizeH(30),
  },
  noteDot: {
    width: scaleSizeW(8),
    height: scaleSizeW(8),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#D9D9D9',
  },
  noteText: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeH(10),
  },
  checkbox: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    borderRadius: scaleSizeW(6),
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  agreeText: {
    marginLeft: scaleSizeW(5),
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(22),
  },
  agreeLink: {
    color: BLUE,
  },
  nextBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.3,
  },
  nextBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
