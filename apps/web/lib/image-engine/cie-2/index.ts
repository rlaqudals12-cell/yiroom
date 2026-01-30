/**
 * CIE-2: 얼굴 감지 및 랜드마크 모듈 배럴 익스포트
 *
 * @module lib/image-engine/cie-2
 * @description MediaPipe 기반 얼굴 감지, 468-point 랜드마크 추출
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 *
 * @example
 * import { processMediaPipeResults, processMock } from '@/lib/image-engine/cie-2';
 *
 * // 실제 MediaPipe 결과로 처리
 * const result = processMediaPipeResults(imageData, mediaPipeResults);
 *
 * // 개발용 Mock 처리
 * const mockResult = processMock(imageData);
 */

// 메인 프로세서
export {
  processMediaPipeResults,
  processMock,
  isMediaPipeAvailable,
  generateMockMediaPipeResult,
} from './processor';

// 얼굴 감지
export {
  convertLandmarksToPoints,
  calculateBoundingBoxFromLandmarks,
  getLandmarkPoint,
  calculateFaceAngle,
  calculateFrontalityFromLandmarks,
  convertToDetectedFace,
  selectBestFace,
  validateFaceAngle,
} from './face-detector';
export type { MediaPipeFaceResult } from './face-detector';

// 영역 추출
export {
  normalizeBoundingBox,
  extractRegionFromImage,
  getPaddedBoundingBox,
  extractFaceRegion,
  extractSquareFaceRegion,
} from './region-extractor';

// Fallback
export {
  generateCIE2Fallback,
  generateNoFaceFallback,
  generateErrorFallback,
  generateRandomCIE2Mock,
  generateFrontalityFallback,
} from './fallback';
