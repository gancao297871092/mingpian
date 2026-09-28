import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { formatLikeCount } from '@/utils/format';
import { formatPushTime } from '@/pages/square/bbsDetail/detailTransform';
import { CardLikeIcon } from '../myIcons';

/** 瀑布流草稿卡片的伪 id */
export const DRAFT_ITEM_ID = '__draft__';

export interface TabHandle {
  onRefresh: () => Promise<void>;
  onEndReached: () => Promise<void> | void;
  /** 未加载过时拉取第一页（tab 切换时主动调用） */
  ensureLoaded: () => void;
}

export interface TabState<T = any> {
  list: T[];
  page: number;
  pages: number;
  loading: boolean;
  loaded: boolean;
}

export const initialTabState = <T,>(): TabState<T> => ({
  list: [],
  page: 0,
  pages: 1,
  loading: false,
  loaded: false,
});

export interface PostCardData {
  id: string;
  imageUrl: string;
  imageHeight: number;
  title: string;
  date: string;
  likeCount: number;
  /** 1已发布 3待审核 4未通过（沿用老项目 pageItem 语义；2草稿已改本地存储，不会出现） */
  status?: number;
  raw?: any;
}

export interface CommentCardData {
  id: string;
  bbsId: number;
  avatar: string;
  name: string;
  company: string;
  content: string;
  time: string;
  bbsTitle: string;
}

function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_388,h_640,m_fast`;
}

export function mapPost(bbs: any): PostCardData {
  const media = bbs.mediaLinkList?.[0]?.media;
  const isVideo = media?.fileType === 'video';
  const imageUrl = isVideo
    ? bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media?.mdUrl || '')
    : media?.mdUrl || bbs.posterUrl || bbs.coverUrl || '';
  const w = media?.width ? parseInt(media.width, 10) : 194;
  const h = media?.height ? parseInt(media.height, 10) : 237;
  const imageHeight = Math.min(Math.round((194 * h) / w), 320);
  return {
    id: String(bbs.id),
    imageUrl,
    imageHeight,
    title: bbs.title || (bbs.content || '').replace(/<[^>]*>/g, '').slice(0, 50),
    date: formatPushTime(bbs.pushTime || bbs.createTime).slice(0, 5),
    likeCount: bbs.countLike || 0,
    status: bbs.status,
    raw: bbs,
  };
}

export function mapComment(c: any): CommentCardData {
  const info = c.userInfoVo ?? {};
  return {
    id: String(c.id),
    bbsId: c.bbsId,
    avatar: info.avatar || '',
    name: info.nickname || info.username || '',
    company: info.cpName || '',
    content: c.content || '',
    time: formatPushTime(c.createTime),
    bbsTitle: c.bbsTitle || '',
  };
}

/** 状态角标：3待审核 4未通过（红底），展示在卡片图片左下角；草稿为本地伪 item，不走 status */
function StatusBadge({ status }: { status?: number }) {
  if (status !== 3 && status !== 4) return null;
  const label = status === 3 ? '待审核' : '未通过';
  return (
    <View style={[tabStyles.statusBadge, status === 4 && tabStyles.statusBadgeDanger]}>
      <Text style={tabStyles.statusBadgeText}>{label}</Text>
    </View>
  );
}

export function PostCard({ item, onPress }: { item: PostCardData; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={tabStyles.postCard} onPress={onPress}>
      {!!item.imageUrl && (
        <View>
          <ExpoImage
            source={{ uri: item.imageUrl }}
            style={[tabStyles.postImage, { height: scaleSizeH(item.imageHeight) }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={item.imageUrl}
          />
          <StatusBadge status={item.status} />
        </View>
      )}
      <View style={tabStyles.postBody}>
        <Text style={tabStyles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={tabStyles.postMeta}>
          <Text style={tabStyles.postDate}>{item.date}</Text>
          <View style={tabStyles.postLike}>
            <CardLikeIcon />
            <Text style={tabStyles.postDate}>{formatLikeCount(item.likeCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function CommentCard({ item, onPress }: { item: CommentCardData; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={tabStyles.commentCard} onPress={onPress}>
      <View style={tabStyles.commentHead}>
        <ExpoImage source={{ uri: item.avatar }} style={tabStyles.commentAvatar} contentFit="cover" transition={150} />
        <View style={tabStyles.commentHeadText}>
          <Text style={tabStyles.commentName} numberOfLines={1}>{item.name}</Text>
          {!!item.company && <Text style={tabStyles.commentCompany} numberOfLines={1}>{item.company}</Text>}
        </View>
        <Text style={tabStyles.commentTime}>{item.time}</Text>
      </View>
      <Text style={tabStyles.commentContent} numberOfLines={2}>{item.content}</Text>
      {!!item.bbsTitle && (
        <View style={tabStyles.commentOrigin}>
          <Text style={tabStyles.commentOriginText} numberOfLines={1}>{item.bbsTitle}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export const CARD_W = scaleSizeW(194);

export const tabStyles = StyleSheet.create({
  loadingPad: {
    height: scaleSizeH(200),
  },
  emptyBox: {
    marginTop: scaleSizeH(60),
  },
  masonryContent: {
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(5),
  },
  postCard: {
    width: CARD_W,
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: scaleSizeH(4),
  },
  postImage: {
    width: CARD_W,
  },
  statusBadge: {
    position: 'absolute',
    left: scaleSizeW(10),
    bottom: scaleSizeH(10),
    height: scaleSizeH(20),
    borderRadius: scaleSizeW(7.5),
    paddingHorizontal: scaleSizeW(9.5),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeDanger: {
    backgroundColor: '#EE5757',
  },
  statusBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postBody: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(10),
  },
  postTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#333333',
    lineHeight: scaleSizeH(21),
    minHeight: scaleSizeH(42),
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(8),
  },
  postDate: {
    fontSize: setSpText(12),
    color: '#616161',
  },
  postLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  draftCard: {
    width: CARD_W,
    height: scaleSizeH(146),
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#E8EFFF',
    marginBottom: scaleSizeH(4),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: scaleSizeW(10),
  },
  draftCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(4),
  },
  draftBadgeText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#000000',
  },
  commentList: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
    gap: scaleSizeH(10),
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(12),
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    borderRadius: scaleSizeW(17),
    backgroundColor: '#F5F5F5',
  },
  commentHeadText: {
    flex: 1,
    marginLeft: scaleSizeW(8),
  },
  commentName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  commentCompany: {
    fontSize: setSpText(11),
    color: '#6C6C6C',
    marginTop: scaleSizeH(2),
  },
  commentTime: {
    fontSize: setSpText(12),
    color: '#999999',
  },
  commentContent: {
    fontSize: setSpText(14),
    color: '#333333',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(8),
  },
  commentOrigin: {
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(6),
    marginTop: scaleSizeH(8),
  },
  commentOriginText: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
  },
});
