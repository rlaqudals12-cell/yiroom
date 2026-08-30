import { Platform } from 'react-native';

const ANDROID_SCOPED_STORAGE_API_LEVEL = 29;
const ANDROID_SYSTEM_PHOTO_PICKER_API_LEVEL = 33;

function getAndroidApiLevel(version: typeof Platform.Version): number {
  return typeof version === 'number' ? version : Number.parseInt(String(version), 10);
}

/**
 * expo-image-picker는 Android 9 이하에서 카메라 촬영 시 외부 저장소 쓰기 권한도 요구한다.
 * 앱은 해당 권한을 선언하지 않으므로, 이 구간에서는 실패할 카메라를 열지 않고 앨범으로 안내한다.
 */
export function requiresLegacyAndroidGalleryFallback(
  os: typeof Platform.OS = Platform.OS,
  version: typeof Platform.Version = Platform.Version
): boolean {
  if (os !== 'android') return false;

  const apiLevel = getAndroidApiLevel(version);
  return Number.isFinite(apiLevel) && apiLevel < ANDROID_SCOPED_STORAGE_API_LEVEL;
}

/**
 * Android 10~12L은 시스템 선택기를 여는 데 저장소 권한이 필요하지 않지만,
 * WRITE_EXTERNAL_STORAGE를 차단한 앱에서는 expo-image-picker 권한 응답이 denied로 남을 수 있다.
 * 이 구간만 사전 권한 게이트를 건너뛰고 네이티브 선택기 자체의 결과를 신뢰한다.
 */
export function shouldBypassMediaLibraryPermissionGate(
  os: typeof Platform.OS = Platform.OS,
  version: typeof Platform.Version = Platform.Version
): boolean {
  if (os !== 'android') return false;

  const apiLevel = getAndroidApiLevel(version);
  return (
    Number.isFinite(apiLevel) &&
    apiLevel >= ANDROID_SCOPED_STORAGE_API_LEVEL &&
    apiLevel < ANDROID_SYSTEM_PHOTO_PICKER_API_LEVEL
  );
}
