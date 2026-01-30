/**
 * CIE-1: 이미지 품질 종합 검증 테스트
 *
 * @module tests/lib/image-engine/cie-1/quality-validator
 */
import { describe, it, expect, vi } from 'vitest';
import {
  validateImageQuality,
  calculateOverallScore,
  calculateOverallConfidence,
  isAcceptable,
  determinePrimaryIssue,
  collectAllIssues,
} from '@/lib/image-engine/cie-1/quality-validator';
import type {
  RGBImageData,
  SharpnessResult,
  ExposureResult,
  CCTResult,
  ResolutionResult,
} from '@/lib/image-engine/types';

// Mock 결과 생성 헬퍼
function createMockSharpness(overrides: Partial<SharpnessResult> = {}): SharpnessResult {
  return {
    score: 75,
    laplacianVariance: 200,
    verdict: 'acceptable',
    feedback: '선명도가 적절합니다.',
    ...overrides,
  };
}

function createMockExposure(overrides: Partial<ExposureResult> = {}): ExposureResult {
  return {
    meanBrightness: 130,
    verdict: 'normal',
    confidence: 0.85,
    feedback: '노출이 적절합니다.',
    ...overrides,
  };
}

function createMockCCT(overrides: Partial<CCTResult> = {}): CCTResult {
  return {
    kelvin: 6500,
    verdict: 'neutral',
    chromaticity: { x: 0.31, y: 0.32 },
    confidence: 0.9,
    feedback: '색온도가 자연광에 가깝습니다.',
    ...overrides,
  };
}

function createMockResolution(overrides: Partial<ResolutionResult> = {}): ResolutionResult {
  return {
    width: 1024,
    height: 768,
    pixelCount: 1024 * 768,
    isValid: true,
    feedback: null,
    ...overrides,
  };
}

// 테스트용 이미지 데이터 생성 헬퍼
function createMockImageData(
  width: number = 640,
  height: number = 480,
  brightness: number = 128
): RGBImageData {
  const pixelCount = width * height;
  const data = new Uint8Array(pixelCount * 3);

  // 균일한 밝기로 채우기
  for (let i = 0; i < pixelCount; i++) {
    data[i * 3] = brightness; // R
    data[i * 3 + 1] = brightness; // G
    data[i * 3 + 2] = brightness; // B
  }

  return { data, width, height, channels: 3 };
}

describe('calculateOverallScore', () => {
  describe('모든 요소가 최적일 때', () => {
    it('높은 종합 점수를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ score: 90 });
      const exposure = createMockExposure({ meanBrightness: 135, verdict: 'normal' });
      const cct = createMockCCT({ kelvin: 6500 });
      const resolution = createMockResolution({ isValid: true });

      const score = calculateOverallScore(sharpness, exposure, cct, resolution);

      expect(score).toBeGreaterThan(80);
    });
  });

  describe('선명도가 낮을 때', () => {
    it('선명도 가중치(30%)만큼 점수가 낮아져야 한다', () => {
      const optimalSharpness = createMockSharpness({ score: 90 });
      const lowSharpness = createMockSharpness({ score: 30 });
      const exposure = createMockExposure();
      const cct = createMockCCT();
      const resolution = createMockResolution();

      const optimalScore = calculateOverallScore(optimalSharpness, exposure, cct, resolution);
      const lowScore = calculateOverallScore(lowSharpness, exposure, cct, resolution);

      // 선명도 30% 가중치 적용 확인
      expect(optimalScore - lowScore).toBeGreaterThan(15);
    });
  });

  describe('노출이 비정상일 때', () => {
    it('과노출이면 점수가 낮아져야 한다', () => {
      const sharpness = createMockSharpness();
      const normalExposure = createMockExposure({ meanBrightness: 135, verdict: 'normal' });
      const overExposure = createMockExposure({ meanBrightness: 220, verdict: 'overexposed' });
      const cct = createMockCCT();
      const resolution = createMockResolution();

      const normalScore = calculateOverallScore(sharpness, normalExposure, cct, resolution);
      const overScore = calculateOverallScore(sharpness, overExposure, cct, resolution);

      expect(normalScore).toBeGreaterThan(overScore);
    });

    it('저노출이면 점수가 낮아져야 한다', () => {
      const sharpness = createMockSharpness();
      const normalExposure = createMockExposure({ meanBrightness: 135, verdict: 'normal' });
      const underExposure = createMockExposure({ meanBrightness: 40, verdict: 'underexposed' });
      const cct = createMockCCT();
      const resolution = createMockResolution();

      const normalScore = calculateOverallScore(sharpness, normalExposure, cct, resolution);
      const underScore = calculateOverallScore(sharpness, underExposure, cct, resolution);

      expect(normalScore).toBeGreaterThan(underScore);
    });
  });

  describe('색온도가 비정상일 때', () => {
    it('너무 따뜻한 색온도면 점수가 낮아져야 한다', () => {
      const sharpness = createMockSharpness();
      const exposure = createMockExposure();
      const neutralCCT = createMockCCT({ kelvin: 6500 });
      const warmCCT = createMockCCT({ kelvin: 3000 });
      const resolution = createMockResolution();

      const neutralScore = calculateOverallScore(sharpness, exposure, neutralCCT, resolution);
      const warmScore = calculateOverallScore(sharpness, exposure, warmCCT, resolution);

      expect(neutralScore).toBeGreaterThan(warmScore);
    });
  });

  describe('해상도가 유효하지 않을 때', () => {
    it('해상도가 유효하지 않으면 점수가 낮아져야 한다', () => {
      const sharpness = createMockSharpness();
      const exposure = createMockExposure();
      const cct = createMockCCT();
      const validResolution = createMockResolution({ isValid: true });
      const invalidResolution = createMockResolution({ isValid: false });

      const validScore = calculateOverallScore(sharpness, exposure, cct, validResolution);
      const invalidScore = calculateOverallScore(sharpness, exposure, cct, invalidResolution);

      expect(validScore).toBeGreaterThan(invalidScore);
    });

    it('해상도가 null이면 검증을 스킵해야 한다', () => {
      const sharpness = createMockSharpness();
      const exposure = createMockExposure();
      const cct = createMockCCT();

      const score = calculateOverallScore(sharpness, exposure, cct, null);

      expect(score).toBeGreaterThan(0);
    });
  });
});

