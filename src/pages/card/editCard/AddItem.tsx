import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { AppAlert } from '@/components/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import { API } from '@/api';
import { getEditorResult } from '@/utils/editorBridge';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import SafeView from '@/components/SafeView';
import LongHtmlView from '@/components/LongHtmlView';
import type { RootStackParamList } from '@/route/map';
import { CameraGrayIcon, DelCircleIcon, ExpandIcon } from './stepIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'addItem'>;

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

  useEffect(() => {
    if (itemId) {
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      AppAlert.alert('提示', '请输入板块名称');
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
        navigation.goBack();
      }
    } catch {
      AppAlert.alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 板块图片上传
  const uploadImg = async () => {
    if (mediaLinkList.length >= 9) {
      AppAlert.alert('提示', '最多上传9张图片');
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
          url: mediaData.mdUrl,
          mdUrl: mediaData.mdUrl,
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
        AppAlert.alert('上传失败');
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

  // 板块内容编辑：与发布长图文动态同一编辑器（publishLongText，simple 去掉话题/图片），结果经 editorBridge 回传
  const goEditContent = () => {
    navigation.navigate('publishLongText', {
      initialHtml: itContent,
      simple: true,
    });
  };

  const hasContent = !!itContent && itContent !== '<p><br></p>';

  const onImagePress = (urls: string[], index: number) => {
    setPreviewImages(urls);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  // 内容区可用宽度：屏幕宽 - 页面左右 padding
  const contentWidth = screenWidth - scaleSizeW(32);

  return (
    <SafeView backgroundColor="#fff" disableTop>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 图片（figma 新增板块：85x85 圆角10，右上角删除钮） */}
          <View style={styles.imgGrid}>
            {mediaLinkList.map((item, index) => (
              <View key={item.mdId || index} style={styles.imgBox}>
                <Image
                  source={{ uri: item.url || item.mdUrl }}
                  style={styles.img}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.imgDel}
                  hitSlop={8}
                  onPress={() => onDeleteMedia(index)}
                >
                  <DelCircleIcon size={16} />
                </TouchableOpacity>
              </View>
            ))}
            {mediaLinkList.length < 9 && (
              <TouchableOpacity style={styles.uploadBox} activeOpacity={0.8} onPress={uploadImg}>
                <CameraGrayIcon size={33} />
              </TouchableOpacity>
            )}
          </View>

          {/* 板块名称 + 字数 */}
          <View style={styles.titleRow}>
            <TextInput
              style={styles.titleInput}
              placeholder="板块名称"
              placeholderTextColor="#6C6C6C"
              value={itTitle}
              onChangeText={setItTitle}
              maxLength={40}
            />
            <Text style={styles.charCount}>{itTitle.length}/40</Text>
          </View>
          <View style={styles.divider} />

          {/* 板块内容：富文本展示（复用长图文 LongHtmlView），点击进入编辑页 */}
          <TouchableOpacity activeOpacity={0.8} onPress={goEditContent}>
            <View style={styles.contentBox}>
              {hasContent ? (
                <LongHtmlView
                  html={itContent}
                  contentWidth={contentWidth}
                  baseStyle={styles.richBase}
                  onImagePress={onImagePress}
                />
              ) : (
                <Text style={styles.contentPlaceholder}>添加板块内容...</Text>
              )}
            </View>
            <View style={styles.contentFooter}>
              <View style={styles.editBtn}>
                <ExpandIcon size={16} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* 保存 */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>

          <View style={styles.bottomGap} />
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
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
  },
  imgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
    marginTop: scaleSizeW(39),
  },
  imgBox: {
    width: scaleSizeW(85),
    height: scaleSizeW(85),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgDel: {
    position: 'absolute',
    right: scaleSizeW(3),
    top: scaleSizeW(3),
    zIndex: 2,
  },
  uploadBox: {
    width: scaleSizeW(85),
    height: scaleSizeW(85),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeW(30),
  },
  titleInput: {
    flex: 1,
    fontWeight: '500',
    fontSize: setSpText(16),
    color: '#000000',
    padding: 0,
    height: scaleSizeW(24),
  },
  charCount: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginTop: scaleSizeW(7),
  },
  contentBox: {
    marginTop: scaleSizeW(10),
    minHeight: scaleSizeW(88),
  },
  contentPlaceholder: {
    fontWeight: '400',
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeW(24),
  },
  richBase: {
    fontSize: setSpText(14),
    color: '#333333',
    lineHeight: scaleSizeW(22),
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scaleSizeW(4),
  },
  editBtn: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#2962D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeW(20),
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  bottomGap: {
    height: scaleSizeW(40),
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
    fontSize: setSpText(16),
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
