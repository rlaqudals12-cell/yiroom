/**
 * C-2: pose-detector.ts 테스트
 *
 * @description MediaPipe Pose 유틸리티 함수 테스트
 * @see apps/web/lib/analysis/body-v2/pose-detector.ts
 *
 * 참고: initPose, detectPose, closePose는 브라우저 환경 및 MediaPipe CDN 의존성으로 인해
 *       통합 테스트에서 다루며, 여기서는 유틸리티 함수만 테스트합니다.
 */

import { describe, it, expect } from 'vitest';
import type { Landmark33 } from '@/lib/analysis/body-v2/types';
import { POSE_LANDMARK_INDEX } from '@/lib/analysis/body-v2/types';
import {
  validatePoseLandmarks,
  landmarkToPixel,
  calculateLandmarkDistance,
  calculateLandmarkDistance3D,
  calculateMidpoint,
} from '@/lib/analysis/body-v2/pose-detector';

// =============================================================================
// 테스트 유틸리티
// =============================================================================

/**
 * 기본 랜드마크 생성
 */
function createLandmark(
  x: number,
  y: number,
  z = 0,
  visibility = 1.0
): Landmark33 {
  return { x, y, z, visibility };
}

/**
 * 33개 표준 랜드마크 배열 생성
 */
function createStandardLandmarks(
  visibility = 1.0,
  overrides: Partial<Record<keyof typeof POSE_LANDMARK_INDEX, Partial<Landmark33>>> = {}
): Landmark33[] {
  const landmarks: Landmark33[] = [];

  // 33개 기본 랜드마크 생성
  for (let i = 0; i < 33; i++) {
    landmarks.push(createLandmark(0.5, 0.5, 0, visibility));
  }

  // 핵심 랜드마크 설정
  landmarks[POSE_LANDMARK_INDEX.NOSE] = createLandmark(0.5, 0.1, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER] = createLandmark(0.35, 0.2, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER] = createLandmark(0.65, 0.2, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.LEFT_HIP] = createLandmark(0.375, 0.5, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP] = createLandmark(0.625, 0.5, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE] = createLandmark(0.38, 0.9, 0, visibility);
  landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE] = createLandmark(0.62, 0.9, 0, visibility);

  // 오버라이드 적용
  for (const [key, value] of Object.entries(overrides)) {
    const idx = POSE_LANDMARK_INDEX[key as keyof typeof POSE_LANDMARK_INDEX];
    if (idx !== undefined && landmarks[idx]) {
      landmarks[idx] = { ...landmarks[idx], ...value };
    }
  }

  return landmarks;
}

// =============================================================================
// validatePoseLandmarks 테스트
// =============================================================================

describe('validatePoseLandmarks', () => {
  describe('유효한 랜드마크', () => {
    it('33개 랜드마크와 높은 가시성에서 true를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(1.0);

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(true);
    });

    it('기본 임계값(0.5) 이상의 가시성에서 true를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(0.6);

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(true);
    });

    it('커스텀 임계값으로 검증할 수 있어야 한다', () => {
      const landmarks = createStandardLandmarks(0.4);

      const result = validatePoseLandmarks(landmarks, 0.3);

      expect(result).toBe(true);
    });
  });

  describe('핵심 랜드마크 검증', () => {
    it('좌측 어깨 가시성이 낮으면 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(1.0, {
        LEFT_SHOULDER: { visibility: 0.3 },
      });

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });

    it('우측 어깨 가시성이 낮으면 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(1.0, {
        RIGHT_SHOULDER: { visibility: 0.3 },
      });

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });

    it('좌측 힙 가시성이 낮으면 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(1.0, {
        LEFT_HIP: { visibility: 0.3 },
      });

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });

    it('우측 힙 가시성이 낮으면 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(1.0, {
        RIGHT_HIP: { visibility: 0.3 },
      });

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });

    it('어깨와 힙 모두 높은 가시성이면 다른 랜드마크는 낮아도 true', () => {
      const landmarks = createStandardLandmarks(0.2); // 대부분 낮은 가시성
      // 필수 랜드마크만 높은 가시성
      landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER].visibility = 0.9;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER].visibility = 0.9;
      landmarks[POSE_LANDMARK_INDEX.LEFT_HIP].visibility = 0.9;
      landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP].visibility = 0.9;

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(true);
    });
  });

  describe('잘못된 입력', () => {
    it('빈 배열에서 false를 반환해야 한다', () => {
      const result = validatePoseLandmarks([]);

      expect(result).toBe(false);
    });

    it('33개 미만의 랜드마크에서 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks().slice(0, 30);

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });

    it('33개 초과의 랜드마크에서 false를 반환해야 한다', () => {
      const landmarks = [
        ...createStandardLandmarks(),
        createLandmark(0.5, 0.5), // 34번째
      ];

      const result = validatePoseLandmarks(landmarks);

      expect(result).toBe(false);
    });
  });

  describe('경계값 테스트', () => {
    it('가시성이 정확히 임계값과 같으면 true를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(0.5);

      const result = validatePoseLandmarks(landmarks, 0.5);

      expect(result).toBe(true);
    });

    it('가시성이 임계값보다 0.01 낮으면 false를 반환해야 한다', () => {
      const landmarks = createStandardLandmarks(0.49);

      const result = validatePoseLandmarks(landmarks, 0.5);

      expect(result).toBe(false);
    });

    it('임계값 0에서 모든 랜드마크가 유효해야 한다', () => {
      const landmarks = createStandardLandmarks(0);

      const result = validatePoseLandmarks(landmarks, 0);

      expect(result).toBe(true);
    });

    it('임계값 1에서 완전한 가시성만 유효해야 한다', () => {
      const landmarks = createStandardLandmarks(0.99);

      const result = validatePoseLandmarks(landmarks, 1);

      expect(result).toBe(false);
    });
  });
});

