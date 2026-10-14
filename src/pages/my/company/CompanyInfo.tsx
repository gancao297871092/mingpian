import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import ImageUploader from '@/components/ImageUploader';
import LongHtmlView from '@/components/LongHtmlView';
import { API } from '@/api';
import { getEditorResult } from '@/utils/editorBridge';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { CONTACT_MAX } from '@/data/company';
import { CompanyInfoIcon, EditPenIcon, TipInfoIcon, TrashLineIcon } from '../myIcons';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

const TABS = ['企业信息', '企业相册', '菜单模块', '联系方式'] as const;

type TabKey = (typeof TABS)[number];

/** 海报/LOGO 裁剪 1:1（对齐小程序 introduction.vue uploadImg） */
async function pickCropUpload(): Promise<string | null> {
  try {
    const image = await ImagePicker.openPicker({
      width: 800,
      height: 800,
      cropping: true,
      compressImageQuality: 0.8,
      mediaType: 'photo',
    });
    const formData = new FormData();
    formData.append('file', {
      uri: image.path,
      type: image.mime || 'image/jpeg',
      name: image.filename || 'image.jpg',
    } as any);
    const res = await API.file.upload(formData);
    if (res.code === '200' && res.data) return res.data.mdUrl;
    return null;
  } catch (e: any) {
    if (e?.code !== 'E_PICKER_CANCELLED') Toast.show({ type: 'error', text1: '上传失败' });
    return null;
  }
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

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

interface InfoForm {
  avatar: string;
  cardPoster: string;
  posterTitle: string;
  des: string;
}

/** 企业信息 tab：LOGO/海报封面上传 + 分享卡企业名 + 企业简介（富文本，深度编辑走 publishLongText） */
function InfoTab({
  form,
  onChange,
  onOpenIntroEditor,
}: {
  form: InfoForm;
  onChange: (patch: Partial<InfoForm>) => void;
  onOpenIntroEditor: () => void;
}) {
  const [uploading, setUploading] = useState<'avatar' | 'cardPoster' | null>(null);

  const onPick = async (key: 'avatar' | 'cardPoster') => {
    setUploading(key);
    const url = await pickCropUpload();
    setUploading(null);
    if (url) onChange({ [key]: url } as Partial<InfoForm>);
  };

  const introText = stripHtml(form.des);

  return (
    <View>
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>企业LOGO</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.logoWrap} onPress={() => onPick('avatar')}>
            {form.avatar ? (
              <ExpoImage source={{ uri: form.avatar }} style={styles.logo} contentFit="cover" transition={150} />
            ) : (
              <View style={styles.logo} />
            )}
            <View style={styles.logoEdit}>
              {uploading === 'avatar' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <EditPenIcon size={12} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.9} style={styles.posterCard} onPress={() => onPick('cardPoster')}>
          {form.cardPoster ? (
            <ExpoImage source={{ uri: form.cardPoster }} style={styles.poster} contentFit="cover" transition={150} />
          ) : (
            <View style={styles.poster} />
          )}
          {uploading === 'cardPoster' && (
            <View style={styles.posterLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.posterLabel}>企业海报封面</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.infoNote}>自定义分享卡上的企业名字</Text>
      <TipBanner text="仅用于分享卡展示，不影响企业认证信息，超过24个字自动省略" />
      <View style={styles.nameCard}>
        <TextInput
          style={styles.nameInput}
          value={form.posterTitle}
          onChangeText={(t) => onChange({ posterTitle: t.slice(0, 40) })}
          placeholder="请输入企业名称"
          placeholderTextColor="#999999"
          maxLength={40}
        />
        <EditPenIcon size={20} color={GRAY} />
      </View>
      <Text style={styles.sectionLabel}>企业简介</Text>
      <View style={styles.introCard}>
        <TouchableOpacity activeOpacity={0.8} onPress={onOpenIntroEditor}>
          {introText ? (
            <LongHtmlView
              html={form.des}
              contentWidth={SCREEN_WIDTH - scaleSizeW(60)}
              baseStyle={styles.introText}
            />
          ) : (
            <Text style={styles.introPlaceholder}>请输入企业简介</Text>
          )}
        </TouchableOpacity>
        <DeepEditButton onPress={onOpenIntroEditor} />
      </View>
    </View>
  );
}

interface PhotoItem {
  mdId: number | string;
  isIndex?: number;
  media?: { mdUrl?: string };
  [key: string]: any;
}

/** 企业相册 tab（公用 ImageUploader；首图即封面，拖拽排序后首图变化时同步 isIndex，对齐小程序 enterCover.vue）
 *  tab 切换会卸载组件，故每次挂载自行拉取最新列表（不能用父级首次快照，否则上传后被旧数据冲掉） */
function PhotosTab() {
  // url → 素材关系记录（ref 保证 uploadFn/onChange 回调里同步可查）
  const linkMapRef = useRef(new Map<string, PhotoItem>());
  const [cpId, setCpId] = useState<number | string | null>(null);
  const [mediaList, setMediaList] = useState<PhotoItem[]>([]);
  const coverIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.company.infoPosterPre();
        if (res.code !== '200' || !res.data) return;
        setCpId(res.data.cpId ?? null);
        const list: PhotoItem[] = res.data.mediaList || [];
        const map = new Map<string, PhotoItem>();
        list.forEach((o) => {
          if (o.media?.mdUrl) map.set(o.media.mdUrl, o);
        });
        linkMapRef.current = map;
        // 封面排最前展示
        const sorted = [...list].sort((a, b) => (b.isIndex ? 1 : 0) - (a.isIndex ? 1 : 0));
        setMediaList(sorted);
        coverIdRef.current = sorted.find((o) => !!o.isIndex)?.mdId ?? null;
      } catch {
        // ignore
      }
    })();
  }, []);

  const urls = useMemo(
    () => mediaList.map((o) => o.media?.mdUrl).filter(Boolean) as string[],
    [mediaList],
  );

  // 上传：multipart 拿 WqUserMedia，注册素材关系（type=4 企业相册）后返回 url 给组件展示
  const uploadFn = useCallback(
    async (uri: string, mime?: string) => {
      if (!cpId) throw new Error('missing cpId');
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mime || 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      } as any);
      const res = await API.file.upload(formData);
      if (res.code !== '200' || !res.data) throw new Error('upload failed');
      const link: PhotoItem = {
        userId: res.data.userId,
        type: 4,
        mdId: res.data.id,
        targetId: cpId,
        isIndex: 0,
        media: { ...res.data },
      };
      await API.common.mediaLinkSave([link]);
      linkMapRef.current.set(res.data.mdUrl, link);
      return res.data.mdUrl;
    },
    [cpId],
  );

  // 首图变化 → 同步封面 isIndex（新首图置 1，旧封面置 0，对齐小程序 onSetIndex）
  const syncCover = (next: PhotoItem[]) => {
    const newCoverId = next[0]?.mdId ?? null;
    if (newCoverId === coverIdRef.current) return;
    if (newCoverId) API.common.mediaLinkUpdate({ mdId: Number(newCoverId), isIndex: 1 }).catch(() => {});
    if (coverIdRef.current) API.common.mediaLinkUpdate({ mdId: Number(coverIdRef.current), isIndex: 0 }).catch(() => {});
    coverIdRef.current = newCoverId;
  };

  // 设为封面：移到首位（首图即封面）并同步后端
  const onSetCover = useCallback((url: string) => {
    const item = linkMapRef.current.get(url);
    if (!item) return;
    setMediaList((prev) => {
      if (prev[0] === item) return prev;
      const next = [item, ...prev.filter((o) => o !== item)];
      syncCover(next);
      return next;
    });
  }, []);

  const renderItemActions = useCallback(
    (item: { url?: string }, index: number) => {
      if (index === 0 || !item.url) return null;
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.setCoverBtn}
          onPress={() => onSetCover(item.url!)}
        >
          <Text style={styles.setCoverText}>设为封面</Text>
        </TouchableOpacity>
      );
    },
    [onSetCover],
  );

  const onChange = useCallback((nextUrls: string[]) => {
    const map = linkMapRef.current;
    // 被移除的素材调删除接口
    map.forEach((o, u) => {
      if (!nextUrls.includes(u)) {
        if (o.mdId) API.common.mediaDel({ mediaId: Number(o.mdId) }).catch(() => {});
        map.delete(u);
      }
    });
    const next = nextUrls.map((u) => map.get(u)).filter(Boolean) as PhotoItem[];
    setMediaList(next);
    syncCover(next);
  }, []);

  return (
    <View>
      <TipBanner text="图片建议宽高比为4:3，可拖拽排序，首张为封面" style={styles.photosTip} />      <ImageUploader
        value={urls}
        onChange={onChange}
        uploadFn={uploadFn}
        layout="grid"
        columns={3}
        itemSize={scaleSizeW(116)}
        gap={scaleSizeW(11)}
        showCoverBadge
        renderItemActions={renderItemActions}
        addBackgroundColor="#FFFFFF"
        style={styles.photoUploader}
      />
    </View>
  );
}

