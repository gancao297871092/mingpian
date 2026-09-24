import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image as RNImage,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Carousel } from 'react-native-reanimated-carousel';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { GestureViewer, GestureTrigger, useGestureViewerState } from 'react-native-gesture-image-viewer';
import Svg, { Circle, Path } from 'react-native-svg';
import Video from 'react-native-video';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import NavHeader from '@/components/NavHeader';
import RichText from '@/components/RichText';
import LongHtmlView from '@/components/LongHtmlView';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import { formatLikeCount } from '@/utils/format';
import { useUserStore } from '@/store/user';
import { useBbsInteractionStore } from '@/store/bbsInteraction';
import { getDetailCache } from '@/utils/detailCache';
import CommentInputSheet from './CommentInputSheet';
import CommentActionSheet, { type CommentAction } from './CommentActionSheet';
import CommentReportSheet from './CommentReportSheet';
import MoreActionSheet, { type MoreAction } from './MoreActionSheet';
import VisibilitySheet, { type VisibilityKey } from './VisibilitySheet';
import {
  VERIFIED_PATH,
  formatPushTime,
  joinRegion,
  transformDetail,
  type DetailData,
} from './detailTransform';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#2962D4';
const LIKE_RED = '#FE2B55';

const THUMB_PATH =
  'M12.6741 7.94118C13.0831 6.11417 13.3687 4.79274 13.5314 3.97427C13.9409 1.91363 12.8775 0 10.7699 0C8.86939 0 7.91493 0.944479 7.35213 2.83239L7.33769 2.88751C6.99985 4.41474 6.48325 5.59862 5.79944 6.44571C5.44362 6.8876 4.99556 7.24642 4.4866 7.49707C3.97763 7.74772 3.42006 7.88415 2.85286 7.89682L2.31368 7.90837C1.02795 7.93593 0 8.99433 0 10.2908V18.1126C0 19.7073 1.28232 21.0001 2.86441 21.0001H13.0164C15.1017 21.0001 16.9631 19.6818 17.6705 17.7044L19.7795 11.8083C20.316 10.3082 19.5448 8.65335 18.0567 8.11233C17.7452 7.99909 17.4163 7.94117 17.0849 7.94118H12.6741ZM10.7688 1.57501C11.7348 1.57501 12.2331 2.47276 11.9966 3.66504C11.8102 4.60374 11.4555 6.23492 10.9329 8.55412C10.8219 9.04684 11.1928 9.51619 11.6936 9.51619H17.0749C17.2251 9.51619 17.3742 9.54244 17.5156 9.59415C18.1911 9.83985 18.5412 10.5922 18.2976 11.2742L16.1919 17.1699C15.7086 18.5234 14.4368 19.4251 13.0119 19.4251H2.87517C2.15697 19.4251 1.57501 18.8373 1.57501 18.1126V10.2908C1.57501 9.85114 1.92308 9.4923 2.35831 9.48311L2.89644 9.47156C3.68964 9.45367 4.46933 9.26254 5.18088 8.91157C5.89244 8.5606 6.51864 8.05828 7.0156 7.4398C7.86086 6.39138 8.47117 4.99592 8.8581 3.25921C9.23925 1.99343 9.6687 1.57501 10.7691 1.57501H10.7688Z';
const STAR_PATH =
  'M6.70657 5.56101L8.81251 1.30786C9.007 0.915164 9.30736 0.584631 9.67969 0.353541C10.052 0.122451 10.4815 0 10.9198 0C11.358 0 11.7875 0.122451 12.1598 0.353541C12.5321 0.584631 12.8325 0.915164 13.027 1.30786L15.1324 5.56101L19.8276 6.24923C20.2612 6.31281 20.6684 6.49629 21.0033 6.77895C21.3381 7.06162 21.5874 7.43223 21.7228 7.84899C21.8583 8.26575 21.8746 8.71206 21.7699 9.1376C21.6652 9.56313 21.4437 9.95095 21.1304 10.2573L17.7363 13.574L18.5327 18.2525C18.6062 18.6846 18.5575 19.1287 18.3921 19.5345C18.2266 19.9404 17.9511 20.292 17.5964 20.5495C17.2418 20.8071 16.8222 20.9604 16.3851 20.9922C15.948 21.024 15.5106 20.933 15.1225 20.7295L10.9195 18.5274L6.7165 20.7305C6.32819 20.9344 5.89062 21.0255 5.45322 20.9938C5.01582 20.962 4.59602 20.8085 4.24125 20.5507C3.88648 20.2929 3.61086 19.941 3.44555 19.5348C3.28023 19.1286 3.2318 18.6843 3.30572 18.252L4.10211 13.5735L0.708051 10.2573C0.394561 9.95097 0.172928 9.56311 0.0681613 9.1375C-0.036605 8.71189 -0.0203336 8.26547 0.115139 7.84862C0.250612 7.43177 0.499893 7.06108 0.834853 6.77838C1.16981 6.49568 1.57712 6.31222 2.01081 6.24871L6.70605 5.56049L6.70657 5.56101ZM11.2675 1.64857C11.1752 1.60291 11.0748 1.57587 10.9721 1.56902C10.8693 1.56216 10.7663 1.57562 10.6687 1.60862C10.5712 1.64162 10.4811 1.69352 10.4036 1.76134C10.3261 1.82917 10.2628 1.91159 10.2172 2.00391L8.05061 6.37935C7.95685 6.56865 7.81858 6.73239 7.64765 6.85653C7.47673 6.98067 7.27825 7.06152 7.06923 7.09213L2.23864 7.8002C2.09408 7.82137 1.95831 7.88252 1.84666 7.97676C1.73501 8.07099 1.65191 8.19456 1.60675 8.33351C1.5616 8.47246 1.55617 8.62126 1.5911 8.76313C1.62602 8.905 1.6999 9.03429 1.80439 9.1364L5.29669 12.5487C5.4478 12.6964 5.56082 12.8786 5.62608 13.0795C5.69134 13.2805 5.70688 13.4943 5.67137 13.7026L4.85199 18.5154C4.82751 18.6594 4.84376 18.8074 4.8989 18.9426C4.95404 19.0779 5.04588 19.1951 5.16406 19.2809C5.28224 19.3668 5.42206 19.4179 5.56775 19.4285C5.71343 19.4391 5.85918 19.4088 5.98857 19.341L10.3128 17.0747C10.5 16.9765 10.7081 16.9253 10.9195 16.9253C11.1308 16.9253 11.339 16.9765 11.5262 17.0747L15.8504 19.3416C15.9798 19.4094 16.1255 19.4397 16.2712 19.429C16.4169 19.4184 16.5567 19.3673 16.6749 19.2814C16.7931 19.1956 16.8849 19.0784 16.9401 18.9432C16.9952 18.8079 17.0115 18.6599 16.987 18.5159L16.1676 13.7026C16.1321 13.4943 16.1476 13.2805 16.2129 13.0795C16.2782 12.8786 16.3912 12.6964 16.5423 12.5487L20.0346 9.1364C20.1391 9.03432 20.213 8.90508 20.2479 8.76325C20.2829 8.62142 20.2775 8.47264 20.2324 8.3337C20.1873 8.19477 20.1043 8.0712 19.9927 7.97693C19.8811 7.88266 19.7454 7.82145 19.6009 7.8002L14.7697 7.09213C14.5607 7.06152 14.3622 6.98067 14.1913 6.85653C14.0204 6.73239 13.8821 6.56865 13.7884 6.37935L11.6218 2.00339C11.5458 1.84951 11.4213 1.72486 11.2675 1.64857Z';
