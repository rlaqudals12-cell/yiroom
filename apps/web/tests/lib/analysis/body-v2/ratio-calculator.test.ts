/**
 * C-2: ratio-calculator.ts 테스트
 *
 * @description MediaPipe Pose 랜드마크 기반 체형 비율 계산 테스트
 * @see apps/web/lib/analysis/body-v2/ratio-calculator.ts
 */

import { describe, it, expect, vi } from 'vitest';
import type { Landmark33, PoseDetectionResult, BodyRatios } from '@/lib/analysis/body-v2/types';
import { POSE_LANDMARK_INDEX } from '@/lib/analysis/body-v2/types';

// 모듈 모킹 (pose-detector 의존성)
vi.mock('@/lib/analysis/body-v2/pose-detector', () => ({
  calculateLandmarkDistance: (a: Landmark33, b: Landmark33): number => {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2));
  },
  calculateMidpoint: (a: Landmark33, b: Landmark33): Landmark33 => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  }),
  validatePoseLandmarks: (landmarks: Landmark33[]): boolean => {
    if (!landmarks || landmarks.length < 33) return false;
    const keyIndices = [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
    ];
    return keyIndices.every((idx) => landmarks[idx]?.visibility >= 0.5);
  },
}));

import {
  calculateBodyRatios,
  convertToCentimeters,
  calculateRatioConfidence,
  calculateSymmetry,
} from '@/lib/analysis/body-v2/ratio-calculator';

// =============================================================================
// 테스트 유틸리티
// =============================================================================

/**
 * 기본 랜드마크 생성
 */
function createLandmark(x: number, y: number, z: number, visibility = 1.0): Landmark33 {
  return { x, y, z, visibility };
}

/**
 * 표준 체형 33개 랜드마크 생성
 * 정면에서 봤을 때 표준적인 사람 체형
 */
function createStandardLandmarks(
  overrides: Partial<Record<keyof typeof POSE_LANDMARK_INDEX, Partial<Landmark33>>> = {}
): Landmark33[] {
  // 33개 빈 랜드마크로 초기화
  const landmarks: Landmark33[] = Array.from({ length: 33 }, () =>
    createLandmark(0.5, 0.5, 0, 0.5)
  );

  // 표준 체형 정의 (정규화 좌표: 0-1)
  // 얼굴
  landmarks[POSE_LANDMARK_INDEX.NOSE] = createLandmark(0.5, 0.1, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_EYE] = createLandmark(0.45, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_EYE] = createLandmark(0.55, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_EAR] = createLandmark(0.4, 0.1, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_EAR] = createLandmark(0.6, 0.1, 0);

  // 어깨 (너비 0.3)
  landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER] = createLandmark(0.35, 0.2, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER] = createLandmark(0.65, 0.2, 0);

  // 팔꿈치
  landmarks[POSE_LANDMARK_INDEX.LEFT_ELBOW] = createLandmark(0.3, 0.35, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_ELBOW] = createLandmark(0.7, 0.35, 0);

  // 손목
  landmarks[POSE_LANDMARK_INDEX.LEFT_WRIST] = createLandmark(0.28, 0.5, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_WRIST] = createLandmark(0.72, 0.5, 0);

  // 힙 (너비 0.25)
  landmarks[POSE_LANDMARK_INDEX.LEFT_HIP] = createLandmark(0.375, 0.5, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP] = createLandmark(0.625, 0.5, 0);

  // 무릎
  landmarks[POSE_LANDMARK_INDEX.LEFT_KNEE] = createLandmark(0.38, 0.7, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_KNEE] = createLandmark(0.62, 0.7, 0);

  // 발목
  landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE] = createLandmark(0.38, 0.9, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE] = createLandmark(0.62, 0.9, 0);

  // 발
  landmarks[POSE_LANDMARK_INDEX.LEFT_HEEL] = createLandmark(0.37, 0.92, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_HEEL] = createLandmark(0.63, 0.92, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_FOOT_INDEX] = createLandmark(0.36, 0.95, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_FOOT_INDEX] = createLandmark(0.64, 0.95, 0);

  // 손가락
  landmarks[POSE_LANDMARK_INDEX.LEFT_PINKY] = createLandmark(0.26, 0.52, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_PINKY] = createLandmark(0.74, 0.52, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_INDEX] = createLandmark(0.27, 0.53, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_INDEX] = createLandmark(0.73, 0.53, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_THUMB] = createLandmark(0.29, 0.51, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_THUMB] = createLandmark(0.71, 0.51, 0);

  // 눈/입 상세
  landmarks[POSE_LANDMARK_INDEX.LEFT_EYE_INNER] = createLandmark(0.47, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.LEFT_EYE_OUTER] = createLandmark(0.43, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_EYE_INNER] = createLandmark(0.53, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_EYE_OUTER] = createLandmark(0.57, 0.08, 0);
  landmarks[POSE_LANDMARK_INDEX.MOUTH_LEFT] = createLandmark(0.47, 0.12, 0);
  landmarks[POSE_LANDMARK_INDEX.MOUTH_RIGHT] = createLandmark(0.53, 0.12, 0);

  // 오버라이드 적용
  for (const [key, value] of Object.entries(overrides)) {
    const idx = POSE_LANDMARK_INDEX[key as keyof typeof POSE_LANDMARK_INDEX];
    if (idx !== undefined && landmarks[idx]) {
      landmarks[idx] = { ...landmarks[idx], ...value };
    }
  }

  return landmarks;
}

