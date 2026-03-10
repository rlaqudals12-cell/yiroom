/**
 * C-2: 체형분석 v2 (MediaPipe 33)
 *
 * @module lib/analysis/body-v2
 * @description MediaPipe Pose 33 랜드마크 기반 체형 분석 모듈
 * @see {@link docs/specs/SDD-BODY-ANALYSIS-v2.md} 스펙 문서
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 *
 * @example
 * ```typescript
 * import {
 *   detectPose,
 *   calculateBodyRatios,
 *   classifyBodyType,
 *   analyzePosture,
 *   generateMockBodyAnalysisResult,
 * } from '@/lib/analysis/body-v2';
 *
 * // 전체 분석 플로우
 * const poseResult = await detectPose(imageBase64);
 * const ratios = calculateBodyRatios(poseResult);
 * const bodyType = classifyBodyType(ratios);
 * const posture = analyzePosture(poseResult);
 *
 * // Mock Fallback
 * const fallback = generateMockBodyAnalysisResult();
 * ```
 */

// =============================================================================
// 타입 내보내기
// =============================================================================

export type {
  // 기본 타입
  Point3D,
  Landmark33,

  // Pose 관련
  PoseDetectionResult,

  // 체형 관련
  BodyRatios,
  BodyShapeType,
  BodyShapeInfo,

  // 자세 관련
  PostureAnalysis,
  PostureIssue,

  // 분석 입출력
  BodyAnalysisV2Input,
  BodyAnalysisV2Result,
} from './types';

// =============================================================================
// 상수 내보내기
// =============================================================================

export {
  // 랜드마크 인덱스
  POSE_LANDMARK_INDEX,

  // 체형 정보
  BODY_SHAPE_INFO,
  BODY_SHAPE_THRESHOLDS,

  // 자세 관련
  POSTURE_ISSUE_LABELS,
  POSTURE_EXERCISES,
} from './types';

// =============================================================================
// Pose 검출 함수 (C2-1)
// =============================================================================

export {
  // Pose 초기화/해제
  initPose,
  closePose,
  isPoseLoaded,

  // 검출
  detectPose,

  // 유틸리티
  validatePoseLandmarks,
  landmarkToPixel,
  calculateLandmarkDistance,
  calculateLandmarkDistance3D,
  calculateMidpoint,
} from './pose-detector';

// =============================================================================
// 체형 비율 계산 (C2-2)
// =============================================================================

export {
  calculateBodyRatios,
  convertToCentimeters,
  calculateRatioConfidence,
  calculateSymmetry,
} from './ratio-calculator';

// =============================================================================
// 체형 유형 분류 (C2-3)
// =============================================================================

export {
  classifyBodyType,
  getBodyShapeInfo,
  getAllBodyShapeInfo,
  calculateClassificationConfidence,
  getStylingPriorities,
  getStylesToAvoid,
} from './type-classifier';

// =============================================================================
// 자세 교정 추천 (C2-4)
// =============================================================================

export {
  analyzePosture,
  getPostureIssueLabel,
  calculatePostureScore,
  getPriorityIssues,
  getRecommendedExercises,
  generatePostureSummary,
} from './posture-advisor';

// =============================================================================
// Mock 데이터 생성 (C2-6)
// =============================================================================

export {
  generateMockLandmarks,
  generateMockPoseResult,
  generateMockBodyRatios,
  generateMockPostureAnalysis,
  generateMockBodyAnalysisResult,
  mockGenerators,
} from './mock';
