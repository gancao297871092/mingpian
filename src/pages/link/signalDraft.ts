/**
 * 合作信号「合作意向书」草稿。
 *
 * 后端 `/signal/create` 只保存 `targetDesc / purpose / abilityContent / identityCardId / reachConfig`，
 * 没有「信号 → 意向书」的关联表：按产品口径，意向书是「匹配到客户时自动发送」的模板。
 * 因此前端把意向书模板序列化进 `abilityContent`（后端原样存储），
 * 预览页、信号进展/结果页都从这里回显。
 */
export interface SignalIntentAbility {
  title: string;
  body: string;
}

/** 意向书草稿（同时用于 abilityContent 序列化与页面回显） */
export interface SignalIntentDraft {
  /** 合作说明 */
  note: string;
  /** 能力卡 ID */
  cardId?: number;
  /** 本次对接人名片 ID */
  contactCardId?: number;
  /** 关联动态 ID */
  relBbs?: number[];
  /** 能力卡名称（展示冗余，避免二次查询） */
  cardName?: string;
  /** 对接人姓名 / 职位（展示冗余） */
  contactName?: string;
  contactTitle?: string;
  /** 关联动态标题（展示冗余） */
  feedTitles?: string[];
  /** 关联动态封面图（与 feedTitles 对齐，展示冗余） */
  feedImages?: string[];
  /** 能力卡正文快照 */
  abilities?: SignalIntentAbility[];
}

/** 解析后端 abilityContent（可能为空 / 非本结构的历史数据） */
export function parseAbilityContent(raw?: string): SignalIntentDraft | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || typeof data.note !== 'string' || !data.note.trim()) {
      return null;
    }
    return {
      note: data.note,
      cardId: typeof data.cardId === 'number' ? data.cardId : undefined,
      contactCardId: typeof data.contactCardId === 'number' ? data.contactCardId : undefined,
      relBbs: Array.isArray(data.relBbs)
        ? (data.relBbs as unknown[]).map(Number).filter((n: number) => !Number.isNaN(n))
        : undefined,
      cardName: typeof data.cardName === 'string' ? data.cardName : undefined,
      contactName: typeof data.contactName === 'string' ? data.contactName : undefined,
      contactTitle: typeof data.contactTitle === 'string' ? data.contactTitle : undefined,
      feedTitles: Array.isArray(data.feedTitles) ? data.feedTitles.filter((s: unknown) => typeof s === 'string') : undefined,
      feedImages: Array.isArray(data.feedImages) ? data.feedImages.filter((s: unknown) => typeof s === 'string') : undefined,
      abilities: Array.isArray(data.abilities)
        ? data.abilities
            .filter((a: any) => a && typeof a.title === 'string' && typeof a.body === 'string')
            .map((a: any) => ({ title: a.title, body: a.body }))
        : undefined,
    };
  } catch {
    return null;
  }
}

/** 序列化为 abilityContent（无草稿时返回 undefined） */
export function stringifyAbilityContent(draft?: SignalIntentDraft | null): string | undefined {
  if (!draft || !draft.note.trim()) return undefined;
  return JSON.stringify(draft);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 能力卡正文 → 「1.能提供什么」等分节（沿用原型五段式，缺字段自动跳过）。
 * 企业能力卡编辑器只存 cardName + content（富文本），summary/offer/scenario/delivery 多为空，
 * 此时兜底用 content 纯文本（截断 160 字），否则「企业能力」整块会被过滤掉。
 */
export function buildAbilities(card?: {
  summary?: string;
  offer?: string;
  scenario?: string;
  delivery?: string;
  content?: string;
} | null): SignalIntentAbility[] {
  if (!card) return [];
  const list: Array<{ title: string; body?: string }> = [
    { title: '1.能提供什么', body: card.summary || card.offer },
    { title: '2.适用企业或场景', body: card.scenario },
    { title: '3.产品/服务范围或交付能力', body: card.delivery || card.offer },
  ];
  const sections = list
    .filter((item): item is { title: string; body: string } => !!item.body && !!item.body.trim())
    .map(item => ({ title: item.title, body: item.body.trim() }));
  if (sections.length > 0) return sections;
  const text = stripHtml(card.content || '');
  if (!text) return [];
  return [{ title: '能力介绍', body: text.length > 160 ? `${text.slice(0, 160)}…` : text }];
}

/** CreateCooperationIntent → CreateCooperationSignal 的草稿回传 */
let pendingDraft: SignalIntentDraft | null = null;

export function setPendingIntentDraft(draft: SignalIntentDraft) {
  pendingDraft = draft;
}

export function takePendingIntentDraft(): SignalIntentDraft | null {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}

/** 修改触达摘要 → 预览页回传 */
export interface TouchSummary {
  target: string;
  purpose: string;
  capability: string;
  identity: string;
}

let pendingSummary: TouchSummary | null = null;

export function setPendingTouchSummary(summary: TouchSummary) {
  pendingSummary = summary;
}

export function takePendingTouchSummary(): TouchSummary | null {
  const summary = pendingSummary;
  pendingSummary = null;
  return summary;
}
