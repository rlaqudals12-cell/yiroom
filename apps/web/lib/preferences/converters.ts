/**
 * 변환 헬퍼 함수
 * @description 기존 모듈 데이터를 UserPreference 형식으로 변환
 */

import type { UserPreference } from '@/types/preferences';
import type { AllergyType } from '@/types/nutrition';

// 알레르기 타입 → 영양 식품 카테고리 매핑
const ALLERGY_TO_FOOD_CATEGORY: Record<AllergyType, string> = {
  dairy: '유제품',
  eggs: '달걀',
  nuts: '견과류',
  seafood: '해산물',
  gluten: '글루텐',
  soy: '대두',
  pork: '돼지고기',
  beef: '소고기',
  spicy: '매운 음식',
  raw: '날 음식',
};

// 부상 부위 → 한글명 매핑
const INJURY_TO_KOREAN: Record<string, string> = {
  knee: '무릎',
  back: '허리',
  shoulder: '어깨',
  wrist: '손목',
  ankle: '발목',
  neck: '목',
};

/**
 * 알레르기 목록 → UserPreference 배열 변환
 * @param allergies 알레르기 타입 배열
 * @param userId Clerk 사용자 ID
 * @returns UserPreference 배열 (생성 준비 완료)
 */
export function allergiesToPreferences(
  allergies: AllergyType[],
  userId: string
): Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>[] {
  return allergies.map((allergyId) => ({
    clerkUserId: userId,
    domain: 'nutrition' as const,
    itemType: 'food_category' as const,
    itemName: ALLERGY_TO_FOOD_CATEGORY[allergyId] || allergyId,
    itemNameEn: allergyId,
    isFavorite: false,
    avoidLevel: 'cannot' as const,
    avoidReason: 'allergy' as const,
    avoidNote: `영양 온보딩에서 선택됨 (${allergyId})`,
    priority: 5, // 알레르기는 최고 우선순위
    source: 'user' as const,
  }));
}

/**
 * 기피 음식 목록 → UserPreference 배열 변환
 * @param dislikedFoods 기피 음식 이름 배열
 * @param userId Clerk 사용자 ID
 * @returns UserPreference 배열 (생성 준비 완료)
 */
export function dislikedFoodsToPreferences(
  dislikedFoods: string[],
  userId: string
): Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>[] {
  return dislikedFoods.map((food) => ({
    clerkUserId: userId,
    domain: 'nutrition' as const,
    itemType: 'food' as const,
    itemName: food,
    isFavorite: false,
    avoidLevel: 'avoid' as const,
    avoidReason: 'taste' as const,
    avoidNote: '영양 온보딩에서 직접 입력',
    priority: 3,
    source: 'user' as const,
  }));
}

/**
 * 부상 목록 → UserPreference 배열 변환
 * @param injuries 부상 부위 ID 배열
 * @param userId Clerk 사용자 ID
 * @returns UserPreference 배열 (생성 준비 완료)
 */
export function injuriesToPreferences(
  injuries: string[],
  userId: string
): Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>[] {
  // 'none' 제외
  const validInjuries = injuries.filter((id) => id !== 'none');

  return validInjuries.map((injuryId) => ({
    clerkUserId: userId,
    domain: 'workout' as const,
    itemType: 'body_part' as const,
    itemName: INJURY_TO_KOREAN[injuryId] || injuryId,
    itemNameEn: injuryId,
    isFavorite: false,
    avoidLevel: 'avoid' as const, // 부상은 'avoid' 수준 (상황에 따라 'cannot' 가능)
    avoidReason: 'injury' as const,
    avoidNote: `운동 온보딩에서 선택됨 (${injuryId})`,
    priority: 4, // 부상은 높은 우선순위
    source: 'user' as const,
  }));
}

/**
 * UserPreference 배열 → 알레르기 타입 배열 역변환
 * @param preferences UserPreference 배열
 * @returns AllergyType 배열
 */
export function preferencesToAllergies(preferences: UserPreference[]): AllergyType[] {
  return preferences
    .filter(
      (p) =>
        p.domain === 'nutrition' && p.itemType === 'food_category' && p.avoidReason === 'allergy'
    )
    .map((p) => p.itemNameEn || p.itemName)
    .filter((name): name is AllergyType => {
      return Object.keys(ALLERGY_TO_FOOD_CATEGORY).includes(name);
    });
}

/**
 * UserPreference 배열 → 기피 음식 배열 역변환
 * @param preferences UserPreference 배열
 * @returns 기피 음식 이름 배열
 */
export function preferencesToDislikedFoods(preferences: UserPreference[]): string[] {
  return preferences
    .filter((p) => p.domain === 'nutrition' && p.itemType === 'food' && p.isFavorite === false)
    .map((p) => p.itemName);
}

/**
 * UserPreference 배열 → 부상 부위 ID 배열 역변환
 * @param preferences UserPreference 배열
 * @returns 부상 부위 ID 배열
 */
export function preferencesToInjuries(preferences: UserPreference[]): string[] {
  const injuries = preferences
    .filter(
      (p) => p.domain === 'workout' && p.itemType === 'body_part' && p.avoidReason === 'injury'
    )
    .map((p) => p.itemNameEn || p.itemName);

  // 부상이 없으면 'none' 반환
  return injuries.length > 0 ? injuries : ['none'];
}