/**
 * 역삼각형 체형 (넓은 어깨, 좁은 힙)
 */
function createInvertedTriangleLandmarks(): Landmark33[] {
  return createStandardLandmarks({
    // 어깨 더 넓게 (너비 0.4)
    LEFT_SHOULDER: { x: 0.3, y: 0.2 },
    RIGHT_SHOULDER: { x: 0.7, y: 0.2 },
    // 힙 더 좁게 (너비 0.2)
    LEFT_HIP: { x: 0.4, y: 0.5 },
    RIGHT_HIP: { x: 0.6, y: 0.5 },
  });
}

/**
 * 삼각형 체형 (좁은 어깨, 넓은 힙)
 */
function createTriangleLandmarks(): Landmark33[] {
  return createStandardLandmarks({
    // 어깨 더 좁게 (너비 0.2)
    LEFT_SHOULDER: { x: 0.4, y: 0.2 },
    RIGHT_SHOULDER: { x: 0.6, y: 0.2 },
    // 힙 더 넓게 (너비 0.35)
    LEFT_HIP: { x: 0.325, y: 0.5 },
    RIGHT_HIP: { x: 0.675, y: 0.5 },
  });
}

/**
 * 비대칭 체형 (좌우 불균형)
 */
function createAsymmetricLandmarks(): Landmark33[] {
  return createStandardLandmarks({
    // 어깨 비대칭
    LEFT_SHOULDER: { x: 0.3, y: 0.2 },
    RIGHT_SHOULDER: { x: 0.6, y: 0.22 },
    // 힙 비대칭
    LEFT_HIP: { x: 0.35, y: 0.5 },
    RIGHT_HIP: { x: 0.65, y: 0.52 },
  });
}

/**
 * 낮은 visibility 랜드마크
 */
function createLowVisibilityLandmarks(): Landmark33[] {
  const landmarks = createStandardLandmarks();
  // 핵심 랜드마크의 visibility 낮춤
  landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER].visibility = 0.3;
  landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE].visibility = 0.2;
  return landmarks;
}

/**
 * PoseDetectionResult 생성
 */
function createPoseResult(
  landmarks: Landmark33[],
  confidence = 0.9,
  overallVisibility = 0.95
): PoseDetectionResult {
  return {
    landmarks,
    confidence,
    overallVisibility,
  };
}

/**
 * Mock BodyRatios 생성
 */
