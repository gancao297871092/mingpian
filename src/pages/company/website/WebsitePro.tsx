import React, { useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { ChevronDownIcon, VerifiedBadgeIcon } from './icons';

const CERT_BG = require('@/assets/company-website/cert-bg.png');

interface WebsiteProProps {
  cpId: number | string;
  fromShare?: number | string;
}

/** 菜单树拍平为 tab 列表（menuType 1 叶子直接展示；父菜单取其 menuType 1 子项；对齐小程序 feeView treeVOList，SelectTree 层级选择暂不实现） */
function flattenTree(tree: any[]): WebsiteTab[] {
  const tabs: WebsiteTab[] = [];
  (tree || []).forEach((node: any) => {
    if (node.menuType === 1) {
      tabs.push({ id: node.id, name: node.menuName, content: node.menuContent });
    } else if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        if (child.menuType === 1) {
          tabs.push({ id: child.id, name: child.menuName, content: child.menuContent });
        }
      });
    }
  });
  return tabs;
}

/** 企业官网升级版（figma 2136:6665，收费版深色官网，对齐小程序 feeView） */
export default function WebsitePro({ cpId, fromShare }: WebsiteProProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data } = useCompanyMain(cpId);
  const userInfo = useUserStore((s) => s.userInfo);
  const contactRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<number | string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null);

  const tabs: WebsiteTab[] = useMemo(() => {
    if (!data) return [];
    return [...flattenTree(data.treeVOList), { id: -1, name: '最新动态' }];
  }, [data]);

  const auths: string[] = (data?.authTypeList || []).map((o: any) => o.authTypeCode);
  const isMyCompany = !!(userInfo?.cpId && String(userInfo.cpId) === String(cpId));
  const showContact = String(fromShare || 0) === '1' && !isMyCompany;
  const contacts = data?.contactList || [];
  const intro = stripHtml(data?.desTxt) || stripHtml(data?.des);
  const medias: any[] = data?.mediaLinkList || [];
  const previewUrls = medias.filter((m) => !isVideoMedia(m)).map(mediaUrl);

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

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

  return (
    <SafeView backgroundColor="#2F2F2F">
      <StatusBar barStyle="light-content" />
      {/* 右上角认证图标底纹（figma 2184:5723，256 图左对齐、167 宽裁切、10% 透明度） */}
      <View style={styles.certBg} pointerEvents="none">
        <ExpoImage source={CERT_BG} style={styles.certBgImg} contentFit="contain" />
      </View>
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
                <VerifiedBadgeIcon size={18} />
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
            <NavPill dark onPress={() => openNavigation(data)} />
            {showContact && <ContactPill dark onPress={onShowContact} />}
          </View>

          {/* 关于企业 */}
          {!!intro && (
            <>
              <View style={styles.aboutRow}>
                <Text style={[styles.sectionLabel, styles.aboutLabel]}>关于企业</Text>
                {showToggle && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.expandBtn}
                    onPress={() => setExpanded((v) => !v)}
                  >
                    <Text style={styles.expandText}>{expanded ? '收起' : '展开'}</Text>
                    <View style={expanded && styles.expandIconUp}>
                      <ChevronDownIcon size={10} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <Text
                style={styles.aboutDesc}
                numberOfLines={expanded ? undefined : 4}
                onTextLayout={(e) => {
                  if (!showToggle && e.nativeEvent.lines.length > 4) setShowToggle(true);
                }}
              >
                {intro}
              </Text>
            </>
          )}

          {/* 企业相册 */}
          {medias.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, styles.albumLabel]}>企业相册</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.albumScroll}
                contentContainerStyle={styles.albumRow}
              >
                {medias.map((item, ix) => (
                  <AlbumItem
                    key={ix}
                    item={item}
                    width={scaleSizeW(150)}
                    height={scaleSizeW(84)}
                    radius={scaleSizeW(10)}
                    onPreview={() => onPreviewImage(item)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* 模块 tab */}
        {tabs.length > 0 && (
          <View style={styles.tabsWrap}>
            <WebsiteTabs dark tabs={tabs} activeId={currentTab?.id} onChange={(t) => setActiveTab(t.id)} />
          </View>
        )}

        {/* tab 内容 */}
        {currentTab?.id === -1 ? (
          <DynamicsTab cpId={cpId} active={currentTab?.id === -1} />
        ) : (
          !!currentTab && (
            <View style={styles.infoContent}>
              <ModuleHtml
                dark
                html={typeof currentTab.content === 'string' ? currentTab.content : currentTab.content?.content || ''}
              />
            </View>
          )
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
  certBg: {
    position: 'absolute',
    top: scaleSizeH(33),
    right: 0,
    width: scaleSizeW(167),
    height: scaleSizeW(256),
    overflow: 'hidden',
  },
  certBgImg: {
    width: scaleSizeW(256),
    height: scaleSizeW(256),
    opacity: 0.1,
  },
  content: {
    paddingHorizontal: scaleSizeW(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: scaleSizeW(62),
    height: scaleSizeW(62),
  },
  logo: {
    width: scaleSizeW(62),
    height: scaleSizeW(62),
    borderRadius: scaleSizeW(31),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  logoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  nameCol: {
    flex: 1,
    marginLeft: scaleSizeW(20),
    gap: scaleSizeH(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionLabel: {
    marginTop: scaleSizeH(30),
    fontSize: setSpText(14),
    fontWeight: '500',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  address: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(19),
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutLabel: {
    marginTop: scaleSizeH(30),
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
    marginTop: scaleSizeH(30),
  },
  expandText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  expandIconUp: {
    transform: [{ rotate: '180deg' }],
  },
  aboutDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(21),
    color: '#FFFFFF',
  },
  albumLabel: {
    marginTop: scaleSizeH(30),
  },
  albumScroll: {
    marginTop: scaleSizeH(10),
    marginHorizontal: -scaleSizeW(16),
  },
  albumRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
  },
  tabsWrap: {
    marginTop: scaleSizeH(30),
  },
  infoContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
  },
  bottomPad: {
    height: scaleSizeH(40),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
