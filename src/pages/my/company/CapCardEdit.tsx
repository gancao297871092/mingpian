import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { useUserStore } from '@/store/user';
import { getEditorResult } from '@/utils/editorBridge';
import LongHtmlView from '@/components/LongHtmlView';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'capCardEdit'>;

const PRIMARY = '#2962D4';
const GRAY = '#999999';
const NAME_MAX = 30;
/** 内容区引导占位文案（figma 42.创建能力卡） */
const CONTENT_GUIDE = '1.能提供什么\n\n2.适用企业或场景\n\n3.产品/服务范围或交付能力\n\n4.案例或实力证明\n\n5.其他补充';

/** 展开富文本编辑器图标（figma 42，271:2409） */
function ExpandIcon({ size = 16 }: { size?: number }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2.62577 1.99854C2.26792 1.99854 1.97783 2.28863 1.97783 2.64648V7.64603C1.97783 8.00388 2.26792 8.29397 2.62577 8.29397C2.98362 8.29397 3.27371 8.00388 3.27371 7.64603V2.64648L2.62577 3.29442H7.70933C8.06718 3.29442 8.35728 3.00433 8.35728 2.64648C8.35728 2.28863 8.06718 1.99854 7.70933 1.99854H2.62577ZM13.3755 14.0018C13.7333 14.0018 14.0234 13.7117 14.0234 13.3539V8.3543C14.0234 7.99645 13.7333 7.70636 13.3755 7.70636C13.0176 7.70636 12.7276 7.99645 12.7276 8.3543V13.3539L13.3755 12.7059H8.29193C7.93408 12.7059 7.64399 12.996 7.64399 13.3539C7.64399 13.7117 7.93408 14.0018 8.29193 14.0018H13.3755Z"
        fill="#000000"
      />
    </Svg>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** 创建/编辑企业能力卡（figma 42.创建能力卡；内容走发布长图文同款富文本编辑器；/capability/card/*） */
export default function CapCardEdit({ navigation, route }: Props) {
  const id = route.params?.id;
  const cpId = useUserStore((s) => s.userInfo?.cpId);

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 编辑模式：回显详情
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await API.capability.cardDetail({ id });
        if (res.code === '200' && res.data) {
          setName(res.data.cardName || '');
          setContent(res.data.content || '');
        }
      } catch {
        // ignore
      }
    })();
  }, [id]);

  // 编辑模式动态改导航标题
  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? '编辑能力卡' : '创建能力卡' });
  }, [navigation, id]);

  // 从 RichTextEdit 返回后接收 HTML（AddItem 同款桥接）
  useFocusEffect(
    useCallback(() => {
      const result = getEditorResult();
      if (result !== null) {
        setContent(result);
      }
    }, []),
  );

  const openEditor = () => {
    navigation.navigate('publishLongText', {
      title: '编辑能力卡内容',
      initialHtml: content || undefined,
    });
  };

  const canSubmit = !!name.trim() && !!stripHtml(content) && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // 企业能力卡 ownerType=1（后端校验管理员身份与 10 张上限）
      const res = await API.capability.cardSave({
        id,
        ownerType: 1,
        cpId,
        cardName: name.trim(),
        content,
      });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: id ? '已保存' : '已创建' });
      navigation.goBack();
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const contentText = stripHtml(content);
  const { width: screenWidth } = useWindowDimensions();
  // 屏幕宽 - 页面 padding 16*2 - 卡片 padding 14*2
  const contentWidth = screenWidth - scaleSizeW(60);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 能力卡名称 */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              能力卡名称<Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.counter}>
              {name.length}/{NAME_MAX}
            </Text>
          </View>
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={(t) => setName(t.slice(0, NAME_MAX))}
              placeholder="例如：包装材料供应与协同交付"
              placeholderTextColor={GRAY}
              maxLength={NAME_MAX}
            />
          </View>

          {/* 能力卡内容 */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              能力卡内容<Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.counter}>支持图文</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.contentCard} onPress={openEditor}>
            {contentText ? (
              <View pointerEvents="none" style={styles.contentRich}>
                <LongHtmlView html={content} contentWidth={contentWidth} baseStyle={styles.contentText} />
              </View>
            ) : (
              <Text style={styles.contentPlaceholder}>{CONTENT_GUIDE}</Text>
            )}
            <View style={styles.expandBtn}>
              <ExpandIcon />
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 提交按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>{id ? '保存' : '创建能力卡'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(20),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  label: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  required: {
    color: '#EF4444',
  },
  counter: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
  },
  nameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  nameInput: {
    padding: 0,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(270),
    padding: scaleSizeW(14),
    overflow: 'hidden',
  },
  contentPlaceholder: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  contentText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  contentRich: {
    flex: 1,
  },
  expandBtn: {
    position: 'absolute',
    right: scaleSizeW(14),
    bottom: scaleSizeH(14),
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(20),
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.3,
  },
  submitText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