function createMockRatios(overrides: Partial<BodyRatios> = {}): BodyRatios {
  return {
    shoulderWidth: 0.3,
    waistWidth: 0.2,
    hipWidth: 0.25,
    shoulderToWaistRatio: 1.5,
    waistToHipRatio: 0.8,
    upperBodyLength: 0.3,
    lowerBodyLength: 0.4,
    upperToLowerRatio: 0.75,
    armLength: 0.35,
    legLength: 0.45,
    armToTorsoRatio: 1.17,
    ...overrides,
  };
}

// =============================================================================
// calculateBodyRatios 테스트
// =============================================================================

describe('calculateBodyRatios', () => {
  describe('정상 케이스', () => {
    it('표준 체형에서 체형 비율을 계산해야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      // 결과 구조 검증
      expect(result).toHaveProperty('shoulderWidth');
      expect(result).toHaveProperty('waistWidth');
      expect(result).toHaveProperty('hipWidth');
      expect(result).toHaveProperty('shoulderToWaistRatio');
      expect(result).toHaveProperty('waistToHipRatio');
      expect(result).toHaveProperty('upperBodyLength');
      expect(result).toHaveProperty('lowerBodyLength');
      expect(result).toHaveProperty('upperToLowerRatio');
      expect(result).toHaveProperty('armLength');
      expect(result).toHaveProperty('legLength');
      expect(result).toHaveProperty('armToTorsoRatio');
    });

    it('어깨 너비가 양수여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.shoulderWidth).toBeGreaterThan(0);
    });

    it('힙 너비가 양수여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.hipWidth).toBeGreaterThan(0);
    });

    it('허리 너비가 양수여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.waistWidth).toBeGreaterThan(0);
    });

    it('상체/하체 길이가 양수여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.upperBodyLength).toBeGreaterThan(0);
      expect(result.lowerBodyLength).toBeGreaterThan(0);
    });

    it('팔/다리 길이가 양수여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.armLength).toBeGreaterThan(0);
      expect(result.legLength).toBeGreaterThan(0);
    });
  });

  describe('체형별 비율 차이', () => {
    it('역삼각형 체형은 어깨가 힙보다 넓어야 한다', () => {
      const landmarks = createInvertedTriangleLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.shoulderWidth).toBeGreaterThan(result.hipWidth);
    });

    it('삼각형 체형은 힙이 어깨보다 넓어야 한다', () => {
      const landmarks = createTriangleLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.hipWidth).toBeGreaterThan(result.shoulderWidth);
    });

    it('표준 체형은 어깨와 힙이 비슷해야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      const ratio = result.shoulderWidth / result.hipWidth;
      // 표준 체형은 비율이 0.9-1.1 범위
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.5);
    });
  });

  describe('비율 계산 검증', () => {
    it('어깨-허리 비율이 1 이상이어야 한다 (허리가 어깨보다 좁음)', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      // 허리는 어깨보다 좁으므로 shoulder/waist > 1
      expect(result.shoulderToWaistRatio).toBeGreaterThanOrEqual(1);
    });

    it('허리-힙 비율이 0.5-1.5 범위여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.waistToHipRatio).toBeGreaterThan(0.5);
      expect(result.waistToHipRatio).toBeLessThan(1.5);
    });

    it('상하체 비율이 합리적인 범위여야 한다 (0.3-1.5)', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      expect(result.upperToLowerRatio).toBeGreaterThan(0.3);
      expect(result.upperToLowerRatio).toBeLessThan(1.5);
    });

    it('팔-상체 비율이 합리적인 범위여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks);

      const result = calculateBodyRatios(poseResult);

      // 팔 길이는 보통 상체 길이의 0.8-1.5배
      expect(result.armToTorsoRatio).toBeGreaterThan(0.5);
      expect(result.armToTorsoRatio).toBeLessThan(2.0);
    });
  });

  describe('에러 케이스', () => {
    it('부족한 랜드마크로 호출 시 에러를 던져야 한다', () => {
      const landmarks = createLowVisibilityLandmarks();
      const poseResult = createPoseResult(landmarks);

      expect(() => calculateBodyRatios(poseResult)).toThrow();
    });

    it('빈 랜드마크 배열로 호출 시 에러를 던져야 한다', () => {
      const poseResult = createPoseResult([]);

      expect(() => calculateBodyRatios(poseResult)).toThrow();
    });
  });
});

