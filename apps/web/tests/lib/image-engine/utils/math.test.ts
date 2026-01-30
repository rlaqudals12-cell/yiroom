/**
 * 수학 유틸리티 테스트
 *
 * @module tests/lib/image-engine/utils/math
 * @description 통계, 벡터, 행렬, 컨볼루션 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  mean,
  variance,
  standardDeviation,
  min,
  max,
  median,
  percentile,
  clamp,
  normalize,
  denormalize,
  lerp,
  add2D,
  subtract2D,
  scale2D,
  dot2D,
  magnitude2D,
  normalize2D,
  distance2D,
  add3D,
  subtract3D,
  scale3D,
  dot3D,
  cross3D,
  magnitude3D,
  normalize3D,
  distance3D,
  multiplyMatrix3x3Vector,
  multiplyMatrix3x3,
  transposeMatrix3x3,
  determinant3x3,
  inverseMatrix3x3,
  radiansToDegrees,
  degreesToRadians,
  convolve2D,
  laplacianVariance,
  LAPLACIAN_KERNEL,
} from '@/lib/image-engine/utils/math';

describe('lib/image-engine/utils/math', () => {
  // =========================================
  // 기본 통계 테스트
  // =========================================

  describe('mean', () => {
    it('빈 배열은 0을 반환한다', () => {
      expect(mean([])).toBe(0);
    });

    it('단일 값은 그 값을 반환한다', () => {
      expect(mean([5])).toBe(5);
    });

    it('여러 값의 평균을 계산한다', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20, 30])).toBe(20);
    });

    it('소수점을 포함한 값도 처리한다', () => {
      expect(mean([0.5, 1.5, 2.5])).toBeCloseTo(1.5, 5);
    });
  });

  describe('variance', () => {
    it('빈 배열은 0을 반환한다', () => {
      expect(variance([])).toBe(0);
    });

    it('동일한 값들의 분산은 0이다', () => {
      expect(variance([5, 5, 5, 5])).toBe(0);
    });

    it('분산을 정확히 계산한다', () => {
      // 1, 2, 3, 4, 5의 분산 = 2
      expect(variance([1, 2, 3, 4, 5])).toBe(2);
    });

    it('미리 계산된 평균을 사용할 수 있다', () => {
      const values = [1, 2, 3, 4, 5];
      const m = mean(values);
      expect(variance(values, m)).toBe(2);
    });
  });

  describe('standardDeviation', () => {
    it('표준편차를 정확히 계산한다', () => {
      // 1, 2, 3, 4, 5의 표준편차 = sqrt(2)
      expect(standardDeviation([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2), 5);
    });
  });

  describe('min / max', () => {
    it('빈 배열은 0을 반환한다', () => {
      expect(min([])).toBe(0);
      expect(max([])).toBe(0);
    });

    it('최소/최대값을 찾는다', () => {
      expect(min([3, 1, 4, 1, 5])).toBe(1);
      expect(max([3, 1, 4, 1, 5])).toBe(5);
    });

    it('음수도 처리한다', () => {
      expect(min([-5, -1, 0, 3])).toBe(-5);
      expect(max([-5, -1, 0, 3])).toBe(3);
    });
  });

  describe('median', () => {
    it('빈 배열은 0을 반환한다', () => {
      expect(median([])).toBe(0);
    });

    it('홀수 개 요소의 중앙값', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
      expect(median([5, 1, 3])).toBe(3);
    });

    it('짝수 개 요소의 중앙값 (두 중간값의 평균)', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });
  });

  describe('percentile', () => {
    it('빈 배열은 0을 반환한다', () => {
      expect(percentile([], 50)).toBe(0);
    });

    it('50 백분위는 중앙값이다', () => {
      expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    });

    it('0 백분위는 최소값이다', () => {
      expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
    });

    it('100 백분위는 최대값이다', () => {
      expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
    });

    it('25/75 백분위를 계산한다', () => {
      expect(percentile([1, 2, 3, 4, 5], 25)).toBe(2);
      expect(percentile([1, 2, 3, 4, 5], 75)).toBe(4);
    });
  });

  // =========================================
  // 값 제한 및 정규화 테스트
  // =========================================

  describe('clamp', () => {
    it('범위 내 값은 그대로 반환한다', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('최소값 미만은 최소값으로 클램핑한다', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('최대값 초과는 최대값으로 클램핑한다', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('normalize', () => {
    it('최소값은 0으로 정규화된다', () => {
      expect(normalize(0, 0, 100)).toBe(0);
    });

    it('최대값은 1로 정규화된다', () => {
      expect(normalize(100, 0, 100)).toBe(1);
    });

    it('중간값은 0.5로 정규화된다', () => {
      expect(normalize(50, 0, 100)).toBe(0.5);
    });

    it('동일한 min/max는 0을 반환한다', () => {
      expect(normalize(5, 5, 5)).toBe(0);
    });
  });

  describe('denormalize', () => {
    it('0은 최소값으로 변환된다', () => {
      expect(denormalize(0, 10, 20)).toBe(10);
    });

    it('1은 최대값으로 변환된다', () => {
      expect(denormalize(1, 10, 20)).toBe(20);
    });

    it('0.5는 중간값으로 변환된다', () => {
      expect(denormalize(0.5, 10, 20)).toBe(15);
    });
  });

  describe('lerp', () => {
    it('t=0이면 a를 반환한다', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('t=1이면 b를 반환한다', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('t=0.5이면 중간값을 반환한다', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });
  });

  // =========================================
  // 2D 벡터 연산 테스트
  // =========================================

  describe('2D 벡터 연산', () => {
    const a = { x: 3, y: 4 };
    const b = { x: 1, y: 2 };

    it('add2D: 벡터 덧셈', () => {
      const result = add2D(a, b);
      expect(result).toEqual({ x: 4, y: 6 });
    });

    it('subtract2D: 벡터 뺄셈', () => {
      const result = subtract2D(a, b);
      expect(result).toEqual({ x: 2, y: 2 });
    });

    it('scale2D: 스칼라 곱', () => {
      const result = scale2D(a, 2);
      expect(result).toEqual({ x: 6, y: 8 });
    });

    it('dot2D: 내적', () => {
      expect(dot2D(a, b)).toBe(11); // 3*1 + 4*2 = 11
    });

    it('magnitude2D: 크기', () => {
      expect(magnitude2D(a)).toBe(5); // sqrt(9 + 16) = 5
    });

    it('normalize2D: 정규화', () => {
      const result = normalize2D(a);
      expect(result.x).toBeCloseTo(0.6, 5);
      expect(result.y).toBeCloseTo(0.8, 5);
    });

    it('normalize2D: 영벡터 처리', () => {
      const result = normalize2D({ x: 0, y: 0 });
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('distance2D: 거리', () => {
      expect(distance2D(a, b)).toBeCloseTo(Math.sqrt(8), 5);
    });
  });

  // =========================================
  // 3D 벡터 연산 테스트
  // =========================================

  describe('3D 벡터 연산', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };

    it('add3D: 벡터 덧셈', () => {
      expect(add3D(a, b)).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('subtract3D: 벡터 뺄셈', () => {
      expect(subtract3D(a, b)).toEqual({ x: -3, y: -3, z: -3 });
    });

    it('scale3D: 스칼라 곱', () => {
      expect(scale3D(a, 2)).toEqual({ x: 2, y: 4, z: 6 });
    });

    it('dot3D: 내적', () => {
      expect(dot3D(a, b)).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    it('cross3D: 외적', () => {
      const result = cross3D(a, b);
      expect(result.x).toBe(-3); // 2*6 - 3*5 = -3
      expect(result.y).toBe(6); // 3*4 - 1*6 = 6
      expect(result.z).toBe(-3); // 1*5 - 2*4 = -3
    });

    it('magnitude3D: 크기', () => {
      const v = { x: 2, y: 2, z: 1 };
      expect(magnitude3D(v)).toBe(3); // sqrt(4 + 4 + 1) = 3
    });

    it('normalize3D: 정규화', () => {
      const v = { x: 0, y: 0, z: 5 };
      const result = normalize3D(v);
      expect(result).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('normalize3D: 영벡터 처리', () => {
      expect(normalize3D({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('distance3D: 거리', () => {
      expect(distance3D(a, b)).toBeCloseTo(Math.sqrt(27), 5);
    });
  });

  // =========================================
  // 행렬 연산 테스트
  // =========================================

  describe('행렬 연산', () => {
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    it('multiplyMatrix3x3Vector: 행렬 × 벡터', () => {
      const v = { x: 1, y: 2, z: 3 };
      const result = multiplyMatrix3x3Vector(identity, v);
      expect(result).toEqual(v);
    });

    it('multiplyMatrix3x3: 항등행렬 곱', () => {
      const result = multiplyMatrix3x3(identity, matrix);
      expect(result).toEqual(matrix);
    });

    it('transposeMatrix3x3: 전치 행렬', () => {
      const transposed = transposeMatrix3x3(matrix);
      expect(transposed).toEqual([
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
      ]);
    });

    it('determinant3x3: 행렬식', () => {
      expect(determinant3x3(identity)).toBe(1);
      expect(determinant3x3(matrix)).toBe(0); // 특이 행렬
    });

    it('inverseMatrix3x3: 역행렬', () => {
      const invertible = [
        [1, 2, 1],
        [2, 1, 3],
        [1, 3, 2],
      ];
      const inverse = inverseMatrix3x3(invertible);
      expect(inverse).not.toBeNull();

      // 역행렬과 원본 곱은 항등 행렬에 가까워야 함
      if (inverse) {
        const product = multiplyMatrix3x3(invertible, inverse);
        expect(product[0][0]).toBeCloseTo(1, 5);
        expect(product[1][1]).toBeCloseTo(1, 5);
        expect(product[2][2]).toBeCloseTo(1, 5);
      }
    });

    it('inverseMatrix3x3: 특이 행렬은 null 반환', () => {
      expect(inverseMatrix3x3(matrix)).toBeNull();
    });
  });

  // =========================================
  // 각도 변환 테스트
  // =========================================

  describe('각도 변환', () => {
    it('radiansToDegrees: π → 180', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
    });

    it('radiansToDegrees: π/2 → 90', () => {
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
    });

    it('degreesToRadians: 180 → π', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
    });

    it('degreesToRadians: 90 → π/2', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  // =========================================
  // 2D 컨볼루션 테스트
  // =========================================

  describe('2D 컨볼루션', () => {
    it('LAPLACIAN_KERNEL이 정의되어 있다', () => {
      expect(LAPLACIAN_KERNEL).toBeDefined();
      expect(LAPLACIAN_KERNEL.length).toBe(3);
      expect(LAPLACIAN_KERNEL[0].length).toBe(3);
    });

    it('convolve2D: 단순 이미지에 대해 작동한다', () => {
      const image = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const kernel = [
        [1, 0],
        [0, 1],
      ];
      const result = convolve2D(image, kernel);
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(3);
    });

    it('laplacianVariance: 균일한 이미지는 분산이 낮다', () => {
      // 경계 처리로 인해 작은 값이 나올 수 있음
      const uniform = [
        [5, 5, 5],
        [5, 5, 5],
        [5, 5, 5],
      ];
      // 균일한 이미지는 대비가 큰 이미지보다 분산이 낮아야 함
      const highContrast = [
        [0, 255, 0],
        [255, 0, 255],
        [0, 255, 0],
      ];
      expect(laplacianVariance(uniform)).toBeLessThan(laplacianVariance(highContrast));
    });

    it('laplacianVariance: 빈 이미지는 0 반환', () => {
      expect(laplacianVariance([])).toBe(0);
    });
  });
});
