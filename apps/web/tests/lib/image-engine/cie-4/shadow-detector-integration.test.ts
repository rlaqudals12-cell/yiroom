/**
 * CIE-4 그림자 감지 통합 테스트
 *
 * @module tests/lib/image-engine/cie-4/shadow-detector-integration
 * @description performShadowAnalysis 종합 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  performShadowAnalysis,
  detectShadowDirection,
  calculateShadowIntensity,
  calculateDarkAreaRatio,
  calculateOverexposedRatio,
  shadowToScore,
  SHADOW_THRESHOLDS,
} from '@/lib/image-engine/cie-4/shadow-detector';
import type { RGBImageData, NormalizedRect, ShadowAnalysis } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createTestImageData(
  width: number,
  height: number,
  fillBrightness: number
): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fillBrightness;
    data[i * 3 + 1] = fillBrightness;
    data[i * 3 + 2] = fillBrightness;
  }

  return { data, width, height, channels: 3 };
}

// 왼쪽에 그림자가 있는 이미지 생성
function createLeftShadowImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const brightness = x < width / 2 ? 50 : 180; // 왼쪽이 어두움 (그림자)
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

// 오른쪽에 그림자가 있는 이미지 생성
function createRightShadowImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const brightness = x < width / 2 ? 180 : 50; // 오른쪽이 어두움 (그림자)
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

// 위에 그림자가 있는 이미지 생성
function createTopShadowImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const brightness = y < height / 2 ? 50 : 180; // 위쪽이 어두움 (그림자)
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

// 아래에 그림자가 있는 이미지 생성
function createBottomShadowImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const brightness = y < height / 2 ? 180 : 50; // 아래쪽이 어두움 (그림자)
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

// 강한 그림자 이미지 생성
function createStrongShadowImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      // 왼쪽 1/3은 매우 어둡고, 나머지는 밝음
      const brightness = x < width / 3 ? 20 : 220;
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

describe('performShadowAnalysis 통합 테스트', () => {
  const fullFaceRegion: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

  // =========================================
  // 기본 기능 테스트
  // =========================================

  describe('기본 기능', () => {
    it('균일한 이미지에서 그림자 없음을 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result).toBeDefined();
      expect(result.hasShadow).toBe(false);
      expect(result.direction).toBe('none');
      expect(result.severity).toBe('none');
    });

    it('결과 구조가 ShadowAnalysis 타입과 일치한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result).toHaveProperty('hasShadow');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('darkAreaRatio');
      expect(result).toHaveProperty('overexposedRatio');
      expect(result).toHaveProperty('recommendation');

      expect(typeof result.hasShadow).toBe('boolean');
      expect(typeof result.intensity).toBe('number');
      expect(typeof result.darkAreaRatio).toBe('number');
      expect(typeof result.overexposedRatio).toBe('number');
      expect(typeof result.recommendation).toBe('string');
    });
  });

  // =========================================
  // 그림자 방향 감지 테스트
  // =========================================

  describe('그림자 방향 감지', () => {
    it('왼쪽 그림자를 감지한다', () => {
      const imageData = createLeftShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.hasShadow).toBe(true);
      expect(result.direction).toBe('left');
    });

    it('오른쪽 그림자를 감지한다', () => {
      const imageData = createRightShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.hasShadow).toBe(true);
      expect(result.direction).toBe('right');
    });

    it('위쪽 그림자를 감지한다', () => {
      const imageData = createTopShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.hasShadow).toBe(true);
      expect(result.direction).toBe('top');
    });

    it('아래쪽 그림자를 감지한다', () => {
      const imageData = createBottomShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.hasShadow).toBe(true);
      expect(result.direction).toBe('bottom');
    });
  });

  // =========================================
  // 그림자 강도 테스트
  // =========================================

  describe('그림자 강도', () => {
    it('강한 그림자에서 높은 강도를 반환한다', () => {
      const imageData = createStrongShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.intensity).toBeGreaterThan(0.5);
    });

    it('균일한 이미지에서 낮은 강도를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.intensity).toBeLessThan(0.2);
    });

    it('강도가 0-1 범위 내에 있다', () => {
      const testCases = [
        createTestImageData(100, 100, 128),
        createLeftShadowImage(100, 100),
        createStrongShadowImage(100, 100),
      ];

      testCases.forEach((imageData) => {
        const result = performShadowAnalysis(imageData, fullFaceRegion);
        expect(result.intensity).toBeGreaterThanOrEqual(0);
        expect(result.intensity).toBeLessThanOrEqual(1);
      });
    });
  });

  // =========================================
  // 심각도 테스트
  // =========================================

  describe('그림자 심각도', () => {
    it('균일한 이미지는 none 심각도를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.severity).toBe('none');
    });

    it('그림자가 있는 이미지는 mild 이상의 심각도를 반환한다', () => {
      const imageData = createLeftShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      // 50 vs 180 밝기 차이가 커서 moderate 또는 severe 가능
      expect(['mild', 'moderate', 'severe']).toContain(result.severity);
    });

    it('강한 그림자는 moderate 또는 severe를 반환한다', () => {
      const imageData = createStrongShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(['moderate', 'severe']).toContain(result.severity);
    });
  });

  // =========================================
  // 어두운/밝은 영역 비율 테스트
  // =========================================

  describe('영역 비율', () => {
    it('어두운 이미지에서 높은 darkAreaRatio를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 50);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.darkAreaRatio).toBeGreaterThan(0.5);
    });

    it('밝은 이미지에서 높은 overexposedRatio를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 220);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.overexposedRatio).toBeGreaterThan(0.5);
    });

    it('중간 밝기에서 낮은 비율을 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.darkAreaRatio).toBe(0);
      expect(result.overexposedRatio).toBe(0);
    });

    it('비율이 0-1 범위 내에 있다', () => {
      const testCases = [
        createTestImageData(100, 100, 30),
        createTestImageData(100, 100, 128),
        createTestImageData(100, 100, 240),
      ];

      testCases.forEach((imageData) => {
        const result = performShadowAnalysis(imageData, fullFaceRegion);
        expect(result.darkAreaRatio).toBeGreaterThanOrEqual(0);
        expect(result.darkAreaRatio).toBeLessThanOrEqual(1);
        expect(result.overexposedRatio).toBeGreaterThanOrEqual(0);
        expect(result.overexposedRatio).toBeLessThanOrEqual(1);
      });
    });
  });

  // =========================================
  // 권장사항 테스트
  // =========================================

  describe('권장사항', () => {
    it('그림자 없으면 양호 메시지를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.recommendation).toContain('양호');
    });

    it('왼쪽 그림자에서 오른쪽 조명 권장', () => {
      const imageData = createLeftShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      if (result.hasShadow && result.direction === 'left') {
        expect(result.recommendation).toContain('오른쪽');
      }
    });

    it('권장사항이 한국어로 되어 있다', () => {
      const imageData = createLeftShadowImage(100, 100);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      const koreanRegex = /[가-힣]/;
      expect(koreanRegex.test(result.recommendation)).toBe(true);
    });
  });

  // =========================================
  // shadowToScore 테스트
  // =========================================

  describe('shadowToScore 점수 변환', () => {
    it('그림자 없으면 100점을 반환한다', () => {
      const noShadow: ShadowAnalysis = {
        hasShadow: false,
        direction: 'none',
        intensity: 0,
        severity: 'none',
        darkAreaRatio: 0,
        overexposedRatio: 0,
        recommendation: '',
      };

      expect(shadowToScore(noShadow)).toBe(100);
    });

    it('심각도에 따라 점수가 감소한다', () => {
      const mildShadow: ShadowAnalysis = {
        hasShadow: true,
        direction: 'left',
        intensity: 0.3,
        severity: 'mild',
        darkAreaRatio: 0.1,
        overexposedRatio: 0,
        recommendation: '',
      };

      const severeShadow: ShadowAnalysis = {
        hasShadow: true,
        direction: 'left',
        intensity: 0.7,
        severity: 'severe',
        darkAreaRatio: 0.4,
        overexposedRatio: 0.2,
        recommendation: '',
      };

      expect(shadowToScore(mildShadow)).toBeGreaterThan(shadowToScore(severeShadow));
    });

    it('점수가 0 이상이다', () => {
      const worstCase: ShadowAnalysis = {
        hasShadow: true,
        direction: 'left',
        intensity: 1,
        severity: 'severe',
        darkAreaRatio: 1,
        overexposedRatio: 1,
        recommendation: '',
      };

      expect(shadowToScore(worstCase)).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================
  // 부분 영역 테스트
  // =========================================

  describe('부분 영역 분석', () => {
    it('부분 영역에서도 정상 작동한다', () => {
      const imageData = createLeftShadowImage(200, 200);
      const partialRegion: NormalizedRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

      const result = performShadowAnalysis(imageData, partialRegion);

      expect(result).toBeDefined();
      expect(typeof result.hasShadow).toBe('boolean');
    });

    it('경계 밖 영역은 기본값을 사용한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const outOfBoundsRegion: NormalizedRect = { x: 1.5, y: 1.5, width: 0.5, height: 0.5 };

      const result = performShadowAnalysis(imageData, outOfBoundsRegion);

      expect(result).toBeDefined();
    });
  });

  // =========================================
  // 엣지 케이스 테스트
  // =========================================

  describe('엣지 케이스', () => {
    it('완전히 어두운 이미지를 처리한다', () => {
      const imageData = createTestImageData(100, 100, 0);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.darkAreaRatio).toBe(1);
      expect(result.overexposedRatio).toBe(0);
    });

    it('완전히 밝은 이미지를 처리한다', () => {
      const imageData = createTestImageData(100, 100, 255);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result.darkAreaRatio).toBe(0);
      expect(result.overexposedRatio).toBe(1);
    });

    it('1x1 이미지를 처리한다', () => {
      const imageData = createTestImageData(1, 1, 128);
      const result = performShadowAnalysis(imageData, fullFaceRegion);

      expect(result).toBeDefined();
    });
  });

  // =========================================
  // SHADOW_THRESHOLDS 상수 테스트
  // =========================================

  describe('SHADOW_THRESHOLDS 상수', () => {
    it('임계값이 올바르게 정의되어 있다', () => {
      expect(SHADOW_THRESHOLDS.darkThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.brightThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetryWarning).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetrySevere).toBeDefined();
    });

    it('dark < bright 임계값이다', () => {
      expect(SHADOW_THRESHOLDS.darkThreshold).toBeLessThan(SHADOW_THRESHOLDS.brightThreshold);
    });

    it('warning < severe 임계값이다', () => {
      expect(SHADOW_THRESHOLDS.asymmetryWarning).toBeLessThan(SHADOW_THRESHOLDS.asymmetrySevere);
    });
  });
});