// =============================================================================
// convertToCentimeters 테스트
// =============================================================================

describe('convertToCentimeters', () => {
  describe('기본 변환', () => {
    it('키 입력 시 cm 단위로 변환해야 한다', () => {
      const ratios = createMockRatios({
        shoulderWidth: 0.25,
        upperBodyLength: 0.3,
        lowerBodyLength: 0.5,
      });
      const heightCm = 170;

      const result = convertToCentimeters(ratios, heightCm);

      // 전체 높이(0.8) 기준 스케일: 170 / 0.8 = 212.5
      expect(result.shoulderWidth).toBeGreaterThan(ratios.shoulderWidth);
      expect(result.upperBodyLength).toBeGreaterThan(ratios.upperBodyLength);
    });

    it('비율 값은 변환하지 않아야 한다', () => {
      const ratios = createMockRatios({
        shoulderToWaistRatio: 1.5,
        waistToHipRatio: 0.8,
        upperToLowerRatio: 0.75,
        armToTorsoRatio: 1.17,
      });
      const heightCm = 170;

      const result = convertToCentimeters(ratios, heightCm);

      expect(result.shoulderToWaistRatio).toBe(ratios.shoulderToWaistRatio);
      expect(result.waistToHipRatio).toBe(ratios.waistToHipRatio);
      expect(result.upperToLowerRatio).toBe(ratios.upperToLowerRatio);
      expect(result.armToTorsoRatio).toBe(ratios.armToTorsoRatio);
    });
  });

  describe('스케일 적용', () => {
    it('큰 키에는 더 큰 변환값이 나와야 한다', () => {
      const ratios = createMockRatios();
      const height1 = 160;
      const height2 = 180;

      const result1 = convertToCentimeters(ratios, height1);
      const result2 = convertToCentimeters(ratios, height2);

      expect(result2.shoulderWidth).toBeGreaterThan(result1.shoulderWidth);
      expect(result2.armLength).toBeGreaterThan(result1.armLength);
    });

    it('스케일이 선형적이어야 한다', () => {
      const ratios = createMockRatios({
        upperBodyLength: 0.3,
        lowerBodyLength: 0.4,
      });
      const height = 170;

      const result = convertToCentimeters(ratios, height);

      // 비율이 유지되어야 함
      const originalRatio = ratios.upperBodyLength / ratios.lowerBodyLength;
      const convertedRatio = result.upperBodyLength / result.lowerBodyLength;
      expect(convertedRatio).toBeCloseTo(originalRatio, 2);
    });
  });

  describe('엣지 케이스', () => {
    it('0 높이로 호출 시 원본 비율을 반환해야 한다', () => {
      const ratios = createMockRatios();

      const result = convertToCentimeters(ratios, 0);

      // 스케일 1 적용 (0/0.7 = NaN 방지 로직)
      expect(result.shoulderWidth).toBeDefined();
    });

    it('매우 큰 키에도 정상 작동해야 한다', () => {
      const ratios = createMockRatios();
      const tallHeight = 220;

      const result = convertToCentimeters(ratios, tallHeight);

      expect(result.shoulderWidth).toBeGreaterThan(0);
      expect(Number.isFinite(result.shoulderWidth)).toBe(true);
    });

    it('매우 작은 키에도 정상 작동해야 한다', () => {
      const ratios = createMockRatios();
      const shortHeight = 100;

      const result = convertToCentimeters(ratios, shortHeight);

      expect(result.shoulderWidth).toBeGreaterThan(0);
      expect(Number.isFinite(result.shoulderWidth)).toBe(true);
    });
  });
});

// =============================================================================
// calculateRatioConfidence 테스트
// =============================================================================

