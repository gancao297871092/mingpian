import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import RenderHtml from 'react-native-render-html';
import { API } from '@/api';
import { getEditorResult } from '@/utils/editorBridge';
import { scaleSizeW } from '@/utils/screenUtils';
import SafeView from '@/components/SafeView';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'addItem'>;

/** 从 HTML 提取所有图片地址 */
function extractImages(html?: string): string[] {
  if (!html) return [];
  const matches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
  return matches
    .map((tag) => {
      const m = tag.match(/src=["']([^"']+)["']/);
      return m ? m[1] : '';
    })
    .filter(Boolean);
}

/** 模块级 ref，供 ImgRenderer 调用 */
const imgPreviewRef = { current: (_src: string) => {} };

function ImgRenderer({ tnode, InternalRenderer, ...props }: any) {
  const src = tnode?.attributes?.src;
  return (
    <TouchableOpacity onPress={() => imgPreviewRef.current(src)} activeOpacity={0.9}>
      <InternalRenderer tnode={tnode} {...props} />
    </TouchableOpacity>
  );
}

export default function AddItem({ route, navigation }: Props) {
  const { itemId, cardId, userId, pjId } = route.params || {};
  const { width: screenWidth } = useWindowDimensions();

  const [itTitle, setItTitle] = useState('');
  const [itContent, setItContent] = useState('');
  const [mediaLinkList, setMediaLinkList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const allImages = useMemo(() => extractImages(itContent), [itContent]);

  useEffect(() => {
    if (itemId) {
      loadDetail();
    }
  }, [itemId]);

  // 从 RichTextEdit 页面返回后接收 HTML
  useFocusEffect(
    useCallback(() => {
      const result = getEditorResult();
      if (result !== null) {
        setItContent(result);
      }
    }, [])
  );

  const loadDetail = async () => {
    try {
      const res = await API.card.projectItemDetail({ itemId: itemId! });
      if (res.code === '200' && res.data) {
        const d = res.data;
        setItTitle(d.itTitle || '');
        setItContent(d.itContent || '');
        setMediaLinkList(
          (d.mediaLinkList || [])
            .filter((o: any) => !!o.media)
            .map((o: any) => ({
              ...o,
              url: o.media.mdUrl,
              mdUrl: o.media.mdUrl,
            }))
        );
      }
    } catch {
      // ignore
    }
  };

  const onSave = async () => {
    if (!itTitle) {
      Alert.alert('提示', '请输入板块名称');
      return;
    }
    setSaving(true);
    try {
      const needSaveMediaList = mediaLinkList.filter((o) => o.isLocal);
      const _res = await API.card.projectItemUpdate({
        userId,
        cardId,
        pjId,
        id: itemId,
        itTitle,
        itContent,
        mediaList: needSaveMediaList.map((o) => ({
          ...o,
          type: 5,
          mdId: o.id,
          targetId: itemId,
          isIndex: 0,
          media: {
            id: o.id,
            mdUrl: o.mdUrl,
            duration: o.duration,
            fileType: o.fileType,
            width: o.width,
            height: o.height,
            size: o.size,
          },
        })),
      });
      if (_res.code === '200') {
        Alert.alert('保存成功', '', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navBtn}>取消</Text>
        </TouchableOpacity>
      ),
      headerTitle: '新增板块',
      headerRight: () => (
        <TouchableOpacity onPress={onSave} disabled={saving}>
          <Text style={[styles.navBtn, saving && { opacity: 0.5 }]}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, itTitle, itContent, mediaLinkList]);

  // 板块图片上传
  const uploadImg = async () => {
    if (mediaLinkList.length >= 9) {
      Alert.alert('提示', '最多上传9张图片');
      return;
    }
    try {
      const image = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        compressImageQuality: 0.8,
      });
      const formData = new FormData();
      formData.append('file', {
        uri: image.path,
        type: image.mime || 'image/jpeg',
        name: image.filename || 'image.jpg',
      } as any);
      const res = await API.file.upload(formData);
      if (res.code === '200' && res.data) {
        const mediaData = res.data;
        const newLink = {
          mdId: mediaData.id,
          url: mediaData.url,
          mdUrl: mediaData.url,
          isLocal: true,
          id: mediaData.id,
          fileType: 'image',
          width: mediaData.width,
          height: mediaData.height,
        };
        setMediaLinkList((prev) => [...prev, newLink]);
      }
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('上传失败');
      }
    }
  };

  const onDeleteMedia = (index: number) => {
    const item = mediaLinkList[index];
    if (item.mdId && !item.isLocal) {
      API.common.mediaDel({ mediaId: item.mdId }).catch(() => {});
    }
    setMediaLinkList((prev) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
  };

  const goEditContent = () => {
    navigation.navigate('richTextEdit', {
      initialHtml: itContent,
      placeholder: '请输入板块内容',
    });
  };

  const hasContent = !!itContent && itContent !== '<p><br></p>';

  useEffect(() => {
    imgPreviewRef.current = (src: string) => {
      const idx = allImages.indexOf(src);
      setPreviewIndex(idx >= 0 ? idx : 0);
      setPreviewImages(allImages.length ? allImages : [src]);
      setPreviewVisible(true);
    };
  }, [allImages]);

  const renderers = { img: ImgRenderer };
  const htmlSource = useMemo(() => ({ html: itContent || '<p></p>' }), [itContent]);

  // 内容区可用宽度：屏幕宽 - 外层 scroll 左右 padding - box 内左右 padding
  const contentWidth = screenWidth - scaleSizeW(64);

  return (
    <SafeView backgroundColor="#fff" disableTop>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 板块名称 */}
          <View style={styles.box}>
            <Text style={styles.boxLabel}>板块名称</Text>
            <View style={styles.titleRow}>
              <TextInput
                style={styles.titleInput}
                placeholder="添加标题"
                placeholderTextColor="#a3a3a3"
                value={itTitle}
                onChangeText={setItTitle}
                maxLength={40}
              />
              {!!itTitle && (
                <TouchableOpacity onPress={() => setItTitle('')}>
                  <Image source={require('@/assets/ming/del_1.png')} style={styles.clearIcon} />
                </TouchableOpacity>
              )}
              <Text
                style={[
                  styles.charCount,
                  { color: itTitle.length > 40 ? '#ff0000' : '#999999' },
                ]}
              >
                {itTitle.length}/40
              </Text>
            </View>
          </View>

          {/* 板块内容 — 富文本回显（对齐小程序 mp-edit） */}
          <View style={styles.box}>
            <Text style={styles.boxLabel}>板块内容</Text>
            {hasContent ? (
              <RenderHtml
                contentWidth={contentWidth}
                source={htmlSource}
                renderers={renderers as any}
                tagsStyles={{
                  p: {
                    marginVertical: scaleSizeW(4),
                    fontSize: scaleSizeW(14),
                    color: '#333333',
                    lineHeight: scaleSizeW(22),
                  },
                  img: {
                    marginVertical: scaleSizeW(8),
                    borderRadius: scaleSizeW(8),
                  },
                  h1: { fontSize: scaleSizeW(20), fontWeight: 'bold', marginVertical: scaleSizeW(8) },
                  h2: { fontSize: scaleSizeW(18), fontWeight: 'bold', marginVertical: scaleSizeW(6) },
                  h3: { fontSize: scaleSizeW(16), fontWeight: 'bold', marginVertical: scaleSizeW(4) },
                  li: { fontSize: scaleSizeW(14), color: '#333333', lineHeight: scaleSizeW(22) },
                  blockquote: {
                    borderLeftWidth: 4,
                    borderLeftColor: '#ddd',
                    paddingLeft: scaleSizeW(12),
                    marginVertical: scaleSizeW(8),
                    color: '#666',
                  },
                }}
              />
            ) : (
              <Text style={styles.contentPlaceholder}>请输入板块内容</Text>
            )}
          </View>

          {/* 点击进入深度编辑页 */}
          <TouchableOpacity style={[styles.box, styles.editBtnBox]} onPress={goEditContent} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>点击进入深度编辑页</Text>
          </TouchableOpacity>

          {/* 图片上传 */}
          <View style={{ marginTop: scaleSizeW(6) }}>
            <View style={styles.imgGrid}>
              {mediaLinkList.map((item, index) => (
                <View
                  key={item.mdId || index}
                  style={[styles.imgBox, index % 2 === 1 && styles.imgBoxEven]}
                >
                  <TouchableOpacity
                    style={styles.imgDel}
                    onPress={() => onDeleteMedia(index)}
                  >
                    <Image source={require('@/assets/ming/del_1.png')} style={styles.imgDelIcon} />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: item.url || item.mdUrl }}
                    style={styles.img}
                    resizeMode="cover"
                  />
                </View>
              ))}
              {mediaLinkList.length < 9 && (
                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    mediaLinkList.length % 2 === 1 && styles.imgBoxEven,
                  ]}
                  onPress={uploadImg}
                >
                  <Image source={require('@/assets/ming/upload.png')} style={styles.uploadIcon} />
                  <Text style={styles.uploadText}>
                    上传图片（{mediaLinkList.length}/9）
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: scaleSizeW(40) }} />
        </ScrollView>

        {/* 图片预览弹窗 */}
        <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewVisible(false)}>
              <Text style={styles.previewCloseText}>关闭</Text>
            </TouchableOpacity>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: previewIndex * screenWidth, y: 0 }}
            >
              {previewImages.map((url, i) => (
                <View key={i} style={[styles.previewPage, { width: screenWidth }]}>
                  <Image source={{ uri: url }} style={styles.previewImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  navBtn: {
    fontSize: scaleSizeW(15),
    color: '#000000',
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(16),
  },
  box: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(12),
    marginTop: scaleSizeW(11),
    minHeight: scaleSizeW(70),
  },
  boxLabel: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#6c6c6c',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeW(4),
  },
  titleInput: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: scaleSizeW(16),
    color: '#000000',
    padding: 0,
    minHeight: scaleSizeW(28),
  },
  clearIcon: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    marginHorizontal: scaleSizeW(8),
  },
  charCount: {
    fontSize: scaleSizeW(12),
    color: '#999999',
  },
  contentPlaceholder: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#a3a3a3',
    lineHeight: scaleSizeW(22),
    marginTop: scaleSizeW(4),
  },
  editBtnBox: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: scaleSizeW(48),
    marginTop: scaleSizeW(6),
  },
  editBtnText: {
    fontSize: scaleSizeW(15),
    color: '#576b95',
    fontWeight: '500',
  },
  imgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleSizeW(11),
  },
  imgBox: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: scaleSizeW(18),
    overflow: 'hidden',
    marginBottom: scaleSizeW(10),
    position: 'relative',
    backgroundColor: '#f9f9f9',
  },
  imgBoxEven: {
    marginLeft: '4%',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgDel: {
    position: 'absolute',
    right: scaleSizeW(8),
    top: scaleSizeW(8),
    width: scaleSizeW(24),
    height: scaleSizeW(24),
    borderRadius: scaleSizeW(12),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  imgDelIcon: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
  },
  uploadBox: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: scaleSizeW(18),
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSizeW(10),
  },
  uploadIcon: {
    width: scaleSizeW(24),
    height: scaleSizeW(22),
  },
  uploadText: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#999999',
    marginTop: scaleSizeW(11),
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: scaleSizeW(50),
    right: scaleSizeW(20),
    zIndex: 10,
    padding: scaleSizeW(8),
  },
  previewCloseText: {
    color: '#fff',
    fontSize: scaleSizeW(16),
  },
  previewPage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
