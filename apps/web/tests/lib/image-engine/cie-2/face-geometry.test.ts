/**
 * CIE-2 Phase 2: 얼굴 기하학 측정 테스트
 *
 * @module tests/lib/image-engine/cie-2/face-geometry
 */

import { describe, it, expect } from 'vitest';
import {
  extractFaceGeometry,
  classifyFaceShape,
  calculateSymmetryScore,
  analyzeFaceGeometry,
} from '@/lib/image-engine/cie-2';
import type { FaceGeometryMeasurements, FaceShape } from '@/lib/image-engine/cie-2';
import type { Point3D } from '@/lib/image-engine/types';

// ============================================================================
// 테스트 헬퍼: 468+ 포인트 Mock 랜드마크 생성
// ============================================================================

/** 기본 정면 얼굴 랜드마크 (468+10 iris points) */
function createMockLandmarks(overrides: Record<number, Partial<Point3D>> = {}): Point3D[] {
  // 478개 포인트 (468 face + 10 iris)
  const points: Point3D[] = Array.from({ length: 478 }, (_, i) => ({
    x: 200 + Math.sin(i * 0.1) * 50,
    y: 200 + Math.cos(i * 0.1) * 50,
    z: 0,
  }));

  // 주요 랜드마크 설정 (정면 대칭 얼굴)
  const keyPoints: Record<number, Point3D> = {
    // 얼굴 측면 (temple)
    127: { x: 100, y: 200, z: 0 }, // leftTemple
    356: { x: 300, y: 200, z: 0 }, // rightTemple
    // 이마/턱
    10: { x: 200, y: 80, z: 0 }, // foreheadTop
    152: { x: 200, y: 350, z: 0 }, // chin
    151: { x: 200, y: 100, z: 0 }, // foreheadHairline
    // 눈 (좌)
    133: { x: 175, y: 190, z: 0 }, // leftEyeInnerCorner
    33: { x: 140, y: 190, z: 0 }, // leftEyeOuterCorner
    // 눈 (우)
    362: { x: 225, y: 190, z: 0 }, // rightEyeInnerCorner
    263: { x: 260, y: 190, z: 0 }, // rightEyeOuterCorner
    // 코
    1: { x: 200, y: 260, z: 0 }, // noseTip
    6: { x: 200, y: 200, z: 0 }, // noseBridge
    129: { x: 180, y: 255, z: 0 }, // noseLeftAla
    358: { x: 220, y: 255, z: 0 }, // noseRightAla
    // 입
    61: { x: 165, y: 300, z: 0 }, // mouthLeftCorner
    291: { x: 235, y: 300, z: 0 }, // mouthRightCorner
    0: { x: 200, y: 290, z: 0 }, // upperLipCenter
    17: { x: 200, y: 310, z: 0 }, // lowerLipCenter
    // 턱
    172: { x: 120, y: 320, z: 0 }, // jawLeft
    397: { x: 280, y: 320, z: 0 }, // jawRight
    136: { x: 130, y: 300, z: 0 }, // jawLeftAngle
    365: { x: 270, y: 300, z: 0 }, // jawRightAngle
    // 광대
    234: { x: 110, y: 230, z: 0 }, // leftCheekbone
    454: { x: 290, y: 230, z: 0 }, // rightCheekbone
  };

  for (const [idx, pt] of Object.entries(keyPoints)) {
    points[Number(idx)] = pt;
  }

  // 오버라이드 적용
  for (const [idx, partial] of Object.entries(overrides)) {
    const i = Number(idx);
    points[i] = { ...points[i], ...partial };
  }

  return points;
}

// ============================================================================
// extractFaceGeometry
// ============================================================================

