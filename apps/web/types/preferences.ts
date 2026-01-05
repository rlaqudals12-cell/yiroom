/**
 * 통합 사용자 선호/기피 시스템 타입 정의
 * @description 영양/운동/뷰티/컬러 도메인 통합 Preference 시스템
 * @version 1.1
 * @see docs/SDD-USER-PREFERENCES.md
 */

// =============================================================================
// 도메인 및 아이템 타입
// =============================================================================

/**
 * 선호/기피 도메인
 */
export type PreferenceDomain =
  | 'beauty' // 화장품 성분
  | 'style' // 패션 소재/스타일
  | 'nutrition' // 음식/영양
  | 'workout' // 운동/장비
  | 'color'; // 퍼스널 컬러

/**
 * 도메인별 아이템 타입
 */
export type PreferenceItemType =
  // Beauty (기존)
  | 'ingredient' // 화장품 성분
  // Style (기존)
  | 'material' // 소재 (면, 린넨, 실크)
  | 'fashion_style' // 스타일 (캐주얼, 미니멀)
  | 'fit' // 핏 (오버핏, 슬림핏)
  // Nutrition (신규)
  | 'food' // 음식/재료
  | 'food_category' // 음식 카테고리 (해산물, 육류)
  | 'allergen' // 알레르겐 (FDA 9대)
  | 'diet_restriction' // 식이 제한 (채식, 할랄)
  | 'nutrient' // 영양소 (단백질, 탄수화물)
  // Workout (신규)
  | 'exercise' // 개별 운동
  | 'exercise_style' // 운동 스타일 (웨이트, 유산소)
  | 'equipment' // 운동 장비
  | 'body_part' // 운동 부위 (하체, 상체)
  // Color (신규)
  | 'color' // 개별 색상
  | 'color_tone' // 색조 (웜톤, 쿨톤)
  | 'pattern'; // 패턴 (체크, 스트라이프)

// =============================================================================
// 기피 수준 및 이유 (i18n 친화적)
// =============================================================================

/**
 * 기피 수준 (문화권 중립적 - i18n 친화적)
 * 의료 용어(mild/moderate/severe) 대신 일상 표현 사용
 */
export type AvoidLevel =
  | 'dislike' // 비선호: 먹을 수/할 수 있지만 싫어함
  | 'avoid' // 회피: 가능하면 피하고 싶음 (경미한 반응)
  | 'cannot' // 불가: 하면 안 됨 (불내증/알레르기)
  | 'danger'; // 위험: 생명 위협 (아나필락시스/심각한 부상)

/**
 * 기피 이유 카테고리
 */
export type AvoidReason =
  // cannot, danger 레벨
  | 'allergy' // 알레르기 (면역 반응)
  | 'intolerance' // 불내증 (소화 문제)
  | 'medical' // 의료적 제한
  | 'injury' // 부상/통증
  // avoid 레벨
  | 'religious' // 종교적 이유 (할랄, 코셔)
  | 'ethical' // 윤리적 이유 (비건)
  | 'health' // 건강 관리 (저염, 저당)
  | 'physical_limitation' // 신체적 제약
  | 'skin_reaction' // 피부 반응
  // dislike 레벨
  | 'taste' // 맛/식감
  | 'smell' // 냄새
  | 'uncomfortable'; // 불편함

// =============================================================================
// 통합 사용자 선호/기피 인터페이스
// =============================================================================

/**
 * 통합 사용자 선호/기피 항목
 */
export interface UserPreference {
  id: string;
  clerkUserId: string;

  // 분류
  domain: PreferenceDomain;
  itemType: PreferenceItemType;

  // 항목 정보
  itemId?: string; // DB 참조 ID (옵션)
  itemName: string; // 한글명
  itemNameEn?: string; // 영문명

  // 선호/기피
  isFavorite: boolean; // true=좋아함, false=기피

  // 기피 상세 (isFavorite=false인 경우)
  avoidLevel?: AvoidLevel; // 기피 수준 (일상어 기반)
  avoidReason?: AvoidReason; // 기피 이유
  avoidNote?: string; // 추가 메모

  // 메타
  priority?: number; // 우선순위 (1-5)
  source?: 'user' | 'analysis' | 'recommendation'; // 출처
  createdAt: string;
  updatedAt: string;
}

/**
 * DB Row 타입 (Supabase)
 */
