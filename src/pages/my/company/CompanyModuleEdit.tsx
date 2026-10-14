import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import LongHtmlView from '@/components/LongHtmlView';
import { API } from '@/api';
import { getEditorResult } from '@/utils/editorBridge';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { EditPenIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const NAME_MAX = 24;

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** 编辑模块：编辑菜单模块（模块名称 + 富文本模块内容，对齐小程序 editModule.vue） */
export default function CompanyModuleEdit() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'companyModuleEdit'>>();
  const mdId = route.params?.id;

  const [cpId, setCpId] = useState<number | string | null>(null);
  const [ctId, setCtId] = useState<number | string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 回显模块名称与内容
  useEffect(() => {
    if (!mdId) return;
    (async () => {
      try {
        const res = await API.company.moduleContentPre({ mdId });
        if (res.code !== '200' || !res.data) return;
        setName(res.data.module?.mdName || '');
        setCpId(res.data.module?.cpId ?? null);
        if (res.data.content) {
          setCtId(res.data.content.id ?? null);
          setContent(res.data.content.content || '');
        }
      } catch {
        // ignore
      }
    })();
  }, [mdId]);

  // 从 publishLongText 返回后接收 HTML（AddItem 同款桥接）
  useFocusEffect(
    useCallback(() => {
      const result = getEditorResult();
      if (result !== null) {
        setContent(result);
      }
    }, []),
  );

  const onOpenEditor = useCallback(() => {
    navigation.navigate('publishLongText', {
      title: '模块内容',
      initialHtml: content || undefined,
    });
  }, [navigation, content]);

  const onSave = useCallback(async () => {
    if (saving) return;
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入模块名称' });
      return;
    }
    if (!stripHtml(content)) {
      Toast.show({ type: 'error', text1: '请输入模块内容' });
      return;
    }
    if (!mdId || !cpId) return;
    setSaving(true);
    try {
      const res = await API.company.moduleContentSave({
        ctId,
        cpId,
        mdId,
        mdName: name.trim(),
        content,
      });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: '保存成功' });
      navigation.goBack();
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSaving(false);
    }
  }, [saving, name, content, mdId, cpId, ctId, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={styles.headerSave} onPress={onSave}>保存</Text>
      ),
    });
  }, [navigation, onSave]);

  const hasContent = !!stripHtml(content) || /<(img|video)\b/i.test(content);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>模块名称</Text>
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={t => setName(t.slice(0, NAME_MAX))}
              placeholder="请输入模块名称"
              placeholderTextColor="#999999"
              maxLength={NAME_MAX}
            />
            <Text style={styles.counter}>{name.length}/{NAME_MAX}</Text>
          </View>
          <Text style={styles.label}>模块内容</Text>
          <View style={styles.contentCard}>
            <TouchableOpacity activeOpacity={0.8} style={styles.contentTouch} onPress={onOpenEditor}>
              {hasContent ? (
                <LongHtmlView
                  html={content}
                  contentWidth={SCREEN_WIDTH - scaleSizeW(60)}
                  baseStyle={styles.contentText}
                />
              ) : (
                <Text style={styles.contentPlaceholder}>请输入模块内容</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.deepEdit} onPress={onOpenEditor}>
              <EditPenIcon size={20} color={PRIMARY} />
              <Text style={styles.deepEditText}>深度编辑</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  headerSave: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: PRIMARY,
  },
  label: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(10),
  },
  nameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(14),
    paddingRight: scaleSizeW(60),
    justifyContent: 'center',
  },
  nameInput: {
    padding: 0,
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: '#000000',
  },
  counter: {
    position: 'absolute',
    right: scaleSizeW(14),
    bottom: scaleSizeH(8),
    fontSize: setSpText(12),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#999999',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    minHeight: scaleSizeH(200),
  },
  contentTouch: {
    flexGrow: 1,
    minHeight: scaleSizeH(80),
  },
  contentText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  contentPlaceholder: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#999999',
  },
  deepEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    height: scaleSizeH(35),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#F2F6FF',
    marginTop: scaleSizeH(16),
  },
  deepEditText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(16),
    color: PRIMARY,
  },
});