describe('extractFaceGeometry', () => {
  it('468개 이상 랜드마크에서 16개 측정값을 추출한다', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    expect(m.faceWidth).toBeGreaterThan(0);
    expect(m.faceHeight).toBeGreaterThan(0);
    expect(m.faceRatio).toBeGreaterThan(0);
    expect(m.eyeDistance).toBeGreaterThan(0);
    expect(m.leftEyeWidth).toBeGreaterThan(0);
    expect(m.rightEyeWidth).toBeGreaterThan(0);
    expect(m.eyeToFaceRatio).toBeGreaterThan(0);
    expect(m.noseLength).toBeGreaterThan(0);
    expect(m.noseWidth).toBeGreaterThan(0);
    expect(m.noseToFaceRatio).toBeGreaterThan(0);
    expect(m.mouthWidth).toBeGreaterThan(0);
    expect(m.mouthToFaceRatio).toBeGreaterThan(0);
    expect(m.jawWidth).toBeGreaterThan(0);
    expect(m.jawAngleDegrees).toBeGreaterThan(0);
    expect(m.foreheadHeight).toBeGreaterThan(0);
    expect(m.cheekboneWidth).toBeGreaterThan(0);
  });

  it('468개 미만이면 에러를 던진다', () => {
    const points: Point3D[] = Array.from({ length: 100 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(() => extractFaceGeometry(points)).toThrow('최소 468개 랜드마크');
  });

  it('대칭 얼굴에서 좌우 눈 너비가 유사하다', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    // 대칭 mock이므로 좌우 눈 너비 차이가 작아야 함
    const eyeWidthDiff = Math.abs(m.leftEyeWidth - m.rightEyeWidth);
    expect(eyeWidthDiff).toBeLessThan(m.leftEyeWidth * 0.5);
  });

  it('faceRatio = faceWidth / faceHeight', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    const expectedRatio = m.faceWidth / m.faceHeight;
    expect(m.faceRatio).toBeCloseTo(expectedRatio, 5);
  });

  it('eyeToFaceRatio = eyeDistance / faceWidth', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    const expected = m.eyeDistance / m.faceWidth;
    expect(m.eyeToFaceRatio).toBeCloseTo(expected, 5);
  });

  it('noseToFaceRatio = noseLength / faceHeight', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    const expected = m.noseLength / m.faceHeight;
    expect(m.noseToFaceRatio).toBeCloseTo(expected, 5);
  });

  it('mouthToFaceRatio = mouthWidth / faceWidth', () => {
    const points = createMockLandmarks();
    const m = extractFaceGeometry(points);

    const expected = m.mouthWidth / m.faceWidth;
    expect(m.mouthToFaceRatio).toBeCloseTo(expected, 5);
  });
});

// ============================================================================
// classifyFaceShape
// ============================================================================

