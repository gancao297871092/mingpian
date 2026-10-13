import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QuillEditor from 'react-native-cn-quill';
import ImagePicker from 'react-native-image-crop-picker';
import SafeView from '@/components/SafeView';
import { setEditorResult } from '@/utils/editorBridge';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'richTextEdit'>;

export default function RichTextEdit({ route, navigation }: Props) {
  const { initialHtml, placeholder = '请输入板块内容', title = '板块内容' } = route.params || {};
  const quillRef = useRef<QuillEditor>(null!);
  const [, setHtml] = useState(initialHtml || '<p><br></p>');
  const [headingModal, setHeadingModal] = useState(false);

  const onSave = useCallback(async () => {
    try {
      const result = await quillRef.current.getHtml();
      setEditorResult(result);
      navigation.goBack();
    } catch {
      // ignore
    }
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navBtn}>取消</Text>
        </TouchableOpacity>
      ),
      headerTitle: title,
      headerRight: () => (
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.navBtn}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, onSave, title]);

  // 编辑器命令封装
  const exec = (fn: () => void) => {
    try {
      fn();
    } catch {
      // ignore
    }
  };

  // 撤销
  const onUndo = () => exec(() => (quillRef.current as any).commandDOM('$.history.undo()'));
  // 重做
  const onRedo = () => exec(() => (quillRef.current as any).commandDOM('$.history.redo()'));
  // 插入图片
  const onInsertImage = async () => {
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
        const sel = await (quillRef.current as any).getSelection(true);
        quillRef.current.insertEmbed(sel?.index || 0, 'image', res.data.url);
      }
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('上传失败');
      }
    }
  };
  // 插入文本（聚焦即可）
  const onInsertText = () => exec(() => quillRef.current.focus());
  // 插入标题
  const onInsertHeading = (level: number) => {
    exec(() => {
      (quillRef.current as any).format('header', level);
      setHeadingModal(false);
    });
  };
  // 清空
  const onClear = () => {
    Alert.alert('确认', '确定清空内容吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => exec(() => {
          quillRef.current.getLength().then((len: number) => {
            quillRef.current.deleteText(0, len);
            quillRef.current.insertText(0, '\n');
          });
        }),
      },
    ]);
  };

  return (
    <SafeView backgroundColor="#fff">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 顶部工具栏 — 对齐小程序 editor.vue */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={onUndo}>
            <Text style={styles.toolIcon}>↩</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={onRedo}>
            <Text style={styles.toolIcon}>↪</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={onInsertImage}>
            <Text style={styles.toolIcon}>🖼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={onInsertText}>
            <Text style={styles.toolIcon}>T</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setHeadingModal(true)}>
            <Text style={styles.toolIcon}>H</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={onClear}>
            <Text style={styles.toolIcon}>🗑</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <QuillEditor
            ref={quillRef}
            initialHtml={initialHtml || '<p><br></p>'}
            onHtmlChange={(data) => setHtml(data.html || '')}
            quill={{
              placeholder: placeholder || '请输入板块内容',
            }}
            theme={{
              background: '#ffffff',
              color: '#000000',
              placeholder: '#a3a3a3',
            }}
            container={false}
            autoSize
            style={styles.editor}
            webview={{
              scrollEnabled: false,
              hideKeyboardAccessoryView: true,
              keyboardDisplayRequiresUserAction: false,
            }}
          />
          <View style={{ height: scaleSizeW(40) }} />
        </ScrollView>

        {/* 插入标题弹窗 */}
        <Modal
          visible={headingModal}
          transparent
          animationType="fade"
          onRequestClose={() => setHeadingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>插入标题</Text>
              <TouchableOpacity style={styles.modalItem} onPress={() => onInsertHeading(1)}>
                <Text style={styles.modalItemText}>大标题</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={() => onInsertHeading(3)}>
                <Text style={styles.modalItemText}>中标题</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={() => onInsertHeading(5)}>
                <Text style={styles.modalItemText}>小标题</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setHeadingModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ededed',
    paddingVertical: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(8),
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSizeW(6),
  },
  toolIcon: {
    fontSize: scaleSizeW(20),
    color: '#000000',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(16),
  },
  editor: {
    backgroundColor: '#ffffff',
    minHeight: scaleSizeW(300),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: scaleSizeW(12),
    width: '75%',
    paddingTop: scaleSizeW(20),
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: scaleSizeW(17),
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: scaleSizeW(12),
  },
  modalItem: {
    paddingVertical: scaleSizeW(14),
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
  },
  modalItemText: {
    fontSize: scaleSizeW(16),
    color: '#000000',
  },
  modalCancel: {
    paddingVertical: scaleSizeW(14),
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
  },
  modalCancelText: {
    fontSize: scaleSizeW(16),
    color: '#576b95',
  },
});