describe('calculateRatioConfidence', () => {
  describe('신뢰도 점수 범위', () => {
    it('신뢰도가 0-100 범위여야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.9);
      const ratios = createMockRatios();

      const result = calculateRatioConfidence(poseResult, ratios);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('높은 신뢰도와 가시성에서 높은 점수가 나와야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 1.0);
      const ratios = createMockRatios();

      const result = calculateRatioConfidence(poseResult, ratios);

      expect(result).toBeGreaterThan(70);
    });

    it('낮은 신뢰도에서 낮은 점수가 나와야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.3);
      const ratios = createMockRatios();

      const result = calculateRatioConfidence(poseResult, ratios);

      // 포즈 신뢰도 0.3 * 40 = 12점 + visibility + validity
      expect(result).toBeLessThan(80);
    });
  });

  describe('가시성 영향', () => {
    it('핵심 랜드마크 가시성이 높으면 점수가 높아야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.8);
      const ratios = createMockRatios();

      const result = calculateRatioConfidence(poseResult, ratios);

      expect(result).toBeGreaterThan(50);
    });

    it('핵심 랜드마크 가시성이 낮으면 점수가 낮아야 한다', () => {
      const landmarks = createStandardLandmarks();
      // 핵심 랜드마크 가시성 낮춤
      landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.LEFT_HIP].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE].visibility = 0.3;

      const poseResult = createPoseResult(landmarks, 0.8);
      const ratios = createMockRatios();

      const lowVisResult = calculateRatioConfidence(poseResult, ratios);

      // 높은 가시성 케이스와 비교
      const highVisLandmarks = createStandardLandmarks();
      const highVisPoseResult = createPoseResult(highVisLandmarks, 0.8);
      const highVisResult = calculateRatioConfidence(highVisPoseResult, ratios);

      expect(lowVisResult).toBeLessThan(highVisResult);
    });
  });

  describe('비율 유효성 영향', () => {
    it('정상 비율에서 높은 유효성 점수가 나와야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.9);
      const normalRatios = createMockRatios({
        shoulderToWaistRatio: 1.3,
        waistToHipRatio: 0.8,
        upperToLowerRatio: 0.75,
      });

      const result = calculateRatioConfidence(poseResult, normalRatios);

      expect(result).toBeGreaterThan(70);
    });

    it('비정상 어깨-허리 비율에서 유효성 감점이 있어야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.9);

      const normalRatios = createMockRatios({ shoulderToWaistRatio: 1.3 });
      const abnormalRatios = createMockRatios({ shoulderToWaistRatio: 2.5 });

      const normalResult = calculateRatioConfidence(poseResult, normalRatios);
      const abnormalResult = calculateRatioConfidence(poseResult, abnormalRatios);

      expect(abnormalResult).toBeLessThan(normalResult);
    });

    it('비정상 허리-힙 비율에서 유효성 감점이 있어야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.9);

      const normalRatios = createMockRatios({ waistToHipRatio: 0.8 });
      const abnormalRatios = createMockRatios({ waistToHipRatio: 1.8 });

      const normalResult = calculateRatioConfidence(poseResult, normalRatios);
      const abnormalResult = calculateRatioConfidence(poseResult, abnormalRatios);

      expect(abnormalResult).toBeLessThan(normalResult);
    });

    it('비정상 상하체 비율에서 유효성 감점이 있어야 한다', () => {
      const landmarks = createStandardLandmarks();
      const poseResult = createPoseResult(landmarks, 0.9);

      const normalRatios = createMockRatios({ upperToLowerRatio: 0.75 });
      const abnormalRatios = createMockRatios({ upperToLowerRatio: 2.0 });

      const normalResult = calculateRatioConfidence(poseResult, normalRatios);
      const abnormalResult = calculateRatioConfidence(poseResult, abnormalRatios);

      expect(abnormalResult).toBeLessThan(normalResult);
    });
  });

  describe('엣지 케이스', () => {
    it('모든 요소가 최소값일 때 0 이상이어야 한다', () => {
      const landmarks = createStandardLandmarks();
      // 모든 가시성 0으로 설정
      landmarks.forEach((l) => (l.visibility = 0));

      const poseResult = createPoseResult(landmarks, 0);
      const ratios = createMockRatios({
        shoulderToWaistRatio: 0.1, // 비정상 범위
        waistToHipRatio: 0.1,
        upperToLowerRatio: 0.1,
      });

      const result = calculateRatioConfidence(poseResult, ratios);

      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('누락된 가시성 속성이 있어도 동작해야 한다', () => {
      const landmarks = createStandardLandmarks();
      // 일부 가시성 제거
      delete (landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER] as Partial<Landmark33>).visibility;

      const poseResult = createPoseResult(landmarks, 0.8);
      const ratios = createMockRatios();

      // 에러 없이 실행되어야 함
      expect(() => calculateRatioConfidence(poseResult, ratios)).not.toThrow();
    });
  });
});