const COMMENT_PATH =
  'M1.77765 16.3888C1.50675 15.9289 1.3293 15.6205 1.2411 15.4559C0.423967 13.9319 -0.00245872 12.2291 1.06641e-05 10.4999C1.06641e-05 4.70108 4.70109 0 10.4999 0C16.2988 0 20.9998 4.70108 20.9998 10.4999C20.9998 16.2988 16.2988 20.9998 10.4999 20.9998C8.60055 21.0027 6.73629 20.4879 5.10743 19.5109C4.94334 19.4137 4.77884 19.3172 4.61394 19.2214L2.04461 19.9223C1.45661 20.0824 0.917441 19.543 1.07783 18.9552L1.77765 16.3888ZM3.38466 16.482L2.95994 18.0399L4.51786 17.6152C4.61866 17.5877 4.72394 17.5805 4.82755 17.594C4.93115 17.6076 5.03103 17.6416 5.12135 17.6942C5.38737 17.8485 5.65276 18.0039 5.9175 18.1604C7.30166 18.9906 8.88592 19.4277 10.4999 19.4248C15.4291 19.4248 19.4249 15.4291 19.4249 10.4999C19.4249 5.57073 15.4291 1.57499 10.4999 1.57499C5.57074 1.57499 1.575 5.57073 1.575 10.4999C1.575 11.9909 1.9404 13.4273 2.62893 14.7114C2.72028 14.8815 2.94708 15.2732 3.3025 15.8738C3.35621 15.9645 3.39115 16.0651 3.40527 16.1695C3.41938 16.274 3.41237 16.3803 3.38466 16.482ZM6.97747 14.7403C6.89653 14.6747 6.82942 14.5936 6.78005 14.5018C6.73068 14.41 6.70001 14.3093 6.68984 14.2056C6.67966 14.1019 6.69018 13.9972 6.72077 13.8975C6.75137 13.7979 6.80143 13.7054 6.86807 13.6252C6.93471 13.5451 7.01659 13.479 7.10897 13.4307C7.20135 13.3825 7.30239 13.353 7.40623 13.3441C7.51007 13.3352 7.61464 13.347 7.71389 13.3788C7.81314 13.4106 7.90509 13.4618 7.98441 13.5294C8.69045 14.1178 9.58087 14.4392 10.4999 14.4374C11.4323 14.4374 12.313 14.1132 13.0147 13.5297C13.0942 13.4636 13.186 13.4137 13.2847 13.3831C13.3835 13.3524 13.4873 13.3416 13.5903 13.351C13.6933 13.3605 13.7934 13.3902 13.8849 13.4384C13.9765 13.4865 14.0576 13.5523 14.1237 13.6318C14.1898 13.7113 14.2396 13.8031 14.2703 13.9019C14.3009 14.0006 14.3118 14.1045 14.3023 14.2075C14.2929 14.3104 14.2632 14.4105 14.215 14.5021C14.1669 14.5936 14.1011 14.6747 14.0216 14.7408C13.0329 15.5641 11.7865 16.0141 10.4999 16.0124C9.213 16.0141 7.96633 15.5639 6.97747 14.7403Z';
const THUMB_SMALL_PATH =
  'M8.25887 5.17475C8.52537 3.98421 8.71148 3.12312 8.81753 2.58977C9.08438 1.24699 8.39144 0 7.01804 0C5.7796 0 5.15765 0.615455 4.7909 1.84568L4.7815 1.8816C4.56135 2.8768 4.22471 3.64826 3.77911 4.20025C3.54725 4.4882 3.25528 4.72202 2.92362 4.88535C2.59197 5.04868 2.22863 5.13759 1.85902 5.14584L1.50768 5.15337C0.669851 5.17133 0 5.86102 0 6.70586V11.8028C0 12.8419 0.835603 13.6844 1.86655 13.6844H8.48192C9.84078 13.6844 11.0537 12.8253 11.5147 11.5368L12.889 7.69473C13.2386 6.71715 12.7361 5.63882 11.7663 5.28628C11.5634 5.21249 11.3491 5.17474 11.1331 5.17475H8.25887ZM7.01735 1.02633C7.64683 1.02633 7.9715 1.61134 7.81738 2.38827C7.69593 2.99996 7.46483 4.06289 7.12426 5.57416C7.05191 5.89523 7.29361 6.20108 7.61998 6.20108H11.1266C11.2244 6.20108 11.3216 6.21819 11.4138 6.25188C11.8539 6.41199 12.0821 6.90223 11.9234 7.34663L10.5512 11.1885C10.2363 12.0705 9.4075 12.6581 8.47902 12.6581H1.87356C1.40556 12.6581 1.02633 12.2751 1.02633 11.8028V6.70586C1.02633 6.41935 1.25315 6.18551 1.53676 6.17953L1.88742 6.172C2.4043 6.16034 2.91237 6.03579 3.37604 5.80709C3.83972 5.57839 4.24777 5.25106 4.57161 4.84804C5.12241 4.16484 5.52011 3.25552 5.77225 2.12382C6.02062 1.29899 6.30046 1.02633 7.01752 1.02633H7.01735Z';

interface ReplyData {
  id: string;
  userId: number;
  avatar: string;
  userName: string;
  isAuthor?: boolean;
  replyTo?: string;
  replyToUserId: number;
  isLike: boolean;
  content: string;
  time: string;
  location: string;
  likeCount: number;
}