describe('calculateOverallConfidence', () => {
  it('노출과 CCT 신뢰도의 평균을 반환해야 한다', () => {
    const exposure = createMockExposure({ confidence: 0.8 });
    const cct = createMockCCT({ confidence: 0.9 });

    const confidence = calculateOverallConfidence(exposure, cct);

    expect(confidence).toBeCloseTo(0.85, 5);
  });

  it('신뢰도가 낮으면 낮은 값을 반환해야 한다', () => {
    const exposure = createMockExposure({ confidence: 0.3 });
    const cct = createMockCCT({ confidence: 0.4 });

    const confidence = calculateOverallConfidence(exposure, cct);

    expect(confidence).toBe(0.35);
  });
});

describe('isAcceptable', () => {
  describe('수용 가능한 경우', () => {
    it('모든 조건을 만족하면 true를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'acceptable' });
      const exposure = createMockExposure({ meanBrightness: 130 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(true);
    });

    it('optimal 선명도도 수용 가능해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'optimal' });
      const exposure = createMockExposure({ meanBrightness: 130 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(true);
    });

    it('warning 선명도도 수용 가능해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'warning' });
      const exposure = createMockExposure({ meanBrightness: 130 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(true);
    });
  });

  describe('수용 불가능한 경우', () => {
    it('선명도가 rejected면 false를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'rejected' });
      const exposure = createMockExposure({ meanBrightness: 130 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });

    it('해상도가 유효하지 않으면 false를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'acceptable' });
      const exposure = createMockExposure({ meanBrightness: 130 });
      const resolution = createMockResolution({ isValid: false });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });

    it('극단적 저노출이면 false를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'acceptable' });
      const exposure = createMockExposure({ meanBrightness: 30 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });

    it('극단적 과노출이면 false를 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'acceptable' });
      const exposure = createMockExposure({ meanBrightness: 230 });
      const resolution = createMockResolution({ isValid: true });

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });
  });

  describe('해상도가 null인 경우', () => {
    it('해상도 null은 검증을 스킵해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'acceptable' });
      const exposure = createMockExposure({ meanBrightness: 130 });

      expect(isAcceptable(sharpness, exposure, null)).toBe(true);
    });
  });
});

describe('determinePrimaryIssue', () => {
  describe('이슈가 없는 경우', () => {
    it('모든 것이 정상이면 null을 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'optimal' });
      const exposure = createMockExposure({ verdict: 'normal' });
      const cct = createMockCCT({ verdict: 'neutral' });
      const resolution = createMockResolution({ isValid: true });

      const issue = determinePrimaryIssue(sharpness, exposure, cct, resolution);

      expect(issue).toBeNull();
    });
  });

  describe('우선순위에 따른 이슈 반환', () => {
    it('해상도 이슈가 최우선이어야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'rejected', feedback: '흐린 이미지' });
      const exposure = createMockExposure({ verdict: 'overexposed', feedback: '과노출' });
      const cct = createMockCCT({ verdict: 'too_warm', feedback: '너무 따뜻함' });
      const resolution = createMockResolution({
        isValid: false,
        feedback: '해상도가 너무 낮습니다.',
      });

      const issue = determinePrimaryIssue(sharpness, exposure, cct, resolution);

      expect(issue).toBe('해상도가 너무 낮습니다.');
    });

    it('선명도 이슈가 두 번째 우선순위여야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'rejected', feedback: '흐린 이미지' });
      const exposure = createMockExposure({ verdict: 'overexposed', feedback: '과노출' });
      const cct = createMockCCT({ verdict: 'too_warm', feedback: '너무 따뜻함' });
      const resolution = createMockResolution({ isValid: true });

      const issue = determinePrimaryIssue(sharpness, exposure, cct, resolution);

      expect(issue).toBe('흐린 이미지');
    });

    it('노출 이슈가 세 번째 우선순위여야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'optimal' });
      const exposure = createMockExposure({ verdict: 'overexposed', feedback: '과노출' });
      const cct = createMockCCT({ verdict: 'too_warm', feedback: '너무 따뜻함' });
      const resolution = createMockResolution({ isValid: true });

      const issue = determinePrimaryIssue(sharpness, exposure, cct, resolution);

      expect(issue).toBe('과노출');
    });

    it('색온도 이슈가 마지막 우선순위여야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'optimal' });
      const exposure = createMockExposure({ verdict: 'normal' });
      const cct = createMockCCT({ verdict: 'too_warm', feedback: '너무 따뜻함' });
      const resolution = createMockResolution({ isValid: true });

      const issue = determinePrimaryIssue(sharpness, exposure, cct, resolution);

      expect(issue).toBe('너무 따뜻함');
    });
  });
});

