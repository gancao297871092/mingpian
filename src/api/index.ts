import { request } from '@/utils/request';

export namespace API {
  export namespace auth {
    export function smsSend(data: { phone: string }) {
      return request.post<{ authCode: string }>('/auth/sms/send', data);
    }
    export function login(data: { phone: string; authCode: string; code: string }) {
      return request.post<{ token: string; userId: number }>('/auth/login', data);
    }
  }

  export namespace common {
    export function userSure() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/userSure');
    }
    export function privates() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/privates');
    }
    /** 名片风格列表 */
    export function cardStyle() {
      return request.get<{ styleList: any[]; colorList: any[] }>('/common/cardStyle');
    }
    /** 保存素材关系 */
    export function mediaLinkSave(data: any[]) {
      return request.post<any>('/common/media/link/save', data);
    }
    /** 更新素材封面索引 */
    export function mediaLinkUpdate(data: { mdId: number; isIndex: number }) {
      return request.post<any>('/common/media/link/update', data);
    }
    /** 删除素材 */
    export function mediaDel(params: { mediaId: number }) {
      return request.get<any>('/common/media/media/del', { params });
    }
  }

  export namespace user {
    export function info() {
      return request.get<any>('/user/base/info');
    }
    /** 关注/取消关注（isFollow: 1关注 0取消） */
    export function followOperate(data: { targetUserId: number; isFollow: number }) {
      return request.post<any>('/user/follow/operate', data);
    }
  }

  export namespace square {
    /** 广场动态流 */
    export function feed(data: {
      tab?: string;
      boardType?: number;
      pageNum?: number;
      pageSize?: number;
    }) {
      return request.post<{
        list: any[];
        total: number;
        pageNum: number;
        pages: number;
      }>('/square/feed', data);
    }
    /** 动态聚合详情（作者/媒体/点赞收藏状态/评论数） */
    export function bbsDetail(params: { bbsId: string | number }) {
      return request.get<{ bbs: any; commentCount: number; isFollowed: 0 | 1 }>('/square/bbs/detail', { params });
    }
  }

  export namespace card {
    /** 名片列表 */
    export function list(params?: { t?: number }) {
      return request.get<{ cardsList: any[] }>('/card/list', { params });
    }
    /** 删除名片 */
    export function del(params: { cardId: string | number }) {
      return request.get<any>('/card/del', { params });
    }
    /** 名片预创建（获取草稿） */
    export function prepare() {
      return request.get<any>('/card/prepare');
    }
    /** 名片详情 */
    export function detail(params: { cardId: string | number }) {
      return request.get<any>('/card/detail', { params });
    }
    /** 保存名片基础信息 */
    export function save(data: any) {
      return request.post<{ cardId: number }>('/card/save', data);
    }
    /** 发布名片 */
    export function push(params: { cardId: number }) {
      return request.get<any>('/card/create/push', { params });
    }
    /** 项目预览 */
    export function projectPre(params: { cardId: string | number }) {
      return request.get<any>('/card/create/project/pre', { params });
    }
    /** 保存项目/板块 */
    export function projectItemSave(data: any) {
      return request.post<any>('/card/create/project/itemSave', data);
    }
    /** 更新项目 */
    export function projectUpdate(data: any) {
      return request.post<any>('/card/create/project/update', data);
    }
    /** 删除项目子集 */
    export function projectItemDel(params: { itemId: string | number }) {
      return request.get<any>('/card/create/project/itemDel', { params });
    }
    /** 项目子集详情 */
    export function projectItemDetail(params: { itemId: string | number }) {
      return request.get<any>('/card/create/project/itemDetail', { params });
    }
    /** 项目子集更新 */
    export function projectItemUpdate(data: any) {
      return request.post<any>('/card/create/project/itemUpdate', data);
    }
    /** 保存样式 */
    export function styleCodeSave(data: any) {
      return request.post<any>('/card/create/styleCode/save', data);
    }
  }

  export namespace publish {
    /** 媒体素材（对齐小程序 mediaLinkList 结构） */
    export interface PublishMedia {
      type: number;
      mdId?: number;
      targetId?: number;
      isIndex: number;
      fileType: string;
      mdUrl: string;
      url: string;
      isLocal: number;
      tempFilePath?: string;
      width?: number;
      height?: number;
      size?: number;
      duration?: number;
      media: {
        mdUrl: string;
        fileType: string;
        width?: number;
        height?: number;
        size?: number;
        duration?: number;
      };
    }
    /** 三类型统一发布（draftType: 0图文/1视频/2长文） */
    export function submit(data: {
      draftType: 0 | 1 | 2;
      title?: string;
      content?: string;
      mediaList?: PublishMedia[];
      videoUrl?: string;
      videoCover?: string;
      aiConnectEnabled?: number;
      declaration?: number;
      visibility?: number;
      commentScope?: number;
      boardType?: number;
      tags?: string;
      draftId?: number;
    }) {
      return request.post<any>('/publish/submit', data);
    }
  }

  export namespace bbs {
    /** 点赞/取消（status: 1赞 0取消） */
    export function like(params: { bbsId: number; status: number }) {
      return request.get<any>('/bbs/like', { params });
    }
    /** 预发布草稿（取/建 status=2 草稿 + 已关联媒体，发布页回填用） */
    export function pushPre() {
      return request.get<any>('/bbs/user/push/pre');
    }
    /** 发布动态（id 传预发布草稿 id；mediaList 只传本次新上传的媒体） */
    export function push(data: {
      id?: number;
      content: string;
      title?: string;
      tags?: string;
      isToLife?: number;
      mediaList?: publish.PublishMedia[];
    }) {
      return request.post<any>('/bbs/user/push', data);
    }
    /** 收藏/取消（status: 1收藏 0取消） */
    export function favorite(params: { bbsId: number; status: number }) {
      return request.get<any>('/bbs/favorite', { params });
    }
    /** 举报（reportedTargetType: 1=用户，2=动态，3=店铺；reportType: 1-6） */
    export function reportSubmit(data: {
      reportedTargetId: number;
      reportedTargetType: number;
      reportType: number;
      reportReason?: string;
      reportImages?: string;
    }) {
      return request.post<any>('/bbs/report/submit', data);
    }
  }

  export namespace bbsComment {
    /** 发表评论/回复（parentId 空=一级） */
    export function add(data: { bbsId: number; parentId?: number; replyToUserId?: number; content: string }) {
      return request.post<any>('/bbs/comment/publish', data);
    }
    /** 一级评论分页（置顶+权重排序，含前3条二级预览） */
    export function list(params: { bbsId: number; pageNum?: number; pageSize?: number }) {
      return request.get<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/bbs/comment/list',
        { params },
      );
    }
    /** 二级回复分页（时间正序） */
    export function replyList(params: { commentId: number; pageNum?: number; pageSize?: number }) {
      return request.get<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/bbs/comment/reply/list',
        { params },
      );
    }
    /** 删除评论（本人/动态作者；一级级联二级） */
    export function del(params: { commentId: number }) {
      return request.get<any>('/bbs/comment/del', { params });
    }
    /** 置顶/取消置顶（仅动态作者；已有置顶返回 needConfirm，确认后 force=1 重调） */
    export function top(params: { commentId: number; force?: number }) {
      return request.get<{ isTop?: number; needConfirm?: boolean; msg?: string }>(
        '/bbs/comment/top',
        { params },
      );
    }
  }

  export namespace file {
    /** 图片上传 */
    export function upload(data: FormData) {
      return request.post<{ id: number; url: string; width: string; height: string }>('/file/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    /** 视频上传（异步转码，秒回 status=0） */
    export function uploadVideo(data: FormData) {
      return request.post<{ id: number; status: number; url: string }>('/file/uploadVideo', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      });
    }
    /** 视频转码状态查询（status=1 时 url 可播放） */
    export function mediaStatus(params: { mediaId: number }) {
      return request.get<{ mediaId: number; status: number; url: string; width?: string; height?: string }>(
        '/file/media/status',
        { params },
      );
    }
    /** OSS 直传签名 */
    export function ossSignature() {
      return request.get<{
        security_token?: string;
        signature: string;
        x_oss_date: string;
        x_oss_credential: string;
        x_oss_signature_version: string;
        policy: string;
        endpoint: string;
        bucket_name: string;
        cdn_domain: string;
        upload_prefix: string;
      }>('/generate_signature');
    }
  }
}
