import { API } from '@/api';

interface OssSignature {
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
}

let cached: { data: OssSignature; ts: number } | null = null;
let pending: Promise<OssSignature> | null = null;

const CACHE_MS = 2.5 * 3600 * 1000;

async function getSignature(): Promise<OssSignature> {
  if (cached && Date.now() - cached.ts < CACHE_MS) return cached.data;
  if (!pending) {
    pending = API.file.ossSignature()
      .then(res => {
        console.log('OSS 签名获取成功', res);
        cached = { data: res.data, ts: Date.now() };
        return res.data;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

export async function uploadToOss(uri: string, mime = 'image/jpeg'): Promise<string> {
  const sig = await getSignature();
  const ext = EXT_BY_MIME[mime] || (uri.split('.').pop() || 'jpg').split('?')[0];
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const key = `${sig.upload_prefix}${fileName}`;

  const form = new FormData();
  form.append('key', key);
  form.append('policy', sig.policy);
  form.append('x-oss-signature-version', sig.x_oss_signature_version);
  form.append('x-oss-credential', sig.x_oss_credential);
  form.append('x-oss-date', sig.x_oss_date);
  if (sig.security_token) form.append('x-oss-security-token', sig.security_token);
  form.append('x-oss-signature', sig.signature);
  form.append('success_action_status', '200');
  form.append('file', { uri, type: mime, name: fileName } as any);

  const host = `https://${sig.bucket_name}.${sig.endpoint}`;
  console.log('OSS 上传', { host, key, fileName, mime, sig });
  const resp = await fetch(host, { method: 'POST', body: form });
    console.log('resp', resp);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OSS 上传失败(${resp.status}) ${text}`);
  }
  const cdn = sig.cdn_domain.startsWith('http') ? sig.cdn_domain : `https://${sig.cdn_domain}`;
  console.log('OSS 上传成功', `${cdn}/${key}`);
  return `${cdn}/${key}`;
}
