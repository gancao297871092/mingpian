import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, usePreventRemove, type RouteProp } from '@react-navigation/native';
import Video from 'react-native-video';
import { BottomSheetTextInput, type BottomSheetModal } from '@gorhom/bottom-sheet';
import Svg, { Path } from 'react-native-svg';
import { API } from '@/api';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import ImageUploader, { UploadImage } from '@/components/ImageUploader';
import VideoUploader, { UploadVideo } from '@/components/VideoUploader';
import { storageUtils } from '@/utils/storage';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import { getFeedCoverHeight } from '@/utils/feedLayout';
import { uploadToOss } from '@/utils/ossUpload';
import { deleteDraft, saveDraft } from '@/utils/draftStore';
import { COVER_RATIO_KEY, COVER_TRANSFORM_KEY, COVER_URI_KEY } from './CoverSelect';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const TEXT_MAIN = '#000000';
const TEXT_SUB = '#6C6C6C';
const DIVIDER = '#EDECEC';
const TILE_BG = '#F5F5F5';
const CARD_BG = '#FFFFFF';
const INFO_BG = '#E3EDFF';

const MAX_IMAGES = 18;
const TITLE_LIMIT = 20;
const BODY_LIMIT = 1000;
const GUIDE_SHOWN_KEY = 'publishGuideShown';
const SYNC_ON_KEY = 'publishSyncOn';

type PublishTab = 'short' | 'video' | 'long';
type VisibilityKey = 'public' | 'mutual' | 'private';
type CommentKey = 'everyone' | 'fans' | 'mutual' | 'self';
type DeclareOption = 'none' | 'self-shot' | 'reprint' | 'fiction' | 'ai' | 'marketing' | 'opinion';

type PublishImage = UploadImage;

const TABS: { key: PublishTab; label: string }[] = [
  { key: 'short', label: '短图文' },
  { key: 'video', label: '视频' },
  { key: 'long', label: '长文' },
];

const VISIBILITY_ROW_LABEL: Record<VisibilityKey, string> = {
  public: '公开可见',
  mutual: '仅互关好友可见',
  private: '仅自己可见',
};
const VISIBILITY_OPTIONS: { key: VisibilityKey; label: string }[] = [
  { key: 'public', label: '公开·所有人可见' },
  { key: 'mutual', label: '仅互关好友可见' },
  { key: 'private', label: '私密·仅自己可见' },
];

const COMMENT_OPTIONS: { key: CommentKey; label: string; icon: number }[] = [
  { key: 'everyone', label: '所有人', icon: require('@/assets/publish/comment-all.png') },
  { key: 'fans', label: '仅粉丝', icon: require('@/assets/publish/comment-fans.png') },
  { key: 'mutual', label: '仅互关好友', icon: require('@/assets/publish/comment-mutual.png') },
  { key: 'self', label: '仅自己', icon: require('@/assets/publish/comment-self.png') },
];

const DECLARE_OPTION_LABEL: Record<DeclareOption, string> = {
  none: '无需声明',
  'self-shot': '内容为自行拍摄',
  reprint: '内容为转载',
  fiction: '含虚构演绎内容',
  ai: '含 AI 合成内容',
  marketing: '内容含营销信息',
  opinion: '个人观点，仅供参考',
};

const ICONS = {
  add: require('@/assets/publish/add.png'),
  eye: require('@/assets/publish/eye.png'),
  declare: require('@/assets/publish/declare.png'),
  comment: require('@/assets/publish/comment.png'),
  sync: require('@/assets/publish/sync.png'),
  help: require('@/assets/publish/help.png'),
  tip: require('@/assets/publish/tip.png'),
  guideInfo: require('@/assets/publish/guide-info.png'),
  check: require('@/assets/publish/check.png'),
  back: require('@/assets/publish/back.png'),
  exitDiscard: require('@/assets/publish/exit-discard.png'),
  exitDraft: require('@/assets/publish/exit-draft.png'),
};

