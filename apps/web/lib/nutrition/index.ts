/**
 * N-1 영양 모듈 공개 API (Barrel Export)
 *
 * P8 원칙: 모듈 경계 준수
 * - 외부에서는 이 index.ts를 통해서만 import
 * - 내부 구현 파일 직접 import 금지
 *
 * @module lib/nutrition
 * @description BMR/TDEE 계산, RDA 데이터베이스, 영양소 평가, 시너지 분석
 *
 * @example
 * import { calculateBMR, KOREAN_RDA, evaluateNutrientIntake } from '@/lib/nutrition';
 *
 * const profile = { gender: 'male', weightKg: 70, heightCm: 175, age: 30 };
 * const bmr = calculateBMR(profile);
 */

// ============================================
// RDA 데이터베이스
// ============================================

export {
  KOREAN_RDA,
  getRDA,
  getNutrientRDA,
  getUpperLimits,
  getAllNutrientIds,
} from './rda-database';

export type { RDAGender, NutrientId, NutrientRDA, GenderRDA, RDADatabase } from './rda-database';

// ============================================
// BMR/TDEE 계산 (Mifflin-St Jeor)
// ============================================

export {
  calculateBMR,
  calculateTDEE,
  calculateEnergyExpenditure,
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_LEVEL_LABELS,
  verifyMifflinStJeorFormula,
  validateProfile,
} from './bmr-calculator';

export type { Gender, ActivityLevel, UserProfile, EnergyExpenditureResult } from './bmr-calculator';

// ============================================
// 영양소 시너지/길항 매트릭스
// ============================================

export {
  NUTRIENT_INTERACTION_MATRIX,
  getInteractionFactor,
  getInteractionType,
  applyInteractionFactor,
  getSynergyNutrients,
  getAntagonistNutrients,
  getInteractionInfo,
} from './nutrient-synergy';

export type { InteractionFactor, InteractionType, NutrientInteraction } from './nutrient-synergy';

// ============================================
// 영양소 섭취량 평가
// ============================================

export {
  evaluateNutrientStatus,
  evaluateNutrientIntake,
  calculateBalanceIndex,
} from './nutrient-evaluation';

export type {
  NutrientStatusLevel,
  NutrientStatus,
  NutrientIntake,
  NutrientEvaluationResult,
} from './nutrient-evaluation';

// ============================================
// 개인화 프로필링 (N-1 확장)
// ============================================

export {
  calculatePersonalizedRDA,
  getPersonalizedNutrientRDA,
  calculateIntakePercentage,
  evaluateIntakeStatus,
  getIntakeRange,
  getAgeGroup,
} from './personalized-profile';

export type {
  AgeGroup,
  SpecialCondition,
  HealthGoal,
  NutritionProfile,
  PersonalizedRDA,
  PersonalizedNutrientRDA,
} from './personalized-profile';

// ============================================
// 기존 모듈 (하위 호환성)
// ============================================

// 기존 calculateBMR.ts는 Harris-Benedict 사용
// 새 bmr-calculator.ts는 Mifflin-St Jeor 사용
// 점진적 마이그레이션을 위해 기존 export 유지
export {
  calculateAge,
  calculateAll,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateBMR as calculateBMRHarrisBenedict,
  calculateTDEE as calculateTDEELegacy,
  ACTIVITY_LEVEL_LABELS as ACTIVITY_LEVEL_LABELS_LEGACY,
} from './calculateBMR';

// ============================================
// 레시피 매칭 시스템 (Phase K-4)
// ============================================

export {
  recommendRecipes,
  getRecipesByGoal,
  findSimilarIngredient,
  calculateDailyCalories,
  calculateDailyProtein,
  calculateGoalBasedMacros,
  calculateAllGoalComparisons,
  mapToFitnessGoal,
  SAMPLE_RECIPES,
  NUTRITION_GOAL_LABELS,
  NUTRITION_TARGETS,
  INGREDIENT_SYNONYMS,
  INGREDIENT_CATEGORY_LABELS,
} from './recipe-matcher';

export type {
  NutritionGoal,
  GoalBasedMacros,
  IngredientCategory,
  RecipeIngredient,
  Recipe,
  RecipeMatchResult,
} from './recipe-matcher';
