import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import QuillEditor from 'react-native-cn-quill';
import ImagePicker from 'react-native-image-crop-picker';
import SafeView from '@/components/SafeView';
import { setEditorResult } from '@/utils/editorBridge';
import { uploadToOss } from '@/utils/ossUpload';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'publishLongText'>;

const PRIMARY = '#2962D4';
const TEXT_MAIN = '#000000';
const TEXT_SUB = '#6C6C6C';
const TILE_BG = '#F5F5F5';
const PANEL_ACTIVE_BG = '#F1F6FF';
const LONG_BODY_LIMIT = 10000;

const CUSTOM_JS = `
var SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ['13px','15px','17px','20px','24px'];
Quill.register(SizeStyle, true);

var BlockEmbed = Quill.import('blots/block/embed');
class Mp4VideoBlot extends BlockEmbed {
  static create(value) {
    var node = document.createElement('video');
    node.setAttribute('src', typeof value === 'string' ? value : value.url);
    node.setAttribute('controls', 'controls');
    node.setAttribute('playsinline', 'playsinline');
    node.setAttribute('webkit-playsinline', 'webkit-playsinline');
    node.style.width = '100%';
    node.style.maxWidth = '100%';
    return node;
  }
  static value(node) {
    return node.getAttribute('src');
  }
}
Mp4VideoBlot.blotName = 'mp4video';
Mp4VideoBlot.tagName = 'video';
Quill.register(Mp4VideoBlot, true);
`;

const CUSTOM_STYLES = ['.ql-editor img { max-width: 100%; } .ql-editor video { max-width: 100%; }'];

const WIDTH_PRESETS = ['25%', '50%', '75%', '100%'];

const SIZE_STOPS: { label: string; value: string | false }[] = [
  { label: '小', value: '13px' },
  { label: '偏小', value: '15px' },
  { label: '标准', value: false },
  { label: '偏大', value: '20px' },
  { label: '大', value: '24px' },
];

const TEXT_COLORS = ['#000000', '#6B7280', '#EF4444', '#F2722C', '#2962D4', '#36BE69', '#7C3AED', '#92400E'];

function htmlToPlainLength(html: string): number {
  return [...html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()].length;
}

function ImageIcon({ color = TEXT_MAIN }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 2.5C17.8315 2.5 18.1495 2.6317 18.3839 2.86612C18.6183 3.10054 18.75 3.41848 18.75 3.75V16.25C18.75 16.5815 18.6183 16.8995 18.3839 17.1339C18.1495 17.3683 17.8315 17.5 17.5 17.5H2.5C2.16848 17.5 1.85054 17.3683 1.61612 17.1339C1.3817 16.8995 1.25 16.5815 1.25 16.25V3.75C1.25 3.41848 1.3817 3.10054 1.61612 2.86612C1.85054 2.6317 2.16848 2.5 2.5 2.5H17.5ZM5.625 8L2.5 11.1238V16.25H17.5V14.625L13.5 10.625L10.875 13.25L5.625 8ZM17.5 3.75H2.5V9.375L5.625 6.25L10.875 11.5L13.5 8.875L17.5 12.875V3.75Z"
        fill={color}
      />
      <Path
        d="M15.1191 6.96753C15.3512 6.96753 15.5738 6.87534 15.7379 6.71125C15.902 6.54715 15.9941 6.32459 15.9941 6.09253C15.9941 5.86047 15.902 5.63791 15.7379 5.47381C15.5738 5.30972 15.3512 5.21753 15.1191 5.21753C14.8871 5.21753 14.6645 5.30972 14.5004 5.47381C14.3363 5.63791 14.2441 5.86047 14.2441 6.09253C14.2441 6.32456 14.3363 6.54715 14.5004 6.71125C14.6645 6.87534 14.8871 6.96753 15.1191 6.96753Z"
        fill={color}
      />
    </Svg>
  );
}

function StyleIcon({ color = TEXT_MAIN }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15.8333 2.5C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333ZM15.8333 4.16667H4.16667V15.8333H15.8333V4.16667ZM11.0442 6.07L14.0542 14.1667H12.4325L11.6858 12.02H8.3025L7.5325 14.1667H5.9575L8.99083 6.07H11.0442ZM10.0758 7.435H9.93583L8.7575 10.7367H11.2308L10.0758 7.435Z"
        fill={color}
      />
    </Svg>
  );
}

