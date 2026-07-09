// lib/skincare 공개 API

// 루틴 생성
export {
  generateRoutine,
  enrichRoutineWithProducts,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  getTimeOfDayEmoji,
} from './routine';

// 피부 고민 파생 (단일 정본 — ADR-117)
export { deriveConcernsFromScores, CONCERN_THRESHOLD } from './concerns';

// 피부 목표 (사용자 선택 축 — ADR-117 루틴 v2)
export {
  SKIN_GOALS,
  SKIN_GOAL_IDS,
  GOAL_TO_CONCERN,
  getSkinGoalLabel,
  mergeGoalsIntoConcerns,
} from './skin-goals';
export type { SkinGoalId } from './skin-goals';

// 스텝별 사용법 (루틴 초보자 how-to — T1)
export { STEP_HOWTO, getStepHowTo, HAND_WASH_PRESTEP } from './step-howto';
export type { StepHowTo, StepHowToKey } from './step-howto';

// 활성 성분 카테고리 (보유 제품 → 활성 탐지)
export {
  ACTIVE_INGREDIENT_CATEGORIES,
  detectItemActives,
  detectOwnedActives,
} from './active-categories';
export type { ActiveCategory } from './active-categories';

// 단계 계획 (장벽 회복 → 목표 케어)
export { deriveCarePhase } from './care-phase';
export type { CarePhase } from './care-phase';

// 스킨 사이클링 (주간 야간 주기)
export { composeWeeklyCycle, getEveningCycle, CYCLE_LABELS } from './cycling';
export type { CyclingFocus, EveningCycle, WeeklyCycle } from './cycling';

// 캡슐 화장대 (중복 자산 지적)
export { findRedundantProducts } from './capsule-vanity';
export type { RedundancyNote } from './capsule-vanity';

// 소진 예측 어댑터 (PAO 기반)
export { estimateShelfDepletion } from './shelf-depletion';
export type { ShelfDepletion } from './shelf-depletion';

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

// 피부 시술 추천 (ADR-045)
export {
  recommendTreatments,
  extractTreatmentConcerns,
  TREATMENT_DISCLAIMER,
  EXCLUDED_MEDICAL_ACTS,
} from './treatment-recommender';
export type { TreatmentOption, TreatmentRecommendation } from './treatment-recommender';
