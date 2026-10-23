import React, { useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { GestureViewer } from 'react-native-gesture-image-viewer';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import ContactSheet from './ContactSheet';
import {
  AlbumItem,
  BackCircle,
  ContactPill,
  DynamicsTab,
  GoldBadge,
  mediaUrl,
  ModuleHtml,
  NavPill,
  openNavigation,
  stripHtml,
  useCompanyMain,
  WebsiteTabs,
  isVideoMedia,
  type WebsiteTab,
} from './common';
import { VerifiedBadgeIcon } from './icons';

interface WebsiteFreeProps {
  cpId: number | string;
  fromShare?: number | string;
}

/** 企业官网2（figma 2134:6575，免费版浅色官网，对齐小程序 freeView） */
export default function WebsiteFree({ cpId, fromShare }: WebsiteFreeProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data } = useCompanyMain(cpId);
  const userInfo = useUserStore((s) => s.userInfo);
  const contactRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<number | string>(-2);
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);

  const tabs: WebsiteTab[] = useMemo(() => {
    if (!data) return [{ id: -2, name: '企业信息' }];
    return [
      { id: -2, name: '企业信息' },
      ...(data.moduleList || []).map((o: any) => ({ id: o.id, name: o.mdName, content: o.content })),
      { id: -1, name: '最新动态' },
    ];
  }, [data]);

  const auths: string[] = (data?.authTypeList || []).map((o: any) => o.authTypeCode);
  const isMyCompany = !!(userInfo?.cpId && String(userInfo.cpId) === String(cpId));
  const showContact = String(fromShare || 0) === '1' && !isMyCompany;
  const contacts = data?.contactList || [];
  const introHtml = data?.des || (data?.desTxt ? `<p>${data.desTxt}</p>` : '');
  const medias: any[] = data?.mediaLinkList || [];
  const previewUrls = medias.filter((m) => !isVideoMedia(m)).map(mediaUrl);

  const onShowContact = () => {
    if (!contacts.length) {
      Toast.show({ type: 'info', text1: '该企业未留下联系方式' });
      return;
    }
    contactRef.current?.present();
  };

  const onPreviewImage = (item: any) => {
    const url = mediaUrl(item);
    const index = previewUrls.indexOf(url);
    setPreview({ urls: previewUrls, index: Math.max(index, 0) });
  };

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <SafeView backgroundColor="#FFFFFF">
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingTop: insets.top + scaleSizeH(81) }]}>
          {/* 头像 + 企业名称/认证角标 */}
          <View style={styles.headerRow}>
            <View style={styles.logoWrap}>
              {data?.avatar ? (
                <ExpoImage
                  source={{ uri: data.avatar }}
                  recyclingKey={data.avatar}
                  style={styles.logo}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={[styles.logo, styles.logoEmpty]} />
              )}
              <View style={styles.logoBadge}>
                <VerifiedBadgeIcon size={13} />
              </View>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.name}>{data?.name || ''}</Text>
              {auths.includes('LOCATION') && <GoldBadge />}
            </View>
          </View>

          {/* 公司地址 */}
          <Text style={styles.sectionLabel}>公司地址</Text>
          <Text style={styles.address}>{data?.address || ''}</Text>

          {/* 导航 / 查看联系方式 */}
          <View style={styles.btnRow}>
            <NavPill onPress={() => openNavigation(data)} />
            {showContact && <ContactPill onPress={onShowContact} />}
          </View>
        </View>

        {/* 模块 tab */}
        <View style={styles.tabsWrap}>
          <WebsiteTabs tabs={tabs} activeId={currentTab?.id} onChange={(t) => setActiveTab(t.id)} />
        </View>

        {/* tab 内容 */}
        {currentTab?.id === -2 ? (
          <View style={styles.infoContent}>
            {!!stripHtml(introHtml) && (
              <>
                <Text style={styles.infoTitle}>企业简介</Text>
                <ModuleHtml html={introHtml} />
              </>
            )}
            {medias.length > 0 && (
              <>
                <Text style={[styles.infoTitle, styles.albumTitle]}>企业相册</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumScroll}>
                  <View style={styles.albumRow}>
                    {medias.map((item, ix) => (
                      <AlbumItem
                        key={ix}
                        item={item}
                        width={scaleSizeW(290)}
                        height={scaleSizeW(175)}
                        radius={scaleSizeW(10)}
                        onPreview={() => onPreviewImage(item)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
            {!stripHtml(introHtml) && medias.length === 0 && (
              <Text style={styles.emptyText}>暂无内容</Text>
            )}
          </View>
        ) : currentTab?.id === -1 ? (
          <DynamicsTab cpId={cpId} active={currentTab?.id === -1} />
        ) : (
          <View style={styles.infoContent}>
            <ModuleHtml html={currentTab?.content?.content || ''} />
          </View>
        )}
        <View style={styles.bottomPad} />
      </ScrollView>

      <BackCircle onPress={() => navigation.goBack()} />
      <ContactSheet ref={contactRef} contacts={contacts} onClose={() => contactRef.current?.dismiss()} />

      <Modal transparent visible={!!preview} onRequestClose={() => setPreview(null)}>
        {!!preview && (
          <GestureViewer
            data={preview.urls}
            initialIndex={preview.index}
            renderItem={(uri: string) => (
              <ExpoImage source={{ uri }} style={styles.previewImage} contentFit="contain" transition={100} />
            )}
            ListComponent={ScrollView}
            onDismiss={() => setPreview(null)}
            onSingleTap={() => setPreview(null)}
          />
        )}
      </Modal>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
  },
  logo: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  logoBadge: {
    position: 'absolute',
    right: -scaleSizeW(1),
    bottom: -scaleSizeW(1),
  },
  nameCol: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#000000',
  },
  sectionLabel: {
    marginTop: scaleSizeH(40),
    fontSize: setSpText(14),
    fontWeight: '500',
    letterSpacing: -0.4,
    color: '#000000',
  },
  address: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#000000',
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(19),
  },
  tabsWrap: {
    marginTop: scaleSizeH(18),
  },
  infoContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
  },
  infoTitle: {
    fontSize: setSpText(14),
    fontWeight: '700',
    color: '#000000',
    marginBottom: scaleSizeH(8),
  },
  albumTitle: {
    marginTop: scaleSizeH(22),
  },
  albumScroll: {
    marginHorizontal: -scaleSizeW(16),
  },
  albumRow: {
    flexDirection: 'row',
    gap: scaleSizeW(15),
    paddingHorizontal: scaleSizeW(16),
  },
  emptyText: {
    marginTop: scaleSizeH(40),
    fontSize: setSpText(13),
    color: '#999999',
    textAlign: 'center',
  },
  bottomPad: {
    height: scaleSizeH(40),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