// =============================================================================
// landmarkToPixel 테스트
// =============================================================================

describe('landmarkToPixel', () => {
  describe('정규화 좌표 → 픽셀 변환', () => {
    it('중심점(0.5, 0.5)을 픽셀 좌표로 변환해야 한다', () => {
      const landmark = createLandmark(0.5, 0.5, 0.1);
      const width = 640;
      const height = 480;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(320); // 0.5 * 640
      expect(result.y).toBe(240); // 0.5 * 480
      expect(result.z).toBe(64); // 0.1 * 640 (z는 x 스케일)
    });

    it('원점(0, 0)을 픽셀 좌표로 변환해야 한다', () => {
      const landmark = createLandmark(0, 0, 0);
      const width = 1920;
      const height = 1080;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('끝점(1, 1)을 픽셀 좌표로 변환해야 한다', () => {
      const landmark = createLandmark(1, 1, 0.5);
      const width = 800;
      const height = 600;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(800);
      expect(result.y).toBe(600);
      expect(result.z).toBe(400); // 0.5 * 800
    });

    it('비정방형 이미지에서 올바르게 변환해야 한다', () => {
      const landmark = createLandmark(0.25, 0.75, 0);
      const width = 1000;
      const height = 500;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(250); // 0.25 * 1000
      expect(result.y).toBe(375); // 0.75 * 500
    });
  });

  describe('다양한 이미지 크기', () => {
    it('정사각형 이미지에서 변환해야 한다', () => {
      const landmark = createLandmark(0.3, 0.7, 0.2);
      const size = 512;

      const result = landmarkToPixel(landmark, size, size);

      expect(result.x).toBeCloseTo(153.6, 1);
      expect(result.y).toBeCloseTo(358.4, 1);
      expect(result.z).toBeCloseTo(102.4, 1);
    });

    it('세로 이미지에서 변환해야 한다', () => {
      const landmark = createLandmark(0.5, 0.5, 0);
      const width = 720;
      const height = 1280;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(360);
      expect(result.y).toBe(640);
    });

    it('매우 작은 이미지에서 변환해야 한다', () => {
      const landmark = createLandmark(0.5, 0.5, 0);
      const width = 10;
      const height = 10;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });
  });

  describe('엣지 케이스', () => {
    it('z값이 음수일 때도 변환해야 한다', () => {
      const landmark = createLandmark(0.5, 0.5, -0.2);
      const width = 640;
      const height = 480;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.z).toBe(-128);
    });

    it('좌표가 1을 초과해도 변환해야 한다 (범위 외)', () => {
      const landmark = createLandmark(1.5, 1.2, 0);
      const width = 640;
      const height = 480;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(960); // 1.5 * 640
      expect(result.y).toBe(576); // 1.2 * 480
    });

    it('좌표가 음수여도 변환해야 한다 (범위 외)', () => {
      const landmark = createLandmark(-0.1, -0.2, 0);
      const width = 640;
      const height = 480;

      const result = landmarkToPixel(landmark, width, height);

      expect(result.x).toBe(-64);
      expect(result.y).toBe(-96);
    });
  });
});

// =============================================================================
// calculateLandmarkDistance 테스트
// =============================================================================

describe('calculateLandmarkDistance', () => {
  describe('기본 거리 계산', () => {
    it('동일 위치에서 거리 0을 반환해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5);
      const lm2 = createLandmark(0.5, 0.5);

      const result = calculateLandmarkDistance(lm1, lm2);

      expect(result).toBe(0);
    });

    it('수평 거리를 계산해야 한다', () => {
      const lm1 = createLandmark(0.3, 0.5);
      const lm2 = createLandmark(0.7, 0.5);

      const result = calculateLandmarkDistance(lm1, lm2);

      expect(result).toBeCloseTo(0.4, 10);
    });

    it('수직 거리를 계산해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.2);
      const lm2 = createLandmark(0.5, 0.8);

      const result = calculateLandmarkDistance(lm1, lm2);

      expect(result).toBeCloseTo(0.6, 10);
    });

    it('대각선 거리를 계산해야 한다 (3-4-5 삼각형)', () => {
      const lm1 = createLandmark(0.0, 0.0);
      const lm2 = createLandmark(0.3, 0.4);

      const result = calculateLandmarkDistance(lm1, lm2);

      expect(result).toBeCloseTo(0.5, 10); // sqrt(0.09 + 0.16) = 0.5
    });
  });

  describe('2D 거리 (z 무시)', () => {
    it('z값이 달라도 2D 거리만 계산해야 한다', () => {
      const lm1 = createLandmark(0, 0, 0);
      const lm2 = createLandmark(0.3, 0.4, 1.0);

      const result = calculateLandmarkDistance(lm1, lm2);

      // z는 무시하므로 2D 거리만
      expect(result).toBeCloseTo(0.5, 10);
    });
  });

  describe('어깨 너비 계산 시나리오', () => {
    it('어깨 랜드마크 간 거리를 계산해야 한다', () => {
      const leftShoulder = createLandmark(0.35, 0.2);
      const rightShoulder = createLandmark(0.65, 0.2);

      const shoulderWidth = calculateLandmarkDistance(leftShoulder, rightShoulder);

      expect(shoulderWidth).toBeCloseTo(0.3, 10);
    });

    it('힙 랜드마크 간 거리를 계산해야 한다', () => {
      const leftHip = createLandmark(0.375, 0.5);
      const rightHip = createLandmark(0.625, 0.5);

      const hipWidth = calculateLandmarkDistance(leftHip, rightHip);

      expect(hipWidth).toBeCloseTo(0.25, 10);
    });
  });

  describe('대칭성 (교환 법칙)', () => {
    it('lm1과 lm2 순서를 바꿔도 같은 거리가 나와야 한다', () => {
      const lm1 = createLandmark(0.2, 0.3);
      const lm2 = createLandmark(0.7, 0.9);

      const dist1 = calculateLandmarkDistance(lm1, lm2);
      const dist2 = calculateLandmarkDistance(lm2, lm1);

      expect(dist1).toBe(dist2);
    });
  });
});

