export interface CompanyMember {
  id: string;
  name: string;
  avatar: string;
  positions: string[];
  isSuper?: boolean;
  isAdmin?: boolean;
  isService?: boolean;
}

export interface MemberApplication {
  id: string;
  name: string;
  avatar: string;
  positions: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditPost {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CompanyMenu {
  id: string;
  name: string;
  content: string;
}

export interface CompanyContact {
  id: string;
  name: string;
  position: string;
  phone: string;
}

export const COMPANY_INFO = {
  name: '重庆万企佳连网络科技有限公司',
  logo: 'https://picsum.photos/seed/qylogo/200/200',
  poster: 'https://picsum.photos/seed/qyposter/316/316',
  intro:
    '重庆万企佳连网络科技有限公司是一家专注于企业数字化服务的科技公司。我们打造了万企卡平台，帮助企业高效展示能力、精准匹配合作机会，并提供智能商机推荐与企业主页定制等一站式服务。',
};

export const COMPANY_PHOTOS = [
  'https://picsum.photos/seed/qyphoto1/232/232',
  'https://picsum.photos/seed/qyphoto2/232/232',
  'https://picsum.photos/seed/qyphoto3/232/232',
];

export const COMPANY_MENUS: CompanyMenu[] = [
  {
    id: 'm1',
    name: '平台概览',
    content: '一、核心资源\n联诚采信聚焦产业融通与数字信用，为企业提供可展示、可触达、可转化的数字化经营能力。',
  },
  { id: 'm2', name: '功能体系', content: '' },
];

export const COMPANY_CONTACTS: CompanyContact[] = [
  { id: 'c1', name: '张三', position: '销售总监', phone: '15712346876' },
  { id: 'c2', name: '李四', position: '财务主管', phone: '13902345678' },
];

export const CONTACT_MAX = 5;

export const COMPANY_BUTLER = {
  name: '刘金旻',
  phone: '17718002874',
  avatar: 'https://picsum.photos/seed/butler/96/96',
};

export const COMPANY_MEMBERS: CompanyMember[] = [
  {
    id: 'u1',
    name: '刘金旻',
    avatar: 'https://picsum.photos/seed/member1/96/96',
    positions: ['总经理'],
    isSuper: true,
  },
  {
    id: 'u2',
    name: '刘金昊',
    avatar: 'https://picsum.photos/seed/member2/96/96',
    positions: ['行政'],
  },
  {
    id: 'u3',
    name: '王嘉明',
    avatar: 'https://picsum.photos/seed/member3/96/96',
    positions: ['销售总监', '销售经理'],
  },
  {
    id: 'u4',
    name: '苗强伟',
    avatar: 'https://picsum.photos/seed/member4/96/96',
    positions: ['业务经理', '企业客服'],
    isAdmin: true,
    isService: true,
  },
  {
    id: 'u5',
    name: '陈晓婷',
    avatar: 'https://picsum.photos/seed/member5/96/96',
    positions: ['财务专员'],
  },
];

export const MEMBER_APPLICATIONS: MemberApplication[] = [
  {
    id: 'a1',
    name: '刘金晏',
    avatar: 'https://picsum.photos/seed/audit1/96/96',
    positions: ['销售', '采购'],
    status: 'pending',
  },
  {
    id: 'a2',
    name: '刘金晏',
    avatar: 'https://picsum.photos/seed/audit1/96/96',
    positions: ['财务总监', '销售总监'],
    status: 'approved',
  },
  {
    id: 'a3',
    name: '刘金晏',
    avatar: 'https://picsum.photos/seed/audit1/96/96',
    positions: ['测试'],
    status: 'rejected',
  },
];

export const AUDIT_POSTS: AuditPost[] = [
  {
    id: 'p1',
    author: '刘谨言',
    avatar: 'https://picsum.photos/seed/poster1/40/40',
    time: '09-14 10:30',
    content: '新增自动化产线投入使用，交付效率提升60%',
    image: 'https://picsum.photos/seed/qypost1/134/180',
    status: 'pending',
  },
  {
    id: 'p2',
    author: '刘谨言',
    avatar: 'https://picsum.photos/seed/poster1/40/40',
    time: '09-14 10:30',
    content: '新一代防腐阀门产品测试完成，性能稳定可靠',
    image: 'https://picsum.photos/seed/qypost2/134/180',
    status: 'approved',
  },
];

export const CAP_CARD_MAX = 10;

export interface CompanySearchItem {
  id: string;
  name: string;
  industry: string;
  city: string;
  logo: string;
}

export const COMPANY_SEARCH_RESULTS: CompanySearchItem[] = [
  {
    id: 'cp1',
    name: '鄂尔多斯市巨鼎煤机制造有限公司',
    industry: '煤矿装备制造',
    city: '鄂尔多斯',
    logo: 'https://picsum.photos/seed/cp1/96/96',
  },
  {
    id: 'cp2',
    name: '重庆渝达精密制造有限公司',
    industry: '煤矿装备制造',
    city: '重庆',
    logo: 'https://picsum.photos/seed/cp2/96/96',
  },
];
