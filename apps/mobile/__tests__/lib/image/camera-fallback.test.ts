import { requiresLegacyAndroidGalleryFallback } from '@/lib/image/camera-fallback';

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
