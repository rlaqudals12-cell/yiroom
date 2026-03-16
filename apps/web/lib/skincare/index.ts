// lib/skincare 공개 API

// 루틴 생성
export {
  generateRoutine,
  enrichRoutineWithProducts,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  getTimeOfDayEmoji,
} from './routine';

// 상관관계 분석
export {
  calculatePearson,
  calculateConfidence,
  generateInsight,
  generateRecommendation,
  analyzeCorrelations,
  calculateFactorAverage,
  calculateConditionAverage,
  analyzeTrend,
  interpretTrend,
} from './correlation';

// 마스크 추천
export {
  recommendMasks,
  recommendMaskForToday,
  recommendMultiMasking,
  MASK_TYPES,
} from './mask-recommendation';
export type {
  MaskType,
  MaskRecommendation,
  MaskSchedule,
  WeeklyMaskPlan,
} from './mask-recommendation';

// 집중 솔루션
export {
  recommendSolutions,
  recommendAcnePatchType,
  checkSolutionCompatibility,
  TARGETED_SOLUTIONS,
} from './targeted-solutions';
export type { SolutionType, TargetedSolution, SolutionRecommendation } from './targeted-solutions';

// 조건부 루틴
export {
  applyConditionalModifications,
  getHydrationLabel,
  getTodayConcernLabel,
  createQuickConditionCheck,
  HYGIENE_PREP_STEPS,
} from './conditional-routine';
export type {
  HydrationLevel,
  TodayConcern,
  TodaySkinCondition,
  ConditionalModification,
  ConditionalRoutineResult,
  HygieneStep,
} from './conditional-routine';

// 인벤토리-루틴 동기화
export {
  detectProductCategory,
  sortByLayeringOrder,
  generateRoutineFromShelf,
  shouldRefreshRoutine,
} from './shelf-routine-sync';
export type { ShelfRoutineSync, ProductLayeringInfo } from './shelf-routine-sync';
