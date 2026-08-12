import { Linking, PermissionsAndroid, Platform, type Permission } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

export type PermissionType = 'camera' | 'microphone' | 'photo' | 'location';

export type PermissionResult =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'restricted'
  | 'not-determined';

export interface PermissionState {
  status: PermissionResult;
  granted: boolean;
}

const grantedResult: PermissionState = { status: 'granted', granted: true };
const deniedResult: PermissionState = { status: 'denied', granted: false };

function mapCameraStatus(status: string): PermissionResult {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'restricted':
      return 'restricted';
    default:
      return 'not-determined';
  }
}

function mapAndroidResult(result: string): PermissionResult {
  switch (result) {
    case PermissionsAndroid.RESULTS.GRANTED:
      return 'granted';
    case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
      return 'blocked';
    default:
      return 'denied';
  }
}

function photoPermission(): Permission {
  if (Number(Platform.Version) >= 33) {
    return PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  }
  return PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
}

async function requestLocation(): Promise<PermissionState> {
  const res = await ExpoGaodeMapModule.requestLocationPermission();
  if (res.granted) return grantedResult;
  return { status: res.canAskAgain ? 'denied' : 'blocked', granted: false };
}

async function checkLocation(): Promise<PermissionState> {
  const res = await ExpoGaodeMapModule.checkLocationPermission();
  if (res.granted) return grantedResult;
  if (res.status === 'undetermined') {
    return { status: 'not-determined', granted: false };
  }
  return { status: res.canAskAgain ? 'denied' : 'blocked', granted: false };
}

export async function checkPermission(type: PermissionType): Promise<PermissionState> {
  switch (type) {
    case 'camera': {
      const status = Camera.getCameraPermissionStatus();
      return { status: mapCameraStatus(status), granted: status === 'granted' };
    }
    case 'microphone': {
      const status = Camera.getMicrophonePermissionStatus();
      return { status: mapCameraStatus(status), granted: status === 'granted' };
    }
    case 'photo':
      if (Platform.OS === 'ios') return grantedResult;
      try {
        const granted = await PermissionsAndroid.check(photoPermission());
        return granted ? grantedResult : deniedResult;
      } catch {
        return deniedResult;
      }
    case 'location':
      return checkLocation();
  }
}

export async function requestPermission(type: PermissionType): Promise<PermissionState> {
  switch (type) {
    case 'camera': {
      const result = await Camera.requestCameraPermission();
      return { status: mapCameraStatus(result), granted: result === 'granted' };
    }
    case 'microphone': {
      const result = await Camera.requestMicrophonePermission();
      return { status: mapCameraStatus(result), granted: result === 'granted' };
    }
    case 'photo':
      if (Platform.OS === 'ios') return grantedResult;
      try {
        const result = await PermissionsAndroid.request(photoPermission());
        return {
          status: mapAndroidResult(result),
          granted: result === PermissionsAndroid.RESULTS.GRANTED,
        };
      } catch {
        return deniedResult;
      }
    case 'location':
      return requestLocation();
  }
}

export function openAppSettings(): void {
  Linking.openSettings();
}
