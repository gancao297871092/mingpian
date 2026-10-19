import type { LocalDraft } from '@/utils/draftStore';

export type RootStackParamList = {
  MainTabs: undefined;
  login: undefined;
  otherLogin: undefined;
  agreement: { type: string; title?: string };
  cardDetail: { id: string | number; userId?: string | number };
  myCard: undefined;
  /** 名片夹（收藏的名片列表，左滑分享/删除） */
  cardList: undefined;
  editCard: { id?: string | number };
  /** 名片预览主页（创建/编辑流程最后一步，mode 区分按钮文案与确认弹窗） */
  viewCard: { id: string | number; mode?: 'add' | 'update' };
  addItem: { itemId?: string | number; cardId?: string | number; userId?: string | number; pjId?: string | number };
  richTextEdit: { initialHtml?: string; placeholder?: string; title?: string };
  /** 创建/编辑能力卡（figma 42.创建能力卡；传 id 为编辑） */
  capCardEdit: { id?: number } | undefined;
  publishLongText: { initialHtml?: string; insertOnMount?: string; simple?: boolean; title?: string } | undefined;
  publish: { draft?: LocalDraft; editBbsId?: number } | undefined;
  publishCover: { videoUri: string; ratio?: '3:4' | '16:9'; title?: string };
  draftBox: undefined;
  bbsDetail: { id: string; isFollowed?: boolean; fromMy?: boolean; audit?: boolean };
  bbsShareImage: { id: string };
  search: undefined;
  editProfile: undefined;
  userHome: { userId?: number; preview?: boolean } | undefined;
  settings: undefined;
  accountSecurity: undefined;
  verifyIdentity: { scene?: 'changePhone' | 'resetPassword' } | undefined;
  changePhoneVerify: { scene?: 'changePhone' | 'resetPassword' } | undefined;
  bindPhone: { ticket?: string } | undefined;
  changePassword: { hasPassword?: boolean } | undefined;
  certificationCenter: undefined;
  generalSettings: undefined;
  defaultHomeSetting: undefined;
  privacySettings: undefined;
  helpCenter: undefined;
  aboutUs: undefined;
  wechatAuth: { code?: string } | undefined;
  wechatBoundOther: { code?: string } | undefined;
  wechatBindSuccess: undefined;
  editName: undefined;
  editBio: undefined;
  reportBbs: { id: string };
  companyPage: { id: string | number; userId?: string | number };
  certification: { openIndex?: number };
  follows: { tab?: 'mutual' | 'follow' | 'fans'; userId?: number; nickname?: string; followShow?: number; fansShow?: number } | undefined;
  workbench: undefined;
  touchTasks: { tab?: 'todo' | 'sent' | 'viewed' } | undefined;
  touchTaskDetail: { id: string | number };
  browseHistory: undefined;
  browseHistorySearch: undefined;
  companyManage: undefined;
  companyInfo: undefined;
  /** 模块编辑：id 为模块 mdId（新增时先调 moduleAdd 拿到 id 再进入） */
  companyModuleEdit: { id?: number | string } | undefined;
  /** 联系方式编辑：无按 id 查询接口，列表项字段带入回显（对齐小程序 editContact） */
  companyContactEdit: { id?: number | string; name?: string; position?: string; phone?: string } | undefined;
  companyMembers: undefined;
  companyMemberAudit: undefined;
  companyBbsAudit: undefined;
  companyCapCards: undefined;
  companyJoin: undefined;
  /** 对齐小程序 apply.vue：type=1申请职位 2职位变更申请 3编辑职位（2/3 需 position 回显，3 需 userId） */
  companyApply: { cpId: string | number; type?: '1' | '2' | '3'; position?: string; userId?: string | number };
  companyRealName: undefined;
  companyCert: undefined;
};

export type MainTabParamList = {
  home: undefined;
  link: undefined;
  message: undefined;
  my: undefined;
};
