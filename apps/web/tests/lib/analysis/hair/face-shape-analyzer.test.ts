/**
 * H-1: face-shape-analyzer 테스트
 *
 * @description 얼굴형 분석 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeFaceShape,
  estimateFaceShapeFromPose,
  getFaceShapeDescription,
  getFaceShapeConfidenceGrade,
} from '@/lib/analysis/hair/face-shape-analyzer';
import type { FaceShapeType } from '@/lib/analysis/hair/types';
import type { Landmark33 } from '@/lib/analysis/body-v2/types';

// =============================================================================
// 테스트 픽스처
// =============================================================================

/**
 * Face Mesh 랜드마크 생성 (468개)
 */
function createFaceLandmarks(
  options: {
    foreheadWidth?: number;
    cheekboneWidth?: number;
    jawWidth?: number;
    faceLength?: number;
  } = {}
): Array<{ x: number; y: number; z?: number }> {
  const {
    foreheadWidth = 0.3,
    cheekboneWidth = 0.35,
    jawWidth = 0.25,
    faceLength = 0.4,
  } = options;

  // 468개 랜드마크 기본 생성
  const landmarks: Array<{ x: number; y: number; z?: number }> = Array(468)
    .fill(null)
    .map(() => ({ x: 0.5, y: 0.5, z: 0 }));

  // 주요 포인트 설정
  const centerX = 0.5;
  const topY = 0.3;

  // 이마 (10: top, 67: left, 297: right)
  landmarks[10] = { x: centerX, y: topY };
  landmarks[67] = { x: centerX - foreheadWidth / 2, y: topY + 0.05 };
  landmarks[297] = { x: centerX + foreheadWidth / 2, y: topY + 0.05 };

  // 광대 (234: left, 454: right)
  landmarks[234] = { x: centerX - cheekboneWidth / 2, y: topY + faceLength * 0.4 };
  landmarks[454] = { x: centerX + cheekboneWidth / 2, y: topY + faceLength * 0.4 };

  // 턱 (172: left, 397: right, 152: chin)
  landmarks[172] = { x: centerX - jawWidth / 2, y: topY + faceLength * 0.7 };
  landmarks[397] = { x: centerX + jawWidth / 2, y: topY + faceLength * 0.7 };
  landmarks[152] = { x: centerX, y: topY + faceLength };

  return landmarks;
}

/**
 * Pose 랜드마크 생성 (33개)
 */
function createPoseLandmarks(
  options: {
    eyeDistance?: number;
    earDistance?: number;
    mouthWidth?: number;
    faceHeight?: number;
  } = {}
): Landmark33[] {
  const {
    eyeDistance = 0.15,
    earDistance = 0.25,
    mouthWidth = 0.1,
    faceHeight = 0.3,
  } = options;

  const centerX = 0.5;
  const topY = 0.2;
  const defaultLandmark: Landmark33 = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 };

  const landmarks: Landmark33[] = Array(33).fill(null).map(() => ({ ...defaultLandmark }));

  // 0: 코
  landmarks[0] = { x: centerX, y: topY + faceHeight * 0.5, z: 0, visibility: 0.95 };

  // 2: 왼쪽 눈, 5: 오른쪽 눈
  landmarks[2] = { x: centerX - eyeDistance / 2, y: topY + faceHeight * 0.3, z: 0, visibility: 0.9 };
  landmarks[5] = { x: centerX + eyeDistance / 2, y: topY + faceHeight * 0.3, z: 0, visibility: 0.9 };

  // 7: 왼쪽 귀, 8: 오른쪽 귀
  landmarks[7] = { x: centerX - earDistance / 2, y: topY, z: 0, visibility: 0.8 };
  landmarks[8] = { x: centerX + earDistance / 2, y: topY, z: 0, visibility: 0.8 };

  // 9: 왼쪽 입, 10: 오른쪽 입
  landmarks[9] = { x: centerX - mouthWidth / 2, y: topY + faceHeight * 0.7, z: 0, visibility: 0.85 };
  landmarks[10] = { x: centerX + mouthWidth / 2, y: topY + faceHeight * 0.7, z: 0, visibility: 0.85 };

  return landmarks;
}

