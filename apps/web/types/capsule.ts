/**
 * 캡슐 에코시스템 공유 타입 정의
 * @description BeautyProfile, 캡슐 구조, CCS 스코어링 타입
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 * @see docs/adr/ADR-071-cross-module-scoring.md
 */

// =============================================================================
// 모듈 코드 (9개 분석 모듈)
// =============================================================================

export type ModuleCode = 'PC' | 'S' | 'C' | 'W' | 'N' | 'H' | 'M' | 'OH' | 'Fashion';

export const MODULE_LABELS: Record<ModuleCode, string> = {
  PC: '퍼스널컬러',
  S: '피부',
  C: '체형',
  W: '운동',
  N: '영양',
  H: '헤어',
  M: '메이크업',
  OH: '구강건강',
  Fashion: '패션',
};

export const ALL_MODULE_CODES: readonly ModuleCode[] = [
  'PC',
  'S',
  'C',
  'W',
  'N',
  'H',
  'M',
  'OH',
  'Fashion',
] as const;

// =============================================================================
// BeautyProfile (9모듈 통합 프로필)
// =============================================================================

/** 퍼스널컬러 분석 요약 */
export interface PCProfileData {
  season: string;
  subType: string;
  palette: string[];
  /** 베스트컬러 이름 (palette hex와 짝) — 솔루션 문구용 예: "드라이 로즈" */
  paletteNames?: string[];
}

/** 피부 분석 요약 */
export interface SkinProfileData {
  type: string;
  concerns: string[];
  scores: Record<string, number>;
  /** 추천 성분 이름 (분석 결과 recommendations.ingredients) — 솔루션 문구용 */
  recommendedIngredients?: string[];
  /** 파운데이션 진단 (foundation_recommendation) — 예: "쿨톤 베이지 계열" */
  foundation?: string;
}

/** 체형 분석 요약 */
export interface BodyProfileData {
  shape: string;
  measurements: Record<string, number>;
  /** 체형 스타일 추천 (style_recommendations) — 코디 솔루션 문구용 */
  styleTips?: {
    tops?: string[];
    bottoms?: string[];
    outerwear?: string[];
    avoid?: string[];
  };
}

/** 운동 프로필 요약 */
export interface WorkoutProfileData {
  fitnessLevel: string;
  goals: string[];
  history: string[];
}

/** 영양 프로필 요약 */
export interface NutritionProfileData {
  deficiencies: string[];
  dietType: string;
  allergies: string[];
}

/** 헤어 분석 요약 */
export interface HairProfileData {
  type: string;
  scalp: string;
  concerns: string[];
}

/** 메이크업 프로필 요약 */
export interface MakeupProfileData {
  preferences: Record<string, string>;
  skillLevel: string;
}

/** 구강건강 프로필 요약 */
export interface OralProfileData {
  conditions: string[];
  goals: string[];
}

/** 패션 프로필 요약 */
export interface FashionProfileData {
  style: string;
  sizeProfile: Record<string, string>;
  wardrobe: string[];
}

/**
 * BeautyProfile — 9개 분석 모듈 통합 인터페이스
 * @see ADR-069 Section 3.1
 */
export interface BeautyProfile {
  userId: string;
  updatedAt: string;

  // 9모듈 분석 결과 (각 모듈 완료 시 채워짐)
  personalColor?: PCProfileData;
  skin?: SkinProfileData;
  body?: BodyProfileData;
  workout?: WorkoutProfileData;
  nutrition?: NutritionProfileData;
  hair?: HairProfileData;
  makeup?: MakeupProfileData;
  oral?: OralProfileData;
  fashion?: FashionProfileData;

  // 메타데이터
  completedModules: ModuleCode[];
  personalizationLevel: PersonalizationLevel;
  lastFullUpdate: string;
}

// =============================================================================
// 개인화 레벨 (C3 원칙)
// =============================================================================

/** 개인화 정밀도 단계 */
export type PersonalizationLevel = 1 | 2 | 3 | 4;

export const PERSONALIZATION_LABELS: Record<PersonalizationLevel, string> = {
  1: '기본 분류',
  2: '상세 점수',
  3: '사용 이력',
  4: '행동 패턴',
};

// 완료 모듈 수 → 개인화 레벨 매핑
export function getPersonalizationLevel(completedCount: number): PersonalizationLevel {
  if (completedCount >= 7) return 4;
  if (completedCount >= 4) return 3;
  if (completedCount >= 2) return 2;
  return 1;
}

// =============================================================================
// CCS (Capsule Compatibility Score) — ADR-071
// =============================================================================

/** CCS 등급 */
export type CCSGrade = 'S' | 'A' | 'B' | 'C' | 'F';

/** CCS 3계층 가중치 */
export const CCS_WEIGHTS = {
  L1_INTRA_DOMAIN: 0.4,
  L2_CROSS_DOMAIN: 0.25,
  L3_PROFILE_FIT: 0.35,
} as const;

/** CCS 임계값 */
export const CCS_THRESHOLD = 70;

/** CCS 등급 범위 */
export const CCS_GRADE_RANGES: Record<CCSGrade, [number, number]> = {
  S: [90, 100],
  A: [70, 89],
  B: [50, 69],
  C: [30, 49],
  F: [0, 29],
};

export function getCCSGrade(score: number): CCSGrade {
  if (score >= 90) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'F';
}