describe('collectAllIssues', () => {
  describe('이슈가 없는 경우', () => {
    it('빈 배열을 반환해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'optimal' });
      const exposure = createMockExposure({ verdict: 'normal' });
      const cct = createMockCCT({ verdict: 'neutral' });
      const resolution = createMockResolution({ isValid: true });

      const issues = collectAllIssues(sharpness, exposure, cct, resolution);

      expect(issues).toHaveLength(0);
    });
  });

  describe('여러 이슈가 있는 경우', () => {
    it('모든 이슈를 수집해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'warning', feedback: '약간 흐림' });
      const exposure = createMockExposure({ verdict: 'underexposed', feedback: '저노출' });
      const cct = createMockCCT({ verdict: 'warm', feedback: '따뜻한 조명' });
      const resolution = createMockResolution({
        isValid: false,
        feedback: '해상도 부족',
      });

      const issues = collectAllIssues(sharpness, exposure, cct, resolution);

      expect(issues).toHaveLength(4);
      expect(issues).toContain('해상도 부족');
      expect(issues).toContain('약간 흐림');
      expect(issues).toContain('저노출');
      expect(issues).toContain('따뜻한 조명');
    });

    it('rejected 선명도도 이슈로 포함해야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'rejected', feedback: '매우 흐림' });
      const exposure = createMockExposure({ verdict: 'normal' });
      const cct = createMockCCT({ verdict: 'neutral' });
      const resolution = createMockResolution({ isValid: true });

      const issues = collectAllIssues(sharpness, exposure, cct, resolution);

      expect(issues).toContain('매우 흐림');
    });
  });

  describe('해상도가 null인 경우', () => {
    it('해상도 이슈를 포함하지 않아야 한다', () => {
      const sharpness = createMockSharpness({ verdict: 'warning', feedback: '약간 흐림' });
      const exposure = createMockExposure({ verdict: 'normal' });
      const cct = createMockCCT({ verdict: 'neutral' });

      const issues = collectAllIssues(sharpness, exposure, cct, null);

      expect(issues).toHaveLength(1);
      expect(issues).toContain('약간 흐림');
    });
  });
});

describe('validateImageQuality', () => {
  describe('정상 이미지', () => {
    it('유효한 결과를 반환해야 한다', () => {
      // 균일한 중간 밝기 이미지
      const imageData = createMockImageData(640, 480, 128);

      const result = validateImageQuality(imageData);

      expect(result).toBeDefined();
      expect(result.sharpness).toBeDefined();
      expect(result.exposure).toBeDefined();
      expect(result.colorTemperature).toBeDefined();
      expect(result.resolution).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.isAcceptable).toBe('boolean');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('해상도 검증 스킵 옵션이 작동해야 한다', () => {
      const imageData = createMockImageData(640, 480, 128);

      const result = validateImageQuality(imageData, undefined, true);

      expect(result.resolution).toBeNull();
    });
  });

  describe('에러 처리', () => {
    it('빈 이미지 데이터도 처리해야 한다', () => {
      const emptyImageData: RGBImageData = {
        data: new Uint8Array(0),
        width: 0,
        height: 0,
        channels: 3,
      };

      // 에러가 발생해도 fallback을 반환해야 함
      const result = validateImageQuality(emptyImageData);

      expect(result).toBeDefined();
    });
  });

  describe('결과 구조', () => {
    it('CIE1Output 형식을 따라야 한다', () => {
      const imageData = createMockImageData(640, 480, 128);

      const result = validateImageQuality(imageData);

      // 필수 필드 확인
      expect(result).toHaveProperty('isAcceptable');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sharpness');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('colorTemperature');
      expect(result).toHaveProperty('primaryIssue');
      expect(result).toHaveProperty('allIssues');
      expect(result).toHaveProperty('processingTime');
    });
  });
});
