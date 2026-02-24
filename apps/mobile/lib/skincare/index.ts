/**
 * 스킨케어 모듈 export
 */

// 타입
export type {
  SkinTypeId,
  SkinConcernId,
  ProductCategory,
  ProductCategoryInfo,
  TimeOfDay,
  RoutineStep,
  RoutineModifier,
  RoutineGenerationInput,
  RoutineGenerationResult,
  SkinAnalysisData,
  SkinMetrics,
  SkinMetricsDelta,
} from './types';

// 피부 분석 상수
export { SKIN_TYPE_DATA, SCORE_WEIGHTS } from './analysis-constants';
export type { SkinTypeInfo } from './analysis-constants';

// Mock 데이터 및 유틸리티
export {
  PRODUCT_CATEGORIES,
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  SKIN_CONCERN_TIPS,
  getCategoryInfo,
  calculateEstimatedTime,
  formatDuration,
  getSkinTypeLabel,
  getTimeOfDayLabel,
} from './mock';

// 루틴 생성 로직
export { generateRoutine } from './routine';

// Hook
export { useSkincareRoutine } from './useSkincareRoutine';
