/**
 * 지역 감지 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Region Detector', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // localStorage mock
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock.store[key];
      }),
      clear: vi.fn(() => {
        localStorageMock.store = {};
      }),
    };

    Object.defineProperty(global, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
    });

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetModules();
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true });
  });

  describe('detectRegion', () => {
    it('저장된 지역이 있으면 해당 지역 반환', async () => {
      localStorage.setItem('yiroom_user_region', 'JP');

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('JP');
    });

    it('저장된 값이 유효하지 않으면 무시', async () => {
      localStorage.setItem('yiroom_user_region', 'INVALID');

      Object.defineProperty(global, 'navigator', {
        value: { language: 'ko-KR' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('KR');
    });

    it('저장값 없고 locale이 ko면 KR 반환', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'ko-KR' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('KR');
    });

    it('저장값 없고 locale이 ja면 JP 반환', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'ja-JP' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('JP');
    });

    it('저장값 없고 locale이 en-US면 US 반환', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('US');
    });

    it('저장값 없고 locale이 de면 EU 반환', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'de-DE' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('EU');
    });

    it('저장값 없고 locale이 th면 SEA 반환', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'th-TH' },
        writable: true,
      });

      const { detectRegion } = await import('@/lib/region/detector');
      const result = detectRegion();

      expect(result).toBe('SEA');
    });
  });

  describe('saveRegion', () => {
    it('지역을 localStorage에 저장', async () => {
      const { saveRegion } = await import('@/lib/region/detector');
      saveRegion('US');

      expect(localStorage.setItem).toHaveBeenCalledWith('yiroom_user_region', 'US');
    });
  });

  describe('clearSavedRegion', () => {
    it('저장된 지역을 삭제', async () => {
      localStorage.setItem('yiroom_user_region', 'JP');

      const { clearSavedRegion } = await import('@/lib/region/detector');
      clearSavedRegion();

      expect(localStorage.removeItem).toHaveBeenCalledWith('yiroom_user_region');
    });
  });

  describe('hasUserSelectedRegion', () => {
    it('저장된 지역이 있으면 true', async () => {
      localStorage.setItem('yiroom_user_region', 'KR');

      const { hasUserSelectedRegion } = await import('@/lib/region/detector');
      const result = hasUserSelectedRegion();

      expect(result).toBe(true);
    });

    it('저장된 지역이 없으면 false', async () => {
      const { hasUserSelectedRegion } = await import('@/lib/region/detector');
      const result = hasUserSelectedRegion();

      expect(result).toBe(false);
    });
  });
});
