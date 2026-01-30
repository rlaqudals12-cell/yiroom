/**
 * CIE-1: 해상도 검증 테스트
 *
 * @module tests/lib/image-engine/cie-1/resolution
 */
import { describe, it, expect } from 'vitest';
import {
  validateResolution,
  validateResolutionDirect,
  calculateResolutionScore,
  isSuitableForFaceAnalysis,
  calculateRecommendedSize,
} from '@/lib/image-engine/cie-1/resolution';
import type { RGBImageData } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createMockImageData(width: number, height: number): RGBImageData {
  return {
    data: new Uint8Array(width * height * 3),
    width,
    height,
    channels: 3,
  };
}

describe('validateResolution', () => {
  describe('유효한 해상도', () => {
    it('최소 해상도 이상이면 유효해야 한다', () => {
      const imageData = createMockImageData(640, 480);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(true);
      expect(result.width).toBe(640);
      expect(result.height).toBe(480);
      expect(result.feedback).toBeNull();
    });

    it('권장 해상도 이상도 유효해야 한다', () => {
      const imageData = createMockImageData(1920, 1080);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(true);
      expect(result.pixelCount).toBe(1920 * 1080);
    });

    it('4K 해상도도 유효해야 한다', () => {
      const imageData = createMockImageData(3840, 2160);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(true);
    });
  });

  describe('유효하지 않은 해상도', () => {
    it('너비가 부족하면 유효하지 않아야 한다', () => {
      const imageData = createMockImageData(320, 480);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(false);
      expect(result.feedback).not.toBeNull();
    });

    it('높이가 부족하면 유효하지 않아야 한다', () => {
      const imageData = createMockImageData(640, 240);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(false);
    });

    it('너비와 높이 모두 부족하면 유효하지 않아야 한다', () => {
      const imageData = createMockImageData(320, 240);
      const result = validateResolution(imageData);

      expect(result.isValid).toBe(false);
    });
  });

  describe('커스텀 설정', () => {
    it('커스텀 최소 해상도 설정을 적용해야 한다', () => {
      const imageData = createMockImageData(800, 600);
      const customConfig = {
        minWidth: 1024,
        minHeight: 768,
        recommendedWidth: 1920,
        recommendedHeight: 1080,
      };

      const result = validateResolution(imageData, customConfig);
      expect(result.isValid).toBe(false);
    });

    it('커스텀 설정에서 유효한 경우', () => {
      const imageData = createMockImageData(1024, 768);
      const customConfig = {
        minWidth: 1024,
        minHeight: 768,
        recommendedWidth: 1920,
        recommendedHeight: 1080,
      };

      const result = validateResolution(imageData, customConfig);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateResolutionDirect', () => {
  it('이미지 데이터 없이 직접 검증해야 한다', () => {
    const result = validateResolutionDirect(1280, 720);

    expect(result.isValid).toBe(true);
    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
    expect(result.pixelCount).toBe(1280 * 720);
  });

  it('최소 해상도 미달 시 피드백을 반환해야 한다', () => {
    const result = validateResolutionDirect(320, 240);

    expect(result.isValid).toBe(false);
    expect(result.feedback).not.toBeNull();
  });
});

describe('calculateResolutionScore', () => {
  describe('최소 해상도 미달', () => {
    it('최소 해상도의 절반이면 약 25점이어야 한다', () => {
      // 기본 최소 해상도: 640x480
      const score = calculateResolutionScore(320, 240);
      expect(score).toBeLessThan(30);
      expect(score).toBeGreaterThan(0);
    });

    it('최소 해상도에 근접하면 50점에 가까워야 한다', () => {
      const score = calculateResolutionScore(600, 450);
      expect(score).toBeLessThan(50);
      expect(score).toBeGreaterThan(40);
    });
  });

  describe('최소~권장 해상도 사이', () => {
    it('최소 해상도면 50점이어야 한다', () => {
      const score = calculateResolutionScore(640, 480);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('최소와 권장 중간이면 약 70점이어야 한다', () => {
      // 권장 해상도가 1024x768이라면
      const score = calculateResolutionScore(832, 624);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThan(90);
    });
  });

  describe('권장 해상도 이상', () => {
    it('권장 해상도(1280x960)면 90점 이상이어야 한다', () => {
      const score = calculateResolutionScore(1280, 960);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('권장 해상도 초과면 최대 100점에 근접해야 한다', () => {
      const score = calculateResolutionScore(2560, 1920);
      expect(score).toBeGreaterThanOrEqual(90);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe('isSuitableForFaceAnalysis', () => {
  it('320px 이상이면 얼굴 분석에 적합해야 한다', () => {
    expect(isSuitableForFaceAnalysis(640, 480)).toBe(true);
    expect(isSuitableForFaceAnalysis(320, 320)).toBe(true);
    expect(isSuitableForFaceAnalysis(1920, 1080)).toBe(true);
  });

  it('320px 미만이면 얼굴 분석에 부적합해야 한다', () => {
    expect(isSuitableForFaceAnalysis(319, 480)).toBe(false);
    expect(isSuitableForFaceAnalysis(640, 319)).toBe(false);
    expect(isSuitableForFaceAnalysis(200, 200)).toBe(false);
  });

  it('최소 치수를 기준으로 판단해야 한다', () => {
    // 한 쪽이 충분히 크더라도 다른 쪽이 작으면 부적합
    expect(isSuitableForFaceAnalysis(1920, 200)).toBe(false);
    expect(isSuitableForFaceAnalysis(200, 1920)).toBe(false);
  });
});

describe('calculateRecommendedSize', () => {
  describe('이미 적정 크기인 경우', () => {
    it('최대 치수 이하면 원본 크기를 반환해야 한다', () => {
      const result = calculateRecommendedSize(800, 600);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.scale).toBe(1);
    });

    it('정확히 최대 치수면 원본 크기를 반환해야 한다', () => {
      const result = calculateRecommendedSize(1024, 768);

      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
      expect(result.scale).toBe(1);
    });
  });

  describe('리사이즈가 필요한 경우', () => {
    it('가로가 긴 이미지는 가로 기준으로 축소해야 한다', () => {
      const result = calculateRecommendedSize(2048, 1536);

      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
      expect(result.scale).toBe(0.5);
    });

    it('세로가 긴 이미지는 세로 기준으로 축소해야 한다', () => {
      const result = calculateRecommendedSize(1536, 2048);

      expect(result.width).toBe(768);
      expect(result.height).toBe(1024);
      expect(result.scale).toBe(0.5);
    });

    it('4K 이미지는 적절히 축소해야 한다', () => {
      const result = calculateRecommendedSize(3840, 2160);

      expect(result.width).toBeLessThanOrEqual(1024);
      expect(result.height).toBeLessThanOrEqual(1024);
      expect(result.scale).toBeLessThan(1);
    });
  });

  describe('커스텀 최대 치수', () => {
    it('커스텀 최대 치수를 적용해야 한다', () => {
      const result = calculateRecommendedSize(2048, 1536, 512);

      expect(result.width).toBe(512);
      expect(result.height).toBe(384);
      expect(result.scale).toBe(0.25);
    });

    it('최대 치수가 작으면 더 많이 축소해야 한다', () => {
      const result = calculateRecommendedSize(1920, 1080, 256);

      expect(Math.max(result.width, result.height)).toBe(256);
      expect(result.scale).toBeLessThan(0.15);
    });
  });

  describe('비율 유지', () => {
    it('가로세로 비율을 유지해야 한다', () => {
      const result = calculateRecommendedSize(1920, 1080);
      const originalRatio = 1920 / 1080;
      const newRatio = result.width / result.height;

      expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.01);
    });

    it('정사각형 이미지도 비율을 유지해야 한다', () => {
      const result = calculateRecommendedSize(2000, 2000);

      expect(result.width).toBe(result.height);
    });
  });
});
