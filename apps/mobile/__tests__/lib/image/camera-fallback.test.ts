import {
  requiresLegacyAndroidGalleryFallback,
  shouldBypassMediaLibraryPermissionGate,
} from '@/lib/image/camera-fallback';

describe('requiresLegacyAndroidGalleryFallback', () => {
  it('Android 9(API 28) 이하에서는 앨범 폴백을 요구한다', () => {
    expect(requiresLegacyAndroidGalleryFallback('android', 28)).toBe(true);
  });

  it('Android 10(API 29) 이상에서는 카메라 경로를 유지한다', () => {
    expect(requiresLegacyAndroidGalleryFallback('android', 29)).toBe(false);
  });

  it('iOS에서는 버전과 무관하게 카메라 경로를 유지한다', () => {
    expect(requiresLegacyAndroidGalleryFallback('ios', '18.0')).toBe(false);
  });
});

describe('shouldBypassMediaLibraryPermissionGate', () => {
  it.each([29, 30, 31, 32])('Android API %s에서는 잘못된 사전 권한 거부를 건너뛴다', (api) => {
    expect(shouldBypassMediaLibraryPermissionGate('android', api)).toBe(true);
  });

  it.each([28, 33, 34])('Android API %s에서는 플랫폼 권한 계약을 그대로 따른다', (api) => {
    expect(shouldBypassMediaLibraryPermissionGate('android', api)).toBe(false);
  });

  it('iOS에서는 버전과 무관하게 권한 게이트를 유지한다', () => {
    expect(shouldBypassMediaLibraryPermissionGate('ios', '18.0')).toBe(false);
  });
});
