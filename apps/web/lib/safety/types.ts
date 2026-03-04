/**
 * Safety Profile 타입 정의
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/specs/SDD-SAFETY-PROFILE.md
 *
 * 3-Level 안전성 분류:
 * Level 1: 알레르겐 교차반응 (BLOCK, FNR ≤ 0.1%)
 * Level 2: 금기사항/상호작용 (WARN, FNR ≤ 5%)
 * Level 3: EWG 일반 안전성 (INFORM, FNR ≤ 15%)
 */

// =============================================================================
// Safety Profile
// =============================================================================

/** 사용자 안전성 프로필 (복호화된 상태) */
export interface SafetyProfile {
  userId: string;
  allergies: string[];
  conditions: string[];
  skinConditions: string[];
  medications: string[];
  age: number | null;
  consentGiven: boolean;
  consentVersion: string;
  updatedAt: string;
}

/** DB 행 구조 (암호화된 상태) */
export interface SafetyProfileRow {
  id: string;
  clerk_user_id: string;
  allergies_encrypted: string | null;
  conditions_encrypted: string | null;
  skin_conditions_encrypted: string | null;
  medications_encrypted: string | null;
  age: number | null;
  consent_given: boolean;
  consent_given_at: string | null;
  consent_version: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Safety Alert / Report
// =============================================================================

/** 안전성 경고 레벨 */
export type SafetyLevel = 1 | 2 | 3;

/** 안전성 경고 타입 */
export type SafetyAlertType = 'ALLERGEN' | 'CONTRAINDICATION' | 'INTERACTION' | 'EWG';

/** 안전성 조치 */
export type SafetyAction = 'BLOCK' | 'WARN' | 'INFORM';

/** 안전성 등급 */
export type SafetyGrade = 'SAFE' | 'CAUTION' | 'DANGER';

/** 개별 안전성 경고 */
export interface SafetyAlert {
  level: SafetyLevel;
  type: SafetyAlertType;
  ingredient: string;
  reason: string;
  action: SafetyAction;
  source: string;
}

/** 제품 안전성 보고서 */
export interface SafetyReport {
  productId: string;
  grade: SafetyGrade;
  score: number;
  alerts: SafetyAlert[];
  blockedIngredients: string[];
  disclaimer: string;
}

// =============================================================================
// 교차반응 / 금기사항
// =============================================================================

/** 교차반응 그룹 */
export interface CrossReactivityGroup {
  id: string;
  name: string;
  nameKo: string;
  members: string[];
}

/** 금기사항 규칙 */
export interface ContraindicationRule {
  condition: string;
  ingredients: string[];
  reason: string;
  level: SafetyLevel;
}

/** 연령 제한 규칙 */
export interface AgeRestrictionRule {
  ingredient: string;
  minAge: number;
  reason: string;
}

/** 성분 상호작용 규칙 */
export interface InteractionRule {
  ingredientA: string;
  ingredientB: string;
  type: 'pH_conflict' | 'oxidative' | 'chelation';
  reason: string;
  level: SafetyLevel;
}

// =============================================================================
// 파이프라인 입출력
// =============================================================================

/** 안전성 검사 입력 */
export interface SafetyCheckInput {
  productId: string;
  ingredients: string[];
  profile: SafetyProfile;
}

/** 파이프라인 중간 결과 */
export interface PipelineContext {
  input: SafetyCheckInput;
  alerts: SafetyAlert[];
  blockedIngredients: string[];
  score: number;
}