/** 菜单模块 tab（对齐小程序 enterMenus.vue：过滤 isMust 固定模块） */
function MenusTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [cpId, setCpId] = useState<number | string | null>(null);
  const [menus, setMenus] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await API.company.modulePre();
          if (res.code !== '200' || !res.data) return;
          setCpId(res.data.cpId ?? null);
          setMenus((res.data.moduleList || []).filter((o: any) => !o.isMust));
        } catch {
          // ignore
        }
      })();
    }, []),
  );

  const onDelete = (item: any) => {
    Alert.alert('删除模块', `确认删除「${item.mdName || ''}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.company.moduleDel({ mdId: item.id });
            if (res.code !== '200') return;
            setMenus((prev) => prev.filter((m) => m.id !== item.id));
          } catch {
            Toast.show({ type: 'error', text1: '删除失败' });
          }
        },
      },
    ]);
  };

  const onAdd = async () => {
    if (!cpId) return;
    try {
      const res = await API.company.moduleAdd({ cpId });
      if (res.code !== '200' || !res.data) return;
      navigation.navigate('companyModuleEdit', { id: res.data.id });
    } catch {
      Toast.show({ type: 'error', text1: '新增失败' });
    }
  };

  return (
    <View>
      {menus.map((m) => (
        <View key={m.id} style={styles.menuRow}>
          <CompanyInfoIcon size={20} />
          <Text style={styles.menuName} numberOfLines={1}>{m.mdName || ''}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() => navigation.navigate('companyModuleEdit', { id: m.id })}
            >
              <EditPenIcon size={20} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onDelete(m)}>
              <TrashLineIcon size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity activeOpacity={0.7} style={styles.addRow} onPress={onAdd}>
        <Text style={styles.addRowText}>+ 新增菜单</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 联系方式 tab（对齐小程序 enterContacts.vue：兼容数组或 list/records/rows 包装） */
function ContactsTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [contacts, setContacts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await API.company.contactList();
          if (res.code !== '200') return;
          const d = res.data;
          setContacts(Array.isArray(d) ? d : d?.list || d?.records || d?.rows || []);
        } catch {
          // ignore
        }
      })();
    }, []),
  );

  const onDelete = (item: any) => {
    const id = item.id ?? item.contactId;
    if (id == null) {
      Toast.show({ type: 'error', text1: '删除失败：缺少联系人ID' });
      return;
    }
    Alert.alert('删除联系方式', `确认删除联系人「${item.name || ''}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.company.contactDel({ id });
            if (res.code !== '200') return;
            setContacts((prev) => prev.filter((c) => (c.id ?? c.contactId) !== id));
          } catch {
            Toast.show({ type: 'error', text1: '删除失败' });
          }
        },
      },
    ]);
  };

  return (
    <View>
      {contacts.map((c, index) => (
        <View key={c.id ?? c.contactId ?? index} style={styles.contactCard}>
          <View style={styles.contactText}>
            <Text style={styles.contactName}>
              {c.position ? `${c.position}·${c.name}` : c.name}
            </Text>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              onPress={() =>
                navigation.navigate('companyContactEdit', {
                  id: c.id ?? c.contactId,
                  name: c.name || '',
                  position: c.position || '',
                  phone: c.phone || '',
                })
              }
            >
              <EditPenIcon size={20} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onDelete(c)}>
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

/** 企业信息（4 个分段 Tab：企业信息/企业相册/菜单模块/联系方式，对齐小程序 enterInfo） */
export default function CompanyInfo() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<TabKey>('企业信息');
  const [pre, setPre] = useState<any>(null);
  const [form, setForm] = useState<InfoForm>({ avatar: '', cardPoster: '', posterTitle: '', des: '' });
  const [saving, setSaving] = useState(false);

  const fetchPre = useCallback(async () => {
    try {
      const res = await API.company.infoPosterPre();
      if (res.code !== '200' || !res.data) return;
      setPre(res.data);
      setForm({
        avatar: res.data.avatar || '',
        cardPoster: res.data.cardPoster || '',
        posterTitle: res.data.posterTitle || '',
        des: res.data.des || '',
      });
    } catch {
      // ignore
    }
  }, []);

  // 仅首次进入拉取回显：从富文本编辑器返回时不能覆盖本地表单（否则会冲掉未保存的简介）
  useEffect(() => {
    fetchPre();
  }, [fetchPre]);

  // 从 publishLongText 返回后接收企业简介 HTML（AddItem 同款桥接）
  useFocusEffect(
    useCallback(() => {
      const result = getEditorResult();
      if (result !== null) {
        setForm((prev) => ({ ...prev, des: result }));
      }
    }, []),
  );

  const onOpenIntroEditor = useCallback(() => {
    navigation.navigate('publishLongText', {
      title: '企业简介',
      initialHtml: form.des || undefined,
    });
  }, [navigation, form.des]);

  const onSave = useCallback(async () => {
    if (tab !== '企业信息' || saving) return;
    if (!form.avatar) {
      Toast.show({ type: 'error', text1: '请上传企业LOGO' });
      return;
    }
    if (!stripHtml(form.des)) {
      Toast.show({ type: 'error', text1: '请输入企业简介' });
      return;
    }
    if (!pre?.cpId) return;
    setSaving(true);
    try {
      const res = await API.company.infoSaveDes({
        id: pre.cpId,
        des: form.des,
        desTxt: stripHtml(form.des),
        avatar: form.avatar,
        cardPoster: form.cardPoster,
        posterTitle: form.posterTitle,
      });
      if (res.code !== '200') return;
      Toast.show({ type: 'success', text1: '保存成功' });
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSaving(false);
    }
  }, [tab, saving, form, pre]);

  useEffect(() => {
    navigation.setOptions({
      headerRight:
        tab === '企业信息'
          ? () => <Text style={styles.headerSave} onPress={onSave}>保存</Text>
          : undefined,
    });
  }, [navigation, tab, onSave]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        {/* 四个 tab 保持挂载不卸载（小程序 v-show 同款），切换时保留各自现状数据 */}
        <View style={tab === '企业信息' ? undefined : styles.tabHidden}>
          <InfoTab
            form={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            onOpenIntroEditor={onOpenIntroEditor}
          />
        </View>
        <View style={tab === '企业相册' ? undefined : styles.tabHidden}>
          <PhotosTab />
        </View>
        <View style={tab === '菜单模块' ? undefined : styles.tabHidden}>
          <MenusTab navigation={navigation} />
        </View>
        <View style={tab === '联系方式' ? undefined : styles.tabHidden}>
          <ContactsTab navigation={navigation} />
        </View>
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
  tabHidden: {
    display: 'none',
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
    overflow: 'hidden',
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
  posterLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  nameInput: {
    flex: 1,
    padding: 0,
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
  introPlaceholder: {
    fontSize: setSpText(14),
    lineHeight: setSpText(23),
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
  setCoverBtn: {
    position: 'absolute',
    left: scaleSizeW(3),
    bottom: scaleSizeW(3),
    height: scaleSizeW(18),
    paddingHorizontal: scaleSizeW(8),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  setCoverText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    color: '#FFFFFF',
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