function UndoIcon({ color = '#999999' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M8.58348 2.74377L4.93848 6.38877L8.58348 10.0338L9.76223 8.85502L8.13098 7.22127H10.6547C12.7535 7.22127 14.451 8.90253 14.451 10.9713C14.451 13.0413 12.7535 14.7213 10.6547 14.7213H8.33348V16.3888H10.6547C13.6697 16.3888 16.1172 13.9663 16.1172 10.9725C16.1172 7.97878 13.6697 5.55502 10.6547 5.55502H8.12973L9.76223 3.92252L8.58348 2.74377Z"
        fill={color}
      />
    </Svg>
  );
}

function RedoIcon({ color = '#999999' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M11.4165 2.74377L15.0615 6.38877L11.4165 10.0338L10.2378 8.85502L11.869 7.22127H9.34527C7.24652 7.22127 5.54902 8.90253 5.54902 10.9713C5.54902 13.0413 7.24652 14.7213 9.34527 14.7213H11.6665V16.3888H9.34527C6.33027 16.3888 3.88277 13.9663 3.88277 10.9725C3.88277 7.97878 6.33027 5.55502 9.34527 5.55502H11.8703L10.2378 3.92252L11.4165 2.74377Z"
        fill={color}
      />
    </Svg>
  );
}

function VideoIcon({ color = TEXT_MAIN }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 2.5H2.5C1.80833 2.5 1.25 3.05833 1.25 3.75V16.25C1.25 16.9417 1.80833 17.5 2.5 17.5H17.5C18.1917 17.5 18.75 16.9417 18.75 16.25V3.75C18.75 3.05833 18.1917 2.5 17.5 2.5ZM17.5 16.25H2.5V3.75H17.5V16.25ZM8.125 6.875L13.75 10L8.125 13.125V6.875Z"
        fill={color}
      />
    </Svg>
  );
}

function CollapseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 36 36" fill="none">
      <Path
        d="M16.7315 17.2954C17.0894 17.2954 17.3794 17.0053 17.3794 16.6475V11.6479C17.3794 11.2901 17.0894 11 16.7315 11C16.3737 11 16.0836 11.2901 16.0836 11.6479V16.6475L16.7315 15.9996H11.6479C11.2901 15.9996 11 16.2896 11 16.6475C11 17.0053 11.2901 17.2954 11.6479 17.2954H16.7315Z"
        fill={TEXT_MAIN}
      />
      <Path
        d="M19.6484 19C19.2905 19 19.0004 19.2901 19.0004 19.6479V24.6475C19.0004 25.0054 19.2905 25.2955 19.6484 25.2955C20.0062 25.2955 20.2963 25.0054 20.2963 24.6475V19.648L19.6484 20.2959H24.7319C25.0898 20.2959 25.3799 20.0058 25.3799 19.648C25.3799 19.2901 25.0898 19 24.7319 19H19.6484Z"
        fill={TEXT_MAIN}
      />
    </Svg>
  );
}

function BoldIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M4.5 2.8h4.6c1.9 0 3.1 1 3.1 2.6 0 1.1-0.6 1.9-1.5 2.3 1.3 0.4 2.1 1.4 2.1 2.8 0 2-1.5 3-3.4 3H4.5V2.8zM6.8 4.6v2.9h2.1c0.9 0 1.5-0.6 1.5-1.5 0-0.8-0.6-1.4-1.5-1.4H6.8zM6.8 9.2v3.1h2.4c1 0 1.7-0.7 1.7-1.6s-0.7-1.5-1.7-1.5H6.8z"
        fill={color}
      />
    </Svg>
  );
}

function ItalicIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M7 2.8h6v1.7h-2.2l-1.8 9h2.3v1.7H5v-1.7h2.2l1.8-9H7V2.8z"
        fill={color}
      />
    </Svg>
  );
}

function UnderlineIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M4.4 2.7h1.9v5.5c0 1.8 1.1 2.8 2.7 2.8s2.7-1 2.7-2.8V2.7h1.9v5.5c0 2.8-2 4.6-4.6 4.6s-4.6-1.8-4.6-4.6V2.7zM3.4 14.1h11.2v1.4H3.4z"
        fill={color}
      />
    </Svg>
  );
}

function IndentIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.4996 2.70874V4.37499H2.49965V2.70874H17.4996ZM17.4996 6.87499V8.54124H8.3334V6.87499H17.4996ZM17.4996 11.0412V12.7087H8.3334V11.0412H17.4996ZM3.5059 7.11874L5.58715 9.20249C5.91215 9.52749 5.91215 10.055 5.58715 10.3812L3.5059 12.4625L2.32715 11.285L3.8209 9.78999L2.32715 8.29624L3.5059 7.11749V7.11874ZM17.4996 15.2087V16.875H2.49965V15.2087H17.4996Z"
        fill={color}
      />
    </Svg>
  );
}

function OutdentIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.50035 2.70874V4.37499H17.5004V2.70874H2.50035ZM2.50035 6.87499V8.54124H11.6666V6.87499H2.50035ZM2.50035 11.0412V12.7087H11.6666V11.0412H2.50035ZM16.4941 7.11874L14.4129 9.20249C14.0879 9.52749 14.0879 10.055 14.4129 10.3812L16.4941 12.4625L17.6729 11.285L16.1791 9.78999L17.6729 8.29624L16.4941 7.11749V7.11874ZM2.50035 15.2087V16.875H17.5004V15.2087H2.50035Z"
        fill={color}
      />
    </Svg>
  );
}

function AlignLeftIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.5 2.70874V4.37499H17.5V2.70874L2.5 2.70874ZM2.5 6.87499V8.54124H11.6663V6.87499H2.5ZM2.5 11.0412V12.7087H11.6663V11.0412H2.5ZM2.5 15.2087V16.875H17.5V15.2087H2.5Z"
        fill={color}
      />
    </Svg>
  );
}

function AlignCenterIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 2.70874V4.37499H2.5V2.70874L17.5 2.70874ZM14.6663 6.87499V8.54124H5.5V6.87499H14.6663ZM14.6663 11.0412V12.7087H5.5V11.0412H14.6663ZM17.5 15.2087V16.875H2.5V15.2087H17.5Z"
        fill={color}
      />
    </Svg>
  );
}

function AlignRightIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 2.70874V4.37499H2.5V2.70874L17.5 2.70874ZM17.5 6.87499V8.54124H8.33375V6.87499H17.5ZM17.5 11.0412V12.7087H8.33375V11.0412H17.5ZM17.5 15.2087V16.875H2.5V15.2087H17.5Z"
        fill={color}
      />
    </Svg>
  );
}

interface FormatState {
  size: string | false;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: string | false;
  color: string;
}

const DEFAULT_FORMAT: FormatState = {
  size: false,
  bold: false,
  italic: false,
  underline: false,
  align: false,
  color: '#000000',
};

function HeaderCancel({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity hitSlop={8} onPress={onPress}>
      <Text style={styles.navBtn}>取消</Text>
    </TouchableOpacity>
  );
}

function HeaderDone({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity hitSlop={8} onPress={onPress}>
      <Text style={[styles.navBtn, styles.navDone]}>完成</Text>
    </TouchableOpacity>
  );
}

