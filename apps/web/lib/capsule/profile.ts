/**
 * BeautyProfile CRUD + On-Read 마이그레이션
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 *
 * 핵심 전략: On-Read Migration
 * - getBeautyProfile() 호출 시 beauty_profiles 테이블에 행이 없으면
 *   9개 분석 테이블에서 최신 결과를 수집하여 자동 생성
 * - 이후 각 분석 API의 후처리에서 실시간 업데이트
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { BeautyProfile, ModuleCode } from '@/types/capsule';
import { getPersonalizationLevel } from '@/types/capsule';
import type { BeautyProfileRow, ProfileFieldName } from './types';
import { MODULE_TO_FIELD, FIELD_TO_MODULE } from './types';
import {
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

// =============================================================================
// 공개 API
// =============================================================================

/**
 * BeautyProfile 조회 (On-Read 마이그레이션 포함)
 *
 * 1. beauty_profiles에서 조회
 * 2. 존재하면 반환
 * 3. 없으면 buildProfileFromAssessments()로 자동 생성
 */
export async function getBeautyProfile(userId: string): Promise<BeautyProfile> {
  const supabase = createServiceRoleClient();

  // 기존 프로필 조회
  const { data: existing, error } = await supabase
    .from('beauty_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Capsule] BeautyProfile 조회 실패:', error);
    throw new Error('프로필을 불러올 수 없습니다.');
  }

  if (existing) {
    return rowToProfile(existing as BeautyProfileRow);
  }

  // On-Read 마이그레이션: 기존 분석 데이터에서 프로필 생성
  return buildProfileFromAssessments(userId);
}

/**
 * BeautyProfile 생성 또는 전체 업데이트
 */
export async function upsertBeautyProfile(
  userId: string,
  profile: Partial<BeautyProfile>
): Promise<BeautyProfile> {
  const supabase = createServiceRoleClient();

  const row = profileToRow(userId, profile);

  const { data, error } = await supabase
    .from('beauty_profiles')
    .upsert(row, { onConflict: 'clerk_user_id' })
    .select()
    .single();

  if (error) {
    console.error('[Capsule] BeautyProfile upsert 실패:', error);
    throw new Error('프로필 저장에 실패했습니다.');
  }

  return rowToProfile(data as BeautyProfileRow);
}

/**
 * BeautyProfile 단일 필드 업데이트 (분석 API 후처리용)
 * 비차단(non-blocking): 실패해도 분석 응답에 영향 없음
 *
 * @param userId 사용자 ID
 * @param moduleCode 모듈 코드 (PC, S, C 등)
 * @param fieldData 매핑된 프로필 필드 데이터
 */
