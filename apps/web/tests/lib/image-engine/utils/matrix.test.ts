/**
 * 행렬 연산 유틸리티 테스트
 *
 * @module tests/lib/image-engine/utils/matrix
 * @description 색공간 변환에 필요한 행렬 연산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  multiplyMatrixVector,
  multiplyMatrices,
  identityMatrix3x3,
  transposeMatrix,
  determinant3x3,
  inverseMatrix3x3,
  scaleMatrix,
  diagonalMatrix,
  type Matrix3x3,
  type Vector3,
} from '@/lib/image-engine/utils/matrix';

describe('lib/image-engine/utils/matrix', () => {
  // =========================================
  // multiplyMatrixVector 테스트
  // =========================================

  describe('multiplyMatrixVector', () => {
    it('단위 행렬과 벡터의 곱은 원본 벡터를 반환한다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const vector: Vector3 = [3, 4, 5];

      const result = multiplyMatrixVector(identity, vector);

      expect(result).toEqual([3, 4, 5]);
    });

    it('스케일링 행렬이 정확히 적용된다', () => {
      const scaleMatrix: Matrix3x3 = [
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 4],
      ];
      const vector: Vector3 = [1, 1, 1];

      const result = multiplyMatrixVector(scaleMatrix, vector);

      expect(result).toEqual([2, 3, 4]);
    });

    it('일반 행렬과 벡터 곱이 정확히 계산된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const vector: Vector3 = [1, 2, 3];

      // [1*1 + 2*2 + 3*3, 4*1 + 5*2 + 6*3, 7*1 + 8*2 + 9*3]
      // [1 + 4 + 9, 4 + 10 + 18, 7 + 16 + 27]
      // [14, 32, 50]
      const result = multiplyMatrixVector(matrix, vector);

      expect(result).toEqual([14, 32, 50]);
    });

    it('영 벡터와의 곱은 영 벡터를 반환한다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const zeroVector: Vector3 = [0, 0, 0];

      const result = multiplyMatrixVector(matrix, zeroVector);

      expect(result).toEqual([0, 0, 0]);
    });

    it('소수점 계산이 정확하다', () => {
      const matrix: Matrix3x3 = [
        [0.5, 0.5, 0],
        [0, 0.5, 0.5],
        [0.5, 0, 0.5],
      ];
      const vector: Vector3 = [2, 2, 2];

      const result = multiplyMatrixVector(matrix, vector);

      expect(result[0]).toBeCloseTo(2, 10);
      expect(result[1]).toBeCloseTo(2, 10);
      expect(result[2]).toBeCloseTo(2, 10);
    });
  });

  // =========================================
  // multiplyMatrices 테스트
  // =========================================

  describe('multiplyMatrices', () => {
    it('단위 행렬과의 곱은 원본 행렬을 반환한다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = multiplyMatrices(identity, matrix);

      expect(result).toEqual(matrix);
    });

    it('역순으로 단위 행렬을 곱해도 원본 행렬을 반환한다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = multiplyMatrices(matrix, identity);

      expect(result).toEqual(matrix);
    });

    it('대각 행렬의 곱이 정확히 계산된다', () => {
      const a: Matrix3x3 = [
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 4],
      ];
      const b: Matrix3x3 = [
        [5, 0, 0],
        [0, 6, 0],
        [0, 0, 7],
      ];

      const result = multiplyMatrices(a, b);

      expect(result).toEqual([
        [10, 0, 0],
        [0, 18, 0],
        [0, 0, 28],
      ]);
    });

    it('일반 행렬 곱이 정확히 계산된다', () => {
      const a: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const b: Matrix3x3 = [
        [9, 8, 7],
        [6, 5, 4],
        [3, 2, 1],
      ];

      const result = multiplyMatrices(a, b);

      // 손계산 검증
      expect(result[0][0]).toBe(1 * 9 + 2 * 6 + 3 * 3); // 30
      expect(result[0][1]).toBe(1 * 8 + 2 * 5 + 3 * 2); // 24
      expect(result[0][2]).toBe(1 * 7 + 2 * 4 + 3 * 1); // 18
    });
  });

  // =========================================
  // identityMatrix3x3 테스트
  // =========================================

  describe('identityMatrix3x3', () => {
    it('3x3 단위 행렬을 생성한다', () => {
      const identity = identityMatrix3x3();

      expect(identity).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it('대각선 요소가 모두 1이다', () => {
      const identity = identityMatrix3x3();

      expect(identity[0][0]).toBe(1);
      expect(identity[1][1]).toBe(1);
      expect(identity[2][2]).toBe(1);
    });

    it('비대각선 요소가 모두 0이다', () => {
      const identity = identityMatrix3x3();

      expect(identity[0][1]).toBe(0);
      expect(identity[0][2]).toBe(0);
      expect(identity[1][0]).toBe(0);
      expect(identity[1][2]).toBe(0);
      expect(identity[2][0]).toBe(0);
      expect(identity[2][1]).toBe(0);
    });
  });

  // =========================================
  // transposeMatrix 테스트
  // =========================================

  describe('transposeMatrix', () => {
    it('단위 행렬의 전치는 단위 행렬이다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];

      const result = transposeMatrix(identity);

      expect(result).toEqual(identity);
    });

    it('대칭 행렬의 전치는 원본과 같다', () => {
      const symmetric: Matrix3x3 = [
        [1, 2, 3],
        [2, 4, 5],
        [3, 5, 6],
      ];

      const result = transposeMatrix(symmetric);

      expect(result).toEqual(symmetric);
    });

    it('일반 행렬의 전치가 정확하다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = transposeMatrix(matrix);

      expect(result).toEqual([
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
      ]);
    });

    it('두 번 전치하면 원본이 된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = transposeMatrix(transposeMatrix(matrix));

      expect(result).toEqual(matrix);
    });
  });

  // =========================================
  // determinant3x3 테스트
  // =========================================

  describe('determinant3x3', () => {
    it('단위 행렬의 행렬식은 1이다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];

      const det = determinant3x3(identity);

      expect(det).toBe(1);
    });

    it('대각 행렬의 행렬식은 대각 요소의 곱이다', () => {
      const diagonal: Matrix3x3 = [
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 4],
      ];

      const det = determinant3x3(diagonal);

      expect(det).toBe(24); // 2 * 3 * 4
    });

    it('특이 행렬의 행렬식은 0이다', () => {
      const singular: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const det = determinant3x3(singular);

      expect(det).toBeCloseTo(0, 10);
    });

    it('일반 행렬의 행렬식이 정확하다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ];

      // det = 1*(1*0 - 4*6) - 2*(0*0 - 4*5) + 3*(0*6 - 1*5)
      // = 1*(-24) - 2*(-20) + 3*(-5)
      // = -24 + 40 - 15 = 1
      const det = determinant3x3(matrix);

      expect(det).toBe(1);
    });

    it('영 행렬의 행렬식은 0이다', () => {
      const zero: Matrix3x3 = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const det = determinant3x3(zero);

      expect(det).toBe(0);
    });
  });

  // =========================================
  // inverseMatrix3x3 테스트
  // =========================================

  describe('inverseMatrix3x3', () => {
    it('단위 행렬의 역행렬은 단위 행렬이다', () => {
      const identity: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];

      const inverse = inverseMatrix3x3(identity);

      expect(inverse).not.toBeNull();
      expect(inverse![0][0]).toBeCloseTo(1, 10);
      expect(inverse![1][1]).toBeCloseTo(1, 10);
      expect(inverse![2][2]).toBeCloseTo(1, 10);
    });

    it('대각 행렬의 역행렬이 정확하다', () => {
      const diagonal: Matrix3x3 = [
        [2, 0, 0],
        [0, 4, 0],
        [0, 0, 5],
      ];

      const inverse = inverseMatrix3x3(diagonal);

      expect(inverse).not.toBeNull();
      expect(inverse![0][0]).toBeCloseTo(0.5, 10);
      expect(inverse![1][1]).toBeCloseTo(0.25, 10);
      expect(inverse![2][2]).toBeCloseTo(0.2, 10);
    });

    it('특이 행렬의 역행렬은 null이다', () => {
      const singular: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const inverse = inverseMatrix3x3(singular);

      expect(inverse).toBeNull();
    });

    it('행렬과 역행렬의 곱은 단위 행렬이다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ];

      const inverse = inverseMatrix3x3(matrix);
      expect(inverse).not.toBeNull();

      const product = multiplyMatrices(matrix, inverse!);

      expect(product[0][0]).toBeCloseTo(1, 10);
      expect(product[1][1]).toBeCloseTo(1, 10);
      expect(product[2][2]).toBeCloseTo(1, 10);
      expect(product[0][1]).toBeCloseTo(0, 10);
      expect(product[0][2]).toBeCloseTo(0, 10);
    });

    it('영 행렬의 역행렬은 null이다', () => {
      const zero: Matrix3x3 = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const inverse = inverseMatrix3x3(zero);

      expect(inverse).toBeNull();
    });
  });

  // =========================================
  // scaleMatrix 테스트
  // =========================================

  describe('scaleMatrix', () => {
    it('스칼라 1을 곱하면 원본이 된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = scaleMatrix(matrix, 1);

      expect(result).toEqual(matrix);
    });

    it('스칼라 0을 곱하면 영 행렬이 된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = scaleMatrix(matrix, 0);

      expect(result).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });

    it('스칼라 2를 곱하면 모든 요소가 2배가 된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = scaleMatrix(matrix, 2);

      expect(result).toEqual([
        [2, 4, 6],
        [8, 10, 12],
        [14, 16, 18],
      ]);
    });

    it('음수 스칼라가 정확히 적용된다', () => {
      const matrix: Matrix3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = scaleMatrix(matrix, -1);

      expect(result).toEqual([
        [-1, -2, -3],
        [-4, -5, -6],
        [-7, -8, -9],
      ]);
    });

    it('소수 스칼라가 정확히 적용된다', () => {
      const matrix: Matrix3x3 = [
        [2, 4, 6],
        [8, 10, 12],
        [14, 16, 18],
      ];

      const result = scaleMatrix(matrix, 0.5);

      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });
  });

  // =========================================
  // diagonalMatrix 테스트
  // =========================================

  describe('diagonalMatrix', () => {
    it('단위 행렬을 생성한다', () => {
      const result = diagonalMatrix(1, 1, 1);

      expect(result).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it('스케일 행렬을 생성한다', () => {
      const result = diagonalMatrix(2, 3, 4);

      expect(result).toEqual([
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 4],
      ]);
    });

    it('영 행렬을 생성한다', () => {
      const result = diagonalMatrix(0, 0, 0);

      expect(result).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });

    it('음수 대각 요소를 허용한다', () => {
      const result = diagonalMatrix(-1, 2, -3);

      expect(result).toEqual([
        [-1, 0, 0],
        [0, 2, 0],
        [0, 0, -3],
      ]);
    });

    it('소수 대각 요소를 허용한다', () => {
      const result = diagonalMatrix(0.5, 1.5, 2.5);

      expect(result).toEqual([
        [0.5, 0, 0],
        [0, 1.5, 0],
        [0, 0, 2.5],
      ]);
    });

    it('대각 행렬의 행렬식은 대각 요소의 곱이다', () => {
      const matrix = diagonalMatrix(2, 3, 4);
      const det = determinant3x3(matrix);

      expect(det).toBe(24);
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('sRGB to XYZ 변환 검증', () => {
      // sRGB → XYZ 변환 행렬 (상수에서 가져옴)
      const sRGBtoXYZ: Matrix3x3 = [
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.072175],
        [0.0193339, 0.119192, 0.9503041],
      ];

      // 흰색 (1, 1, 1)을 XYZ로 변환
      const white: Vector3 = [1, 1, 1];
      const xyz = multiplyMatrixVector(sRGBtoXYZ, white);

      // D65 백색점 근처여야 함
      expect(xyz[0]).toBeCloseTo(0.95047, 3); // X
      expect(xyz[1]).toBeCloseTo(1.0, 3); // Y (휘도)
      expect(xyz[2]).toBeCloseTo(1.08883, 3); // Z
    });

    it('행렬 곱의 교환 법칙은 성립하지 않는다', () => {
      const a: Matrix3x3 = [
        [1, 2, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const b: Matrix3x3 = [
        [1, 0, 0],
        [0, 1, 3],
        [0, 0, 1],
      ];

      const ab = multiplyMatrices(a, b);
      const ba = multiplyMatrices(b, a);

      // AB ≠ BA
      expect(ab).not.toEqual(ba);
    });

    it('Bradford 색순응 변환 검증', () => {
      // Bradford 행렬
      const bradford: Matrix3x3 = [
        [0.8951, 0.2664, -0.1614],
        [-0.7502, 1.7135, 0.0367],
        [0.0389, -0.0685, 1.0296],
      ];

      // Bradford 역행렬
      const bradfordInv: Matrix3x3 = [
        [0.9869929, -0.1470543, 0.1599627],
        [0.4323053, 0.5183603, 0.0492912],
        [-0.0085287, 0.0400428, 0.9684867],
      ];

      // 곱이 단위 행렬에 가까워야 함
      const product = multiplyMatrices(bradford, bradfordInv);

      expect(product[0][0]).toBeCloseTo(1, 3);
      expect(product[1][1]).toBeCloseTo(1, 3);
      expect(product[2][2]).toBeCloseTo(1, 3);
    });
  });
});
