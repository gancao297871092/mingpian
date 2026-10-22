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
    /** 通用富文本（userSure 用户协议 / privates 隐私政策 / cardSure 实名认证协议 / cpSure 企业认证协议） */
    export function richText(apiUrl: string) {
      return request.get<{ name: string; value: string; htmls: string }>(`/common/${apiUrl}`);
    }
    /** 发送短信验证码（通用，data 为 authCode 字符串） */
    export function msgSend(data: { phone: string; id?: number | null }) {
      return request.post<string>('/common/msg/send', data);
    }
    /** 校验短信验证码 */
    export function msgValidate(data: { authCode: string; code: string }) {
      return request.post<any>('/common/msg/validate', data);
    }
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
    /** 企业行业树（搜索筛选） */
    export function companyIndustry() {
      return request.get<any[]>('/common/company-industry');
    }
    /** 企业荣誉列表（搜索筛选） */
    export function companyHonors() {
      return request.get<any[]>('/common/company-honors');
    }
    /** 更新素材封面索引 */
    export function mediaLinkUpdate(data: { mdId: number; isIndex: number }) {
      return request.post<any>('/common/media/link/update', data);
    }
    /** 删除素材 */
    export function mediaDel(params: { mediaId: number }) {
      return request.get<any>('/common/media/media/del', { params });
    }
    /** 企业信息纠错提交（collectId 为企业采集记录id，errorImg 多图逗号拼接） */
    export function companyError(data: {
      collectId: number;
      errorContent?: string;
      errorImg?: string;
      linkPhone?: string;
    }) {
      return request.post<any>('/common/company/error', data);
    }
  }

  export namespace user {
    export function info() {
      return request.get<any>('/user/base/info');
    }
    /** 基础字段更新（隐私开关：bbsShow/isLikePrivate/isFavoritePrivate/isFollowShow/isFansShow 等，1公开 0关闭） */
    export function baseUpdate(data: Record<string, number>) {
      return request.post<any>('/user/info/base/update', data);
    }
    /** 关注/取消关注（isFollow: 1关注 0取消） */
    export function followOperate(data: { targetUserId: number; isFollow: number }) {
      return request.post<any>('/user/follow/operate', data);
    }
    /** 关注列表（targetUserId 必填；对方关闭「我的关注」公开时返回空分页） */
    export function followList(data: { targetUserId: number; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/user/follow/list',
        data,
      );
    }
    /** 粉丝列表（targetUserId 必填；对方关闭「我的粉丝」公开时返回空分页） */
    export function fansList(data: { targetUserId: number; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/user/fans/list',
        data,
      );
    }
    /** 互相关注列表（仅登录用户查看自己，无需 targetUserId） */
    export function mutualList(data: { pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/user/follow/mutual/list',
        data,
      );
    }
    /** 用户主页信息（关注/粉丝/动态数 + 是否已关注） */
    export function homeInfo(data: { targetUserId: number }) {
      return request.post<any>('/user/home/info', data);
    }
    /** 个人资料修改（昵称≤20字，简介≤100字；birthday 后端暂不持久化） */
    export function updateInfo(data: {
      nickname?: string;
      username?: string;
      gender?: number;
      birthday?: number;
      province?: string;
      city?: string;
      district?: string;
      address?: string;
      des?: string;
      avatar?: string;
    }) {
      return request.post<any>('/user/info/base/update', data);
    }
    /** 实名认证预填信息（authStatus: 0未认证 1已认证 2待审核 3未通过） */
    export function idCardPre() {
      return request.get<{
        realCard?: string;
        realName?: string;
        authStatus?: number;
        auth?: { id?: number; authRemark?: string };
      }>('/auth/idCard/pre');
    }
    /** 实名认证提交（手机号三要素核验；人脸识别走 SDK 另接） */
    export function idCardVerify(data: {
      id?: number | null;
      realCard: string;
      realName: string;
      phone: string;
      authCode: string;
      code: string;
    }) {
      return request.post<any>('/auth/idCard/verifyV3', data);
    }
  }

  export namespace my {
    /** 我的动态列表（发布 tab；statusTab: all/publishing/published/rejected） */
    export function bbsList(data: { statusTab?: string; boardType?: number; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>('/my/bbs/list', data);
    }
    /** 点赞/收藏的动态列表（type: 1点赞 2收藏） */
    export function likeFavoritesList(data: { targetUserId: number; type: 1 | 2; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/bbs/user/like-favorites/list',
        data,
      );
    }
  }

  export namespace interaction {
    /** 我收到的评论（我的动态下他人评论，含楼中楼；targetUserId 查看他人主页时传） */
    export function commentList(params: { targetUserId?: number; pageNum?: number; pageSize?: number }) {
      return request.get<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/interaction/comment/list',
        { params },
      );
    }
    /** 我点赞过的评论列表（按点赞时间倒序；评论/动态已删除时对应字段为 null、status=0） */
    export function likeCommentList(params: { pageNum?: number; pageSize?: number }) {
      return request.get<{ list: any[]; total: number; pageNum: number; pages: number }>(
        '/interaction/like/comment/list',
        { params },
      );
    }
  }

  export namespace square {
    /** 全站搜索（searchType: all综合/company企业/bbs动态/user用户；无需登录） */
    export function search(data: {
      keyword: string;
      searchType: 'all' | 'company' | 'bbs' | 'user';
      industry?: string;
      honors?: string;
      provinceStr?: string;
      cityStr?: string;
      districtStr?: string;
      pageNum?: number;
      pageSize?: number;
    }) {
      return request.post<any>('/search', data);
    }
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
    /** 删除名片（软删除，AppCardController /card/delete） */
    export function del(params: { cardId: string | number }) {
      return request.get<any>('/card/delete', { params });
    }
    /** 名片草稿字段（/card/prepare 与 /card/detail 均返回 WqUserCards） */
    export interface CardDraft {
      id?: number;
      alias?: string;
      nameZh?: string;
      nameEn?: string;
      phone?: string;
      telNumber?: string;
      fax?: string;
      email?: string;
      province?: string;
      city?: string;
      district?: string;
      address?: string;
      profile?: string;
      provinceCode?: string;
      cityCode?: string;
      districtCode?: string;
      isShow?: number;
      isAuth?: number;
      styleCode?: string;
      fontColor?: string;
      backColor?: string;
      positionList?: any[];
      mediaList?: any[];
      mediaLinkList?: any[];
      userId?: number;
    }
    /** 名片聚合详情（/bbs/cardDetail，免登录；返回 userCard/projectList/userInfo） */
    export function aggregate(params: { cardId: string | number }) {
      return request.get<any>('/bbs/cardDetail', { params });
    }
    /** 收藏/取消名片（type: 1收藏 0取消） */
    export function favoriteDo(data: { cardId: string | number; type: number }) {
      return request.post<any>('/card/favorite/do', data);
    }
    /** 名片夹列表（/user/favorite/cards/list，对齐小程序 cardList） */
    export function favoriteCards(data: { nickname?: string; pageNum?: number; pageSize?: number }) {
      return request.post<any>('/user/favorite/cards/list', data);
    }
    /** 名片预创建：查找草稿（status=2），不存在则自动创建（AppCardController /card/prepare，无入参） */
    export function prepare() {
      return request.get<CardDraft>('/card/prepare');
    }
    /** 名片详情（含 mediaLinkList 媒体链接） */
    export function detail(params: { cardId: string | number }) {
      return request.get<CardDraft>('/card/detail', { params });
    }
    /** 保存名片基础信息 */
    export function save(data: any) {
      return request.post<{ cardId: number; preId?: number; id?: number }>('/card/save', data);
    }
    /** 发布名片 */
    export function push(params: { cardId: string | number }) {
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

  export namespace bbs {
    /** 他人主页的发布动态列表 */
    export function userMain(data: { targetUserId: number; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>('/bbs/user/main', data);
    }
    /** 点赞/取消（status: 1赞 0取消） */
    export function like(params: { bbsId: number; status: number }) {
      return request.get<any>('/bbs/like', { params });
    }
    export function bbsDetail(params: { bbsId: number }) {
      return request.get<any>('/my/bbs/detail', { params });
    }
    /** 发布动态（/publish/submit；draftType 必填，视频动态传 videoUrl） */
    export function push(data: {
      id?: number;
      draftType?: 0 | 1 | 2;
      content: string;
      title?: string;
      tags?: string;
      images?: string[];
      videoUrl?: string;
      videos?: string[];
      videoCover?: string;
      boardType?: number;
      isToLife?: number;
      aiConnectEnabled?: number;
      declaration?: number;
      /** 转载来源（名称或链接，declaration=2 时传） */
      source?: string;
      visibility?: number;
      commentScope?: number;
    }) {
      return request.post<any>('/publish/submit', data);
    }
    /** 编辑动态（/publish/update；媒体全量替换语义，传了就覆盖） */
    export function update(data: {
      bbsId: number;
      draftType?: 0 | 1 | 2;
      title?: string;
      content?: string;
      tags?: string;
      images?: string[];
      videoUrl?: string;
      videos?: string[];
      videoCover?: string;
      aiConnectEnabled?: number;
      declaration?: number;
      /** 转载来源（名称或链接，declaration=2 时传） */
      source?: string;
      visibility?: number;
      commentScope?: number;
      boardType?: number;
      isToLife?: number;
    }) {
      return request.post<any>('/publish/update', data);
    }
    /** 收藏/取消（status: 1收藏 0取消） */
    export function favorite(params: { bbsId: number; status: number }) {
      return request.get<any>('/bbs/favorite', { params });
    }
    /** 举报（reportedTargetType: 1=用户，2=动态，3=店铺，4=评论；reportType: 1-6） */
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
    /** 评论/回复点赞（status: 1点赞 0取消） */
    export function like(params: { commentId: number; status: number }) {
      return request.get<any>('/bbs/comment/like', { params });
    }
    /** 置顶/取消置顶（仅动态作者；已有置顶返回 needConfirm，确认后 force=1 重调） */
    export function top(params: { commentId: number; force?: number }) {
      return request.get<{ isTop?: number; needConfirm?: boolean; msg?: string }>(
        '/bbs/comment/top',
        { params },
      );
    }
  }

  /** 业务员工作台/触达任务（字段为预设，待后端联调确认） */
  export namespace touch {
    /** 工作台汇总（待触达/已发送/已查看数量） */
    export function summary() {
      return request.get<{ todoCount?: number; sentCount?: number; viewedCount?: number }>('/touch/task/summary');
    }
    /** 触达任务列表（status: todo待触达 sent已发送 viewed已查看） */
    export function taskList(data: { status: 'todo' | 'sent' | 'viewed'; pageNum?: number; pageSize?: number }) {
      return request.post<{ list: any[]; total: number; pageNum: number; pages: number }>('/touch/task/list', data);
    }
    /** 触达任务详情 */
    export function taskDetail(params: { id: string | number }) {
      return request.get<any>('/touch/task/detail', { params });
    }
  }

  /** 设置相关接口：字段为预设，待后端联调确认 */
  export namespace setting {
    /** 账号与安全信息 */
    export interface AccountSecurityInfo {
      /** 已绑定手机号（完整号，前端自行脱敏） */
      phone?: string;
      /** 是否已设置登录密码 */
      hasPassword?: boolean;
      /** 是否已绑定微信 */
      wechatBound?: boolean;
      /** 绑定的微信昵称 */
      wechatNickname?: string;
      /** 实名认证状态 */
      authReal?: boolean;
      /** 职业认证状态 */
      authPosition?: boolean;
      /** 企业认证状态 */
      authCompany?: boolean;
    }
    export function accountSecurity() {
      return request.get<AccountSecurityInfo>('/setting/account/security');
    }

    /** 发送短信验证码（scene: changePhoneOld/changePhoneNew/bindPhone 等） */
    export function smsSend(data: { phone: string; scene: string }) {
      return request.post<{ authCode: string }>('/setting/sms/send', data);
    }

    /** 原手机号验证，成功后返回换绑票据 ticket */
    export function verifyOldPhone(data: { phone: string; authCode: string; code: string }) {
      return request.post<{ ticket: string }>('/setting/phone/verifyOld', data);
    }

    /** 绑定/更换为新手机号 */
    export function changePhone(data: { ticket: string; phone: string; authCode: string; code: string }) {
      return request.post<any>('/setting/phone/change', data);
    }

    /** 修改/设置登录密码（未设置时 oldPassword 可不传） */
    export function updatePassword(data: { oldPassword?: string; newPassword: string }) {
      return request.post<any>('/setting/password/update', data);
    }

    /** 通用/隐私偏好设置 */
    export interface PreferenceSettings {
      /** 打开视频时默认静音 */
      videoMuted?: boolean;
      /** 默认首页：square 广场 / link 链接 */
      defaultHome?: 'square' | 'link';
      /** 资料公开：我的动态 */
      publicBbs?: boolean;
      /** 资料公开：我的点赞 */
      publicLike?: boolean;
      /** 资料公开：我的收藏 */
      publicFavorite?: boolean;
      /** 资料公开：我的关注 */
      publicFollow?: boolean;
      /** 资料公开：我的粉丝 */
      publicFans?: boolean;
      /** AI 产业连接（新发动态默认参与分析） */
      aiConnect?: boolean;
      /** 分析我的公开动态 */
      analyzeBbs?: boolean;
      /** 为我推荐企业与机会 */
      recommendCompany?: boolean;
    }
    export function preference() {
      return request.get<PreferenceSettings>('/setting/preference');
    }
    export function preferenceSave(data: PreferenceSettings) {
      return request.post<any>('/setting/preference/save', data);
    }

    /** 微信绑定状态（授权回调后查询） */
    export interface WechatBindInfo {
      /** 微信昵称 */
      nickname?: string;
      /** 微信头像 */
      avatar?: string;
      /** 该微信是否已绑定其他账号 */
      boundOther?: boolean;
      /** 原绑定账号昵称（boundOther 时返回） */
      otherNickname?: string;
      /** 原绑定账号头像 */
      otherAvatar?: string;
    }
    export function wechatBindInfo(params: { code: string }) {
      return request.get<WechatBindInfo>('/setting/wechat/bindInfo', { params });
    }
    /** 确认绑定微信（rebind=1 表示换绑） */
    export function wechatBind(data: { code: string; rebind?: number }) {
      return request.post<any>('/setting/wechat/bind', data);
    }
  }

  /** 企业相关 */
  export namespace company {
    /** 搜索企业（无分页，data 为企业数组） */
    export function query(data: { name: string }) {
      return request.post<any[]>('/user/company/query', data);
    }
    /** 预查询：我已申请的企业（含审核状态 checkStatus：0未通过 1通过 2待审核） */
    export function queryPre() {
      return request.get<any>('/user/company/queryPre');
    }
    /** 申请加入企业 / 职位变更申请（submitPosition 多职位逗号分隔） */
    export function auth(data: { cpId: number | string; submitPosition: string; submitMsg?: string; userId?: number | string | null }) {
      return request.post<any>('/user/company/auth', data);
    }
    /** 编辑成员职位（type=3，管理员操作） */
    export function positionEdit(data: { cpId: number | string; submitPosition: string; submitMsg?: string; userId?: number | string | null }) {
      return request.post<any>('/company/user/position/edit', data);
    }
    /** 成员列表（/company/user/list，对齐小程序 personManage） */
    export function memberList(data: { name?: string; pageNum?: number; pageSize?: number }) {
      return request.post<any>('/company/user/list', data);
    }
    /** 踢出成员 */
    export function memberDel(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/del', data);
    }
    /** 设为管理员 */
    export function memberSetMaster(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/setMaster', data);
    }
    /** 取消管理员 */
    export function memberDelMaster(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/delMaster', data);
    }
    /** 设为客服 */
    export function memberSetKf(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/setKf', data);
    }
    /** 取消客服 */
    export function memberDelKf(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/delKf', data);
    }
    /** 设客服前检查：data 为 false 时需确认是否移交客服 */
    export function memberSetKfCheck(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/setKf/check', data);
    }
    /** 移交超管 */
    export function memberHandOver(data: { cuId: number | string; toUserId: number | string }) {
      return request.post<any>('/company/user/master/handOver', data);
    }
    /** 成员审核列表（/company/auth/list，对齐小程序 persionExamine） */
    export function authList(data: { pageNum?: number; pageSize?: number }) {
      return request.post<any>('/company/auth/list', data);
    }
    /** 成员审核操作（status: 1通过 0拒绝） */
    export function authCheck(params: { authId: number | string; status: number }) {
      return request.get<any>('/company/auth/check', { params });
    }
    /** 查看管家（/company/manager/getManager，对齐小程序 moreSets viewManager） */
    export function managerGet() {
      return request.get<any[]>('/company/manager/getManager');
    }
    /** 退出企业（/company/user/liveOut，对齐小程序 moreSets exitCp） */
    export function liveOut() {
      return request.get<any>('/company/user/liveOut');
    }
    /** 企业管理角标（/company/manager/tips：companyUserAuthCount 成员审核数 / bbsCount 动态审核数，对齐小程序 getTips） */
    export function managerTips() {
      return request.get<{ bbsCount?: number; companyUserAuthCount?: number; companyWorkCount?: number; userAuth?: number }>(
        '/company/manager/tips',
      );
    }
    /** 企业名片公开开关（isShow: 1公开 0关闭） */
    export function bbsShow(isShow: number) {
      return request.get<any>(`/company/bbs/show?isShow=${isShow}`);
    }
    /** 企业认证-查询进行中的认证（有 data 则需回显） */
    export function certStepOne() {
      return request.get<any>('/company/auth/step/one');
    }
    /** 企业认证-回显主体信息 */
    export function certStepTwo(data: any) {
      return request.post<any>('/company/auth/step/two', data);
    }
    /** 企业认证-营业执照 OCR 识别 */
    export function certOcr(data: { id: number | string | null; businessLicense: string }) {
      return request.post<any>('/company/auth/step/ocr', data);
    }
    /** 企业认证-提交主体信息（返回 authUrl 委托书模板地址） */
    export function certBusiness(data: any) {
      return request.post<any>('/company/auth/step/business', data);
    }
    /** 企业认证-对公认证发送短信验证码（data 为 authCode） */
    export function certSendCode(data: any) {
      return request.post<any>('/company/auth/step/sendCode', data);
    }
    /** 企业认证-校验短信验证码 */
    export function certValidateCode(data: any) {
      return request.post<any>('/company/auth/step/validateCode', data);
    }
    /** 企业认证-提交授权委托书 */
    export function certAuthPng(data: any) {
      return request.post<any>('/company/auth/step/authPng', data);
    }
    /** 企业认证-提交联系人信息 */
    export function certLink(data: any) {
      return request.post<any>('/company/auth/step/link', data);
    }
    /** 企业信息/相册预查询（对齐小程序 enterInfo：cpId、avatar、cardPoster、posterTitle、des、mediaList） */
    export function infoPosterPre() {
      return request.get<any>('/company/info/poster/pre');
    }
    /** 保存企业信息（简介/LOGO/海报封面/分享卡企业名，id 为 cpId） */
    export function infoSaveDes(data: {
      id: number | string;
      des: string;
      desTxt?: string;
      avatar: string;
      cardPoster?: string;
      posterTitle?: string;
    }) {
      return request.post<any>('/company/info/save/des', data);
    }
    /** 菜单模块预查询（moduleList 含 isMust 固定模块，需过滤） */
    export function modulePre() {
      return request.get<{ cpId: number | string; moduleList: any[] }>('/company/info/module/pre');
    }
    /** 新增菜单模块（返回新模块，随后进编辑页填内容） */
    export function moduleAdd(params: { cpId: number | string }) {
      return request.get<any>('/company/info/module/add', { params });
    }
    /** 删除菜单模块 */
    export function moduleDel(params: { mdId: number | string }) {
      return request.get<any>('/company/info/module/del', { params });
    }
    /** 菜单模块排序 */
    export function moduleSort(data: { id: number | string; mdSort: number }[]) {
      return request.post<any>('/company/info/module/sort', data);
    }
    /** 模块内容回显（content 可能为 null） */
    export function moduleContentPre(params: { mdId: number | string }) {
      return request.get<{ module: any; content: { id: number | string; content: string } | null }>(
        '/company/info/content/pre',
        { params },
      );
    }
    /** 保存模块名称与富文本内容（ctId 有则更新内容记录） */
    export function moduleContentSave(data: {
      ctId?: number | string | null;
      cpId: number | string;
      mdId: number | string;
      mdName: string;
      content: string;
    }) {
      return request.post<any>('/company/info/content/save', data);
    }
    /** 联系方式列表（data 可能是数组或 {list/records/rows} 包装） */
    export function contactList() {
      return request.get<any>('/company/contact/list');
    }
    /** 保存联系方式（传 id 为编辑，不传为新增） */
    export function contactSave(data: { id?: number | string; name: string; position?: string; phone: string }) {
      return request.post<any>('/company/contact/save', data);
    }
    /** 删除联系方式 */
    export function contactDel(params: { id: number | string }) {
      return request.get<any>('/company/contact/del', { params });
    }
    /** 动态审核列表（对齐小程序 dynamicsEx） */
    export function bbsCheckList(data: { name?: string; pageNum?: number; pageSize?: number }) {
      return request.post<any>('/company/bbs/check/list', data);
    }
    /** 动态审核详情（审核场景替代 /circle/bbs/getOne） */
    export function bbsCheckDetail(params: { bbsId: number | string }) {
      return request.get<any>('/company/bbs/check/detail', { params });
    }
    /** 动态审核操作（status: 1通过 4拒绝；拒绝需传 msg 理由） */
    export function bbsCheckDo(data: { bbsId: number | string; status: number; msg?: string }) {
      return request.post<any>('/company/bbs/check/do', data);
    }
    /** 企业主页详情（免登录，Redis 缓存 7 天；含 mediaLinkList 封面媒体、treeVOList 菜单树；每次调用浏览量+1） */
    export function main(params: { cpId: number | string }) {
      return request.get<any>('/company/main', { params });
    }
    /** 企业基本信息卡片（免登录；不含图片分组，走 /company/gallery） */
    export function infoBasic(params: { cpId: number | string }) {
      return request.get<any>('/company/info/basic', { params });
    }
    /** 可信档案图片分组（verifyStatus: 0未核验 1已核验；images: [{imageId,imageUrl,title}]） */
    export function gallery(params: { cpId: number | string }) {
      return request.get<{ groups: any[] }>('/company/gallery', { params });
    }
    /** 企业员工动态列表（企业主页-最新动态瀑布流） */
    export function bbsMain(data: { cpId: number | string; pageNum?: number; pageSize?: number }) {
      return request.post<any>('/company/bbs/main', data);
    }
  }

  /** 业务采录（未入驻企业，数据来源快启API） */
  export namespace business {
    /** 企业模糊查询（data: {records: CompanyRecord[], total}，isExist=1 表示平台已存在） */
    export function collectQuery(data: { keywords: string }) {
      return request.post<{ records?: any[]; total?: number }>('/business/collect/query', data);
    }
    /** 企业（工商）详情：id 为快启API企业id */
    export function collectDetail(data: { id: string | number }) {
      return request.post<any>('/business/collect/detail', data);
    }
    /** 企业录入（认领企业）：提交完整企业信息 */
    export function collectAdd(data: any) {
      return request.post<any>('/business/collect/add', data);
    }
    /** 展客（已录入企业）列表 */
    export function collectList(data: { pageNum?: number; pageSize?: number; name?: string }) {
      return request.post<{ list?: any[]; total?: number }>('/user/collect/list', data);
    }
    /** 展客详情（已录入的企业采集记录，id 为采集记录id） */
    export function collectInfo(params: { id: string | number }) {
      return request.get<any>('/user/collect/detail', { params });
    }
  }

  /** 浏览历史（我的-浏览记录；动态详情登录时服务端自动记录） */
  export namespace history {
    export interface HistoryItem {
      id: number;
      targetType: number;
      targetId: number;
      targetTitle?: string;
      targetAvatar?: string;
      viewedAt?: string;
      authorName?: string;
      authorAvatar?: string;
      countLike?: number;
      /** 完整动态卡片（targetType=1/5 时回填，与 /square/feed 同构） */
      bbs?: any;
    }
    /** 记录一次浏览（targetType：1动态 2企业 3名片 4商机 5技术文章 6AI商机） */
    export function record(data: { targetType: number; targetId: number; title?: string; avatar?: string }) {
      return request.post<any>('/history/record', data);
    }
    /** 浏览历史分页（viewedAt 倒序；keyword 可选：动态/文章搜标题正文，其余搜标题快照） */
    export function list(data: { pageNum: number; pageSize: number; keyword?: string }) {
      return request.post<{ list: HistoryItem[]; total: number; pageNum: number; pages: number }>('/history/list', data);
    }
    /** 批量删除 */
    export function del(ids: number[]) {
      return request.post<{ deleted: number }>('/history/del', { ids });
    }
    /** 清空浏览历史 */
    export function clear() {
      return request.post<{ deleted: number }>('/history/clear');
    }
  }

  export namespace file {
    /** 图片上传（返回 WqUserMedia：id/mdUrl/mdUrlOss/width/height/fileType，无 url 字段） */
    export function upload(data: FormData) {
      return request.post<{ id: number; mdUrl: string; mdUrlOss?: string; url?: string; userId?: number; width: string; height: string }>('/file/uploadV2', data, {
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

  /** 能力卡（AppCapabilityCardController：标题 + 富文本，保存后 AI 抽取五段回填） */
  export namespace capability {
    /** 新建/编辑（编辑传 id；企业卡需 ownerType=1 + cpId 且为管理员；cardName≤50、content≤20000 必填） */
    export function cardSave(data: {
      id?: number;
      ownerType?: number;
      cpId?: number | string;
      cardName: string;
      content: string;
      cardCover?: string;
      tags?: string;
      attachments?: string;
    }) {
      return request.post<{ cardId: number }>('/capability/card/save', data);
    }
    /** 我的/本企业能力卡列表（ownerType 0个人默认 1企业需 cpId；按更新时间倒序） */
    export function cardList(params: { ownerType?: number; cpId?: number | string }) {
      return request.get<{ list: any[] }>('/capability/card/list', { params });
    }
    /** 详情（编辑回显） */
    export function cardDetail(params: { id: number }) {
      return request.get<any>('/capability/card/detail', { params });
    }
    /** 删除（软删） */
    export function cardDelete(params: { id: number }) {
      return request.get<any>('/capability/card/delete', { params });
    }
  }
}