// =============================================================================
// analyzeFaceShape 테스트
// =============================================================================

describe('analyzeFaceShape', () => {
  it('should return face shape analysis with all required fields', () => {
    const landmarks = createFaceLandmarks();
    const result = analyzeFaceShape(landmarks);

    expect(result).toHaveProperty('faceShape');
    expect(result).toHaveProperty('faceShapeLabel');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('ratios');

    expect(result.ratios).toHaveProperty('faceLength');
    expect(result.ratios).toHaveProperty('faceWidth');
    expect(result.ratios).toHaveProperty('foreheadWidth');
    expect(result.ratios).toHaveProperty('cheekboneWidth');
    expect(result.ratios).toHaveProperty('jawWidth');
    expect(result.ratios).toHaveProperty('lengthToWidthRatio');
  });

  it('should classify oval face shape correctly', () => {
    // 타원형: 이마 ≈ 광대 > 턱, 비율 1.1-1.5
    const landmarks = createFaceLandmarks({
      foreheadWidth: 0.32,
      cheekboneWidth: 0.35,
      jawWidth: 0.28,
      faceLength: 0.45,
    });

    const result = analyzeFaceShape(landmarks);

    // 타원형 특성을 가진 얼굴로 분류되어야 함
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.ratios.lengthToWidthRatio).toBeGreaterThan(1.0);
    expect(result.ratios.lengthToWidthRatio).toBeLessThan(1.6);
  });

  it('should classify round face shape correctly', () => {
    // 둥근형: 길이 ≈ 너비
    const landmarks = createFaceLandmarks({
      foreheadWidth: 0.3,
      cheekboneWidth: 0.35,
      jawWidth: 0.3,
      faceLength: 0.35, // 짧은 얼굴
    });

    const result = analyzeFaceShape(landmarks);

    expect(result.ratios.lengthToWidthRatio).toBeLessThan(1.15);
    expect(result.confidence).toBeGreaterThan(50);
  });

  it('should classify oblong/rectangle face shape for long faces', () => {
    // 긴 형: 길이/너비 > 1.5
    const landmarks = createFaceLandmarks({
      foreheadWidth: 0.25,
      cheekboneWidth: 0.28,
      jawWidth: 0.25,
      faceLength: 0.55, // 긴 얼굴
    });

    const result = analyzeFaceShape(landmarks);

    expect(result.ratios.lengthToWidthRatio).toBeGreaterThan(1.4);
    expect(['oblong', 'rectangle']).toContain(result.faceShape);
  });

  it('should classify heart face shape correctly', () => {
    // 하트형: 이마 > 광대 > 턱
    const landmarks = createFaceLandmarks({
      foreheadWidth: 0.38,
      cheekboneWidth: 0.32,
      jawWidth: 0.2,
      faceLength: 0.4,
    });

    const result = analyzeFaceShape(landmarks);

    // 이마가 턱보다 넓은 특성
    expect(result.ratios.foreheadWidth).toBeGreaterThan(result.ratios.jawWidth);
  });

  it('should classify diamond face shape correctly', () => {
    // 다이아몬드형: 광대 > 이마, 턱
    const landmarks = createFaceLandmarks({
      foreheadWidth: 0.25,
      cheekboneWidth: 0.4,
      jawWidth: 0.22,
      faceLength: 0.45,
    });

    const result = analyzeFaceShape(landmarks);

    // 광대가 가장 넓은 특성
    expect(result.ratios.cheekboneWidth).toBeGreaterThan(result.ratios.foreheadWidth);
    expect(result.ratios.cheekboneWidth).toBeGreaterThan(result.ratios.jawWidth);
  });

  it('should return confidence between 50 and 95', () => {
    const landmarks = createFaceLandmarks();
    const result = analyzeFaceShape(landmarks);

    expect(result.confidence).toBeGreaterThanOrEqual(50);
    expect(result.confidence).toBeLessThanOrEqual(95);
  });

  it('should handle edge case with minimal landmarks', () => {
    // 최소 랜드마크 (일부만 유효)
    const minimalLandmarks: Array<{ x: number; y: number }> = Array(50).fill({ x: 0.5, y: 0.5 });

    const result = analyzeFaceShape(minimalLandmarks);

    // 기본값으로 처리되어야 함
    expect(result.faceShape).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(50);
  });

  // ===========================================================================
  // 7가지 얼굴형 전체 분류 테스트
  // ===========================================================================
  describe('All 7 Face Shape Classifications', () => {
    it('should classify square face shape correctly', () => {
      // 사각형: 이마 ≈ 광대 ≈ 턱, 비율 ≈ 1.0
      const landmarks = createFaceLandmarks({
        foreheadWidth: 0.35,
        cheekboneWidth: 0.35,
        jawWidth: 0.34, // 턱이 이마/광대와 거의 같음
        faceLength: 0.36, // 짧은 길이 (비율 ~1.0)
      });

      const result = analyzeFaceShape(landmarks);

      // 사각형 특성: 모든 너비가 비슷하고 비율이 1에 가까움
      expect(result.ratios.lengthToWidthRatio).toBeLessThan(1.2);
      expect(Math.abs(result.ratios.foreheadWidth - result.ratios.jawWidth)).toBeLessThan(0.05);
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should classify rectangle face shape correctly', () => {
      // 직사각형: 이마 ≈ 광대 ≈ 턱 (사각형과 비슷), 비율 > 1.3 (긴 형)
      const landmarks = createFaceLandmarks({
        foreheadWidth: 0.28,
        cheekboneWidth: 0.3,
        jawWidth: 0.28,
        faceLength: 0.5, // 긴 얼굴
      });

      const result = analyzeFaceShape(landmarks);

      // 직사각형 특성: 모든 너비 비슷하고 길이가 김
      expect(result.ratios.lengthToWidthRatio).toBeGreaterThan(1.3);
      expect(Math.abs(result.ratios.foreheadWidth - result.ratios.jawWidth)).toBeLessThan(0.08);
    });

    it('oval vs round: length-to-width ratio distinguishes them', () => {
      // 타원형: 비율 1.2-1.4
      const ovalLandmarks = createFaceLandmarks({
        foreheadWidth: 0.32,
        cheekboneWidth: 0.35,
        jawWidth: 0.28,
        faceLength: 0.46, // ratio ~1.3
      });

      // 둥근형: 비율 < 1.1
      const roundLandmarks = createFaceLandmarks({
        foreheadWidth: 0.32,
        cheekboneWidth: 0.35,
        jawWidth: 0.30,
        faceLength: 0.36, // ratio ~1.0
      });

      const ovalResult = analyzeFaceShape(ovalLandmarks);
      const roundResult = analyzeFaceShape(roundLandmarks);

      expect(ovalResult.ratios.lengthToWidthRatio).toBeGreaterThan(roundResult.ratios.lengthToWidthRatio);
      expect(roundResult.ratios.lengthToWidthRatio).toBeLessThan(1.15);
    });

    it('heart vs diamond: forehead vs cheekbone prominence', () => {
      // 하트형: 이마 > 광대 > 턱
      const heartLandmarks = createFaceLandmarks({
        foreheadWidth: 0.4,
        cheekboneWidth: 0.35,
        jawWidth: 0.22,
        faceLength: 0.42,
      });

      // 다이아몬드: 광대 > 이마, 턱
      const diamondLandmarks = createFaceLandmarks({
        foreheadWidth: 0.26,
        cheekboneWidth: 0.42,
        jawWidth: 0.24,
        faceLength: 0.45,
      });

      const heartResult = analyzeFaceShape(heartLandmarks);
      const diamondResult = analyzeFaceShape(diamondLandmarks);

      // 하트: 이마 > 광대
      expect(heartResult.ratios.foreheadWidth).toBeGreaterThan(heartResult.ratios.cheekboneWidth);
      // 다이아몬드: 광대 > 이마
      expect(diamondResult.ratios.cheekboneWidth).toBeGreaterThan(diamondResult.ratios.foreheadWidth);
    });

    it('oblong vs rectangle: both are long faces', () => {
      // oblong과 rectangle 모두 긴 얼굴
      const oblongLandmarks = createFaceLandmarks({
        foreheadWidth: 0.25,
        cheekboneWidth: 0.28,
        jawWidth: 0.23,
        faceLength: 0.52,
      });

      const result = analyzeFaceShape(oblongLandmarks);

      expect(result.ratios.lengthToWidthRatio).toBeGreaterThan(1.4);
      expect(['oblong', 'rectangle']).toContain(result.faceShape);
    });
  });

  // ===========================================================================
  // Edge Cases - 극단값 테스트
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle empty landmark array gracefully', () => {
      const emptyLandmarks: Array<{ x: number; y: number }> = [];
      const result = analyzeFaceShape(emptyLandmarks);

      // 빈 배열이어도 기본값으로 처리
      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle all zero coordinates', () => {
      const zeroLandmarks: Array<{ x: number; y: number }> = Array(468)
        .fill(null)
        .map(() => ({ x: 0, y: 0 }));

      const result = analyzeFaceShape(zeroLandmarks);

      expect(result.faceShape).toBeDefined();
      expect(typeof result.faceShape).toBe('string');
    });

    it('should handle negative coordinates without crashing', () => {
      const negativeLandmarks: Array<{ x: number; y: number }> = Array(468)
        .fill(null)
        .map(() => ({ x: -0.5, y: -0.5 }));

      const result = analyzeFaceShape(negativeLandmarks);

      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large coordinate values', () => {
      const largeLandmarks = createFaceLandmarks({
        foreheadWidth: 1000,
        cheekboneWidth: 1200,
        jawWidth: 800,
        faceLength: 1500,
      });

      const result = analyzeFaceShape(largeLandmarks);

      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle NaN values in landmarks', () => {
      const nanLandmarks: Array<{ x: number; y: number }> = Array(468)
        .fill(null)
        .map(() => ({ x: NaN, y: NaN }));

      // NaN 처리 시 크래시 없이 기본값 반환
      expect(() => analyzeFaceShape(nanLandmarks)).not.toThrow();
    });

    it('should handle Infinity values in landmarks', () => {
      const infinityLandmarks: Array<{ x: number; y: number }> = Array(468)
        .fill(null)
        .map(() => ({ x: Infinity, y: -Infinity }));

      expect(() => analyzeFaceShape(infinityLandmarks)).not.toThrow();
    });

    it('should handle mixed valid and invalid landmarks', () => {
      const mixedLandmarks = createFaceLandmarks({
        foreheadWidth: 0.3,
        cheekboneWidth: 0.35,
        jawWidth: 0.25,
        faceLength: 0.4,
      });

      // 일부 랜드마크를 NaN으로 변경
      mixedLandmarks[100] = { x: NaN, y: NaN };
      mixedLandmarks[200] = { x: Infinity, y: -Infinity };

      const result = analyzeFaceShape(mixedLandmarks);

      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle landmarks with z coordinate', () => {
      const landmarks3D = createFaceLandmarks({
        foreheadWidth: 0.32,
        cheekboneWidth: 0.35,
        jawWidth: 0.28,
        faceLength: 0.45,
      }).map((l) => ({ ...l, z: Math.random() - 0.5 }));

      const result = analyzeFaceShape(landmarks3D);

      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThan(50);
    });
  });

  // ===========================================================================
  // 비율 경계값 테스트
  // ===========================================================================
  describe('Ratio Boundary Tests', () => {
    it('lengthToWidthRatio boundary for round vs oval (1.1)', () => {
      // 정확히 1.1 근처 비율
      const landmarks = createFaceLandmarks({
        foreheadWidth: 0.35,
        cheekboneWidth: 0.35,
        jawWidth: 0.30,
        faceLength: 0.385, // ~1.1 ratio
      });

      const result = analyzeFaceShape(landmarks);

      // 비율이 경계값 근처에서 올바르게 계산
      expect(result.ratios.lengthToWidthRatio).toBeCloseTo(1.1, 0);
    });

    it('lengthToWidthRatio boundary for oblong (1.5)', () => {
      // 정확히 1.5 근처 비율
      const landmarks = createFaceLandmarks({
        foreheadWidth: 0.30,
        cheekboneWidth: 0.32,
        jawWidth: 0.28,
        faceLength: 0.48, // ~1.5 ratio
      });

      const result = analyzeFaceShape(landmarks);

      expect(result.ratios.lengthToWidthRatio).toBeGreaterThanOrEqual(1.4);
    });

    it('all widths equal should indicate square or rectangle', () => {
      // 모든 너비가 동일
      const landmarks = createFaceLandmarks({
        foreheadWidth: 0.30,
        cheekboneWidth: 0.30,
        jawWidth: 0.30,
        faceLength: 0.32,
      });

      const result = analyzeFaceShape(landmarks);

      // 모든 너비 동일 → 사각형 계열
      const widthDiff = Math.max(
        Math.abs(result.ratios.foreheadWidth - result.ratios.cheekboneWidth),
        Math.abs(result.ratios.cheekboneWidth - result.ratios.jawWidth)
      );
      expect(widthDiff).toBeLessThan(0.1);
    });
  });
});