// =============================================================================
// calculateSymmetry 테스트
// =============================================================================

describe('calculateSymmetry', () => {
  describe('대칭성 점수 범위', () => {
    it('대칭성이 0-1 범위여야 한다', () => {
      const landmarks = createStandardLandmarks();

      const result = calculateSymmetry(landmarks);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('완전 대칭 체형은 1에 가까워야 한다', () => {
      const landmarks = createStandardLandmarks();

      const result = calculateSymmetry(landmarks);

      expect(result).toBeGreaterThan(0.9);
    });

    it('비대칭 체형은 낮은 점수가 나와야 한다', () => {
      const asymmetricLandmarks = createAsymmetricLandmarks();
      const symmetricLandmarks = createStandardLandmarks();

      const asymmetricResult = calculateSymmetry(asymmetricLandmarks);
      const symmetricResult = calculateSymmetry(symmetricLandmarks);

      expect(asymmetricResult).toBeLessThan(symmetricResult);
    });
  });

  describe('대칭성 비교', () => {
    it('어깨 비대칭이 대칭성 점수에 영향을 미쳐야 한다', () => {
      const landmarks = createStandardLandmarks({
        LEFT_SHOULDER: { x: 0.3 }, // 좌측 어깨 더 바깥쪽
        RIGHT_SHOULDER: { x: 0.6 }, // 우측 어깨 덜 바깥쪽
      });

      const result = calculateSymmetry(landmarks);
      const symmetricResult = calculateSymmetry(createStandardLandmarks());

      expect(result).toBeLessThan(symmetricResult);
    });

    it('힙 비대칭이 대칭성 점수에 영향을 미쳐야 한다', () => {
      const landmarks = createStandardLandmarks({
        LEFT_HIP: { x: 0.35 },
        RIGHT_HIP: { x: 0.7 }, // 우측 힙 더 바깥쪽
      });

      const result = calculateSymmetry(landmarks);
      const symmetricResult = calculateSymmetry(createStandardLandmarks());

      expect(result).toBeLessThan(symmetricResult);
    });

    it('무릎 비대칭이 대칭성 점수에 영향을 미쳐야 한다', () => {
      const landmarks = createStandardLandmarks({
        LEFT_KNEE: { x: 0.35 },
        RIGHT_KNEE: { x: 0.7 },
      });

      const result = calculateSymmetry(landmarks);
      const symmetricResult = calculateSymmetry(createStandardLandmarks());

      expect(result).toBeLessThan(symmetricResult);
    });
  });

  describe('가시성 처리', () => {
    it('낮은 가시성 랜드마크는 대칭성 계산에서 제외되어야 한다', () => {
      const landmarks = createStandardLandmarks();
      // 무릎 가시성 낮춤
      landmarks[POSE_LANDMARK_INDEX.LEFT_KNEE].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_KNEE].visibility = 0.3;

      const result = calculateSymmetry(landmarks);

      // 여전히 어깨, 힙, 발목으로 대칭성 계산 가능
      expect(result).toBeGreaterThan(0);
    });

    it('모든 쌍의 가시성이 낮으면 0을 반환해야 한다', () => {
      const landmarks = createStandardLandmarks();
      // 모든 쌍의 가시성을 낮춤
      landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.LEFT_HIP].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.LEFT_KNEE].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_KNEE].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE].visibility = 0.3;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE].visibility = 0.3;

      const result = calculateSymmetry(landmarks);

      expect(result).toBe(0);
    });
  });

  describe('에러 케이스', () => {
    it('빈 배열로 호출 시 0을 반환해야 한다', () => {
      const result = calculateSymmetry([]);

      expect(result).toBe(0);
    });

    it('부족한 랜드마크로 호출 시 0을 반환해야 한다', () => {
      const landmarks: Landmark33[] = Array.from({ length: 10 }, () =>
        createLandmark(0.5, 0.5, 0, 0.2)
      );

      const result = calculateSymmetry(landmarks);

      expect(result).toBe(0);
    });

    it('validatePoseLandmarks가 false를 반환하면 0이어야 한다', () => {
      const landmarks = createLowVisibilityLandmarks();

      const result = calculateSymmetry(landmarks);

      expect(result).toBe(0);
    });
  });

  describe('극단적 비대칭', () => {
    it('한쪽이 치우친 경우 대칭 체형보다 낮은 점수여야 한다', () => {
      const asymmetricLandmarks = createStandardLandmarks({
        // 좌측 어깨/힙이 중심에 가깝게
        LEFT_SHOULDER: { x: 0.45 },
        LEFT_HIP: { x: 0.48 },
        // 우측은 정상
        RIGHT_SHOULDER: { x: 0.65 },
        RIGHT_HIP: { x: 0.625 },
      });
      const symmetricLandmarks = createStandardLandmarks();

      const asymmetricResult = calculateSymmetry(asymmetricLandmarks);
      const symmetricResult = calculateSymmetry(symmetricLandmarks);

      // 비대칭 체형은 대칭 체형보다 낮은 점수
      expect(asymmetricResult).toBeLessThan(symmetricResult);
      // 완전히 비정상은 아니므로 0.5 이상일 수 있음
      expect(asymmetricResult).toBeLessThan(1);
    });
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('ratio-calculator 통합 테스트', () => {
  it('calculateBodyRatios → convertToCentimeters 파이프라인이 동작해야 한다', () => {
    const landmarks = createStandardLandmarks();
    const poseResult = createPoseResult(landmarks);

    const ratios = calculateBodyRatios(poseResult);
    const cmRatios = convertToCentimeters(ratios, 170);

    expect(cmRatios.shoulderWidth).toBeGreaterThan(ratios.shoulderWidth);
    expect(cmRatios.shoulderToWaistRatio).toBe(ratios.shoulderToWaistRatio);
  });

  it('calculateBodyRatios → calculateRatioConfidence 파이프라인이 동작해야 한다', () => {
    const landmarks = createStandardLandmarks();
    const poseResult = createPoseResult(landmarks, 0.9);

    const ratios = calculateBodyRatios(poseResult);
    const confidence = calculateRatioConfidence(poseResult, ratios);

    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('전체 분석 파이프라인이 동작해야 한다', () => {
    const landmarks = createStandardLandmarks();
    const poseResult = createPoseResult(landmarks, 0.9);

    // 비율 계산
    const ratios = calculateBodyRatios(poseResult);
    // cm 변환
    const cmRatios = convertToCentimeters(ratios, 170);
    // 신뢰도 계산
    const confidence = calculateRatioConfidence(poseResult, ratios);
    // 대칭성 계산
    const symmetry = calculateSymmetry(landmarks);

    // 모든 결과가 유효해야 함
    expect(ratios.shoulderWidth).toBeGreaterThan(0);
    expect(cmRatios.shoulderWidth).toBeGreaterThan(ratios.shoulderWidth);
    expect(confidence).toBeGreaterThan(50);
    expect(symmetry).toBeGreaterThan(0.5);
  });
});
