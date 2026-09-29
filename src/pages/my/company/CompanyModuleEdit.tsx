import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { COMPANY_MENUS } from '@/data/company';
import { EditPenIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const NAME_MAX = 24;

/** 编辑模块：编辑菜单模块（模块名称 + 模块内容） */
export default function CompanyModuleEdit() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'companyModuleEdit'>>();
  const menu = COMPANY_MENUS.find(m => m.id === route.params?.id);
  const [name, setName] = useState(route.params?.name ?? menu?.name ?? '万企小刘');
  const [content, setContent] = useState(menu?.content ?? '');

  const onSave = useCallback(() => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '请输入模块名称' });
      return;
    }
    Toast.show({ type: 'success', text1: '已保存' });
    navigation.goBack();
  }, [name, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={styles.headerSave} onPress={onSave}>保存</Text>
      ),
    });
  }, [navigation, onSave]);

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
            {!!menu?.content && (
              <ExpoImage
                source={{ uri: 'https://picsum.photos/seed/qymodule/684/210' }}
                style={styles.contentImage}
                contentFit="cover"
                transition={150}
              />
            )}
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="请输入模块内容"
              placeholderTextColor="#999999"
              multiline
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.deepEdit}
            onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}
          >
            <EditPenIcon size={20} color={PRIMARY} />
            <Text style={styles.deepEditText}>深度编辑</Text>
          </TouchableOpacity>
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
  contentImage: {
    width: '100%',
    height: scaleSizeH(105),
    borderRadius: scaleSizeW(6),
    backgroundColor: '#F5F5F5',
    marginBottom: scaleSizeH(13),
  },
  contentInput: {
    padding: 0,
    minHeight: scaleSizeH(80),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
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