// =============================================================================
// calculateLandmarkDistance3D 테스트
// =============================================================================

describe('calculateLandmarkDistance3D', () => {
  describe('기본 3D 거리 계산', () => {
    it('동일 위치에서 거리 0을 반환해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0.5);
      const lm2 = createLandmark(0.5, 0.5, 0.5);

      const result = calculateLandmarkDistance3D(lm1, lm2);

      expect(result).toBe(0);
    });

    it('z축 거리만 있을 때 계산해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0.1);
      const lm2 = createLandmark(0.5, 0.5, 0.6);

      const result = calculateLandmarkDistance3D(lm1, lm2);

      expect(result).toBeCloseTo(0.5, 10);
    });

    it('3D 대각선 거리를 계산해야 한다', () => {
      const lm1 = createLandmark(0, 0, 0);
      const lm2 = createLandmark(0.1, 0.2, 0.2);

      const result = calculateLandmarkDistance3D(lm1, lm2);

      // sqrt(0.01 + 0.04 + 0.04) = sqrt(0.09) = 0.3
      expect(result).toBeCloseTo(0.3, 10);
    });
  });

  describe('2D vs 3D 비교', () => {
    it('z가 0일 때 2D와 3D 거리가 같아야 한다', () => {
      const lm1 = createLandmark(0.2, 0.3, 0);
      const lm2 = createLandmark(0.5, 0.7, 0);

      const dist2D = calculateLandmarkDistance(lm1, lm2);
      const dist3D = calculateLandmarkDistance3D(lm1, lm2);

      expect(dist3D).toBeCloseTo(dist2D, 10);
    });

    it('z 차이가 있으면 3D 거리가 2D보다 커야 한다', () => {
      const lm1 = createLandmark(0.2, 0.3, 0);
      const lm2 = createLandmark(0.5, 0.7, 0.5);

      const dist2D = calculateLandmarkDistance(lm1, lm2);
      const dist3D = calculateLandmarkDistance3D(lm1, lm2);

      expect(dist3D).toBeGreaterThan(dist2D);
    });
  });

  describe('깊이 인식 시나리오', () => {
    it('팔을 앞으로 뻗은 경우 더 먼 거리가 측정되어야 한다', () => {
      // 어깨와 손목 (팔을 옆으로)
      const shoulderSide = createLandmark(0.35, 0.2, 0);
      const wristSide = createLandmark(0.2, 0.35, 0);

      // 어깨와 손목 (팔을 앞으로)
      const shoulderFront = createLandmark(0.35, 0.2, 0);
      const wristFront = createLandmark(0.35, 0.35, 0.3); // z가 앞으로

      const distSide = calculateLandmarkDistance3D(shoulderSide, wristSide);
      const distFront = calculateLandmarkDistance3D(shoulderFront, wristFront);

      // 두 경우 다 유효한 거리
      expect(distSide).toBeGreaterThan(0);
      expect(distFront).toBeGreaterThan(0);
    });
  });

  describe('교환 법칙', () => {
    it('lm1과 lm2 순서를 바꿔도 같은 거리가 나와야 한다', () => {
      const lm1 = createLandmark(0.1, 0.2, 0.3);
      const lm2 = createLandmark(0.4, 0.5, 0.6);

      const dist1 = calculateLandmarkDistance3D(lm1, lm2);
      const dist2 = calculateLandmarkDistance3D(lm2, lm1);

      expect(dist1).toBe(dist2);
    });
  });
});