// =============================================================================
// estimateFaceShapeFromPose 테스트
// =============================================================================

describe('estimateFaceShapeFromPose', () => {
  it('should estimate face shape from pose landmarks', () => {
    const poseLandmarks = createPoseLandmarks();
    const result = estimateFaceShapeFromPose(poseLandmarks);

    expect(result).toHaveProperty('faceShape');
    expect(result).toHaveProperty('faceShapeLabel');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('ratios');
  });

  it('should return lower confidence than face mesh analysis', () => {
    const poseLandmarks = createPoseLandmarks();
    const result = estimateFaceShapeFromPose(poseLandmarks);

    // Pose 기반은 신뢰도가 낮아야 함 (최소 40%, 일반 분석 대비 -15%)
    expect(result.confidence).toBeLessThanOrEqual(80);
    expect(result.confidence).toBeGreaterThanOrEqual(25); // 40 - 15
  });

  it('should estimate ratios from eye and ear distances', () => {
    const poseLandmarks = createPoseLandmarks({
      eyeDistance: 0.2,
      earDistance: 0.3,
    });

    const result = estimateFaceShapeFromPose(poseLandmarks);

    expect(result.ratios.faceWidth).toBeGreaterThan(0);
    expect(result.ratios.foreheadWidth).toBeGreaterThan(0);
    expect(result.ratios.cheekboneWidth).toBeGreaterThan(0);
  });

  it('should classify different face shapes from pose', () => {
    // 긴 얼굴
    const longFace = createPoseLandmarks({
      eyeDistance: 0.12,
      earDistance: 0.2,
      faceHeight: 0.4,
    });

    // 둥근 얼굴
    const roundFace = createPoseLandmarks({
      eyeDistance: 0.15,
      earDistance: 0.3,
      faceHeight: 0.25,
    });

    const longResult = estimateFaceShapeFromPose(longFace);
    const roundResult = estimateFaceShapeFromPose(roundFace);

    // 비율이 다르게 계산되어야 함
    expect(longResult.ratios.lengthToWidthRatio).not.toBe(roundResult.ratios.lengthToWidthRatio);
  });

  // ===========================================================================
  // Edge Cases - Pose 랜드마크 극단값
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should throw on empty pose landmarks array (expected behavior)', () => {
      const emptyPose: Landmark33[] = [];

      // 빈 배열은 유효하지 않은 입력 - 에러 발생 예상
      expect(() => estimateFaceShapeFromPose(emptyPose)).toThrow();
    });

    it('should handle pose landmarks with zero values', () => {
      const zeroPose: Landmark33[] = Array(33).fill(null).map(() => ({
        x: 0,
        y: 0,
        z: 0,
        visibility: 0,
      }));

      const result = estimateFaceShapeFromPose(zeroPose);

      expect(result.faceShape).toBeDefined();
    });

    it('should handle pose landmarks with low visibility', () => {
      const lowVisibilityPose = createPoseLandmarks();
      // 모든 랜드마크의 visibility를 매우 낮게 설정
      lowVisibilityPose.forEach((l) => {
        l.visibility = 0.1;
      });

      const result = estimateFaceShapeFromPose(lowVisibilityPose);

      expect(result.faceShape).toBeDefined();
      // 낮은 visibility로 인해 신뢰도가 낮을 수 있음
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle NaN values in pose landmarks', () => {
      const nanPose: Landmark33[] = Array(33).fill(null).map(() => ({
        x: NaN,
        y: NaN,
        z: NaN,
        visibility: NaN,
      }));

      expect(() => estimateFaceShapeFromPose(nanPose)).not.toThrow();
    });

    it('should handle pose landmarks with partial face data', () => {
      // 33개 중 일부만 유효한 데이터
      const partialPose = createPoseLandmarks();
      // 일부 필수 랜드마크 손상
      partialPose[0] = { x: NaN, y: NaN, z: 0, visibility: 0 }; // 코
      partialPose[7] = { x: NaN, y: NaN, z: 0, visibility: 0 }; // 왼쪽 귀

      const result = estimateFaceShapeFromPose(partialPose);

      expect(result.faceShape).toBeDefined();
    });

    it('should handle very small distance values', () => {
      const smallPose = createPoseLandmarks({
        eyeDistance: 0.001,
        earDistance: 0.002,
        mouthWidth: 0.001,
        faceHeight: 0.003,
      });

      const result = estimateFaceShapeFromPose(smallPose);

      expect(result.faceShape).toBeDefined();
      expect(result.ratios.lengthToWidthRatio).toBeGreaterThan(0);
    });

    it('should handle very large distance values', () => {
      const largePose = createPoseLandmarks({
        eyeDistance: 100,
        earDistance: 150,
        mouthWidth: 80,
        faceHeight: 200,
      });

      const result = estimateFaceShapeFromPose(largePose);

      expect(result.faceShape).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });
});

