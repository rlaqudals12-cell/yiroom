/**
 * 행렬 연산 유틸리티
 *
 * @module lib/image-engine/utils/matrix
 * @description 색공간 변환에 필요한 행렬 연산
 */

/** 3x3 행렬 타입 */
export type Matrix3x3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number]
];

/** 3차원 벡터 타입 */
export type Vector3 = [number, number, number];

/**
 * 3x3 행렬과 3차원 벡터의 곱
 *
 * @param matrix - 3x3 행렬
 * @param vector - 3차원 벡터
 * @returns 결과 벡터
 */
export function multiplyMatrixVector(
  matrix: Matrix3x3 | readonly (readonly number[])[],
  vector: Vector3 | readonly number[]
): Vector3 {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

/**
 * 3x3 행렬의 곱
 *
 * @param a - 첫 번째 행렬
 * @param b - 두 번째 행렬
 * @returns 결과 행렬
 */
export function multiplyMatrices(
  a: Matrix3x3 | readonly (readonly number[])[],
  b: Matrix3x3 | readonly (readonly number[])[]
): Matrix3x3 {
  const result: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result as unknown as Matrix3x3;
}

/**
 * 3x3 단위 행렬 생성
 *
 * @returns 단위 행렬
 */
export function identityMatrix3x3(): Matrix3x3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

/**
 * 3x3 행렬의 전치
 *
 * @param matrix - 원본 행렬
 * @returns 전치 행렬
 */
export function transposeMatrix(matrix: Matrix3x3 | readonly (readonly number[])[]): Matrix3x3 {
  return [
    [matrix[0][0], matrix[1][0], matrix[2][0]],
    [matrix[0][1], matrix[1][1], matrix[2][1]],
    [matrix[0][2], matrix[1][2], matrix[2][2]],
  ];
}

/**
 * 3x3 행렬의 행렬식 계산
 *
 * @param matrix - 3x3 행렬
 * @returns 행렬식 값
 */
export function determinant3x3(matrix: Matrix3x3 | readonly (readonly number[])[]): number {
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;

  return (
    a * (e * i - f * h) -
    b * (d * i - f * g) +
    c * (d * h - e * g)
  );
}

/**
 * 3x3 행렬의 역행렬 계산
 *
 * @param matrix - 3x3 행렬
 * @returns 역행렬 (역행렬이 없으면 null)
 */
export function inverseMatrix3x3(
  matrix: Matrix3x3 | readonly (readonly number[])[]
): Matrix3x3 | null {
  const det = determinant3x3(matrix);

  if (Math.abs(det) < 1e-10) {
    return null; // 특이 행렬
  }

  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;

  const invDet = 1 / det;

  return [
    [
      (e * i - f * h) * invDet,
      (c * h - b * i) * invDet,
      (b * f - c * e) * invDet,
    ],
    [
      (f * g - d * i) * invDet,
      (a * i - c * g) * invDet,
      (c * d - a * f) * invDet,
    ],
    [
      (d * h - e * g) * invDet,
      (b * g - a * h) * invDet,
      (a * e - b * d) * invDet,
    ],
  ];
}

/**
 * 3x3 행렬에 스칼라 곱
 *
 * @param matrix - 3x3 행렬
 * @param scalar - 스칼라 값
 * @returns 스칼라 곱 결과
 */
export function scaleMatrix(
  matrix: Matrix3x3 | readonly (readonly number[])[],
  scalar: number
): Matrix3x3 {
  return [
    [matrix[0][0] * scalar, matrix[0][1] * scalar, matrix[0][2] * scalar],
    [matrix[1][0] * scalar, matrix[1][1] * scalar, matrix[1][2] * scalar],
    [matrix[2][0] * scalar, matrix[2][1] * scalar, matrix[2][2] * scalar],
  ];
}

/**
 * 대각 행렬 생성
 *
 * @param d1 - 첫 번째 대각 요소
 * @param d2 - 두 번째 대각 요소
 * @param d3 - 세 번째 대각 요소
 * @returns 대각 행렬
 */
export function diagonalMatrix(d1: number, d2: number, d3: number): Matrix3x3 {
  return [
    [d1, 0, 0],
    [0, d2, 0],
    [0, 0, d3],
  ];
}
