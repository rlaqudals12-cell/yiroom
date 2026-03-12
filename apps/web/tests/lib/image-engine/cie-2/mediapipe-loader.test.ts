/**
 * MediaPipe FaceLandmarker 로더 테스트
 *
 * @description mediapipe-loader.ts의 환경 감지 및 로드 로직 검증
 */

import { describe, it, expect } from 'vitest';
import {
  isBrowserEnvironment,
  hasWebGL2Support,
  canUseMediaPipe,
  disposeFaceLandmarker,
} from '@/lib/image-engine/cie-2/mediapipe-loader';

describe('mediapipe-loader', () => {
  describe('isBrowserEnvironment', () => {
    it('should return false in Node.js (test) environment', () => {
      // Node.js에서는 window/document가 없음
      const original = globalThis.window;
      // @ts-expect-error -- 테스트용 환경 초기화
      delete globalThis.window;

      expect(isBrowserEnvironment()).toBe(false);

      // 복원
      globalThis.window = original;
    });

    it('should return true when window and document exist', () => {
      // jsdom 환경에서는 window/document가 존재
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        expect(isBrowserEnvironment()).toBe(true);
      }
    });
  });

  describe('hasWebGL2Support', () => {
    it('should return false in non-browser environment', () => {
      const original = globalThis.window;
      // @ts-expect-error -- 테스트용 환경 초기화
      delete globalThis.window;

      expect(hasWebGL2Support()).toBe(false);

      globalThis.window = original;
    });

    it('should check WebGL2 context availability', () => {
      // jsdom에는 WebGL2가 없으므로 false 반환
      if (typeof window !== 'undefined') {
        // jsdom doesn't support WebGL2
        expect(hasWebGL2Support()).toBe(false);
      }
    });
  });

  describe('canUseMediaPipe', () => {
    it('should return false in test environment', () => {
      // 테스트 환경: WebGL2 미지원이므로 false
      expect(canUseMediaPipe()).toBe(false);
    });
  });

  describe('disposeFaceLandmarker', () => {
    it('should not throw when called without initialization', () => {
      expect(() => disposeFaceLandmarker()).not.toThrow();
    });

    it('should be idempotent', () => {
      disposeFaceLandmarker();
      disposeFaceLandmarker();
      // 두 번 호출해도 에러 없음
      expect(true).toBe(true);
    });
  });

  describe('loadFaceLandmarker', () => {
    it('should return null in non-browser environment', async () => {
      const { loadFaceLandmarker } = await import('@/lib/image-engine/cie-2/mediapipe-loader');

      // canUseMediaPipe() = false 이므로 null 반환
      const result = await loadFaceLandmarker();
      expect(result).toBeNull();
    });
  });

  describe('detectFaceLandmarks', () => {
    it('should return null when MediaPipe is not available', async () => {
      const { detectFaceLandmarks } = await import('@/lib/image-engine/cie-2/mediapipe-loader');

      // Mock ImageData
      const imageData = new ImageData(100, 100);
      const result = await detectFaceLandmarks(imageData);
      expect(result).toBeNull();
    });
  });
});

describe('mediapipe-loader barrel exports', () => {
  it('should export all public functions from cie-2 index', async () => {
    const cie2 = await import('@/lib/image-engine/cie-2');

    expect(cie2.isBrowserEnvironment).toBeDefined();
    expect(cie2.hasWebGL2Support).toBeDefined();
    expect(cie2.canUseMediaPipe).toBeDefined();
    expect(cie2.loadFaceLandmarker).toBeDefined();
    expect(cie2.detectFaceLandmarks).toBeDefined();
    expect(cie2.disposeFaceLandmarker).toBeDefined();
  });
});