interface CommentData extends ReplyData {
  isTop?: boolean;
  replyCount: number;
  authorReplied?: boolean;
  replies: ReplyData[];
}

interface ReplyTarget {
  name: string;
  commentId: string;
  replyToUserId: number;
  /** 仅回复二级评论时带（用于展示"回复 xx"）；回复一级评论为空 */
  replyToName?: string;
}

function transformReply(c: any): ReplyData {
  const info = c.userInfoVo ?? {};
  return {
    id: String(c.id),
    userId: c.userId,
    avatar: info.avatar || '',
    userName: [info.nickname || info.username, info.cpName].filter(Boolean).join('·'),
    isAuthor: !!c.isAuthor,
    replyTo: c.replyToNickname || '',
    replyToUserId: c.replyToUserId || 0,
    isLike: !!c.isLike,
    content: c.content || '',
    time: formatPushTime(c.createTime),
    location: joinRegion(info.province, info.city),
    likeCount: c.likeCount || 0,
  };
}

/** 回复一级评论本身（replyToUserId=一级评论作者）不展示"回复 xx"；回复二级才展示 */
function applyReplyToRule(reply: ReplyData, commentUserId: number): ReplyData {
  return reply.replyToUserId === commentUserId ? { ...reply, replyTo: '' } : reply;
}

function transformComment(c: any): CommentData {
  return {
    ...transformReply(c),
    isTop: Number(c.isTop) === 1,
    replyCount: c.replyCount || 0,
    authorReplied: !!c.authorReplied,
    replies: (c.firstReplies ?? []).map((r: any) => applyReplyToRule(transformReply(r), c.userId)),
  };
}

const PROGRESS_W = scaleSizeW(120);

/** 顶部不定进度条（缓存渲染 + 接口在途时提示数据更新中） */
function TopProgressBar() {
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-PROGRESS_W, SCREEN_WIDTH],
  });
  return (
    <View style={styles.progressTrack} pointerEvents="none">
      <Animated.View style={[styles.progressBar, { transform: [{ translateX }] }]} />
    </View>
  );
}

/** 无缓存时的详情骨架屏 */
function DetailSkeleton() {
  return (
    <View>
      <View style={[styles.skeletonBlock, { height: SCREEN_WIDTH * (535 / 402) }]} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLine92]} />
        <View style={[styles.skeletonLine, styles.skeletonLine70]} />
        <View style={[styles.skeletonLine, styles.skeletonMeta]} />
      </View>
    </View>
  );
}

const VideoCoverPlayer = React.memo(function VideoCoverPlayerInner({
  poster,
  videoUrl,
  height,
}: {
  poster: string;
  videoUrl: string;
  height: number;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <Video
        source={{ uri: videoUrl }}
        style={{ width: SCREEN_WIDTH, height }}
        controls
        paused={false}
        resizeMode="contain"
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setPlaying(true)}>
      <ExpoImage
        source={{ uri: poster }}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        recyclingKey={poster}
      />
      <View style={styles.videoPlayOverlay}>
        <View style={styles.videoPlayBtn}>
          <Svg width={scaleSizeW(22)} height={scaleSizeW(22)} viewBox="0 0 24 24">
            <Path
              d="M9.5 6.8v10.4c0 .8.9 1.3 1.6.9l8.2-5.2c.6-.4.6-1.4 0-1.8l-8.2-5.2c-.7-.4-1.6.1-1.6.9z"
              fill="#1A1A1A"
            />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function VerifiedBadge() {
  return (
    <Svg width={scaleSizeW(12)} height={scaleSizeW(12)} viewBox="0 0 12 12">
      <Path d={VERIFIED_PATH} fill={BLUE} />
    </Svg>
  );
}

function PreviewBadge() {
  const { currentIndex, totalCount } = useGestureViewerState();
  if (totalCount <= 1) return null;
  return (
    <View style={styles.previewBadge} pointerEvents="none">
      <Text style={styles.pageBadgeText}>{currentIndex + 1}/{totalCount}</Text>
    </View>
  );
}

interface TapViewProps extends ViewProps {
  onPress?: () => void;
  children?: React.ReactNode;
}

// 轮播 item 内的点击必须走 gesture-handler 的 Tap（与 carousel 的 pan 协调），
// 用 RN Pressable 会消费触摸流导致 carousel 拖不动
// 注意：gesture 回调是 worklet，在 UI 线程执行，不能在其中同步调用普通 JS 函数，
// 需用 scheduleOnRN 调度回 JS 线程；也不能捕获 ref 后再修改 ref.current
const TapView = React.forwardRef<View, TapViewProps>(({ onPress, children, ...rest }, ref) => {
  const tap = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        if (onPress) scheduleOnRN(onPress);
      }),
    [onPress],
  );
  return (
    <GestureDetector gesture={tap}>
      <View ref={ref} {...rest}>
        {children}
      </View>
    </GestureDetector>
  );
});
TapView.displayName = 'TapView';

