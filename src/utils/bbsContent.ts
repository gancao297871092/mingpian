interface BbsContent {
  draftType?: number | string | null;
  content?: string | null;
}

/** 优先使用发布类型；仅缺失类型的旧接口数据兼容 HTML 展示，不回写推断结果。 */
export function isLongFormBbs(bbs: BbsContent): boolean {
  if (bbs.draftType != null) return Number(bbs.draftType) === 2;
  return /<\/?(p|img|video|strong|em|u|span|h[1-6])[ >]/i.test(bbs.content || '');
}
