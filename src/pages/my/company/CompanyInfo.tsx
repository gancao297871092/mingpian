import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import ImageUploader from '@/components/ImageUploader';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  COMPANY_CONTACTS,
  COMPANY_INFO,
  COMPANY_MENUS,
  COMPANY_PHOTOS,
  CONTACT_MAX,
} from '@/data/company';
import { CompanyInfoIcon, EditPenIcon, TipInfoIcon, TrashLineIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

const TABS = ['企业信息', '企业相册', '菜单模块', '联系方式'] as const;

type TabKey = (typeof TABS)[number];

function TipBanner({ text, style }: { text: string; style?: object }) {
  return (
    <View style={[styles.tip, style]}>
      <TipInfoIcon />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function DeepEditButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.deepEdit} onPress={onPress}>
      <EditPenIcon size={20} color={PRIMARY} />
      <Text style={styles.deepEditText}>深度编辑</Text>
    </TouchableOpacity>
  );
}

function InfoTab() {
  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });
  return (
    <View>
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>企业LOGO</Text>
          <View style={styles.logoWrap}>
            <ExpoImage source={{ uri: COMPANY_INFO.logo }} style={styles.logo} contentFit="cover" transition={150} />
            <TouchableOpacity activeOpacity={0.8} style={styles.logoEdit} onPress={todo}>
              <EditPenIcon size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.9} style={styles.posterCard} onPress={todo}>
          <ExpoImage source={{ uri: COMPANY_INFO.poster }} style={styles.poster} contentFit="cover" transition={150} />
          <Text style={styles.posterLabel}>企业海报封面</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.infoNote}>自定义分享卡上的企业名字</Text>
      <TipBanner text="仅用于分享卡展示，不影响企业认证信息，超过24个字自动省略" />
      <TouchableOpacity activeOpacity={0.7} style={styles.nameCard} onPress={todo}>
        <Text style={styles.nameText} numberOfLines={1}>{COMPANY_INFO.name}</Text>
        <EditPenIcon size={20} color={GRAY} />
      </TouchableOpacity>
      <Text style={styles.sectionLabel}>企业简介</Text>
      <View style={styles.introCard}>
        <Text style={styles.introText}>{COMPANY_INFO.intro}</Text>
        <DeepEditButton onPress={todo} />
      </View>
    </View>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = useState(COMPANY_PHOTOS);
  return (
    <View>
      <TipBanner text="图片建议宽高比为4:3" style={styles.photosTip} />
      <ImageUploader
        value={photos}
        onChange={setPhotos}
        layout="grid"
        columns={3}
        itemSize={scaleSizeW(116)}
        gap={scaleSizeW(11)}
        showCoverBadge={false}
        addBackgroundColor="#FFFFFF"
        style={styles.photoUploader}
      />
    </View>
  );
}

function MenusTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [menus, setMenus] = useState(COMPANY_MENUS);
  const onDelete = (id: string, name: string) => {
    Alert.alert('删除模块', `确认删除「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setMenus(prev => prev.filter(m => m.id !== id)) },
    ]);
  };
  return (
    <View>
      {menus.map(m => (
        <View key={m.id} style={styles.menuRow}>
          <CompanyInfoIcon size={20} />
          <Text style={styles.menuName} numberOfLines={1}>{m.name}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => navigation.navigate('companyModuleEdit', { id: m.id, name: m.name })}
            >
              <EditPenIcon size={20} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onDelete(m.id, m.name)}>
              <TrashLineIcon size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.addRow}
        onPress={() => navigation.navigate('companyModuleEdit', {})}
      >
        <Text style={styles.addRowText}>+ 新增菜单</Text>
      </TouchableOpacity>
    </View>
  );
}

function ContactsTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [contacts, setContacts] = useState(COMPANY_CONTACTS);
  const onDelete = (id: string, name: string) => {
    Alert.alert('删除联系方式', `确认删除联系人「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setContacts(prev => prev.filter(c => c.id !== id)) },
    ]);
  };
  return (
    <View>
      {contacts.map(c => (
        <View key={c.id} style={styles.contactCard}>
          <View style={styles.contactText}>
            <Text style={styles.contactName}>{c.name}·{c.position}</Text>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => navigation.navigate('companyContactEdit', { id: c.id })}
            >
              <EditPenIcon size={20} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onDelete(c.id, c.name)}>
              <TrashLineIcon size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {contacts.length < CONTACT_MAX && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.addRow}
          onPress={() => navigation.navigate('companyContactEdit', {})}
        >
          <Text style={styles.addRowText}>+ 新增联系方式 {contacts.length}/{CONTACT_MAX}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** 企业信息（4 个分段 Tab：企业信息/企业相册/菜单模块/联系方式） */
export default function CompanyInfo() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<TabKey>('企业信息');

  const onSave = useCallback(() => Toast.show({ type: 'success', text1: '已保存' }), []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={styles.headerSave} onPress={onSave}>保存</Text>
      ),
    });
  }, [navigation, onSave]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>企业信息维护</Text>
        <Text style={styles.pageSub}>自定义展示企业介绍</Text>
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.8}
              style={[styles.tabItem, tab === t && styles.tabItemOn]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === '企业信息' && <InfoTab />}
        {tab === '企业相册' && <PhotosTab />}
        {tab === '菜单模块' && <MenusTab navigation={navigation} />}
        {tab === '联系方式' && <ContactsTab navigation={navigation} />}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  headerSave: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: PRIMARY,
  },
  pageTitle: {
    fontSize: setSpText(20),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
    marginTop: scaleSizeH(14),
  },
  pageSub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
    marginTop: scaleSizeH(11),
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(100),
    padding: scaleSizeW(2),
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(20),
    gap: scaleSizeW(4),
  },
  tabItem: {
    flex: 1,
    height: scaleSizeH(28),
    borderRadius: scaleSizeW(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemOn: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: setSpText(13),
    fontWeight: '500',
    lineHeight: setSpText(18),
    color: '#000000',
  },
  tabTextOn: {
    color: '#FFFFFF',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    marginTop: scaleSizeH(14),
  },
  tipText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(16),
    color: PRIMARY,
  },
  infoRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  infoCard: {
    width: scaleSizeW(180),
    height: scaleSizeW(180),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
    marginTop: scaleSizeH(20),
  },
  logoWrap: {
    marginTop: scaleSizeH(10),
  },
  logo: {
    width: scaleSizeW(80),
    height: scaleSizeW(80),
    borderRadius: scaleSizeW(40),
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#F5F5F5',
  },
  logoEdit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterCard: {
    width: scaleSizeW(180),
    height: scaleSizeW(180),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    padding: scaleSizeW(11),
  },
  poster: {
    flex: 1,
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
  },
  posterLabel: {
    position: 'absolute',
    top: scaleSizeH(20),
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  infoNote: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
    marginTop: scaleSizeH(20),
  },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(14),
    marginTop: scaleSizeH(14),
  },
  nameText: {
    flex: 1,
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    color: '#000000',
    marginRight: scaleSizeW(10),
  },
  sectionLabel: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: GRAY,
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(10),
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  introText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(23),
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
    marginTop: scaleSizeH(14),
  },
  deepEditText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(16),
    color: PRIMARY,
  },
  photosTip: {
    marginTop: 0,
  },
  photoUploader: {
    marginTop: scaleSizeH(14),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
    gap: scaleSizeW(10),
  },
  menuName: {
    flex: 1,
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(20),
  },
  addRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    height: scaleSizeH(80),
    paddingHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  contactText: {
    flex: 1,
    gap: scaleSizeH(9),
  },
  contactName: {
    fontSize: setSpText(15),
    lineHeight: setSpText(15),
    color: '#000000',
  },
  contactPhone: {
    fontSize: setSpText(15),
    lineHeight: setSpText(15),
    color: GRAY,
  },
});
