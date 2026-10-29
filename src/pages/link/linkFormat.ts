/**
 * AI 分析文案拆「引导句 + 正文」。
 * 后端返回的 aiAnalysis 一般是一整段，设计稿是「引导句 + 正文」两段式排版：
 * 优先按首个冒号（中/英）拆分，其次按首个句号拆分，都拆不出来就整段作为正文。
 */
export function splitAnalysis(text?: string): { lead: string; body: string } {
  const content = (text ?? '').trim();
  if (!content) return { lead: '', body: '' };
  const colon = content.search(/[：:]/);
  if (colon > 0 && colon <= 24) {
    return { lead: content.slice(0, colon + 1), body: content.slice(colon + 1).trim() };
  }
  const dot = content.indexOf('。');
  if (dot > 0 && dot < content.length - 1) {
    return { lead: content.slice(0, dot + 1), body: content.slice(dot + 1).trim() };
  }
  return { lead: '', body: content };
}

/**
 * 判断依据文案：`依据：企业信息 · 化工、能力卡 · xx 等3条依据`
 * 超过 2 条时展示前两条 + 总数，保持卡片单行。
 */
export function formatBasis(labels?: Array<string | undefined | null>, fallback = '企业信息 · AI 研判'): string {
  const list = (labels ?? []).filter((s): s is string => !!s);
  if (!list.length) return `依据：${fallback}`;
  const shown = list.slice(0, 2).join('、');
  return list.length > 2 ? `依据：${shown} 等${list.length}条依据` : `依据：${shown}`;
}

/** 后端时间字符串（ISO 带 T / 空格）→ 时间戳，非法返回 undefined */
export function toTimestamp(t?: string): number | undefined {
  if (!t) return undefined;
  const ts = new Date(t.replace(' ', 'T')).getTime();
  return Number.isNaN(ts) ? undefined : ts;
}

/** 列表时间文案：刚刚 / x 分钟前 / x 小时前 / 昨天 / x 天前 / MM-DD HH:mm */
export function formatRelativeTime(t?: string): string {
  const ts = toTimestamp(t);
  if (ts === undefined) return '';
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 2 * day) return '昨天';
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 投放第几天（从开始投放算起，向上取整，至少 1 天） */
export function elapsedDays(startTime?: string): number | undefined {
  const ts = toTimestamp(startTime);
  if (ts === undefined) return undefined;
  return Math.max(1, Math.ceil((Date.now() - ts) / (24 * 60 * 60 * 1000)));
}
