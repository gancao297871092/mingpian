import { AppAlert } from '@/components/AppAlert';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestPermission } from '@/utils/permission';

export async function requestGalleryPermission(): Promise<boolean> {
  return (await requestPermission('photo')).granted;
}

export async function saveToGallery(url: string, type: 'photo' | 'video' = 'photo') {
  const hasPermission = await requestGalleryPermission();
  if (!hasPermission) {
    AppAlert.alert('权限不足', '需要相册访问权限');
    return false;
  }
  try {
    await CameraRoll.saveAsset(url, { type });
    return true;
  } catch {
    return false;
  }
}

export async function getGalleryPhotos(
  after?: string,
  first: number = 50,
  assetType: 'Photos' | 'Videos' | 'All' = 'Photos',
) {
  const hasPermission = await requestGalleryPermission();
  if (!hasPermission) return null;
  const result = await CameraRoll.getPhotos({ first, after, assetType });
  return result;
}