export interface UserPreferenceRow {
  id: string;
  clerk_user_id: string;
  domain: string;
  item_type: string;
  item_id: string | null;
  item_name: string;
  item_name_en: string | null;
  is_favorite: boolean;
  avoid_level: string | null;
  avoid_reason: string | null;
  avoid_note: string | null;
  priority: number;
  source: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// 도메인별 상세 타입
// =============================================================================

/**
 * FDA 9대 주요 알레르겐 (FALCPA + FASTER Act 2023)
 */
export type FDAMajorAllergen =
  | 'milk' // 우유 (모든 포유류 포함)
  | 'eggs' // 달걀 (모든 조류 포함)
  | 'fish' // 생선
  | 'shellfish' // 갑각류 (새우, 게, 랍스터)
  | 'tree_nuts' // 견과류 (12종: 아몬드, 호두, 캐슈 등)
  | 'peanuts' // 땅콩
  | 'wheat' // 밀
  | 'soybeans' // 대두
  | 'sesame'; // 참깨 (2023년 추가)

/**
 * 식이 제한 유형
 */
export type DietaryRestriction =
  | 'vegetarian' // 채식 (유제품/달걀 허용)
  | 'vegan' // 완전 채식
  | 'pescatarian' // 페스코 (생선 허용)
  | 'halal' // 할랄
  | 'kosher' // 코셔
  | 'lactose_free' // 유당불내증
  | 'gluten_free' // 글루텐프리
  | 'low_sodium' // 저염식
  | 'low_sugar' // 저당식
  | 'keto' // 키토/저탄수화물
  | 'fodmap'; // 저포드맵

/**
 * 음식 카테고리 (기피용)
 */
export type FoodCategory =
  | 'seafood' // 해산물
  | 'meat' // 육류
  | 'pork' // 돼지고기 (할랄/코셔)
  | 'beef' // 소고기
  | 'poultry' // 가금류
  | 'dairy' // 유제품
  | 'raw' // 날음식
  | 'spicy' // 매운 음식
  | 'fermented' // 발효 음식
  | 'processed'; // 가공식품

/**
 * 신체 부위 (부상/기피)
 */
export type InjuryArea =
  | 'knee' // 무릎
  | 'back' // 허리/등
  | 'shoulder' // 어깨
  | 'wrist' // 손목
  | 'ankle' // 발목
  | 'neck' // 목
  | 'hip' // 엉덩이/골반
  | 'elbow'; // 팔꿈치

/**
 * 운동 스타일 선호도
 */
export type ExerciseStylePreference =
  | 'weight_training' // 웨이트
  | 'calisthenics' // 맨몸운동
  | 'cardio' // 유산소
  | 'hiit' // 고강도 인터벌
  | 'yoga' // 요가
  | 'pilates' // 필라테스
  | 'stretching' // 스트레칭
  | 'swimming' // 수영
  | 'cycling' // 사이클링
  | 'running'; // 러닝

/**
 * 색상 톤
 */
export type ColorTone =
  | 'warm_light' // 웜톤 밝은색
  | 'warm_dark' // 웜톤 어두운색
  | 'cool_light' // 쿨톤 밝은색
  | 'cool_dark' // 쿨톤 어두운색
  | 'neutral'; // 뉴트럴

/**
 * 패턴 선호도
 */
export type PatternPreference =
  | 'solid' // 무지
  | 'stripe' // 스트라이프
  | 'check' // 체크
  | 'floral' // 꽃무늬
  | 'animal' // 애니멀 프린트
  | 'geometric' // 기하학
  | 'abstract'; // 추상

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * DB Row를 UserPreference로 변환
 */
export function toUserPreference(row: UserPreferenceRow): UserPreference {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    domain: row.domain as PreferenceDomain,
    itemType: row.item_type as PreferenceItemType,
    itemId: row.item_id ?? undefined,
    itemName: row.item_name,
    itemNameEn: row.item_name_en ?? undefined,
    isFavorite: row.is_favorite,
    avoidLevel: (row.avoid_level as AvoidLevel) ?? undefined,
    avoidReason: (row.avoid_reason as AvoidReason) ?? undefined,
    avoidNote: row.avoid_note ?? undefined,
    priority: row.priority,
    source: row.source as 'user' | 'analysis' | 'recommendation',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 위험 레벨인지 확인 (cannot, danger)
 */
export function isCriticalAvoid(level?: AvoidLevel): boolean {
  return level === 'cannot' || level === 'danger';
}

/**
 * 기피 레벨 우선순위 (높을수록 심각)
 */
export function getAvoidLevelPriority(level?: AvoidLevel): number {
  switch (level) {
    case 'danger':
      return 4;
    case 'cannot':
      return 3;
    case 'avoid':
      return 2;
    case 'dislike':
      return 1;
    default:
      return 0;
  }
}