export default function LongTextEdit({ route, navigation }: Props) {
  const { initialHtml, insertOnMount } = route.params || {};
  const quillRef = useRef<QuillEditor>(null!);
  const [plainLen, setPlainLen] = useState(() => htmlToPlainLength(initialHtml || ''));
  const [panelOpen, setPanelOpen] = useState(false);
  const [fmt, setFmt] = useState<FormatState>(DEFAULT_FORMAT);
  const [embedTarget, setEmbedTarget] = useState<{ index: number; kind: 'image' | 'video' } | null>(null);
  const [customWidth, setCustomWidth] = useState('');
  const embedModalOpenRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshHistory = useCallback(async () => {
    try {
      const h = await quillRef.current.getHistory();
      setCanUndo(h.undo > 0);
      setCanRedo(h.redo > 0);
    } catch {
      // ignore
    }
  }, []);
  const insets = useSafeAreaInsets();
  const kbAnim = useRef(new Animated.Value(Platform.OS === 'ios' ? insets.bottom : 0)).current;

  useEffect(() => {
    // Android 为 adjustResize，无需手动避让
    if (Platform.OS !== 'ios') return;
    const onShow = (e: KeyboardEvent) => {
      Animated.timing(kbAnim, {
        toValue: e.endCoordinates.height,
        duration: e.duration || 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    };
    const onHide = (e: KeyboardEvent) => {
      Animated.timing(kbAnim, {
        toValue: insets.bottom,
        duration: e.duration || 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    };
    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, kbAnim]);

  const onDone = useCallback(async () => {
    try {
      const result = await quillRef.current.getHtml();
      setEditorResult(result);
    } catch {
      // ignore
    }
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: '编辑正文',
      headerBackVisible: false,
      headerLeft: undefined,
      headerRight: undefined,
      unstable_headerLeftItems: () => [
        {
          type: 'custom',
          element: <HeaderCancel onPress={() => navigation.goBack()} />,
          hidesSharedBackground: true,
        },
      ],
      unstable_headerRightItems: () => [
        {
          type: 'custom',
          element: <HeaderDone onPress={onDone} />,
          hidesSharedBackground: true,
        },
      ],
    });
  }, [navigation, onDone]);

  useEffect(() => {
    if (!insertOnMount) return;
    const timer = setTimeout(() => {
      quillRef.current?.getLength().then((len: number) => {
        quillRef.current?.insertText(Math.max(len - 1, 0), insertOnMount);
        quillRef.current?.focus();
      }).catch(() => undefined);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (fn: () => void) => {
    try {
      fn();
    } catch {
      // ignore
    }
  };

  const onUndo = () => {
    if (!canUndo) return;
    exec(() => quillRef.current.undo());
    setTimeout(refreshHistory, 150);
  };
  const onRedo = () => {
    if (!canRedo) return;
    exec(() => quillRef.current.redo());
    setTimeout(refreshHistory, 150);
  };

  const onInsertImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        compressImageQuality: 0.8,
      });
      const url = await uploadToOss(image.path, image.mime || 'image/jpeg');
      const sel = await (quillRef.current as any).getSelection(true);
      quillRef.current.insertEmbed(sel?.index || 0, 'image', url);
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('上传失败');
      }
    }
  };

  const onInsertVideo = async () => {
    try {
      const video = await ImagePicker.openPicker({
        mediaType: 'video',
      });
      const url = await uploadToOss(video.path, video.mime || 'video/mp4');
      const sel = await (quillRef.current as any).getSelection(true);
      quillRef.current.insertEmbed(sel?.index || 0, 'mp4video', url);
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('上传失败');
      }
    }
  };

  const onSelectionChange = async (data: any) => {
    const range = data?.range;
    if (!range || embedModalOpenRef.current) return;
    const checkAt = async (index: number) => {
      if (index < 0) return null;
      try {
        const contents = await (quillRef.current as any).getContents(index, 1);
        const op = contents?.ops?.[0];
        const insert = op?.insert;
        if (insert && typeof insert === 'object') {
          if (insert.image) return { index, kind: 'image' as const };
          if (insert.mp4video) return { index, kind: 'video' as const };
        }
      } catch {
        // ignore
      }
      return null;
    };
    const hit = (await checkAt(range.index)) ?? (await checkAt(range.index - 1));
    if (hit) {
      embedModalOpenRef.current = true;
      setCustomWidth('');
      setEmbedTarget(hit);
    }
  };

  const closeEmbedModal = () => {
    embedModalOpenRef.current = false;
    setEmbedTarget(null);
  };

  const applyEmbedWidth = (width: string) => {
    if (!embedTarget) return;
    exec(() => quillRef.current.setEmbedWidth(embedTarget.index, width));
    closeEmbedModal();
  };

  const applyCustomWidth = () => {
    const n = parseInt(customWidth, 10);
    if (!n || n < 1 || n > 100) {
      Alert.alert('提示', '请输入 1-100 的百分比');
      return;
    }
    applyEmbedWidth(`${n}%`);
  };

  const onInsertTopic = () => {
    exec(() => {
      quillRef.current.focus();
      (quillRef.current as any).getSelection(true).then((sel: any) => {
        quillRef.current.insertText(sel?.index ?? 0, '#');
      });
    });
  };

  const applyFormat = (name: string, value: any) => {
    exec(() => quillRef.current.format(name, value));
  };

  const onTogglePanel = async () => {
    if (!panelOpen) {
      try {
        const sel = await (quillRef.current as any).getSelection(true);
        const f: any = await (quillRef.current as any).getFormat(sel?.index ?? 0, sel?.length ?? 0);
        setFmt({
          size: typeof f?.size === 'string' ? f.size : false,
          bold: !!f?.bold,
          italic: !!f?.italic,
          underline: !!f?.underline,
          align: typeof f?.align === 'string' ? f.align : false,
          color: typeof f?.color === 'string' ? f.color : '#000000',
        });
      } catch {
        // ignore
      }
    }
    setPanelOpen(v => !v);
  };

  const activeSizeIndex = Math.max(0, SIZE_STOPS.findIndex(s => s.value === fmt.size));

  const onPickSize = (index: number) => {
    const stop = SIZE_STOPS[index];
    setFmt(prev => ({ ...prev, size: stop.value }));
    applyFormat('size', stop.value);
  };

  const onToggleInline = (key: 'bold' | 'italic' | 'underline') => {
    const next = !fmt[key];
    setFmt(prev => ({ ...prev, [key]: next }));
    applyFormat(key, next);
  };

  const onPickAlign = (value: string | false) => {
    setFmt(prev => ({ ...prev, align: value }));
    applyFormat('align', value);
  };

  const onPickColor = (color: string) => {
    setFmt(prev => ({ ...prev, color }));
    applyFormat('color', color === '#000000' ? false : color);
  };

  const renderSizeRow = () => {
    const trackW = scaleSizeW(280);
    const pad = scaleSizeW(15);
    const gap = (trackW - pad * 2) / (SIZE_STOPS.length - 1);
    const knobX = pad + gap * activeSizeIndex;
    return (
      <View style={styles.panelRow}>
        <Text style={styles.panelLabel}>字号</Text>
        <View style={[styles.sliderTrack, { width: trackW }]}>
          <View style={[styles.sliderFill, { width: knobX }]} />
          {SIZE_STOPS.map((stop, i) => {
            const cx = pad + gap * i;
            const active = i === activeSizeIndex;
            return (
              <TouchableOpacity
                key={stop.label}
                activeOpacity={0.8}
                style={[styles.sliderStop, { left: cx - scaleSizeW(16) }]}
                onPress={() => onPickSize(i)}
              >
                {active ? (
                  <View style={styles.sliderKnob} />
                ) : (
                  <View style={[styles.sliderDot, i < activeSizeIndex && styles.sliderDotPassed]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.sliderValue}>{SIZE_STOPS[activeSizeIndex].label}</Text>
      </View>
    );
  };

  const renderStyleRow = () => {
    const items: { key: 'bold' | 'italic' | 'underline'; label: string; Icon: React.FC<{ color: string }> }[] = [
      { key: 'bold', label: '加粗', Icon: BoldIcon },
      { key: 'italic', label: '斜体', Icon: ItalicIcon },
      { key: 'underline', label: '下划线', Icon: UnderlineIcon },
    ];
    return (
      <View style={styles.panelRow}>
        <Text style={styles.panelLabel}>样式</Text>
        <View style={styles.styleGroup}>
          {items.map(({ key, label, Icon }) => {
            const active = fmt[key];
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                style={[styles.styleBtn, active && styles.styleBtnActive]}
                onPress={() => onToggleInline(key)}
              >
                <Icon color={active ? '#FFFFFF' : TEXT_MAIN} />
                <Text style={[styles.styleBtnText, active && styles.styleBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderParaRow = () => {
    const alignItems: { key: string; Icon: React.FC<{ color: string }>; active: boolean; onPress: () => void }[] = [
      { key: 'indent-add', Icon: IndentIcon, active: false, onPress: () => applyFormat('indent', '+1') },
      { key: 'indent-reduce', Icon: OutdentIcon, active: false, onPress: () => applyFormat('indent', '-1') },
      { key: 'align-left', Icon: AlignLeftIcon, active: fmt.align === false, onPress: () => onPickAlign(false) },
      { key: 'align-center', Icon: AlignCenterIcon, active: fmt.align === 'center', onPress: () => onPickAlign('center') },
      { key: 'align-right', Icon: AlignRightIcon, active: fmt.align === 'right', onPress: () => onPickAlign('right') },
    ];
    return (
      <View style={styles.panelRow}>
        <Text style={styles.panelLabel}>段落</Text>
        <View style={styles.paraGroup}>
          {alignItems.map(({ key, Icon, active, onPress }) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              style={[styles.paraBtn, active && styles.paraBtnActive]}
              onPress={onPress}
            >
              <Icon color={active ? '#FFFFFF' : '#1A202E'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderColorRow = () => (
    <View style={styles.panelRow}>
      <Text style={styles.panelLabel}>字色</Text>
      <View style={styles.colorTrack}>
        {TEXT_COLORS.map(color => {
          const active = fmt.color.toLowerCase() === color.toLowerCase();
          return (
            <TouchableOpacity
              key={color}
              activeOpacity={0.8}
              style={[styles.colorStop, active && styles.colorStopActive]}
              onPress={() => onPickColor(color)}
            >
              <View style={[styles.colorDot, { backgroundColor: color }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeView backgroundColor="#fff">
      <Animated.View style={[styles.flex1, { paddingBottom: kbAnim }]}>
        <View style={styles.scroll}>
          <QuillEditor
            ref={quillRef}
            initialHtml={initialHtml || '<p><br></p>'}
            onHtmlChange={(data) => {
              setPlainLen(htmlToPlainLength(data.html || ''));
              refreshHistory();
            }}
            quill={{
              placeholder: '添加正文...',
              modules: { toolbar: false },
            }}
            customJS={CUSTOM_JS}
            customStyles={CUSTOM_STYLES}
            onSelectionChange={onSelectionChange}
            theme={{
              background: '#ffffff',
              color: TEXT_MAIN,
              placeholder: TEXT_SUB,
            }}
            container={false}
            style={styles.editor}
            webview={{
              scrollEnabled: true,
              hideKeyboardAccessoryView: true,
              keyboardDisplayRequiresUserAction: false,
            }}
          />
        </View>

        <View style={styles.bottomBar}>
          <Text style={[styles.counter, plainLen > LONG_BODY_LIMIT && styles.counterOver]}>
            {plainLen}/{LONG_BODY_LIMIT}
          </Text>
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.topicBtn} activeOpacity={0.8} onPress={onInsertTopic}>
              <Text style={styles.topicStrong}>#</Text>
              <Text style={styles.topicText}>话题</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8} onPress={onInsertImage}>
              <ImageIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8} onPress={onInsertVideo}>
              <VideoIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, panelOpen && styles.toolBtnPanelOpen]}
              activeOpacity={0.8}
              onPress={onTogglePanel}
            >
              <StyleIcon color={panelOpen ? PRIMARY : TEXT_MAIN} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8} onPress={onUndo}>
              <UndoIcon color={canUndo ? TEXT_MAIN : '#999999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8} onPress={onRedo}>
              <RedoIcon color={canRedo ? TEXT_MAIN : '#999999'} />
            </TouchableOpacity>
            <View style={styles.flex1} />
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8} onPress={Keyboard.dismiss}>
              <CollapseIcon />
            </TouchableOpacity>
          </View>
          {panelOpen && (
            <View style={styles.panel}>
              {renderSizeRow()}
              {renderStyleRow()}
              {renderParaRow()}
              {renderColorRow()}
            </View>
          )}
        </View>

        <Modal
          visible={embedTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={closeEmbedModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{embedTarget?.kind === 'video' ? '视频宽度' : '图片宽度'}</Text>
              <View style={styles.widthPresets}>
                {WIDTH_PRESETS.map(preset => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.widthPresetBtn}
                    activeOpacity={0.8}
                    onPress={() => applyEmbedWidth(preset)}
                  >
                    <Text style={styles.widthPresetText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.widthInputRow}>
                <TextInput
                  style={styles.widthInput}
                  placeholder="自定义百分比（1-100）"
                  placeholderTextColor={TEXT_SUB}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={customWidth}
                  onChangeText={setCustomWidth}
                />
                <Text style={styles.widthPercent}>%</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalActionBtn} onPress={closeEmbedModal}>
                  <Text style={styles.modalActionText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionBtn} onPress={applyCustomWidth}>
                  <Text style={[styles.modalActionText, styles.modalActionPrimary]}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  navBtn: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  navDone: {
    color: PRIMARY,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
  },
  editor: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bottomBar: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(8),
    backgroundColor: '#FFFFFF',
  },
  counter: {
    fontSize: scaleSizeW(12),
    lineHeight: scaleSizeH(24),
    color: '#999999',
    textAlign: 'right',
  },
  counterOver: {
    color: '#EF4444',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(4),
  },
  topicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    height: scaleSizeW(36),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
  },
  topicStrong: {
    fontSize: scaleSizeW(14),
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  topicText: {
    fontSize: scaleSizeW(14),
    color: TEXT_MAIN,
  },
  toolBtn: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnPanelOpen: {
    backgroundColor: PANEL_ACTIVE_BG,
  },
  panel: {
    marginTop: scaleSizeH(16),
    gap: scaleSizeH(20),
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(18),
  },
  panelLabel: {
    width: scaleSizeW(28),
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(24),
    color: TEXT_SUB,
  },
  sliderTrack: {
    height: scaleSizeH(26),
    borderRadius: scaleSizeW(90),
    backgroundColor: TILE_BG,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
  },
  sliderStop: {
    position: 'absolute',
    width: scaleSizeW(32),
    height: scaleSizeH(26),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDot: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    borderRadius: scaleSizeW(5),
    backgroundColor: '#D5D5D5',
  },
  sliderDotPassed: {
    backgroundColor: '#9EBEFF',
  },
  sliderKnob: {
    width: scaleSizeW(22),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(11),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderValue: {
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(24),
    color: TEXT_SUB,
    textAlign: 'right',
    flexShrink: 0,
    width: scaleSizeW(30),
  },
  styleGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  styleBtn: {
    flex: 1,
    height: scaleSizeH(36),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  styleBtnActive: {
    backgroundColor: PRIMARY,
  },
  styleBtnText: {
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(24),
    color: TEXT_MAIN,
  },
  styleBtnTextActive: {
    color: '#FFFFFF',
  },
  paraGroup: {
    flex: 1,
    height: scaleSizeH(36),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
    flexDirection: 'row',
    padding: scaleSizeW(3),
  },
  paraBtn: {
    flex: 1,
    borderRadius: scaleSizeW(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  paraBtnActive: {
    backgroundColor: PRIMARY,
  },
  colorTrack: {
    flex: 1,
    height: scaleSizeH(26),
    borderRadius: scaleSizeW(90),
    backgroundColor: TILE_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(10),
  },
  colorStop: {
    width: scaleSizeW(24),
    height: scaleSizeH(22),
    borderRadius: scaleSizeW(90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorStopActive: {
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  colorDot: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    borderRadius: scaleSizeW(5),
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
    width: '78%',
    paddingTop: scaleSizeH(18),
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: scaleSizeW(16),
    fontWeight: '600',
    color: TEXT_MAIN,
    textAlign: 'center',
  },
  widthPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSizeW(8),
    marginTop: scaleSizeH(16),
    paddingHorizontal: scaleSizeW(16),
  },
  widthPresetBtn: {
    flex: 1,
    height: scaleSizeH(32),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widthPresetText: {
    fontSize: scaleSizeW(13),
    color: TEXT_MAIN,
  },
  widthInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginTop: scaleSizeH(12),
    marginHorizontal: scaleSizeW(16),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(8),
    backgroundColor: TILE_BG,
    paddingHorizontal: scaleSizeW(12),
  },
  widthInput: {
    flex: 1,
    padding: 0,
    fontSize: scaleSizeW(14),
    color: TEXT_MAIN,
  },
  widthPercent: {
    fontSize: scaleSizeW(14),
    color: TEXT_SUB,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: scaleSizeH(18),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: scaleSizeH(13),
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: scaleSizeW(15),
    color: TEXT_MAIN,
  },
  modalActionPrimary: {
    color: PRIMARY,
    fontWeight: '500',
  },
});