function CommentLike({
  commentId,
  count,
  isLike,
  showCount = true,
}: {
  commentId: string;
  count: number;
  isLike: boolean;
  showCount?: boolean;
}) {
  const [liked, setLiked] = useState(isLike);
  useEffect(() => setLiked(isLike), [isLike]);
  const delta = liked === isLike ? 0 : liked ? 1 : -1;
  const onPress = () => {
    const next = !liked;
    setLiked(next);
    API.bbsComment.like({ commentId: Number(commentId), status: next ? 1 : 0 }).catch(() => setLiked(!next));
  };
  return (
    <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.commentLike} onPress={onPress}>
      <Svg width={scaleSizeW(13)} height={scaleSizeW(14)} viewBox="0 0 13 14">
        <Path d={THUMB_SMALL_PATH} fill={liked ? LIKE_RED : '#666666'} />
      </Svg>
      {showCount && (
        <Text style={[styles.commentLikeCount, liked && styles.commentLikeCountActive]}>
          {formatLikeCount(count + delta)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ReplyRow({
  reply,
  onReply,
  onLongPress,
}: {
  reply: ReplyData;
  onReply?: (name: string, userId: number) => void;
  onLongPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={1} onLongPress={onLongPress} delayLongPress={350}>
      <View style={styles.replyRow}>
      <ExpoImage source={{ uri: reply.avatar }} style={styles.replyAvatar} contentFit="cover" transition={150} recyclingKey={reply.avatar} />
      <View style={styles.replyBody}>
        <View style={styles.replyNameRow}>
          <Text style={styles.commentName} numberOfLines={1}>{reply.userName}</Text>
          {reply.isAuthor && (
            <View style={styles.authorBadge}>
              <Text style={styles.authorBadgeText}>作者</Text>
            </View>
          )}
        </View>
        <Text style={styles.commentContent}>
          {reply.replyTo ? `回复 ${reply.replyTo}：` : ''}{reply.content}
        </Text>
        <View style={styles.commentMetaRow}>
          <View style={styles.commentMetaLeft}>
            <Text style={styles.commentMetaText}>{reply.time} {reply.location}</Text>
            <TouchableOpacity activeOpacity={0.7} hitSlop={6} onPress={() => onReply?.(reply.userName, reply.userId)}>
              <Text style={styles.commentReplyText}>回复</Text>
            </TouchableOpacity>
          </View>
          <CommentLike commentId={reply.id} count={reply.likeCount} isLike={reply.isLike} showCount={false} />
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );
}

function CommentItem({
  item,
  onReply,
  onLongPress,
  onLongPressReply,
  onExpandReplies,
}: {
  item: CommentData;
  onReply?: (target: ReplyTarget) => void;
  onLongPress?: (item: CommentData) => void;
  onLongPressReply?: (reply: ReplyData) => void;
  onExpandReplies?: (item: CommentData) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleReplies = expanded ? item.replies : item.replies.slice(0, 1);
  const hiddenCount = item.replyCount - visibleReplies.length;

  const onToggleExpand = () => {
    // 展开且本地数据不足时拉取全量回复（写入 comments 单一数据源）
    if (!expanded && item.replyCount > item.replies.length) {
      onExpandReplies?.(item);
    }
    setExpanded(v => !v);
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.commentRow} onLongPress={() => onLongPress?.(item)} delayLongPress={350}>
      <ExpoImage source={{ uri: item.avatar }} style={styles.commentAvatar} contentFit="cover" transition={150} recyclingKey={item.avatar} />
      <View style={styles.commentBody}>
        <View style={styles.replyNameRow}>
          <Text style={styles.commentName} numberOfLines={1}>{item.userName}</Text>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
        <View style={styles.commentMetaRow}>
          <View style={styles.commentMetaLeft}>
            <Text style={styles.commentMetaText}>{item.time} {item.location}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={6}
              onPress={() => onReply?.({ name: item.userName, commentId: item.id, replyToUserId: item.userId })}
            >
              <Text style={styles.commentReplyText}>回复</Text>
            </TouchableOpacity>
          </View>
          <CommentLike commentId={item.id} count={item.likeCount} isLike={item.isLike} />
        </View>
        {item.isTop && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>置顶评论</Text>
          </View>
        )}
          {visibleReplies.map(r => (
          <ReplyRow
            key={r.id}
            reply={r}
            onReply={(name, userId) => onReply?.({ name, commentId: item.id, replyToUserId: userId, replyToName: name })}
            onLongPress={() => onLongPressReply?.(r)}
          />
        ))}
        {item.replyCount > 1 && (
          <TouchableOpacity activeOpacity={0.7} style={styles.expandRow} onPress={onToggleExpand}>
            <View style={styles.expandDash} />
            <Text style={styles.expandText}>{expanded ? '收起' : `展开 ${hiddenCount} 条回复`}</Text>
          </TouchableOpacity>
        )}
        {item.authorReplied && (
          <View style={styles.authorLikedBadge}>
            <Text style={styles.authorLikedText}>作者回复过</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function BbsDetail() {
  const route = useRoute<RouteProp<RootStackParamList, 'bbsDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentAvatar = useUserStore(s => s.userInfo?.wqUser?.avatar);
  const currentName = useUserStore(s => s.userInfo?.wqUser?.nameZh || s.userInfo?.wqUser?.username);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPages, setCommentPages] = useState(1);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [visibility, setVisibility] = useState<VisibilityKey>('public');
  const likeNextRef = useRef({ isLiked: false, likeCount: 0 });
  const favNextRef = useRef({ isFaved: false, favCount: 0 });

  const myId = useUserStore(s => s.userInfo?.wqUser?.id);
  const isBbsAuthor = !!detail && !!myId && detail.authorId === myId;
  // commentScope：0所有人 1粉丝 2互关 3仅自己；不满足条件时评论区锁定
  const commentLockText = (() => {
    if (!detail || isBbsAuthor) return '';
    const scope = detail.commentScope;
    if (scope === 3) return '作者已关闭评论';
    if (scope === 2) return following ? '' : '作者仅允许互关好友评论';
    if (scope === 1) return following ? '' : '作者仅允许粉丝评论';
    return '';
  })();
  const commentRestricted = commentLockText !== '';

  const inputSheetRef = useRef<BottomSheetModal>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const reportSheetRef = useRef<BottomSheetModal>(null);
  const moreSheetRef = useRef<BottomSheetModal>(null);
  const visibilitySheetRef = useRef<BottomSheetModal>(null);
  const pendingActionRef = useRef<'report' | 'visibility' | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentData | ReplyData | null>(null);
  const [actionVariant, setActionVariant] = useState<'user' | 'author' | 'manage'>('user');
  // 二级回复可弹出操作层但不提供置顶
  const [canPin, setCanPin] = useState(true);

  const loadComments = useCallback(
    (page: number) => {
      return API.bbsComment
        .list({ bbsId: Number(route.params.id), pageNum: page, pageSize: 20 })
        .then(res => {
          console.log(res)
          const mapped = (res.data?.list ?? []).map(transformComment);
          setComments(prev => (page === 1 ? mapped : [...prev, ...mapped]));
          setCommentPage(page);
          setCommentPages(res.data?.pages || 1);
          setCommentCount(res.data?.total ?? 0);
        })
        .catch(() => { });
    },
    [route.params.id],
  );

  const fetchReplies = useCallback(async (commentId: string, commentUserId: number): Promise<ReplyData[]> => {
    const res = await API.bbsComment.replyList({ commentId: Number(commentId), pageNum: 1, pageSize: 50 });
    return (res.data?.list ?? []).map((r: any) => applyReplyToRule(transformReply(r), commentUserId));
  }, []);

  const expandingRef = useRef<Set<string>>(new Set());
  const expandReplies = useCallback(
    (item: CommentData) => {
      if (expandingRef.current.has(item.id)) return;
      expandingRef.current.add(item.id);
      fetchReplies(item.id, item.userId)
        .then(list => {
          setComments(prev => prev.map(c => (c.id === item.id ? { ...c, replies: list } : c)));
        })
        .catch(() => { })
        .finally(() => expandingRef.current.delete(item.id));
    },
    [fetchReplies],
  );

  const openCommentInput = useCallback((target?: ReplyTarget) => {
    if (commentRestricted) {
      Toast.show({ type: 'info', text1: commentLockText });
      return;
    }
    setReplyTarget(target ?? null);
    inputSheetRef.current?.present();
  }, [commentRestricted, commentLockText]);

  const openCommentActions = useCallback((item: CommentData) => {
    setSelectedComment(item);
    setCanPin(true);
    setActionVariant(isBbsAuthor ? 'author' : 'user');
    actionSheetRef.current?.present();
  }, [isBbsAuthor]);

  const openReplyActions = useCallback((reply: ReplyData) => {
    setSelectedComment(reply);
    setCanPin(false);
    setActionVariant(isBbsAuthor ? 'author' : 'user');
    actionSheetRef.current?.present();
  }, [isBbsAuthor]);

  const onSendComment = useCallback(
    (text: string) => {
      const data: { bbsId: number; parentId?: number; replyToUserId?: number; content: string } = {
        bbsId: Number(route.params.id),
        content: text,
      };
      if (replyTarget) {
        data.parentId = Number(replyTarget.commentId);
        data.replyToUserId = replyTarget.replyToUserId;
      }
      API.bbsComment
        .add(data)
        .then(res => {
          const mine = transformReply(res.data ?? {});
          // 接口可能不回传完整数据，本地回填，保证立即展示
          if (!mine.id || mine.id === 'undefined') mine.id = `local-${Date.now()}`;
          if (!mine.content) mine.content = text;
          if (!mine.time) mine.time = '刚刚';
          if (!mine.userName && currentName) mine.userName = currentName;
          if (!mine.avatar && currentAvatar) mine.avatar = currentAvatar;
          if (replyTarget) {
            // 仅回复二级评论时展示"回复 xx"（与列表接口口径一致）
            if (!mine.replyTo && replyTarget.replyToName) mine.replyTo = replyTarget.replyToName;
            setComments(prev =>
              prev.map(c =>
                c.id === replyTarget.commentId
                  ? { ...c, replyCount: c.replyCount + 1, replies: [...c.replies, mine] }
                  : c,
              ),
            );
          } else {
            // 列表按权重排序，新评论直接在本地置顶插入，避免刷新后看不到
            const newComment: CommentData = {
              ...mine,
              isTop: false,
              replyCount: 0,
              authorReplied: false,
              replies: [],
            };
            setComments(prev => [newComment, ...prev]);
          }
          setCommentCount(c => c + 1);
        })
        .catch(() => { });
    },
    [replyTarget, route.params.id, currentName, currentAvatar],
  );

  const onToggleTop = useCallback(
    (commentId: string, force: number = 0) => {
      API.bbsComment
        .top({ commentId: Number(commentId), force })
        .then(res => {
          if (res.data?.needConfirm) {
            Alert.alert('提示', res.data.msg || '已有其他置顶评论，是否替换？', [
              { text: '取消', style: 'cancel' },
              { text: '确认', onPress: () => onToggleTop(commentId, 1) },
            ]);
            return;
          }
          loadComments(1);
        })
        .catch(() => { });
    },
    [loadComments],
  );

  const onDeleteComment = useCallback(
    (commentId: string) => {
      Alert.alert('提示', '确认删除该评论吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            // 本地即时移除：一级整条（含级联回复），二级从父评论移除
            const top = comments.find(c => c.id === commentId);
            const removed = top ? 1 + top.replyCount : 1;
            API.bbsComment
              .del({ commentId: Number(commentId) })
              .then(() => {
                if (top) {
                  setComments(prev => prev.filter(c => c.id !== commentId));
                } else {
                  setComments(prev =>
                    prev.map(c =>
                      c.replies.some(r => r.id === commentId)
                        ? {
                            ...c,
                            replyCount: Math.max(0, c.replyCount - 1),
                            replies: c.replies.filter(r => r.id !== commentId),
                          }
                        : c,
                    ),
                  );
                }
                setCommentCount(c => Math.max(0, c - removed));
              })
              .catch(() => { });
          },
        },
      ]);
    },
    [comments],
  );

  const onCommentAction = useCallback(
    (action: CommentAction) => {
      if (action === 'report') {
        pendingActionRef.current = 'report';
      } else if (action === 'permission') {
        pendingActionRef.current = 'visibility';
      } else if (action === 'edit') {
        navigation.navigate('publish', { editBbsId: Number(route.params.id) });
      } else if (action === 'pin' && selectedComment) {
        onToggleTop(selectedComment.id);
      } else if (action === 'delete' && selectedComment) {
        onDeleteComment(selectedComment.id);
      } else if (action === 'copy' && selectedComment) {
        Clipboard.setString(selectedComment.content);
        Toast.show({ type: 'success', text1: '复制成功' });
      }
      actionSheetRef.current?.dismiss();
    },
    [selectedComment, onToggleTop, onDeleteComment, navigation, route.params.id],
  );

  const onActionSheetClose = useCallback(() => {
    if (pendingActionRef.current === 'report') {
      reportSheetRef.current?.present();
    } else if (pendingActionRef.current === 'visibility') {
      visibilitySheetRef.current?.present();
    }
    pendingActionRef.current = null;
  }, []);

  const onMoreAction = useCallback(
    (action: MoreAction) => {
      moreSheetRef.current?.dismiss();
      if (action === 'report') {
        navigation.navigate('reportBbs', { id: route.params.id });
      } else if (action === 'shareImage') {
        navigation.navigate('bbsShareImage', { id: route.params.id });
      }
    },
    [navigation, route.params.id],
  );

  useEffect(() => {
    let mounted = true;
    // 优先用列表带过来的缓存数据渲染，详情接口返回后再更新
    const cached = getDetailCache(route.params.id);
    if (cached) {
      const d = transformDetail(cached);
      setDetail(d);
      setLiked(d.isLiked);
      setFaved(d.isFaved);
      setFollowing(d.isFollowed || route.params.isFollowed === true);
      setVisibility(d.visibility === 2 ? 'private' : d.visibility === 1 ? 'mutual' : 'public');
      setLikeCount(d.likeCount);
      setFavCount(d.favCount);
      setLoading(false);
    }
    API.square
      .bbsDetail({ bbsId: route.params.id })
      .then(res => {
        console.log(res.data);
        if (!mounted) return;
        const d = transformDetail(res.data?.bbs ?? {});

        setDetail(d);
        setLiked(d.isLiked);
        setFaved(d.isFaved);
        setFollowing(res.data.isFollowed === 1 || route.params.isFollowed === true);
        setVisibility(d.visibility === 2 ? 'private' : d.visibility === 1 ? 'mutual' : 'public');
        setLikeCount(d.likeCount);
        setFavCount(d.favCount);
      })
      .catch(() => { })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [route.params.id, route.params.isFollowed]);

  useEffect(() => {
    if (!commentRestricted) loadComments(1);
  }, [loadComments, commentRestricted]);

  const onToggleFollow = useCallback(() => {
    if (!detail || refreshing) return;
    const next = !following;
    setFollowing(next);
    API.user
      .followOperate({ targetUserId: detail.authorId, isFollow: next ? 1 : 0 })
      .catch(() => setFollowing(!next));
  }, [detail, following, refreshing]);

  const DEFAULT_IMG_HEIGHT = SCREEN_WIDTH * (535 / 402);
  const [imgHeight, setImgHeight] = useState(DEFAULT_IMG_HEIGHT);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    setMediaReady(false);
  }, [route.params.id]);

  useEffect(() => {
    if (!detail) return;
    if (detail.images.length === 0) {
      setMediaReady(true);
      return;
    }
    const maxHeight = (SCREEN_WIDTH * 4) / 3;
    const minHeight = SCREEN_WIDTH * 0.5;
    const applySize = (width: number, height: number) => {
      if (width && height) {
        const scale = SCREEN_WIDTH / width;
        setImgHeight(prev => {
          const next = Math.min(Math.max(height * scale, minHeight), maxHeight);
          return Math.abs(next - prev) < 1 ? prev : next;
        });
      }
      setMediaReady(true);
    };
    // 优先用接口媒体宽高；缺失时用首图实测（列表已预热过图片缓存，解析很快）
    if (detail.mediaWidth && detail.mediaHeight) {
      applySize(detail.mediaWidth, detail.mediaHeight);
      return;
    }
    let cancelled = false;
    RNImage.getSize(
      detail.isVideo && detail.posterUrl ? detail.posterUrl : detail.images[0],
      (w, h) => {
        if (!cancelled) applySize(w, h);
      },
      () => {
        if (!cancelled) applySize(0, 0);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [detail]);

  const renderPreviewImage = useCallback(
    (uri: string) => <ExpoImage source={{ uri }} style={styles.previewImage} contentFit="contain" transition={100} />,
    [],
  );

  const onSnapToItem = useCallback((index: number) => {
    setImgIndex(index);
  }, []);

  const onRichImagePress = useCallback((urls: string[], index: number) => {
    setPreviewImages(urls);
    setPreviewIndex(index);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewIndex(-1);
    setPreviewImages(null);
  }, []);

  const onToggleLike = () => {
    if (refreshing) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => {
      const count = next ? c + 1 : c - 1;
      likeNextRef.current = { isLiked: next, likeCount: count };
      return count;
    });
    API.bbs
      .like({ bbsId: Number(route.params.id), status: next ? 1 : 0 })
      .then(() => {
        useBbsInteractionStore.getState().setLike(route.params.id, likeNextRef.current);
      })
      .catch(() => {
        setLiked(!next);
        setLikeCount(c => (next ? c - 1 : c + 1));
      });
  };
  const onToggleFav = () => {
    if (refreshing) return;
    const next = !faved;
    setFaved(next);
    setFavCount(c => {
      const count = next ? c + 1 : c - 1;
      favNextRef.current = { isFaved: next, favCount: count };
      return count;
    });
    API.bbs
      .favorite({ bbsId: Number(route.params.id), status: next ? 1 : 0 })
      .then(() => {
        useBbsInteractionStore.getState().setFav(route.params.id, favNextRef.current);
      })
      .catch(() => {
        setFaved(!next);
        setFavCount(c => (next ? c - 1 : c + 1));
      });
  };

  const renderHeader = () => {
    if (!detail) return null;
    // 长文按正文是否含 HTML 标签识别（动态表无 draftType 字段）
    const isLongForm = /<\/?(p|img|video|strong|em|u|span|h[1-6])[ >]/i.test(detail.content || '');
    return (
      <View>
        {detail.images.length > 0 && !isLongForm && !mediaReady && (
          <View style={[styles.mediaPlaceholder, { height: DEFAULT_IMG_HEIGHT }]} />
        )}
        {detail.images.length > 0 && !isLongForm && mediaReady && (
          <View>
            {detail.isVideo && detail.videoUrl ? (
              <VideoCoverPlayer poster={detail.images[0]} videoUrl={detail.videoUrl} height={imgHeight} />
            ) : (
              <Carousel
                data={detail.images}
                loop={true}
                autoplay={false}
                onSnapToItem={onSnapToItem}
                style={{ width: SCREEN_WIDTH, height: imgHeight }}
                itemSize={SCREEN_WIDTH}
                renderWindowSize={SCREEN_WIDTH}
                renderItem={({ item, index }) => (
                  <GestureTrigger index={index} onPress={() => setPreviewIndex(index)}>
                    <TapView>
                      <ExpoImage
                        source={{ uri: item }}
                        style={{ width: SCREEN_WIDTH, height: imgHeight }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                        recyclingKey={item}
                      />
                    </TapView>
                  </GestureTrigger>
                )}
              />
            )}
            {detail.images.length > 1 && !detail.isVideo && (
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>{imgIndex + 1}/{detail.images.length}</Text>
              </View>
            )}
          </View>
        )}
        {detail.images.length > 1 && !isLongForm && !detail.isVideo && (
          <View style={styles.dotsRow}>
            {detail.images.map((uri, i) => (
              <View key={uri} style={[styles.dot, i === imgIndex && styles.dotActive]} />
            ))}
          </View>
        )}
        <View style={styles.contentBox}>
          {!!detail.title && <Text style={styles.title}>{detail.title}</Text>}
          {!isLongForm && !!detail.content && <RichText content={detail.content} style={styles.body} />}
          {detail.tags.length > 0 && <Text style={styles.tags}>{detail.tags.join('  ')}</Text>}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {detail.timeText}{detail.location ? ` · ${detail.location}` : ''}
            </Text>
            {detail.declaration && <Text style={styles.declarationText}>已声明原创</Text>}
          </View>
          {isLongForm && !!detail.content && (
            <LongHtmlView
              contentWidth={SCREEN_WIDTH - scaleSizeW(32)}
              html={detail.content}
              baseStyle={styles.body}
              onImagePress={onRichImagePress}
            />
          )}
          {!commentRestricted && (
            <>
              <View style={styles.divider} />
              <Text style={styles.commentCount}>共 {commentCount} 条评论</Text>
            </>
          )}
          <View style={styles.commentInputRow}>
            <ExpoImage
              source={{ uri: currentAvatar || 'https://i.pravatar.cc/100?img=8' }}
              style={styles.commentAvatar}
              contentFit="cover"
              transition={150}
            />
            <TouchableOpacity activeOpacity={0.7} style={styles.commentInput} onPress={() => openCommentInput()}>
              <Text style={styles.commentInputText}>
                {commentRestricted ? commentLockText : '留下你的看法'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor="#FFFFFF">
      <NavHeader
        center={
          detail ? (
            <View style={styles.headerAuthor}>
              <ExpoImage source={{ uri: detail.authorAvatar }} style={styles.headerAvatar} contentFit="cover" transition={150} />
              <View style={styles.headerAuthorText}>
                <Text style={styles.headerName} numberOfLines={1}>{detail.authorName}</Text>
                {detail.authorCompany && <View style={styles.headerCompanyRow}>
                  <Text style={styles.headerCompany} numberOfLines={1}>{detail.authorCompany}</Text>
                  <VerifiedBadge />
                </View>}
              </View>
            </View>
          ) : null
        }
        right={
          <>
            {!isBbsAuthor && (
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={refreshing}
                style={[styles.followBtn, following && styles.followedBtn, refreshing && styles.actionDisabled]}
                onPress={onToggleFollow}
              >
                <Text style={[styles.followText, following && styles.followedText]}>{following ? '已关注' : '关注'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              style={styles.moreBtn}
              onPress={() => moreSheetRef.current?.present()}
            >
              <Svg width={scaleSizeW(30)} height={scaleSizeW(14)} viewBox="0 0 30 14">
                <Circle cx={7} cy={7} r={2} fill="#999999" />
                <Circle cx={15} cy={7} r={2} fill="#999999" />
                <Circle cx={23} cy={7} r={2} fill="#999999" />
              </Svg>
            </TouchableOpacity>
          </>
        }
      />
      <View style={styles.flex1}>
        {refreshing && detail && <TopProgressBar />}
        {loading && !detail ? (
          <DetailSkeleton />
        ) : (
        <FlatList
          data={commentRestricted ? [] : comments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              onReply={openCommentInput}
              onLongPress={openCommentActions}
              onLongPressReply={openReplyActions}
              onExpandReplies={expandReplies}
            />
          )}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={
            commentRestricted ? (
              <View style={styles.restrictedEmpty}>
                <RNImage
                  source={require('@/assets/empty-state/comment-restricted.png')}
                  style={styles.restrictedImage}
                  resizeMode="contain"
                />
                <Text style={styles.restrictedText}>{commentLockText}</Text>
              </View>
            ) : (
              <EmptyState variant="comment" title="暂无评论" style={styles.emptyComment} />
            )
          }
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (commentPage < commentPages) loadComments(commentPage + 1);
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <View style={[styles.bottomBar, { paddingBottom: scaleSizeH(10) }]}>
        <View style={styles.bottomBarRow}>
          {isBbsAuthor ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSelectedComment(null);
                  setActionVariant('manage');
                  actionSheetRef.current?.present();
                }}
                activeOpacity={0.7}
                style={[styles.bottomInput, styles.authorBtn]}
              >
                <Text style={[styles.commentInputText, styles.authorBtnText]}>编辑和权限设置</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity activeOpacity={0.7} style={styles.bottomInput} onPress={() => openCommentInput()}>
              <Text style={styles.commentInputText}>
                {commentRestricted ? commentLockText : '留下你的看法'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.7} hitSlop={6} disabled={refreshing} style={[styles.bottomAction, refreshing && styles.actionDisabled]} onPress={onToggleLike}>
            <Svg width={scaleSizeW(20)} height={scaleSizeW(21)} viewBox="0 0 20 21">
              <Path d={THUMB_PATH} fill={liked ? LIKE_RED : '#000000'} />
            </Svg>
            <Text style={[styles.bottomActionText, { color: liked ? LIKE_RED : '#000000' }]}>{formatLikeCount(likeCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} hitSlop={6} disabled={refreshing} style={[styles.bottomAction, refreshing && styles.actionDisabled]} onPress={onToggleFav}>
            <Svg width={scaleSizeW(22)} height={scaleSizeW(21)} viewBox="0 0 22 21">
              <Path d={STAR_PATH} fill={faved ? '#FFB800' : '#000000'} />
            </Svg>
            <Text style={[styles.bottomActionText, { color: faved ? '#FFB800' : '#000000' }]}>{formatLikeCount(favCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openCommentInput()}
            style={styles.bottomAction}
          >
            <Svg width={scaleSizeW(21)} height={scaleSizeW(21)} viewBox="0 0 21 21">
              <Path d={COMMENT_PATH} fill="#000000" />
            </Svg>
            <Text style={styles.bottomActionText}>{formatLikeCount(commentCount)}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
      <CommentInputSheet
        ref={inputSheetRef}
        placeholder={replyTarget ? `回复 @${replyTarget.name}` : '留下你的看法'}
        onSend={onSendComment}
      />
      <CommentActionSheet
        ref={actionSheetRef}
        variant={actionVariant}
        isTop={selectedComment && 'isTop' in selectedComment ? selectedComment.isTop : false}
        canPin={canPin}
        onAction={onCommentAction}
        onClose={onActionSheetClose}
      />
      <CommentReportSheet ref={reportSheetRef} onSubmit={() => reportSheetRef.current?.dismiss()} />
      <MoreActionSheet ref={moreSheetRef} onAction={onMoreAction} />
      <VisibilitySheet
        ref={visibilitySheetRef}
        value={visibility}
        onSelect={key => {
          setVisibility(key);
          visibilitySheetRef.current?.dismiss();
        }}
      />
      <Modal transparent visible={previewIndex >= 0} onRequestClose={closePreview}>
        {detail && previewIndex >= 0 && (
          <>
            <GestureViewer
              data={previewImages ?? detail.images}
              initialIndex={previewIndex}
              renderItem={renderPreviewImage}
              ListComponent={ScrollView}
              onDismiss={closePreview}
              onSingleTap={closePreview}
            />
            <PreviewBadge />
          </>
        )}
      </Modal>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
    overflow: 'hidden',
  },
  progressBar: {
    width: PROGRESS_W,
    height: 2,
    borderRadius: 1,
    backgroundColor: BLUE,
  },
  skeletonBlock: {
    width: SCREEN_WIDTH,
    backgroundColor: '#F5F5F5',
  },
  skeletonBody: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
    gap: scaleSizeH(10),
  },
  skeletonLine: {
    height: scaleSizeH(12),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#F5F5F5',
    width: '100%',
  },
  skeletonTitle: {
    width: '55%',
    height: scaleSizeH(18),
  },
  skeletonLine92: {
    width: '92%',
  },
  skeletonLine70: {
    width: '70%',
  },
  skeletonMeta: {
    width: '35%',
    marginTop: scaleSizeH(12),
  },
  actionDisabled: {
    opacity: 0.4,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: scaleSizeH(30),
    backgroundColor: '#FFFFFF',
  },
  headerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scaleSizeW(12),
    flexShrink: 1,
  },
  headerAvatar: {
    width: scaleSizeW(37),
    height: scaleSizeW(37),
    borderRadius: scaleSizeW(18.5),
    backgroundColor: '#F5F5F5',
  },
  headerAuthorText: {
    marginLeft: scaleSizeW(10),
    flexShrink: 1,
  },
  headerName: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(12),
  },
  headerCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(5),
    gap: scaleSizeW(2),
  },
  headerCompany: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
    flexShrink: 1,
  },
  followBtn: {
    width: scaleSizeW(64),
    height: scaleSizeH(28),
    borderRadius: scaleSizeH(14),
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedBtn: {
    borderColor: '#EDEDEC',
  },
  followText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: BLUE,
  },
  followedText: {
    color: '#000000',
  },
  moreBtn: {
    marginLeft: scaleSizeW(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadge: {
    position: 'absolute',
    top: scaleSizeH(10),
    right: scaleSizeW(16),
    height: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeH(10),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadgeText: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
    lineHeight: scaleSizeH(12),
  },
  previewBadge: {
    position: 'absolute',
    top: scaleSizeH(60),
    right: scaleSizeW(16),
    height: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeH(10),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSizeW(3),
    marginTop: scaleSizeH(10),
  },
  dot: {
    width: scaleSizeW(6),
    height: scaleSizeW(6),
    borderRadius: scaleSizeW(3),
    backgroundColor: '#CCCCCC',
  },
  dotActive: {
    backgroundColor: BLUE,
  },
  mediaPlaceholder: {
    width: SCREEN_WIDTH,
    backgroundColor: '#F5F5F5',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayBtn: {
    width: scaleSizeW(52),
    height: scaleSizeW(52),
    borderRadius: scaleSizeW(26),
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  contentBox: {
    paddingHorizontal: scaleSizeW(16),
  },
  title: {
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(23),
    marginTop: scaleSizeH(20),
  },
  body: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(10),
  },
  tags: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: BLUE,
    lineHeight: scaleSizeH(24),
    marginTop: scaleSizeH(20),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(20),
  },
  metaText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  declarationText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEBEB',
    marginTop: scaleSizeH(20),
  },
  commentCount: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(16),
    marginTop: scaleSizeH(10),
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(20),
  },
  commentAvatar: {
    width: scaleSizeW(37),
    height: scaleSizeW(37),
    borderRadius: scaleSizeW(18.5),
    backgroundColor: '#F5F5F5',
  },
  commentInput: {
    flex: 1,
    height: scaleSizeH(40),
    borderRadius: scaleSizeH(20),
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    paddingLeft: scaleSizeW(20),
    marginLeft: scaleSizeW(12),
  },
  commentInputText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#999999',
  },
  emptyComment: {
    paddingVertical: scaleSizeH(60),
  },
  restrictedEmpty: {
    alignItems: 'center',
    paddingVertical: scaleSizeH(30),
  },
  restrictedImage: {
    width: scaleSizeW(122),
    height: scaleSizeW(129),
    opacity: 0.3,
  },
  restrictedText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#C1C1C1',
    lineHeight: scaleSizeH(19),
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(30),
  },
  commentBody: {
    flex: 1,
    marginLeft: scaleSizeW(12),
  },
  replyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
    minHeight: scaleSizeH(18),
  },
  commentName: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(12),
    flexShrink: 1,
  },
  authorBadge: {
    height: scaleSizeH(18),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeH(9),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: BLUE,
    lineHeight: scaleSizeH(12),
  },
  commentContent: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(10),
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(10),
  },
  commentMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(12),
  },
  commentMetaText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#999999',
    lineHeight: scaleSizeH(12),
  },
  commentReplyText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  commentLikeCount: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#616161',
    lineHeight: scaleSizeH(21),
  },
  commentLikeCountActive: {
    color: LIKE_RED,
  },
  topBadge: {
    alignSelf: 'flex-start',
    height: scaleSizeH(18),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeH(9),
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(10),
  },
  topBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: BLUE,
    lineHeight: scaleSizeH(10),
  },
  replyRow: {
    flexDirection: 'row',
    marginTop: scaleSizeH(20),
  },
  replyAvatar: {
    width: scaleSizeW(25),
    height: scaleSizeW(25),
    borderRadius: scaleSizeW(12.5),
    backgroundColor: '#F5F5F5',
  },
  replyBody: {
    flex: 1,
    marginLeft: scaleSizeW(6),
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(20),
  },
  expandDash: {
    width: scaleSizeW(25),
    height: 1,
    backgroundColor: '#D9D9D9',
  },
  expandText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(12),
  },
  authorLikedBadge: {
    alignSelf: 'flex-start',
    height: scaleSizeH(18),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeH(9),
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeH(10),
  },
  authorLikedText: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeH(10),
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEBEB',
  },
  bottomBarRow: {
    height: scaleSizeH(72),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
  },
  bottomInput: {
    height: scaleSizeH(36),
    borderRadius: scaleSizeH(18),
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    paddingLeft: scaleSizeW(14),
    flex: 1
  },
  authorBtn: {
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    paddingLeft: 0,
  },
  authorBtnText: {
    color: BLUE,
  },
  bottomSpacer: {
    flex: 1,
  },
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
    marginLeft: scaleSizeW(18),
  },
  bottomActionText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeH(21),
  },
});