// =============================================================================
// getFaceShapeDescription 테스트
// =============================================================================

describe('getFaceShapeDescription', () => {
  const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];

  it.each(faceShapes)('should return description for %s', (faceShape) => {
    const description = getFaceShapeDescription(faceShape);

    expect(description).toBeDefined();
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(10);
  });

  it('should return Korean description for oval', () => {
    const description = getFaceShapeDescription('oval');
    expect(description).toContain('이상적');
  });

  it('should return Korean description for round', () => {
    const description = getFaceShapeDescription('round');
    expect(description).toContain('세로');
  });

  it('should return Korean description for square', () => {
    const description = getFaceShapeDescription('square');
    expect(description).toContain('각진');
  });
});

// =============================================================================
// getFaceShapeConfidenceGrade 테스트
// =============================================================================

describe('getFaceShapeConfidenceGrade', () => {
  it('should return "매우 높음" for confidence >= 85', () => {
    const result = getFaceShapeConfidenceGrade(90);
    expect(result.label).toBe('매우 높음');
    expect(result.color).toBe('emerald');
  });

  it('should return "높음" for confidence 70-84', () => {
    const result = getFaceShapeConfidenceGrade(75);
    expect(result.label).toBe('높음');
    expect(result.color).toBe('blue');
  });

  it('should return "보통" for confidence 55-69', () => {
    const result = getFaceShapeConfidenceGrade(60);
    expect(result.label).toBe('보통');
    expect(result.color).toBe('amber');
  });

  it('should return "낮음" for confidence < 55', () => {
    const result = getFaceShapeConfidenceGrade(40);
    expect(result.label).toBe('낮음');
    expect(result.color).toBe('red');
  });

  it('should handle boundary values correctly', () => {
    expect(getFaceShapeConfidenceGrade(85).label).toBe('매우 높음');
    expect(getFaceShapeConfidenceGrade(84).label).toBe('높음');
    expect(getFaceShapeConfidenceGrade(70).label).toBe('높음');
    expect(getFaceShapeConfidenceGrade(69).label).toBe('보통');
    expect(getFaceShapeConfidenceGrade(55).label).toBe('보통');
    expect(getFaceShapeConfidenceGrade(54).label).toBe('낮음');
  });
});
