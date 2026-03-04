/**
 * 캡슐 에코시스템 모듈 — 공개 API
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 * @see docs/adr/ADR-071-cross-module-scoring.md
 * @see docs/adr/ADR-073-one-button-daily.md
 *
 * P8: 외부에서는 이 index.ts를 통해서만 import
 */

// Types (공유 타입)
export type {
  ModuleCode,
  BeautyProfile,
  PersonalizationLevel,
  PCProfileData,
  SkinProfileData,
  BodyProfileData,
  WorkoutProfileData,
  NutritionProfileData,
  HairProfileData,
  MakeupProfileData,
  OralProfileData,
  FashionProfileData,
  CCSGrade,
  CompatibilityScore,
  PairwiseScore,
  Capsule,
  CapsuleItem,
  CapsuleStatus,
  DailyCapsule,
  DailyCapsuleStatus,
  DailyItem,
  DailyContext,
  DayOfWeek,
  SeasonType,
  RotationRecord,
  RotationReason,
  CrossDomainRule,
  CrossDomainRuleType,
} from '@/types/capsule';

// Constants
export {
  MODULE_LABELS,
  ALL_MODULE_CODES,
  CCS_WEIGHTS,
  CCS_THRESHOLD,
  CCS_GRADE_RANGES,
  PERSONALIZATION_LABELS,
  getCCSGrade,
  getPersonalizationLevel,
} from '@/types/capsule';

// Engine Interface
export type { CapsuleEngine } from './engine';

// Registry
export { registerDomain, getDomain, getAllDomains, hasDomain, getDomainCount } from './registry';

// Profile (BeautyProfile CRUD)
export {
  getBeautyProfile,
  upsertBeautyProfile,
  updateBeautyProfileField,
  buildProfileFromAssessments,
} from './profile';

// Profile Mappers (분석 API 후처리용)
export {
  mapPCAssessment,
  mapSkinAssessment,
  mapBodyAssessment,
  mapPostureToWorkout,
  mapNutritionSettings,
  mapHairAssessment,
  mapMakeupAnalysis,
  mapOralHealthAssessment,
  mapFashionFromBodyAndInventory,
} from './profile-mappers';

// Scoring (Phase 3: CCS 계산)
export { calculateCCS, intraDomainScore, crossDomainScore, profileFitScore } from './scoring';
export { findLowScoreItems, calculateDomainCompatibility } from './scoring';
export type { CCSResult, DomainItemGroup } from './scoring';

// Domain Engines (Phase 3 + Phase 5)
export { registerPhase3Domains, registerAllDomains } from './domains';
export { skinEngine } from './domains/skin';
export { fashionEngine } from './domains/fashion';
export { nutritionEngine } from './domains/nutrition';
export { workoutEngine } from './domains/workout';
export { hairEngine } from './domains/hair';
export { makeupEngine } from './domains/makeup';
export { personalColorEngine } from './domains/personal-color';
export { oralEngine } from './domains/oral';
export { bodyEngine } from './domains/body';

// Domain Item Types
export type {
  SkinProduct,
  FashionItem,
  NutritionItem,
  NutrientInfo,
  WorkoutPlan,
  HairProduct,
  MakeupProduct,
  PCPalette,
  OralProduct,
  BodyPlan,
} from './domain-types';

// Capsule Repository (CRUD)
export {
  getCapsule,
  createCapsule,
  addItemToCapsule,
  removeItemFromCapsule,
  updateCapsuleCCS,
  updateCapsuleRotation,
  getCrossDomainRules,
} from './capsule-repository';

// Context (Phase 4: 컨텍스트 수집)
export { collectContext, getDayOfWeek, getSeason } from './context';

// Rotation (Phase 4: 로테이션 엔진)
export { findDomainsNeedingRotation, rotateCapsule } from './rotation';
export type { RotationResult } from './rotation';

// Daily Capsule (Phase 4: 6단계 파이프라인)
export { generateDailyCapsule, checkDailyItem, getTodayDailyCapsule } from './daily';

// Shopping Companion (Phase 5: 갭 분석)
export { analyzeGap } from './shopping';
export type { GapItem, GapAnalysisResult, DomainCapsuleStatus } from './shopping';
