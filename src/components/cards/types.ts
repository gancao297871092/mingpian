export type CardStyle = 'business' | 'fashion' | 'simple';

export interface CardData {
  id?: number | string;
  alias?: string;
  nameZh?: string;
  nameEn?: string;
  position?: string;
  cpName?: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  isAuth?: number;
  styleCode?: string;
  fontColor?: string;
  backColor?: string;
  cardPoster?: string;
  mediaLinkList?: any[];
  countBrowse?: number;
  countFavorite?: number;
  [key: string]: any;
}

/**
 * 新版设计：个人名片三种风格（商务/时尚/简约）。
 * 兼容服务端旧 styleCode：NORMAL→商务，TRADITIONAL（左图右文+配色）→时尚，FASHION（整图）→简约。
 */
export function normalizeCardStyle(styleCode?: string, name?: string): CardStyle {
  if (name) {
    if (name.includes('时尚')) return 'fashion';
    if (name.includes('简约')) return 'simple';
    if (name.includes('商务')) return 'business';
  }
  switch ((styleCode || '').toUpperCase()) {
    case 'FASHION':
    case 'SIMPLE':
      return 'simple';
    case 'TRADITIONAL':
      return 'fashion';
    default:
      return 'business';
  }
}

/** 名片形象照：编辑态取 mediaLinkList 封面，展示态取 cardPoster */
export function getCardPhoto(data?: CardData | null): string {
  if (!data) return '';
  if (Array.isArray(data.mediaLinkList) && data.mediaLinkList.length > 0) {
    const cover = data.mediaLinkList.find((o: any) => o.isIndex) || data.mediaLinkList[0];
    const url = cover?.media?.mdUrl || cover?.mdUrl;
    if (url) return url;
  }
  return data.cardPoster || '';
}

export interface FashionColor {
  name: string;
  fontColor: string;
  backColor: string;
}

/** 时尚名片默认配色（figma 创建名片4-2），接口 colorList 为空时使用 */
export const FASHION_COLOR_PRESETS: FashionColor[] = [
  { name: '克莱茵蓝', fontColor: '#002FA7', backColor: '#FFFFFF' },
  { name: '马尔斯绿', fontColor: '#008C8C', backColor: '#FFFFFF' },
  { name: '勃艮第红', fontColor: '#900021', backColor: '#FFFFFF' },
  { name: '凡戴克棕', fontColor: '#432913', backColor: '#FFFFFF' },
  { name: '经典黑白', fontColor: '#000000', backColor: '#FFFFFF' },
  { name: '主题蓝', fontColor: '#2962D4', backColor: '#FFFFFF' },
];
