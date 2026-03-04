/**
 * 캡슐 모듈 내부 타입 정의
 * 공유 타입은 @/types/capsule에서 re-export
 */

// 공유 타입 re-export (P8: barrel pattern)
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

// =============================================================================
// 내부 전용 타입 (외부 노출 안 함)
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

/** DB beauty_profiles 행 구조 */
export interface BeautyProfileRow {
  id: string;
  clerk_user_id: string;
  personal_color: unknown | null;
  skin: unknown | null;
  body: unknown | null;
  workout: unknown | null;
  nutrition: unknown | null;
  hair: unknown | null;
  makeup: unknown | null;
  oral: unknown | null;
  fashion: unknown | null;
  completed_modules: string[] | null;
  personalization_level: number | null;
  last_full_update: string | null;
  created_at: string;
  updated_at: string;
}

/** BeautyProfile 업데이트 요청 */
export interface UpdateBeautyProfileField {
  field: ProfileFieldName;
  data: unknown;
}

/** 프로필 필드명 (DB 컬럼명 매핑) */
export type ProfileFieldName =
  | 'personal_color'
  | 'skin'
  | 'body'
  | 'workout'
  | 'nutrition'
  | 'hair'
  | 'makeup'
  | 'oral'
  | 'fashion';

/** 모듈 코드 → DB 필드명 매핑 */
export const MODULE_TO_FIELD: Record<string, ProfileFieldName> = {
  PC: 'personal_color',
  S: 'skin',
  C: 'body',
  W: 'workout',
  N: 'nutrition',
  H: 'hair',
  M: 'makeup',
  OH: 'oral',
  Fashion: 'fashion',
};

/** DB 필드명 → 모듈 코드 매핑 */
export const FIELD_TO_MODULE: Record<ProfileFieldName, string> = {
  personal_color: 'PC',
  skin: 'S',
  body: 'C',
  workout: 'W',
  nutrition: 'N',
  hair: 'H',
  makeup: 'M',
  oral: 'OH',
  fashion: 'Fashion',
};

/** Supabase 클라이언트 타입 (내부 사용) */
export type SupabaseClientType = SupabaseClient;

/** 큐레이션 옵션 */
export interface CurateOptions {
  maxItems?: number;
  excludeRecentlyUsed?: boolean;
  preferNewItems?: boolean;
}