/** 호환성 점수 (아이템 쌍 간) */
export interface CompatibilityScore {
  overall: number;
  layer1: number;
  layer2: number;
  layer3: number;
}

/** 아이템 쌍 점수 */
export interface PairwiseScore {
  itemAId: string;
  itemBId: string;
  domain: 'same' | 'different';
  score: number;
}

// =============================================================================
// 캡슐 구조 — ADR-069
// =============================================================================

/** 캡슐 상태 */
export type CapsuleStatus = 'active' | 'archived';

/** 캡슐 — 도메인별 아이템 컬렉션 */
export interface Capsule<T> {
  id: string;
  userId: string;
  domainId: string;
  items: CapsuleItem<T>[];
  ccs: number;
  status: CapsuleStatus;
  createdAt: string;
  updatedAt: string;
  lastRotation: string;
}

/** 캡슐 아이템 — 개별 추천 항목 */
export interface CapsuleItem<T> {
  id: string;
  capsuleId: string;
  item: T;
  profileFitScore: number;
  usageCount: number;
  lastUsed: string | null;
  addedAt: string;
}

// =============================================================================
// Daily Capsule — ADR-073
// =============================================================================

/** Daily Capsule 상태 */
export type DailyCapsuleStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** 오늘의 캡슐 */
export interface DailyCapsule {
  id: string;
  userId: string;
  date: string;
  items: DailyItem[];
  totalCcs: number;
  estimatedMinutes: number;
  status: DailyCapsuleStatus;
  completedAt: string | null;
  createdAt: string;
}

/** 아이템 실행 시간대 — 사용자 멘탈 모델(아침 루틴/저녁 루틴)에 맞춘 그룹핑용 */
export type DailyItemTimeOfDay = 'morning' | 'evening' | 'anytime';

/** 오늘의 개별 아이템 */
export interface DailyItem {
  id: string;
  moduleCode: ModuleCode;
  name: string;
  reason: string;
  compatibilityScore: number;
  isChecked: boolean;
  /** 선택적(구 데이터 하위호환) — 없으면 'anytime' 취급 */
  timeOfDay?: DailyItemTimeOfDay;
  /**
   * 모듈 그룹 개인화 근거 (그룹 첫 아이템에만 부여) — 예: "복합성 피부 맞춤 · 수분이
   * 낮아 보습 강화". 상세 페이지 모듈 헤더 아래에 노출해 "내 분석이 반영됐다"를 가시화.
   */
  groupNote?: string;
  /**
   * 실행 솔루션 한 줄 — "무엇을/어떻게"의 구체 지침. 내 분석 데이터에서 조립
   * (추천 성분·파운데이션 진단·베스트컬러 이름·체형 스타일 추천). 없으면 미노출.
   */
  solution?: string;
  /** 아이템 소스 카테고리 (제품 매칭용 내부 필드) — 예: 'toner', 'lip', 'shampoo' */
  category?: string;
  /**
   * 솔루션에 대응하는 실제 제품 (cosmetic_products에서 프로필 기준 최고 매칭 1개).
   * 없으면 미노출 — 매칭 실패 시 지어내지 않는다.
   */
  solutionProduct?: DailySolutionProduct;
}

/** 데일리 아이템에 붙는 실제 제품 카드 축약 — 상세는 /products/cosmetic/{id} */
export interface DailySolutionProduct {
  id: string;
  name: string;
  brand: string;
  priceKrw?: number;
  imageUrl?: string;
  /**
   * 제품 출처 (ADR-117) — 'shelf'는 내 제품함 보유 제품(그것을 배치),
   * 'catalog'는 보유가 없어 카탈로그에서 추천한 제품(빈 슬롯 = 구매 연결).
   * 하위호환: 없으면 'catalog'로 간주.
   */
  source?: 'shelf' | 'catalog';
  /** source가 'shelf'일 때 user_product_shelf 아이템 ID */
  shelfItemId?: string;
}

// =============================================================================
// 로테이션 이력 — ADR-069
// =============================================================================

/** 로테이션 이유 */
export type RotationReason = 'time-based' | 'trigger-based' | 'user-requested';

/** 로테이션 이력 레코드 */
export interface RotationRecord {
  id: string;
  capsuleId: string;
  userId: string;
  itemsRemoved: unknown[];
  itemsAdded: unknown[];
  reason: RotationReason;
  triggerCondition: string | null;
  compatibilityBefore: number;
  compatibilityAfter: number;
  createdAt: string;
}

// =============================================================================
// 크로스 도메인 규칙 — ADR-071
// =============================================================================

/** 크로스 도메인 규칙 타입 */
export type CrossDomainRuleType = 'synergy' | 'conflict' | 'neutral';

/** 크로스 도메인 규칙 */
export interface CrossDomainRule {
  id: string;
  domain1: string;
  domain2: string;
  ruleName: string;
  factor: number;
  ruleType: CrossDomainRuleType;
  description: string | null;
}

// =============================================================================
// 컨텍스트 수집 — ADR-073 Step 2
// =============================================================================

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export interface DailyContext {
  dayOfWeek: DayOfWeek;
  season: SeasonType;
  recentUsageHistory: {
    lastUsedItems: string[];
    lastRotationDate: string | null;
    frequency: Record<string, number>;
  };
}
