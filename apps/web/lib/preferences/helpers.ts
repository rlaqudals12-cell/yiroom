/**
 * User Preferences 헬퍼 함수
 * @description 추천 API에서 사용하는 공통 로직
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getCriticalAvoids, getAvoidedItemNames } from './repository';
import { preferencesToAllergies, preferencesToInjuries } from './converters';
import type { AllergyType } from '@/types/nutrition';

/**
 * 영양 도메인: 알레르기 목록 조회
 * - user_preferences 우선 조회
 * - 없으면 fallback 배열 사용
 */
export async function getAllergies(
  supabase: SupabaseClient,
  userId: string,
  fallbackAllergies: string[] = []
): Promise<AllergyType[]> {
  try {
    // user_preferences에서 조회
    const preferences = await getCriticalAvoids(supabase, userId, 'nutrition');

    if (preferences.length > 0) {
      const allergies = preferencesToAllergies(preferences);
      console.log('[Preferences] Allergies loaded from user_preferences:', allergies);
      return allergies;
    }

    // Fallback: 파라미터로 받은 allergies 사용
    console.log('[Preferences] Using fallback allergies:', fallbackAllergies);
    return fallbackAllergies as AllergyType[];
  } catch (error) {
    console.error('[Preferences] Error fetching allergies, using fallback:', error);
    return fallbackAllergies as AllergyType[];
  }
}

/**
 * 영양 도메인: 기피 음식 목록 조회
 * - user_preferences 우선 조회
 * - 없으면 빈 배열 반환
 */
export async function getDislikedFoods(
  supabase: SupabaseClient,
  userId: string,
  fallbackFoods: string[] = []
): Promise<string[]> {
  try {
    // user_preferences에서 조회 (food 타입, avoid 레벨)
    const avoidedNames = await getAvoidedItemNames(supabase, userId, 'nutrition');

    if (avoidedNames.length > 0) {
      console.log('[Preferences] Disliked foods loaded from user_preferences:', avoidedNames);
      return avoidedNames;
    }

    // Fallback
    console.log('[Preferences] Using fallback disliked foods:', fallbackFoods);
    return fallbackFoods;
  } catch (error) {
    console.error('[Preferences] Error fetching disliked foods, using fallback:', error);
    return fallbackFoods;
  }
}

/**
 * 운동 도메인: 부상 부위 목록 조회
 * - user_preferences 우선 조회
 * - 없으면 fallback 배열 사용
 */
export async function getInjuries(
  supabase: SupabaseClient,
  userId: string,
  fallbackInjuries: string[] = []
): Promise<string[]> {
  try {
    // user_preferences에서 조회
    const avoidedBodyParts = await getAvoidedItemNames(supabase, userId, 'workout');

    if (avoidedBodyParts.length > 0) {
      // 한글 → 영문 ID 변환 필요 시 converters 활용
      console.log('[Preferences] Injuries loaded from user_preferences:', avoidedBodyParts);
      return avoidedBodyParts;
    }

    // Fallback
    console.log('[Preferences] Using fallback injuries:', fallbackInjuries);
    return fallbackInjuries.filter((id) => id !== 'none');
  } catch (error) {
    console.error('[Preferences] Error fetching injuries, using fallback:', error);
    return fallbackInjuries.filter((id) => id !== 'none');
  }
}