function ChevronRight({ size = 12, color = '#999999' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function Publish() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'publish'>>();
  const draftParam = route.params?.draft;

  const [activeTab, setActiveTab] = useState<PublishTab>('short');
  const [images, setImages] = useState<PublishImage[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [video, setVideo] = useState<UploadVideo | null>(null);
  const [videoCover, setVideoCover] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [videoRatio, setVideoRatio] = useState<'3:4' | '16:9'>('3:4');
  const [coverTransform, setCoverTransform] = useState<{ tx: number; ty: number; scale: number } | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoBody, setVideoBody] = useState('');
  const [exitMenuVisible, setExitMenuVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draftParam?.id ?? null);

  useEffect(() => {
    if (!draftParam) return;
    if (draftParam.draftType === 1) {
      setActiveTab('video');
      setVideoTitle(draftParam.title);
      setVideoBody(draftParam.content);
      const videoUri = draftParam.videoUri || draftParam.videoUrl;
      if (videoUri) {
        setVideo({ uri: videoUri, url: draftParam.videoUrl, uploading: false });
      }
      setVideoCover(draftParam.videoCover ?? null);
      if (draftParam.videoRatio) setVideoRatio(draftParam.videoRatio);
      setCoverTransform(draftParam.coverTransform ?? null);
    } else {
      setActiveTab('short');
      setTitle(draftParam.title);
      setBody(draftParam.content);
      setImages(
        draftParam.images.map((img, i) => ({
          key: `${draftParam.id}-${i}`,
          uri: img.uri,
          url: img.url,
          uploading: false,
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const ratio = storageUtils.getString(COVER_RATIO_KEY);
      if (ratio === '3:4' || ratio === '16:9') {
        setVideoRatio(ratio);
        storageUtils.remove(COVER_RATIO_KEY);
      }
      const coverUri = storageUtils.getString(COVER_URI_KEY);
      if (coverUri) {
        setVideoCover(coverUri);
        storageUtils.remove(COVER_URI_KEY);
        uploadCover(coverUri);
      }
      const transform = storageUtils.getObject<{ tx: number; ty: number; scale: number }>(COVER_TRANSFORM_KEY);
      if (transform) {
        setCoverTransform(transform);
        storageUtils.remove(COVER_TRANSFORM_KEY);
      }
    }, []),
  );

  const [visibility, setVisibility] = useState<VisibilityKey>('public');
  const [declareOriginal, setDeclareOriginal] = useState(false);
  const [declareOption, setDeclareOption] = useState<DeclareOption>('none');
  const [reprintSource, setReprintSource] = useState('');
  const [reprintDraft, setReprintDraft] = useState('');
  const [commentWho, setCommentWho] = useState<CommentKey>('everyone');
  const [syncOn, setSyncOnState] = useState(() => storageUtils.getString(SYNC_ON_KEY) === '1');
  const setSyncOn = (enabled: boolean) => {
    setSyncOnState(enabled);
    storageUtils.set(SYNC_ON_KEY, enabled ? '1' : '0');
  };
  const [aiHelpVisible, setAiHelpVisible] = useState(false);

  const guideRef = useRef<BottomSheetModal>(null);
  const visibilityRef = useRef<BottomSheetModal>(null);
  const declareRef = useRef<BottomSheetModal>(null);
  const reprintRef = useRef<BottomSheetModal>(null);
  const commentRef = useRef<BottomSheetModal>(null);
  const reprintConfirmedRef = useRef(false);
  const guideConfirmedRef = useRef(false);

  useEffect(() => {
    if (storageUtils.getString(GUIDE_SHOWN_KEY)) return;
    const timer = setTimeout(() => guideRef.current?.present(), 350);
    return () => clearTimeout(timer);
  }, []);

  const closeGuide = (enabled: boolean) => {
    guideConfirmedRef.current = true;
    storageUtils.set(GUIDE_SHOWN_KEY, '1');
    setSyncOn(enabled);
    guideRef.current?.dismiss();
  };

  const declareLabel = () => {
    const parts: string[] = [];
    if (declareOriginal) parts.push('原创声明');
    if (declareOption !== 'none') {
      parts.push(
        declareOption === 'reprint' && reprintSource
          ? `转载·${reprintSource}`
          : DECLARE_OPTION_LABEL[declareOption],
      );
    }
    return parts.length ? parts.join(' · ') : '无需声明';
  };

  const handleVideoChange = (next: UploadVideo | null) => {
    if (!next || next.uri !== video?.uri) {
      setVideoCover(null);
      setCoverTransform(null);
    }
    setVideo(next);
  };

  const uploadCover = (uri: string) => {
    setCoverUploading(true);
    uploadToOss(uri, 'image/jpeg')
      .then(url => setVideoCover(prev => (prev === uri ? url : prev)))
      .catch(() => undefined)
      .finally(() => setCoverUploading(false));
  };

  const openCoverSelect = () => {
    if (!video) return;
    Keyboard.dismiss();
    (navigation as any).navigate('publishCover', {
      videoUri: video.uri,
      ratio: videoRatio,
      title: videoTitle,
    });
  };

  const hasContent = () =>
    images.length > 0 ||
    !!video ||
    !!title.trim() ||
    !!body.trim() ||
    !!videoTitle.trim() ||
    !!videoBody.trim();

  const clearAll = () => {
    setImages([]);
    setVideo(null);
    setVideoCover(null);
    setCoverTransform(null);
    setTitle('');
    setBody('');
    setVideoTitle('');
    setVideoBody('');
  };

  const [allowLeave, setAllowLeave] = useState(false);
  const pendingActionRef = useRef<any>(null);

  usePreventRemove(!allowLeave && hasContent(), ({ data }) => {
    pendingActionRef.current = data.action;
    setExitMenuVisible(true);
  });

  useEffect(() => {
    if (!allowLeave) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      navigation.dispatch(action);
    } else {
      navigation.goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowLeave]);

  const onExitDiscard = () => {
    setExitMenuVisible(false);
    clearAll();
    setAllowLeave(true);
  };

  const onExitDraft = () => {
    setExitMenuVisible(false);
    if (activeTab === 'short' && images.length === 0) {
      Alert.alert('提示', '短图文至少需要一张图片才能存草稿');
      return;
    }
    if (activeTab === 'video' && !video) {
      Alert.alert('提示', '视频动态至少需要上传一个视频才能存草稿');
      return;
    }
    const id = draftId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    saveDraft({
      id,
      draftType: activeTab === 'video' ? 1 : 0,
      title: activeTab === 'video' ? videoTitle : title,
      content: activeTab === 'video' ? videoBody : body,
      images: images.map(item => ({ uri: item.url || item.uri, url: item.url })),
      videoUri: video?.uri,
      videoUrl: video?.url,
      videoCover: videoCover ?? undefined,
      videoRatio,
      coverTransform,
      updatedAt: Date.now(),
    });
    setDraftId(id);
    clearAll();
    Alert.alert('提示', '已存入草稿箱', [{ text: '知道了', onPress: () => setAllowLeave(true) }]);
  };

  const openSheet = (target: React.RefObject<BottomSheetModal | null>) => {
    Keyboard.dismiss();
    target.current?.present();
  };

  const openReprint = () => {
    setReprintDraft(reprintSource);
    reprintRef.current?.present();
  };

  const confirmReprint = () => {
    reprintConfirmedRef.current = true;
    setReprintSource(reprintDraft.trim());
    setDeclareOption('reprint');
    reprintRef.current?.dismiss();
  };

  const VISIBILITY_MAP: Record<VisibilityKey, number> = { public: 0, mutual: 1, private: 2 };
  const COMMENT_MAP: Record<CommentKey, number> = { everyone: 0, fans: 1, mutual: 2, self: 3 };

  const onPublish = async () => {
    const activeTitle = activeTab === 'video' ? videoTitle : title;
    const activeBody = activeTab === 'video' ? videoBody : body;
    if (activeTab === 'short' && !activeTitle.trim() && !activeBody.trim() && images.length === 0) {
      Alert.alert('提示', '请先填写内容');
      return;
    }
    if (activeTab === 'video' && !video) {
      Alert.alert('提示', '请先上传视频');
      return;
    }
    if ([...activeTitle].length > TITLE_LIMIT) {
      Alert.alert('提示', '标题最多20字');
      return;
    }
    if (images.some(item => item.uploading)) {
      Alert.alert('提示', '图片上传中，请稍候');
      return;
    }
    if (images.some(item => item.failed)) {
      Alert.alert('提示', '有图片上传失败，请重试或删除');
      return;
    }
    if (video?.uploading) {
      Alert.alert('提示', '视频上传中，请稍候');
      return;
    }
    if (activeTab === 'video' && video && (!video.url || video.failed)) {
      Alert.alert('提示', '视频上传失败，请删除后重试');
      return;
    }
    if (activeTab === 'video' && coverUploading) {
      Alert.alert('提示', '封面上传中，请稍候');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    try {
      let videoCoverUrl: string | undefined;
      if (activeTab === 'video' && videoCover) {
        videoCoverUrl = videoCover.startsWith('http')
          ? videoCover
          : await uploadToOss(videoCover, 'image/jpeg');
      }
      await API.publish.submit({
        draftType: activeTab === 'video' ? 1 : 0,
        title: activeTitle.trim(),
        content: activeBody.trim(),
        images: activeTab === 'short' ? images.map(item => item.url || item.uri) : undefined,
        videoUrl: activeTab === 'video' ? video?.url : undefined,
        videoCover: videoCoverUrl,
        aiConnectEnabled: syncOn ? 1 : 0,
        declaration: declareOriginal ? 1 : 0,
        visibility: VISIBILITY_MAP[visibility],
        commentScope: COMMENT_MAP[commentWho],
      });
      if (draftId) deleteDraft(draftId);
      Alert.alert('发布成功', '企业用户发布后，需企业管理员审核', [
        {
          text: '知道了',
          onPress: () => {
            clearAll();
            setAllowLeave(true);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('发布失败', e?.msg || '请稍后重试');
    } finally {
      setPublishing(false);
    }
  };

  const renderSegment = () => (
    <View style={styles.segment}>
      {TABS.map(tab => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.segmentText}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTextFields = (
    value: string,
    onChange: (v: string) => void,
    bodyValue: string,
    onBodyChange: (v: string) => void,
  ) => (
    <>
      <View style={styles.titleRow}>
        <TextInput
          style={styles.titleInput}
          placeholder="添加标题"
          placeholderTextColor={TEXT_SUB}
          value={value}
          onChangeText={onChange}
        />
        <Text style={[styles.titleCount, [...value].length > TITLE_LIMIT && styles.titleCountOver]}>
          {[...value].length}/{TITLE_LIMIT}
        </Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        style={styles.bodyInput}
        placeholder="添加正文..."
        placeholderTextColor={TEXT_SUB}
        maxLength={BODY_LIMIT}
        multiline
        value={bodyValue}
        onChangeText={onBodyChange}
      />
    </>
  );

  const renderVideoSection = () => {
    const videoSize = {
      width: scaleSizeW(110),
      height: getFeedCoverHeight(scaleSizeW(110), '3:4'),
    };
    const previewSize = {
      width: scaleSizeW(110),
      height: getFeedCoverHeight(scaleSizeW(110), videoRatio),
    };
    const cropK = previewSize.width / scaleSizeW(386);
    const hasCover = !!videoCover || !!(coverTransform && video);
    const coverMedia = videoCover ? (
      <Image source={{ uri: videoCover }} style={previewSize} resizeMode="cover" />
    ) : video ? (
      <Video source={{ uri: video.uri }} style={previewSize} paused resizeMode="cover" pointerEvents="none" />
    ) : null;
    const coverContent = coverTransform && video ? (
      <View
        style={[
          previewSize,
          {
            transform: [
              { translateX: coverTransform.tx * cropK },
              { translateY: coverTransform.ty * cropK },
              { scale: coverTransform.scale },
            ],
          },
        ]}
      >
        {coverMedia}
      </View>
    ) : videoCover ? (
      <Image source={{ uri: videoCover }} style={previewSize} resizeMode="cover" />
    ) : (
      <>
        <Image source={ICONS.add} style={styles.mediaAddIcon} />
        <Text style={styles.videoCoverText}>添加封面</Text>
      </>
    );
    return (
      <View style={styles.videoRow}>
        <VideoUploader
          value={video}
          onChange={handleVideoChange}
          width={videoSize.width}
          height={videoSize.height}
        />
        {video && (
          <TouchableOpacity
            style={[styles.videoCoverTile, previewSize, hasCover && styles.videoCoverTileFilled]}
            activeOpacity={0.8}
            onPress={openCoverSelect}
          >
            {coverContent}
            {hasCover && (
              <View style={styles.coverEditBtn}>
                <Text style={styles.coverEditText}>更改封面</Text>
              </View>
            )}
            {coverUploading && (
              <View style={styles.coverLoading}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderExitMenu = () => (
    <Modal
      visible={exitMenuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setExitMenuVisible(false)}
    >
      <TouchableOpacity style={styles.exitMask} activeOpacity={1} onPress={() => setExitMenuVisible(false)}>
        <View style={styles.exitMenu}>
          <TouchableOpacity style={styles.exitItem} activeOpacity={0.7} onPress={onExitDiscard}>
            <Image source={ICONS.exitDiscard} style={styles.icon20} />
            <Text style={[styles.exitItemText, styles.exitDiscardText]}>不保存返回</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitItem} activeOpacity={0.7} onPress={onExitDraft}>
            <Image source={ICONS.exitDraft} style={styles.icon20} />
            <Text style={styles.exitItemText}>存草稿</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSettingRow = (
    icon: React.ReactNode,
    label: string,
    value: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={onPress}>
      {icon}
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );

  const renderCheck = (show: boolean) =>
    show ? <Image source={ICONS.check} style={styles.icon18} /> : <View style={styles.icon18} />;

  const renderOptionRow = (
    label: string,
    checked: boolean,
    onPress: () => void,
    options?: { icon?: number; showDivider?: boolean },
  ) => (
    <TouchableOpacity
      style={[styles.optionRow, options?.showDivider && styles.optionRowDivider]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {options?.icon ? <Image source={options.icon} style={styles.icon20} /> : null}
      <Text style={styles.optionLabel}>{label}</Text>
      {renderCheck(checked)}
    </TouchableOpacity>
  );

  const renderVisibilitySheet = () => (
    <AppBottomSheet ref={visibilityRef}>
      <Text style={styles.sheetNote}>以下可见权限设置只对本条动态生效</Text>
      <View style={styles.sheetCard}>
        {VISIBILITY_OPTIONS.map((opt, i) => (
          <React.Fragment key={opt.key}>
            {renderOptionRow(opt.label, visibility === opt.key, () => {
              setVisibility(opt.key);
              visibilityRef.current?.dismiss();
            }, { showDivider: i > 0 })}
          </React.Fragment>
        ))}
      </View>
    </AppBottomSheet>
  );

  const renderCommentSheet = () => (
    <AppBottomSheet ref={commentRef}>
      <View style={[styles.sheetCard, { marginTop: scaleSizeH(20) }]}>
        {COMMENT_OPTIONS.map((opt, i) => (
          <React.Fragment key={opt.key}>
            {renderOptionRow(opt.label, commentWho === opt.key, () => {
              setCommentWho(opt.key);
              commentRef.current?.dismiss();
            }, { icon: opt.icon, showDivider: i > 0 })}
          </React.Fragment>
        ))}
      </View>
    </AppBottomSheet>
  );

  const renderDeclareSheet = () => (
    <AppBottomSheet ref={declareRef}>
      <View style={[styles.sheetCard, { marginTop: scaleSizeH(20) }]}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>原创声明</Text>
          <Switch
            value={declareOriginal}
            onValueChange={setDeclareOriginal}
            trackColor={{ false: '#E5E5E5', true: PRIMARY }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
      <View style={styles.sheetCard}>
        {renderOptionRow('内容为自行拍摄', declareOption === 'self-shot', () => {
          setDeclareOption('self-shot');
        })}
        <TouchableOpacity
          style={[styles.optionRow, styles.optionRowDivider]}
          activeOpacity={0.7}
          onPress={openReprint}
        >
          <Text style={styles.optionLabel}>内容为转载</Text>
          <ChevronRight />
        </TouchableOpacity>
      </View>
      <View style={styles.sheetCard}>
        {(['fiction', 'ai', 'marketing', 'opinion'] as DeclareOption[]).map((key, i) => (
          <React.Fragment key={key}>
            {renderOptionRow(DECLARE_OPTION_LABEL[key], declareOption === key, () => {
              setDeclareOption(key);
            }, { showDivider: i > 0 })}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.sheetCard}>
        {renderOptionRow('无需声明', declareOption === 'none', () => {
          setDeclareOption('none');
        })}
      </View>
    </AppBottomSheet>
  );

  const renderReprintSheet = () => (
    <AppBottomSheet
      ref={reprintRef}
      onClose={() => {
        if (reprintConfirmedRef.current) {
          reprintConfirmedRef.current = false;
          return;
        }
        declareRef.current?.present();
      }}
    >
      <View style={styles.reprintHeader}>
        <TouchableOpacity style={styles.reprintBack} hitSlop={8} onPress={confirmReprint}>
          <Image source={ICONS.back} style={styles.icon25} />
        </TouchableOpacity>
        <Text style={styles.reprintTitle}>转载来源</Text>
      </View>
      <View style={styles.reprintInfo}>
        <Image source={ICONS.tip} style={styles.icon16} />
        <Text style={styles.reprintInfoText}>作品涉及引用他人发布的内容，需添加引用来源。</Text>
      </View>
      <View style={styles.reprintInputCard}>
        <BottomSheetTextInput
          style={styles.reprintInput}
          placeholder="请输入来源名称或链接"
          placeholderTextColor={TEXT_SUB}
          value={reprintDraft}
          onChangeText={setReprintDraft}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={confirmReprint}
        />
      </View>
    </AppBottomSheet>
  );

  const renderAiHelp = () => (
    <Modal visible={aiHelpVisible} transparent animationType="fade" onRequestClose={() => setAiHelpVisible(false)}>
      <View style={styles.aiOverlay}>
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>AI产业连接说明</Text>
          <Text style={styles.aiBody}>
            开启后，AI会分析你公开发布的内容，识别需求/能力并同步到联诚链接，同时为你推荐潜在合作。
          </Text>
          <Text style={styles.aiList}>
            {'  - 不会根据推测替你发布采购需求\n  - 不会自动联系其他企业\n  - 本页开关仅对本条动态生效，不会改设置里的默认值\n  - 修改默认值请到：我的 > 设置 > 隐私与权限 > AI产业连接'}
          </Text>
          <TouchableOpacity
            style={styles.aiBtn}
            activeOpacity={0.85}
            onPress={() => setAiHelpVisible(false)}
          >
            <Text style={styles.aiBtnText}>我知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderGuideSheet = () => (
    <AppBottomSheet
      ref={guideRef}
      onClose={() => {
        if (guideConfirmedRef.current) {
          guideConfirmedRef.current = false;
          return;
        }
        closeGuide(false);
      }}
    >
      <Text style={styles.guideTitle}>是否默认同步到「正在发生」?</Text>
      <View style={styles.guideInfo}>
        <Image source={ICONS.guideInfo} style={styles.icon16} />
        <Text style={styles.guideInfoText}>关闭仅影响公开展示，匹配和画像更新仍会继续。</Text>
      </View>
      <Text style={styles.guideBody}>
        开启后，AI结合标签和企业画像进行匹配，明确供需符合条件时同步展示。
      </Text>
      <View style={styles.guideActions}>
        <TouchableOpacity style={styles.guideBtn} activeOpacity={0.85} onPress={() => closeGuide(false)}>
          <Text style={styles.guideBtnText}>保持关闭</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.guideBtn, styles.guideBtnPrimary]}
          activeOpacity={0.85}
          onPress={() => closeGuide(true)}
        >
          <Text style={[styles.guideBtnText, styles.guideBtnTextPrimary]}>默认开启</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.guideFoot}>保存为我的发布默认值，以后可在设置中修改</Text>
    </AppBottomSheet>
  );

  return (
    <SafeView backgroundColor="#fff">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderSegment()}

        {activeTab === 'short' && (
          <>
            <ImageUploader
              value={images}
              onChange={setImages}
              maxCount={MAX_IMAGES}
              style={styles.uploaderWrap}
            />
            {renderTextFields(title, setTitle, body, setBody)}
          </>
        )}

        {activeTab === 'video' && (
          <>
            {renderVideoSection()}
            {renderTextFields(videoTitle, setVideoTitle, videoBody, setVideoBody)}
          </>
        )}

        {activeTab === 'long' && (
          <View style={styles.tabPlaceholder}>
            <Text style={styles.tabPlaceholderText}>长文发布敬请期待</Text>
          </View>
        )}

        <View style={styles.divider} />

        {renderSettingRow(<Image source={ICONS.eye} style={styles.icon20} />, '可见范围', VISIBILITY_ROW_LABEL[visibility], () =>
          openSheet(visibilityRef),
        )}
        {renderSettingRow(<Image source={ICONS.declare} style={styles.icon20} />, '内容声明', declareLabel(), () =>
          openSheet(declareRef),
        )}
        {renderSettingRow(<Image source={ICONS.comment} style={styles.icon20} />, '谁可以评论', COMMENT_OPTIONS.find(o => o.key === commentWho)?.label || '所有人', () =>
          openSheet(commentRef),
        )}

        <View style={styles.syncRow}>
          <Image source={ICONS.sync} style={styles.iconSync} />
          <View style={styles.syncCopy}>
            <View style={styles.syncTitleRow}>
              <Text style={styles.syncTitle}>同步到「正在发生」</Text>
              <TouchableOpacity hitSlop={8} onPress={() => setAiHelpVisible(true)}>
                <Image source={ICONS.help} style={styles.icon15} />
              </TouchableOpacity>
            </View>
            <Text style={styles.syncSub}>
              {syncOn ? 'AI + 标签综合匹配 · 符合条件时公开展示' : '不公开·AI匹配和画像更新仍继续'}
            </Text>
          </View>
          <Switch
            value={syncOn}
            onValueChange={setSyncOn}
            trackColor={{ false: '#E5E5E5', true: PRIMARY }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.tipBar}>
          <Image source={ICONS.tip} style={styles.icon16} />
          <Text style={styles.tipText}>只有明确、有效的供需信息，才会同步到「正在发生」。</Text>
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
          activeOpacity={0.85}
          disabled={publishing}
          onPress={onPublish}
        >
          {publishing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.publishBtnText}>立即发布</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.reviewNote}>企业用户发布后，需企业管理员审核</Text>
      </ScrollView>

      {renderGuideSheet()}
      {renderVisibilitySheet()}
      {renderDeclareSheet()}
      {renderReprintSheet()}
      {renderCommentSheet()}
      {renderAiHelp()}
      {renderExitMenu()}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
  },
  segment: {
    flexDirection: 'row',
    height: scaleSizeH(32),
    backgroundColor: TILE_BG,
    borderRadius: scaleSizeW(100),
    padding: scaleSizeW(2),
    marginTop: scaleSizeH(18),
  },
  segmentItem: {
    flex: 1,
    borderRadius: scaleSizeW(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: scaleSizeW(13),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  uploaderWrap: {
    marginTop: scaleSizeH(30),
  },
  mediaAddIcon: {
    width: scaleSizeW(33),
    height: scaleSizeW(33),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(30),
  },
  titleInput: {
    flex: 1,
    padding: 0,
    fontSize: scaleSizeW(16),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  titleCount: {
    fontSize: scaleSizeW(12),
    color: '#999999',
    marginLeft: scaleSizeW(8),
  },
  titleCountOver: {
    color: '#EF4444',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginTop: scaleSizeH(10),
  },
  bodyInput: {
    padding: 0,
    marginTop: scaleSizeH(10),
    minHeight: scaleSizeH(96),
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(24),
    color: TEXT_MAIN,
    textAlignVertical: 'top',
  },
  tabPlaceholder: {
    height: scaleSizeH(180),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPlaceholderText: {
    fontSize: scaleSizeW(13),
    color: '#999999',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleSizeH(50),
    gap: scaleSizeW(5),
  },
  settingLabel: {
    flex: 1,
    fontSize: scaleSizeW(14),
    color: TEXT_MAIN,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    maxWidth: '60%',
  },
  settingValue: {
    fontSize: scaleSizeW(14),
    color: TEXT_SUB,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleSizeH(50),
    gap: scaleSizeW(5),
  },
  syncCopy: {
    flex: 1,
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  syncTitle: {
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  syncSub: {
    marginTop: scaleSizeH(3),
    fontSize: scaleSizeW(12),
    color: TEXT_SUB,
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    height: scaleSizeH(36),
    paddingLeft: scaleSizeW(14),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F2F6FF',
    marginTop: scaleSizeH(8),
  },
  tipText: {
    fontSize: scaleSizeW(12),
    color: PRIMARY,
  },
  publishBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeH(30),
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reviewNote: {
    marginTop: scaleSizeH(12),
    marginBottom: scaleSizeH(30),
    fontSize: scaleSizeW(12),
    color: TEXT_SUB,
    textAlign: 'center',
  },
  icon20: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  icon18: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
  },
  icon16: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  icon15: {
    width: scaleSizeW(15),
    height: scaleSizeW(15),
  },
  icon25: {
    width: scaleSizeW(25),
    height: scaleSizeW(25),
  },
  iconSync: {
    width: scaleSizeW(20),
    height: scaleSizeW(18.62),
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(30),
  },
  videoCoverTileFilled: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  coverLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEditBtn: {
    position: 'absolute',
    bottom: scaleSizeW(6),
    alignSelf: 'center',
    height: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  coverEditText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  videoCoverTile: {
    borderRadius: scaleSizeW(10),
    backgroundColor: TILE_BG,
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeH(5),
  },
  videoCoverText: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#999999',
  },
  exitMask: {
    flex: 1,
  },
  exitMenu: {
    position: 'absolute',
    left: scaleSizeW(16),
    top: scaleSizeH(104),
    width: scaleSizeW(136),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleSizeH(14),
    paddingHorizontal: scaleSizeW(14),
    gap: scaleSizeH(20),
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  exitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  exitItemText: {
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  exitDiscardText: {
    color: '#EF4444',
  },
  sheetNote: {
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(14),
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#6E6F74',
  },
  sheetCard: {
    backgroundColor: CARD_BG,
    borderRadius: scaleSizeW(10),
    marginBottom: scaleSizeH(10),
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleSizeH(55),
    paddingHorizontal: scaleSizeW(16),
    gap: scaleSizeW(9),
  },
  optionRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  optionLabel: {
    flex: 1,
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  reprintHeader: {
    height: scaleSizeH(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  reprintBack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  reprintTitle: {
    fontSize: scaleSizeW(17),
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  reprintInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeW(10),
    backgroundColor: INFO_BG,
    marginTop: scaleSizeH(10),
  },
  reprintInfoText: {
    flex: 1,
    fontSize: scaleSizeW(12),
    color: PRIMARY,
  },
  reprintInputCard: {
    height: scaleSizeH(55),
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(14),
    borderRadius: scaleSizeW(10),
    backgroundColor: CARD_BG,
    marginTop: scaleSizeH(12),
  },
  reprintInput: {
    padding: 0,
    fontSize: scaleSizeW(14),
    color: TEXT_MAIN,
  },
  aiOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCard: {
    width: scaleSizeW(300),
    borderRadius: scaleSizeW(34),
    backgroundColor: 'rgba(245,245,245,0.95)',
    paddingHorizontal: scaleSizeW(22),
    paddingTop: scaleSizeH(22),
    paddingBottom: scaleSizeH(14),
  },
  aiTitle: {
    fontSize: scaleSizeW(15),
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  aiBody: {
    marginTop: scaleSizeH(10),
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(20),
    color: TEXT_MAIN,
  },
  aiList: {
    marginTop: scaleSizeH(4),
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(28),
    color: TEXT_MAIN,
  },
  aiBtn: {
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(100),
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeH(20),
  },
  aiBtnText: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  guideTitle: {
    marginTop: scaleSizeH(20),
    fontSize: scaleSizeW(22),
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  guideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeW(10),
    backgroundColor: INFO_BG,
    marginTop: scaleSizeH(24),
  },
  guideInfoText: {
    flex: 1,
    fontSize: scaleSizeW(12),
    color: PRIMARY,
  },
  guideBody: {
    marginTop: scaleSizeH(16),
    fontSize: scaleSizeW(14),
    lineHeight: scaleSizeH(30),
    color: TEXT_MAIN,
  },
  guideActions: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(30),
  },
  guideBtn: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBtnPrimary: {
    backgroundColor: PRIMARY,
  },
  guideBtnText: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    color: TEXT_MAIN,
  },
  guideBtnTextPrimary: {
    color: '#FFFFFF',
  },
  guideFoot: {
    marginTop: scaleSizeH(14),
    fontSize: scaleSizeW(12),
    color: TEXT_SUB,
    textAlign: 'center',
  },
});