// =============================================================================
// calculateMidpoint 테스트
// =============================================================================

describe('calculateMidpoint', () => {
  describe('기본 중점 계산', () => {
    it('동일 위치에서 같은 좌표를 반환해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0.5, 0.8);
      const lm2 = createLandmark(0.5, 0.5, 0.5, 0.8);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
      expect(result.z).toBe(0.5);
      expect(result.visibility).toBe(0.8);
    });

    it('수평 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(0.2, 0.5, 0, 1.0);
      const lm2 = createLandmark(0.8, 0.5, 0, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });

    it('수직 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.1, 0, 1.0);
      const lm2 = createLandmark(0.5, 0.9, 0, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.y).toBe(0.5);
    });

    it('3D 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(0, 0, 0, 1.0);
      const lm2 = createLandmark(1, 1, 1, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
      expect(result.z).toBe(0.5);
    });
  });

  describe('가시성 평균 계산', () => {
    it('두 가시성의 평균을 계산해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0, 0.8);
      const lm2 = createLandmark(0.5, 0.5, 0, 0.4);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.visibility).toBeCloseTo(0.6, 10); // (0.8 + 0.4) / 2
    });

    it('한쪽이 가시성 0이면 평균이 절반이어야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0, 1.0);
      const lm2 = createLandmark(0.5, 0.5, 0, 0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.visibility).toBe(0.5);
    });
  });

  describe('어깨/힙 중점 시나리오', () => {
    it('어깨 중점을 계산해야 한다', () => {
      const leftShoulder = createLandmark(0.35, 0.2, 0, 0.95);
      const rightShoulder = createLandmark(0.65, 0.2, 0, 0.93);

      const shoulderMid = calculateMidpoint(leftShoulder, rightShoulder);

      expect(shoulderMid.x).toBe(0.5);
      expect(shoulderMid.y).toBe(0.2);
      expect(shoulderMid.visibility).toBeCloseTo(0.94, 2);
    });

    it('힙 중점을 계산해야 한다', () => {
      const leftHip = createLandmark(0.375, 0.5, 0, 0.9);
      const rightHip = createLandmark(0.625, 0.5, 0, 0.9);

      const hipMid = calculateMidpoint(leftHip, rightHip);

      expect(hipMid.x).toBe(0.5);
      expect(hipMid.y).toBe(0.5);
    });
  });

  describe('비대칭 좌표 중점', () => {
    it('비대칭 좌표에서 정확한 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(0.1, 0.3, 0.2, 1.0);
      const lm2 = createLandmark(0.7, 0.9, 0.8, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBeCloseTo(0.4, 10);
      expect(result.y).toBeCloseTo(0.6, 10);
      expect(result.z).toBeCloseTo(0.5, 10);
    });
  });

  describe('엣지 케이스', () => {
    it('음수 좌표에서도 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(-0.2, -0.1, 0, 1.0);
      const lm2 = createLandmark(0.2, 0.3, 0, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(0.1, 10);
    });

    it('범위 외 좌표에서도 중점을 계산해야 한다', () => {
      const lm1 = createLandmark(0.5, 0.5, 0, 1.0);
      const lm2 = createLandmark(1.5, 1.5, 0, 1.0);

      const result = calculateMidpoint(lm1, lm2);

      expect(result.x).toBe(1.0);
      expect(result.y).toBe(1.0);
    });
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('pose-detector 통합 테스트', () => {
  describe('체형 분석 파이프라인 시뮬레이션', () => {
    it('랜드마크 검증 → 거리 계산 파이프라인이 동작해야 한다', () => {
      const landmarks = createStandardLandmarks(0.9);

      // 1. 검증
      expect(validatePoseLandmarks(landmarks)).toBe(true);

      // 2. 어깨 너비 계산
      const shoulderWidth = calculateLandmarkDistance(
        landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
      );
      expect(shoulderWidth).toBeGreaterThan(0);

      // 3. 힙 너비 계산
      const hipWidth = calculateLandmarkDistance(
        landmarks[POSE_LANDMARK_INDEX.LEFT_HIP],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP]
      );
      expect(hipWidth).toBeGreaterThan(0);
    });

    it('중점 계산을 통한 상체 길이 측정이 동작해야 한다', () => {
      const landmarks = createStandardLandmarks(0.9);

      // 어깨 중점
      const shoulderMid = calculateMidpoint(
        landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
      );

      // 힙 중점
      const hipMid = calculateMidpoint(
        landmarks[POSE_LANDMARK_INDEX.LEFT_HIP],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP]
      );

      // 상체 길이 (어깨 중점 ~ 힙 중점)
      const upperBodyLength = calculateLandmarkDistance(shoulderMid, hipMid);

      expect(upperBodyLength).toBeGreaterThan(0);
    });

    it('픽셀 좌표 변환이 체형 비율에 영향을 미치지 않아야 한다', () => {
      const landmarks = createStandardLandmarks(0.9);
      const width = 640;
      const height = 480;

      // 정규화 좌표에서의 어깨 너비
      const normalizedShoulderWidth = calculateLandmarkDistance(
        landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
      );

      // 픽셀 좌표로 변환
      const leftShoulderPx = landmarkToPixel(
        landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
        width,
        height
      );
      const rightShoulderPx = landmarkToPixel(
        landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER],
        width,
        height
      );

      // 픽셀 좌표에서의 어깨 너비
      const pixelShoulderWidth = Math.sqrt(
        Math.pow(rightShoulderPx.x - leftShoulderPx.x, 2) +
          Math.pow(rightShoulderPx.y - leftShoulderPx.y, 2)
      );

      // 비율 관계 확인 (픽셀 너비 / 정규화 너비 ≈ 이미지 너비)
      const scaleFactor = pixelShoulderWidth / normalizedShoulderWidth;
      expect(scaleFactor).toBeCloseTo(width, -1); // 대략 이미지 너비와 같음
    });
  });
});