export async function updateBeautyProfileField(
  userId: string,
  moduleCode: string,
  fieldData: unknown
): Promise<void> {
  const supabase = createServiceRoleClient();
  const fieldName = MODULE_TO_FIELD[moduleCode];
  if (!fieldName) {
    console.warn(`[Capsule] 알 수 없는 모듈 코드: ${moduleCode}`);
    return;
  }

  // 현재 프로필 조회 (없으면 생성)
  const { data: existing } = await supabase
    .from('beauty_profiles')
    .select('id, completed_modules')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!existing) {
    // 프로필이 없으면 해당 필드만 포함하여 생성
    const completedModules = [moduleCode];
    const { error } = await supabase.from('beauty_profiles').insert({
      clerk_user_id: userId,
      [fieldName]: fieldData,
      completed_modules: completedModules,
      personalization_level: getPersonalizationLevel(completedModules.length),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`[Capsule] BeautyProfile 생성 실패 (${moduleCode}):`, error);
    }
    return;
  }

  // 기존 프로필 업데이트
  const currentModules = (existing.completed_modules as string[]) ?? [];
  const updatedModules = currentModules.includes(moduleCode)
    ? currentModules
    : [...currentModules, moduleCode];

  const { error } = await supabase
    .from('beauty_profiles')
    .update({
      [fieldName]: fieldData,
      completed_modules: updatedModules,
      personalization_level: getPersonalizationLevel(updatedModules.length),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (error) {
    console.error(`[Capsule] BeautyProfile 필드 업데이트 실패 (${moduleCode}):`, error);
  }
}

// =============================================================================
// On-Read 마이그레이션
// =============================================================================

/**
 * 9개 분석 테이블에서 최신 결과를 수집하여 BeautyProfile 생성
 * 첫 getBeautyProfile() 호출 시 자동 실행
 */
export async function buildProfileFromAssessments(userId: string): Promise<BeautyProfile> {
  const supabase = createServiceRoleClient();

  // 9개 분석 테이블에서 최신 결과 병렬 조회
  const [
    pcResult,
    skinResult,
    bodyResult,
    postureResult,
    nutritionResult,
    hairResult,
    makeupResult,
    oralResult,
  ] = await Promise.allSettled([
    supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('skin_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('body_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posture_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('nutrition_settings').select('*').eq('clerk_user_id', userId).maybeSingle(),
    supabase
      .from('hair_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('makeup_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('oral_health_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // 각 결과 매핑 (실패한 모듈은 건너뜀)
  const profile: Partial<BeautyProfile> = {};
  const completedModules: ModuleCode[] = [];

  const pcData = extractSettledData(pcResult);
  if (pcData) {
    profile.personalColor = mapPCAssessment(pcData);
    completedModules.push('PC');
  }

  const skinData = extractSettledData(skinResult);
  if (skinData) {
    profile.skin = mapSkinAssessment(skinData);
    completedModules.push('S');
  }

  const bodyData = extractSettledData(bodyResult);
  if (bodyData) {
    profile.body = mapBodyAssessment(bodyData);
    completedModules.push('C');
  }

  const postureData = extractSettledData(postureResult);
  if (postureData) {
    profile.workout = mapPostureToWorkout(postureData);
    completedModules.push('W');
  }

  const nutritionData = extractSettledData(nutritionResult);
  if (nutritionData) {
    profile.nutrition = mapNutritionSettings(nutritionData);
    completedModules.push('N');
  }

  const hairData = extractSettledData(hairResult);
  if (hairData) {
    profile.hair = mapHairAssessment(hairData);
    completedModules.push('H');
  }

  const makeupData = extractSettledData(makeupResult);
  if (makeupData) {
    profile.makeup = mapMakeupAnalysis(makeupData);
    completedModules.push('M');
  }

  const oralData = extractSettledData(oralResult);
  if (oralData) {
    profile.oral = mapOralHealthAssessment(oralData);
    completedModules.push('OH');
  }

  // Fashion은 body + inventory 결합
  if (bodyData) {
    profile.fashion = mapFashionFromBodyAndInventory(bodyData);
    completedModules.push('Fashion');
  }

  const now = new Date().toISOString();
  const fullProfile: BeautyProfile = {
    userId,
    updatedAt: now,
    ...profile,
    completedModules,
    personalizationLevel: getPersonalizationLevel(completedModules.length),
    lastFullUpdate: now,
  };

  // DB에 저장 (향후 조회에서 On-Read 재실행 방지)
  try {
    await upsertBeautyProfile(userId, fullProfile);
  } catch (e) {
    // 저장 실패해도 메모리 프로필은 반환
    console.error('[Capsule] On-Read 프로필 저장 실패 (반환은 정상):', e);
  }

  return fullProfile;
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

/** DB Row → BeautyProfile 변환 */
function rowToProfile(row: BeautyProfileRow): BeautyProfile {
  const completedModules: ModuleCode[] = [];
  const moduleFieldPairs: [ProfileFieldName, unknown][] = [
    ['personal_color', row.personal_color],
    ['skin', row.skin],
    ['body', row.body],
    ['workout', row.workout],
    ['nutrition', row.nutrition],
    ['hair', row.hair],
    ['makeup', row.makeup],
    ['oral', row.oral],
    ['fashion', row.fashion],
  ];

  for (const [field, value] of moduleFieldPairs) {
    if (value != null) {
      completedModules.push(FIELD_TO_MODULE[field] as ModuleCode);
    }
  }

  return {
    userId: row.clerk_user_id,
    updatedAt: row.updated_at,
    personalColor: row.personal_color as BeautyProfile['personalColor'],
    skin: row.skin as BeautyProfile['skin'],
    body: row.body as BeautyProfile['body'],
    workout: row.workout as BeautyProfile['workout'],
    nutrition: row.nutrition as BeautyProfile['nutrition'],
    hair: row.hair as BeautyProfile['hair'],
    makeup: row.makeup as BeautyProfile['makeup'],
    oral: row.oral as BeautyProfile['oral'],
    fashion: row.fashion as BeautyProfile['fashion'],
    completedModules: (row.completed_modules as ModuleCode[]) ?? completedModules,
    personalizationLevel: (row.personalization_level as BeautyProfile['personalizationLevel']) ?? 1,
    lastFullUpdate: row.last_full_update ?? row.updated_at,
  };
}

/** BeautyProfile → DB Row 변환 */
function profileToRow(userId: string, profile: Partial<BeautyProfile>): Record<string, unknown> {
  const row: Record<string, unknown> = {
    clerk_user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (profile.personalColor !== undefined) row.personal_color = profile.personalColor;
  if (profile.skin !== undefined) row.skin = profile.skin;
  if (profile.body !== undefined) row.body = profile.body;
  if (profile.workout !== undefined) row.workout = profile.workout;
  if (profile.nutrition !== undefined) row.nutrition = profile.nutrition;
  if (profile.hair !== undefined) row.hair = profile.hair;
  if (profile.makeup !== undefined) row.makeup = profile.makeup;
  if (profile.oral !== undefined) row.oral = profile.oral;
  if (profile.fashion !== undefined) row.fashion = profile.fashion;
  if (profile.completedModules !== undefined) row.completed_modules = profile.completedModules;
  if (profile.personalizationLevel !== undefined)
    row.personalization_level = profile.personalizationLevel;
  if (profile.lastFullUpdate !== undefined) row.last_full_update = profile.lastFullUpdate;

  return row;
}

/** Promise.allSettled 결과에서 성공 데이터 추출 */
function extractSettledData(
  result: PromiseSettledResult<{ data: Record<string, unknown> | null; error: unknown }>
): Record<string, unknown> | null {
  if (result.status === 'rejected') return null;
  if (result.value.error) return null;
  return result.value.data;
}
