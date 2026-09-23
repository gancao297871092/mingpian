export const VERIFIED_PATH =
  'M5.99414 0.949219C6.25322 0.949219 6.51231 1.04805 6.70992 1.2457L7.62333 2.15914H8.88415C9.44325 2.15914 9.89641 2.61236 9.89641 3.17141V4.43223L10.766 5.30181C11.1613 5.69712 11.1613 6.33805 10.766 6.73337L9.8964 7.60296V8.9076C9.8964 9.46665 9.44324 9.91986 8.88414 9.91986H7.57952L6.70993 10.7894C6.5123 10.9871 6.25322 11.0859 5.99414 11.0859C5.73504 11.0859 5.47596 10.9871 5.27835 10.7895L4.40876 9.91986H3.14796C2.58893 9.91986 2.1357 9.46665 2.1357 8.9076V7.64681L1.22229 6.73337C0.826945 6.33806 0.826945 5.69713 1.22229 5.30181L2.13568 4.38837V3.17142C2.13568 2.61238 2.58893 2.15916 3.14795 2.15916H4.36494L5.27834 1.24571C5.47597 1.04807 5.73504 0.949219 5.99412 0.949219H5.99414ZM7.87004 4.97129C7.7332 4.83445 7.51136 4.83445 7.37452 4.97129L5.70192 6.64387L4.98075 5.94745C4.84294 5.81436 4.62415 5.81682 4.48936 5.95196L4.48529 5.9561L4.48518 5.95622C4.35076 6.09541 4.35463 6.31724 4.49384 6.45166L5.4442 7.36943C5.48869 7.41252 5.54385 7.44299 5.60401 7.45771C5.72614 7.49878 5.86643 7.47067 5.96373 7.37337L7.87016 5.46694C8.007 5.3301 8.007 5.10824 7.87016 4.97141L7.87004 4.97129Z';

export interface DetailData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timeText: string;
  location: string;
  declaration: boolean;
  visibility: number;
  /** 评论权限：0所有人 1粉丝 2互关 3仅自己 */
  commentScope: number;
  images: string[];
  authorName: string;
  authorCompany: string;
  authorAvatar: string;
  authorId: number;
  likeCount: number;
  favCount: number;
  isLiked: boolean;
  isFaved: boolean;
  isFollowed: boolean;
  mediaWidth: number;
  mediaHeight: number;
  isVideo: boolean;
  posterUrl: string;
  videoUrl: string;
}

export function ossVideoSnapshot(videoUrl: string): string {
  if (!videoUrl) return '';
  return `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg,w_750,h_1000,m_fast`;
}

export function formatPushTime(t?: string): string {
  if (!t) return '';
  const m = t.match(/^\d{4}[-/](\d{2})[-/](\d{2})[T ](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]} ${m[3]}:${m[4]}` : t;
}

export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map(t => (t.startsWith('#') ? t : `#${t}`));
}

export function joinRegion(province?: string, city?: string): string {
  if (!province) return city || '';
  if (!city || province === city) return province;
  return province + city;
}

export function transformDetail(bbs: any): DetailData {
  const mediaList: any[] = bbs.mediaLinkList ?? [];
  const firstMedia = mediaList[0]?.media;
  const images = mediaList
    .map(link => {
      const media = link?.media;
      if (!media?.mdUrl) return '';
      if (media.fileType === 'video') {
        return bbs.posterUrl || bbs.coverUrl || ossVideoSnapshot(media.mdUrl);
      }
      return media.mdUrl;
    })
    .filter(Boolean);
  return {
    id: String(bbs.id),
    title: bbs.title || '',
    content: bbs.content || '',
    tags: parseTags(bbs.tags),
    timeText: formatPushTime(bbs.pushTime),
    location: joinRegion(bbs.province, bbs.city) || bbs.ipLocation || '',
    declaration: Number(bbs.declaration) === 1,
    visibility: bbs.visibility ?? 0,
    commentScope: bbs.commentScope ?? 0,
    images,
    authorName: bbs.userInfoVo?.nickname || bbs.userInfoVo?.username || '',
    authorCompany: bbs.userInfoVo?.cpName || '',
    authorAvatar: bbs.userInfoVo?.avatar || '',
    authorId: bbs.userId || 0,
    likeCount: bbs.countLike || 0,
    favCount: bbs.countFavorite || 0,
    isLiked: bbs.userIsZan === 1,
    isFaved: bbs.userIsFavorites === 1,
    isFollowed: Number(bbs.userInfoVo?.isFollow ?? bbs.isFollow) === 1,
    mediaWidth: Number(firstMedia?.width) || 0,
    mediaHeight: Number(firstMedia?.height) || 0,
    isVideo: firstMedia?.fileType === 'video',
    posterUrl: bbs.posterUrl || '',
    videoUrl: firstMedia?.fileType === 'video' ? firstMedia?.mdUrl || '' : '',
  };
}
