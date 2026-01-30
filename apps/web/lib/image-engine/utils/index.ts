/**
 * Image Engine 유틸리티 배럴 익스포트
 *
 * @module lib/image-engine/utils
 */

// 그레이스케일 변환
export {
  toGrayscale,
  toGrayscaleBT709,
  calculateMeanBrightness,
  calculateStdDev,
  calculateHistogram,
  normalizeHistogram,
  extractRegion,
  fromCanvasImageData,
  fromBase64,
} from './grayscale';

// 색공간 변환
export {
  srgbToLinear,
  linearToSrgb,
  normalizeRGB,
  denormalizeRGB,
  rgbToXYZ,
  xyzToRGB,
  xyzToChromaticity,
  rgbToChromaticity,
  xyzToLMS,
  lmsToXYZ,
  vonKriesAdaptation,
  rgbToYCbCr,
  ycbcrToRGB,
  estimateCCT,
  estimateCCTFromRGB,
  calculateColorDifference,
  calculateAverageRGB,
} from './color-space';

// 행렬 연산
export {
  multiplyMatrixVector,
  multiplyMatrices,
  identityMatrix3x3,
  transposeMatrix,
  determinant3x3,
  inverseMatrix3x3,
  scaleMatrix,
  diagonalMatrix,
} from './matrix';
export type { Matrix3x3, Vector3 } from './matrix';

// 벡터 연산
export {
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
} from './vector-math';
