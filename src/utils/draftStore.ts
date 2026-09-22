import { storageUtils } from './storage';

export interface LocalDraft {
  id: string;
  draftType: 0 | 1 | 2;
  title: string;
  content: string;
  /** 已上传图片 url 列表（与后端 images 字段一致） */
  images: string[];
  videoUri?: string;
  videoUrl?: string;
  videoCover?: string;
  videoRatio?: '3:4' | '16:9';
  coverTransform?: { tx: number; ty: number; scale: number } | null;
  /** 长文封面 url（draftType=2） */
  cover?: string;
  updatedAt: number;
}

const KEY = 'publishDrafts';

export function listDrafts(): LocalDraft[] {
  return storageUtils.getObject<LocalDraft[]>(KEY) ?? [];
}

export function saveDraft(draft: LocalDraft) {
  const list = listDrafts().filter(item => item.id !== draft.id);
  list.unshift(draft);
  storageUtils.setObject(KEY, list);
}

export function deleteDraft(id: string) {
  storageUtils.setObject(KEY, listDrafts().filter(item => item.id !== id));
}

export function formatDraftTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
