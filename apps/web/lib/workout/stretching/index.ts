/**
 * W-2 스트레칭 모듈 공개 API
 *
 * @module lib/workout/stretching
 * @description Janda 교차증후군 기반 스트레칭 처방 및 루틴 생성
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 *
 * P8 모듈 경계 규칙 준수:
 * - 외부는 이 index.ts를 통해서만 import
 * - 내부 구현 파일 직접 import 금지
 */

// ============================================
// 자세 매핑 (posture-mapping)
// ============================================
export {
  // 프로토콜
  POSTURE_PROTOCOLS,
  SPORT_STRETCH_PROTOCOLS,
  STRETCH_DATABASE,
  MUSCLE_NAME_KO,

  // 함수
  getStretchesForMuscle,
  getStretchProtocolForImbalance,
  mapPostureToStretches,
  getStretchesForSport,

  // 타입 (re-export)
  type PostureProtocol,
} from './posture-mapping';

// ============================================
// 데이터베이스 헬퍼 (database)
// ============================================
export {
  // 검색 함수
  getStretchesByCategory,
  getStretchesByType,
  getStretchesByDifficulty,
  getStretchById,
} from './database';

// ============================================
// 루틴 생성 (routine-generator)
// ============================================
export {
  // 상수
  ACSM_GUIDELINES,
  MEDICAL_DISCLAIMER,

  // 처방 생성
  generatePostureCorrectionPrescription,
  generateSportStretchingPrescription,
  generateGeneralFlexibilityPrescription,

  // 주간 플랜
  generateWeeklyStretchingPlan,

  // 요약
  generatePrescriptionSummary,
  generateWeeklyPlanSummary,
} from './routine-generator';

// ============================================
// C-2 체형분석 통합 (posture-integration)
// ============================================
export {
  // 타입 매핑
  POSTURE_ISSUE_TO_IMBALANCE_MAP,
  mapPostureIssueToImbalance,
  detectCompoundSyndromes,

  // 변환 함수
  convertToStretchingPostureAnalysis,
  createStretchingProfileFromBodyAnalysis,
  generateStretchingFromBodyAnalysis,

  // 유틸리티
  calculateStretchingNeed,
  getTargetMusclesFromPosture,
  prioritizePostureIssues,
} from './posture-integration';

// ============================================
// Janda 교차증후군 프로토콜 (janda-protocol)
// ============================================
export {
  // 프로토콜
  JANDA_PROTOCOLS,

  // 조회 함수
  getJandaProtocol,
  getProgressionPhase,
  getExercisesInNASMOrder,
  findExerciseById,
  detectCompoundSyndrome,

  // 처방 생성
  generateJandaPrescription,
  generateCompoundPrescription,
  generateJandaPrescriptionSummary,

  // 타입
  type JandaProtocol,
  type JandaPrescription,
  type ProgressionPhase,
  type NASMPhase,
} from './janda-protocol';

// ============================================
// 스포츠 워밍업/쿨다운 (sport-warmup)
// ============================================
export {
  // 프로토콜
  SPORT_PROTOCOLS,
  SPORT_NAME_KO,

  // 조회 함수
  getSportProtocol,
  getWarmupExercises,
  getCooldownExercises,
  getKeyMuscles,
  getInjuryInfo,

  // 처방 생성
  generateSportPrescription,
  generateFullSportSession,
  generateSportPrescriptionSummary,

  // 타입
  type SportProtocol,
  type SportProtocolPhase,
  type SportStretchingPrescription,
} from './sport-warmup';

// ============================================
// 타입 재내보내기
// ============================================
export type {
  // 기본 타입
  StretchType,
  StretchCategory,
  SportType,
  PostureImbalanceType,
  MuscleGroup,
  Equipment,
  Difficulty,

  // 운동 정의
  StretchExercise,
  ExerciseModification,

  // 자세 분석
  PostureAnalysisResult,
  PostureImbalance,

  // 사용자 프로필
  StretchingUserProfile,
  SpecialCondition,

  // 처방 및 플랜
  PrescribedStretch,
  StretchingPrescription,
  WeeklyStretchingPlan,
  DailyRoutine,

  // 진행 추적
  StretchingSession,
  CompletedExercise,
  ROMSelfReport,
  PainReport,

  // API 타입
  StretchingPrescriptionRequest,
  StretchingPrescriptionResponse,
  RoutineGeneratorInput,
  RoutineGeneratorOutput,
} from '@/types/stretching';