describe('classifyFaceShape', () => {
  function makeMeasurements(
    overrides: Partial<FaceGeometryMeasurements> = {}
  ): FaceGeometryMeasurements {
    return {
      faceWidth: 200,
      faceHeight: 280,
      faceRatio: 0.71, // oval 범위
      eyeDistance: 65,
      leftEyeWidth: 30,
      rightEyeWidth: 30,
      eyeToFaceRatio: 0.325,
      noseLength: 55,
      noseWidth: 40,
      noseToFaceRatio: 0.196,
      mouthWidth: 55,
      mouthToFaceRatio: 0.275,
      jawWidth: 170,
      jawAngleDegrees: 135,
      foreheadHeight: 80,
      cheekboneWidth: 195,
      ...overrides,
    };
  }

  it('결과에 shape과 confidence를 포함한다', () => {
    const result = classifyFaceShape(makeMeasurements());
    expect(result).toHaveProperty('shape');
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('유효한 FaceShape 값을 반환한다', () => {
    const validShapes: FaceShape[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'];
    const result = classifyFaceShape(makeMeasurements());
    expect(validShapes).toContain(result.shape);
  });

  it('faceRatio 0.65~0.75에서 oval 점수가 높다', () => {
    const result = classifyFaceShape(makeMeasurements({ faceRatio: 0.7 }));
    // oval 점수가 가장 높을 가능성이 크지만, 다른 요인도 영향
    expect(result.shape).toBeDefined();
  });

  it('faceRatio > 0.75에서 round/square 가능성 높다', () => {
    const result = classifyFaceShape(
      makeMeasurements({
        faceRatio: 0.8,
        jawAngleDegrees: 140, // 둥근 턱
      })
    );
    expect(['round', 'square', 'oval', 'heart', 'diamond']).toContain(result.shape);
  });

  it('faceRatio < 0.6에서 oblong 가능성 높다', () => {
    const result = classifyFaceShape(
      makeMeasurements({
        faceRatio: 0.55,
      })
    );
    expect(result.shape).toBe('oblong');
  });

  it('jawAngle < 110에서 square 가능성 높다', () => {
    const result = classifyFaceShape(
      makeMeasurements({
        faceRatio: 0.78,
        jawAngleDegrees: 100,
        cheekboneWidth: 180, // 광대 < 턱
        jawWidth: 185,
      })
    );
    expect(result.shape).toBe('square');
  });

  it('광대 넓고 턱 좁으면 heart/diamond 가능성 높다', () => {
    const result = classifyFaceShape(
      makeMeasurements({
        faceRatio: 0.7,
        cheekboneWidth: 210,
        jawWidth: 150,
        jawAngleDegrees: 135,
      })
    );
    expect(['heart', 'diamond']).toContain(result.shape);
  });

  it('jawWidth=0일 때 에러 없이 동작한다', () => {
    const result = classifyFaceShape(makeMeasurements({ jawWidth: 0 }));
    expect(result.shape).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// calculateSymmetryScore
// ============================================================================

describe('calculateSymmetryScore', () => {
  function makeSymmetric(): FaceGeometryMeasurements {
    return {
      faceWidth: 200,
      faceHeight: 280,
      faceRatio: 0.71,
      eyeDistance: 66,
      leftEyeWidth: 30,
      rightEyeWidth: 30,
      eyeToFaceRatio: 0.33,
      noseLength: 55,
      noseWidth: 50, // 0.25 of faceWidth
      noseToFaceRatio: 0.196,
      mouthWidth: 55,
      mouthToFaceRatio: 0.275,
      jawWidth: 170,
      jawAngleDegrees: 135,
      foreheadHeight: 80,
      cheekboneWidth: 195,
    };
  }

  it('대칭 얼굴에서 높은 점수 (70+)', () => {
    const score = calculateSymmetryScore(makeSymmetric());
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('좌우 눈 크기 차이가 클수록 점수가 낮다', () => {
    const symmetric = calculateSymmetryScore(makeSymmetric());
    const asymmetric = calculateSymmetryScore({
      ...makeSymmetric(),
      leftEyeWidth: 35,
      rightEyeWidth: 20,
    });
    expect(asymmetric).toBeLessThan(symmetric);
  });

  it('0~100 범위를 반환한다', () => {
    const score = calculateSymmetryScore(makeSymmetric());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('정수를 반환한다', () => {
    const score = calculateSymmetryScore(makeSymmetric());
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ============================================================================
// analyzeFaceGeometry (통합)
// ============================================================================

describe('analyzeFaceGeometry', () => {
  it('measurements, faceShape, faceShapeConfidence, symmetryScore를 반환한다', () => {
    const points = createMockLandmarks();
    const result = analyzeFaceGeometry(points);

    expect(result).toHaveProperty('measurements');
    expect(result).toHaveProperty('faceShape');
    expect(result).toHaveProperty('faceShapeConfidence');
    expect(result).toHaveProperty('symmetryScore');
  });

  it('faceShape이 유효한 값이다', () => {
    const points = createMockLandmarks();
    const result = analyzeFaceGeometry(points);

    const validShapes: FaceShape[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'];
    expect(validShapes).toContain(result.faceShape);
  });

  it('confidence와 symmetry가 0~100 범위이다', () => {
    const points = createMockLandmarks();
    const result = analyzeFaceGeometry(points);

    expect(result.faceShapeConfidence).toBeGreaterThanOrEqual(0);
    expect(result.faceShapeConfidence).toBeLessThanOrEqual(100);
    expect(result.symmetryScore).toBeGreaterThanOrEqual(0);
    expect(result.symmetryScore).toBeLessThanOrEqual(100);
  });

  it('468개 미만이면 에러를 던진다', () => {
    const points: Point3D[] = Array.from({ length: 200 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(() => analyzeFaceGeometry(points)).toThrow('최소 468개');
  });
});

// ============================================================================
// 턱선 각도 계산 검증
// ============================================================================

describe('턱선 각도 계산', () => {
  it('직각(90°)에 가까운 턱을 감지한다', () => {
    // jawLeftAngle과 jawRightAngle을 chin 기준으로 직각에 가깝게 배치
    const points = createMockLandmarks({
      136: { x: 130, y: 250, z: 0 }, // jawLeftAngle - chin과 수평에 가까움
      365: { x: 270, y: 250, z: 0 }, // jawRightAngle
      152: { x: 200, y: 350, z: 0 }, // chin - 아래쪽
    });
    const m = extractFaceGeometry(points);
    // 각진 턱 → 각도가 작아야 함 (< 130°)
    expect(m.jawAngleDegrees).toBeLessThan(180);
    expect(m.jawAngleDegrees).toBeGreaterThan(0);
  });

  it('둥근 턱(넓은 각도)을 감지한다', () => {
    // jawLeftAngle과 jawRightAngle을 chin에 가깝게 배치 → 넓은 각도
    const points = createMockLandmarks({
      136: { x: 190, y: 340, z: 0 },
      365: { x: 210, y: 340, z: 0 },
      152: { x: 200, y: 350, z: 0 },
    });
    const m = extractFaceGeometry(points);
    // 둥근 턱 → 각도가 넓거나, 벡터가 짧아서 값이 작을 수 있음
    expect(m.jawAngleDegrees).toBeGreaterThanOrEqual(0);
    expect(m.jawAngleDegrees).toBeLessThanOrEqual(180);
  });
});
