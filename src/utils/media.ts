import { Image as ImageCompressor, getImageMetaData } from 'react-native-compressor';

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const COMPRESS_THRESHOLD = 2 * 1024 * 1024;

function qualityFor(size: number): number | null {
  if (size <= COMPRESS_THRESHOLD) return null;
  const mb = size / (1024 * 1024);
  if (mb <= 5) return 80;
  if (mb <= 10) return 65;
  if (mb <= 20) return 55;
  return 45;
}

export async function maybeCompressImage(uri: string, size?: number): Promise<string> {
  let fileSize = size;
  if (!fileSize) {
    try {
      fileSize = (await getImageMetaData(uri)).size;
    } catch {
      return uri;
    }
  }
  const quality = qualityFor(fileSize);
  if (!quality) return uri;
  try {
    const compressed = await ImageCompressor.compress(uri, {
      compressionMethod: 'auto',
      quality,
      maxWidth: 2000,
      maxHeight: 2000,
    });
    // react-native-compressor 平台差异：Android 返回无 scheme 的裸路径（iOS 返回 file://）。
    // 裸路径传给 expo-image 在 Android 上加载失败（图片空白）；RN FormData 上传可容忍，故「上传成功但不显示」。
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(compressed) ? compressed : `file://${compressed}`;
  } catch {
    return uri;
  }
}
