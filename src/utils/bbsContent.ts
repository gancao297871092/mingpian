interface BbsContent {
  draftType?: number | string | null;
  content?: string | null;
}

/** 优先使用发布类型；仅缺失类型的旧接口数据兼容 HTML 展示，不回写推断结果。 */
export function isLongFormBbs(bbs: BbsContent): boolean {
  if (bbs.draftType != null) return Number(bbs.draftType) === 2;
  return /<\/?(p|img|video|strong|em|u|span|h[1-6])[ >]/i.test(bbs.content || '');
}

/** 从 HTML 提取指定标签的 src（仅 http(s) 资源） */
export function extractMediaSrcs(html: string, tag: 'img' | 'video'): string[] {
  const regex = new RegExp(`<${tag}[^>]+src=["']([^"']+)["']`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const src = m[1];
    // 兜底：img 里混入视频资源时按视频归类
    const isVideoSrc = /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(src);
    if (!/^https?:\/\//.test(src)) continue;
    if (tag === 'img' && isVideoSrc) continue;
    if (tag === 'video' && !isVideoSrc) continue;
    out.push(src);
  }
  return out;
}
