/**
 * 벡터 연산 유틸리티 테스트
 *
 * @module tests/lib/image-engine/utils/vector-math
 * @description 3D 랜드마크, 각도 계산에 필요한 벡터 연산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  add2D,
  subtract2D,
  scale2D,
  magnitude2D,
  normalize2D,
  dot2D,
  distance2D,
  add3D,
  subtract3D,
  scale3D,
  magnitude3D,
  normalize3D,
  dot3D,
  cross3D,
  distance3D,
  radiansToDegrees,
  degreesToRadians,
  eulerToDegrees,
  calculateFaceNormal,
  normalToEulerAngles,
  calculateRollFromEyes,
  calculateFaceEulerAngles,
  calculateFrontalityScore,
  centroid3D,
  lerp,
  lerp3D,
  clamp,
} from '@/lib/image-engine/utils/vector-math';
import type { Point2D, Point3D, EulerAngles } from '@/lib/image-engine/types';

describe('lib/image-engine/utils/vector-math', () => {
  // =========================================
  // 2D 벡터 연산 테스트
  // =========================================

  describe('2D 벡터 연산', () => {
    const v1: Point2D = { x: 3, y: 4 };
    const v2: Point2D = { x: 1, y: 2 };

    it('add2D: 두 벡터를 더한다', () => {
      expect(add2D(v1, v2)).toEqual({ x: 4, y: 6 });
    });

    it('subtract2D: 두 벡터를 뺀다', () => {
      expect(subtract2D(v1, v2)).toEqual({ x: 2, y: 2 });
    });

    it('scale2D: 스칼라 곱을 계산한다', () => {
      expect(scale2D(v1, 2)).toEqual({ x: 6, y: 8 });
      expect(scale2D(v1, 0)).toEqual({ x: 0, y: 0 });
      expect(scale2D(v1, -1)).toEqual({ x: -3, y: -4 });
    });

    it('magnitude2D: 벡터의 크기를 계산한다', () => {
      expect(magnitude2D(v1)).toBe(5); // 3-4-5 삼각형
      expect(magnitude2D({ x: 0, y: 0 })).toBe(0);
    });

    it('normalize2D: 단위 벡터로 정규화한다', () => {
      const normalized = normalize2D(v1);
      expect(normalized.x).toBeCloseTo(0.6, 5);
      expect(normalized.y).toBeCloseTo(0.8, 5);
      expect(magnitude2D(normalized)).toBeCloseTo(1, 5);
    });

    it('normalize2D: 영벡터는 영벡터를 반환한다', () => {
      expect(normalize2D({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });

    it('dot2D: 내적을 계산한다', () => {
      expect(dot2D(v1, v2)).toBe(11); // 3*1 + 4*2
      expect(dot2D(v1, { x: -4, y: 3 })).toBe(0); // 수직
    });

    it('distance2D: 두 점 사이의 거리를 계산한다', () => {
      expect(distance2D(v1, v2)).toBeCloseTo(Math.sqrt(8), 5);
      expect(distance2D(v1, v1)).toBe(0);
    });
  });

  // =========================================
  // 3D 벡터 연산 테스트
  // =========================================

  describe('3D 벡터 연산', () => {
    const v1: Point3D = { x: 1, y: 2, z: 3 };
    const v2: Point3D = { x: 4, y: 5, z: 6 };

    it('add3D: 두 벡터를 더한다', () => {
      expect(add3D(v1, v2)).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('subtract3D: 두 벡터를 뺀다', () => {
      expect(subtract3D(v1, v2)).toEqual({ x: -3, y: -3, z: -3 });
    });

    it('scale3D: 스칼라 곱을 계산한다', () => {
      expect(scale3D(v1, 2)).toEqual({ x: 2, y: 4, z: 6 });
    });

    it('magnitude3D: 벡터의 크기를 계산한다', () => {
      const v = { x: 2, y: 2, z: 1 };
      expect(magnitude3D(v)).toBe(3);
    });

    it('normalize3D: 단위 벡터로 정규화한다', () => {
      const v = { x: 0, y: 0, z: 5 };
      expect(normalize3D(v)).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('normalize3D: 영벡터는 영벡터를 반환한다', () => {
      expect(normalize3D({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('dot3D: 내적을 계산한다', () => {
      expect(dot3D(v1, v2)).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it('cross3D: 외적을 계산한다', () => {
      const result = cross3D(v1, v2);
      expect(result.x).toBe(-3); // 2*6 - 3*5
      expect(result.y).toBe(6); // 3*4 - 1*6
      expect(result.z).toBe(-3); // 1*5 - 2*4
    });

    it('cross3D: 결과는 두 벡터에 수직이다', () => {
      const result = cross3D(v1, v2);
      expect(dot3D(result, v1)).toBeCloseTo(0, 5);
      expect(dot3D(result, v2)).toBeCloseTo(0, 5);
    });

    it('distance3D: 두 점 사이의 거리를 계산한다', () => {
      expect(distance3D(v1, v2)).toBeCloseTo(Math.sqrt(27), 5);
    });
  });

  // =========================================
  // 각도 변환 테스트
  // =========================================

  describe('각도 변환', () => {
    it('radiansToDegrees: 라디안을 도로 변환한다', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(radiansToDegrees(0)).toBe(0);
    });

    it('degreesToRadians: 도를 라디안으로 변환한다', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(degreesToRadians(0)).toBe(0);
    });

    it('eulerToDegrees: 오일러 각도를 도로 변환한다', () => {
      const euler: EulerAngles = {
        pitch: Math.PI / 4,
        yaw: Math.PI / 6,
        roll: Math.PI / 3,
      };
      const result = eulerToDegrees(euler);
      expect(result.pitch).toBeCloseTo(45, 5);
      expect(result.yaw).toBeCloseTo(30, 5);
      expect(result.roll).toBeCloseTo(60, 5);
    });
  });

  // =========================================
  // 얼굴 각도 계산 테스트
  // =========================================

  describe('얼굴 각도 계산', () => {
    it('calculateFaceNormal: 정면 얼굴의 법선 벡터를 계산한다', () => {
      // 정면을 향한 얼굴 (이마가 위, 볼이 양쪽)
      const forehead: Point3D = { x: 0, y: 1, z: 0 };
      const leftCheek: Point3D = { x: -1, y: 0, z: 0 };
      const rightCheek: Point3D = { x: 1, y: 0, z: 0 };

      const normal = calculateFaceNormal(forehead, leftCheek, rightCheek);

      // 법선은 z 방향을 가리켜야 함
      expect(magnitude3D(normal)).toBeCloseTo(1, 5);
    });

    it('normalToEulerAngles: 정면 법선에서 각도를 추출한다', () => {
      const frontNormal: Point3D = { x: 0, y: 0, z: 1 };
      const angles = normalToEulerAngles(frontNormal);

      expect(angles.yaw).toBeCloseTo(0, 5);
      expect(angles.pitch).toBeCloseTo(0, 5);
    });

    it('calculateRollFromEyes: 눈 위치로 기울기를 계산한다', () => {
      // 수평 눈
      const leftEye: Point2D = { x: 0, y: 0 };
      const rightEye: Point2D = { x: 100, y: 0 };
      expect(calculateRollFromEyes(leftEye, rightEye)).toBeCloseTo(0, 5);

      // 45도 기울어진 눈
      const tiltedLeft: Point2D = { x: 0, y: 0 };
      const tiltedRight: Point2D = { x: 100, y: 100 };
      expect(radiansToDegrees(calculateRollFromEyes(tiltedLeft, tiltedRight))).toBeCloseTo(45, 5);
    });

    it('calculateFaceEulerAngles: 종합 각도를 계산한다', () => {
      const forehead: Point3D = { x: 0, y: 1, z: 0 };
      const leftCheek: Point3D = { x: -1, y: 0, z: 0 };
      const rightCheek: Point3D = { x: 1, y: 0, z: 0 };
      const leftEye: Point2D = { x: 0, y: 0 };
      const rightEye: Point2D = { x: 100, y: 0 };

      const angles = calculateFaceEulerAngles(forehead, leftCheek, rightCheek, leftEye, rightEye);

      expect(angles).toHaveProperty('pitch');
      expect(angles).toHaveProperty('yaw');
      expect(angles).toHaveProperty('roll');
    });
  });

  // =========================================
  // 정면성 점수 테스트
  // =========================================

  describe('calculateFrontalityScore', () => {
    const defaultThresholds = { pitch: 15, yaw: 15, roll: 10 };
    const defaultWeights = { pitch: 0.4, yaw: 0.4, roll: 0.2 };

    it('정면 얼굴은 높은 점수를 반환한다', () => {
      const angles: EulerAngles = { pitch: 0, yaw: 0, roll: 0 };
      const score = calculateFrontalityScore(angles, defaultThresholds, defaultWeights);
      expect(score).toBe(100);
    });

    it('기울어진 얼굴은 낮은 점수를 반환한다', () => {
      const angles: EulerAngles = {
        pitch: degreesToRadians(30),
        yaw: degreesToRadians(30),
        roll: degreesToRadians(20),
      };
      const score = calculateFrontalityScore(angles, defaultThresholds, defaultWeights);
      expect(score).toBeLessThan(50);
    });

    it('점수는 0-100 범위이다', () => {
      const extremeAngles: EulerAngles = {
        pitch: degreesToRadians(90),
        yaw: degreesToRadians(90),
        roll: degreesToRadians(90),
      };
      const score = calculateFrontalityScore(extremeAngles, defaultThresholds, defaultWeights);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // =========================================
  // 기타 유틸리티 테스트
  // =========================================

  describe('기타 유틸리티', () => {
    it('centroid3D: 점들의 중심을 계산한다', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 0, y: 0, z: 2 },
      ];
      const center = centroid3D(points);
      expect(center.x).toBeCloseTo(0.5, 5);
      expect(center.y).toBeCloseTo(0.5, 5);
      expect(center.z).toBeCloseTo(0.5, 5);
    });

    it('centroid3D: 빈 배열은 원점을 반환한다', () => {
      expect(centroid3D([])).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('lerp: 선형 보간을 계산한다', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('lerp3D: 3D 점의 선형 보간을 계산한다', () => {
      const a: Point3D = { x: 0, y: 0, z: 0 };
      const b: Point3D = { x: 10, y: 20, z: 30 };
      const result = lerp3D(a, b, 0.5);
      expect(result).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('clamp: 값을 범위 내로 제한한다', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
