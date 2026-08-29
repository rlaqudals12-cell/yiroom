import { Platform } from 'react-native';

const ANDROID_SCOPED_STORAGE_API_LEVEL = 29;

/**
 * expo-image-picker는 Android 9 이하에서 카메라 촬영 시 외부 저장소 쓰기 권한도 요구한다.
 * 앱은 해당 권한을 선언하지 않으므로, 이 구간에서는 실패할 카메라를 열지 않고 앨범으로 안내한다.
 */
export function requiresLegacyAndroidGalleryFallback(
  os: typeof Platform.OS = Platform.OS,
  version: typeof Platform.Version = Platform.Version
): boolean {
  if (os !== 'android') return false;

  const apiLevel = typeof version === 'number' ? version : Number.parseInt(String(version), 10);
  return Number.isFinite(apiLevel) && apiLevel < ANDROID_SCOPED_STORAGE_API_LEVEL;
}
