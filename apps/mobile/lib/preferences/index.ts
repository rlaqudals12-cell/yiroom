/**
 * 사용자 선호도 모듈
 *
 * 사용자 기피/선호 CRUD — 영양, 운동, 뷰티, 컬러 도메인 통합
 *
 * @module lib/preferences
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type PreferenceCategory =
  | 'food_allergy'
  | 'food_dislike'
  | 'food_prefer'
  | 'ingredient_avoid'
  | 'ingredient_prefer'
  | 'workout_prefer'
  | 'workout_avoid'
  | 'style_prefer'
  | 'color_prefer'
  | 'color_avoid'
  | 'skin_concern';

export interface UserPreference {
  id: string;
  category: PreferenceCategory;
  item: string;
  createdAt: string;
}

export interface PreferenceSummary {
  category: PreferenceCategory;
  label: string;
  items: string[];
}

// ─── 상수 ─────────────────────────────────────────────

export const PREFERENCE_CATEGORY_LABELS: Record<PreferenceCategory, string> = {
  food_allergy: '음식 알레르기',
  food_dislike: '기피 음식',
  food_prefer: '선호 음식',
  ingredient_avoid: '기피 성분',
  ingredient_prefer: '선호 성분',
  workout_prefer: '선호 운동',
  workout_avoid: '기피 운동',
  style_prefer: '선호 스타일',
  color_prefer: '선호 색상',
  color_avoid: '기피 색상',
  skin_concern: '피부 고민',
};

// 카테고리별 선택 가능 항목
export const PREFERENCE_ITEMS: Record<PreferenceCategory, { key: string; label: string }[]> = {
  food_allergy: [
    { key: 'egg', label: '달걀' },
    { key: 'milk', label: '우유' },
    { key: 'peanut', label: '땅콩' },
    { key: 'tree_nut', label: '견과류' },
    { key: 'shellfish', label: '갑각류' },
    { key: 'wheat', label: '밀' },
    { key: 'soy', label: '대두' },
    { key: 'fish', label: '생선' },
  ],
  food_dislike: [
    { key: 'spicy', label: '매운 음식' },
    { key: 'raw', label: '날것' },
    { key: 'oily', label: '기름진 음식' },
    { key: 'sweet', label: '단 음식' },
    { key: 'sour', label: '신 음식' },
  ],
  food_prefer: [
    { key: 'korean', label: '한식' },
    { key: 'japanese', label: '일식' },
    { key: 'western', label: '양식' },
    { key: 'chinese', label: '중식' },
    { key: 'salad', label: '샐러드' },
    { key: 'fruit', label: '과일' },
  ],
  ingredient_avoid: [
    { key: 'alcohol', label: '알코올' },
    { key: 'fragrance', label: '향료' },
    { key: 'paraben', label: '파라벤' },
    { key: 'sulfate', label: '설페이트' },
    { key: 'silicone', label: '실리콘' },
  ],
  ingredient_prefer: [
    { key: 'hyaluronic', label: '히알루론산' },
    { key: 'niacinamide', label: '나이아신아마이드' },
    { key: 'ceramide', label: '세라마이드' },
    { key: 'retinol', label: '레티놀' },
    { key: 'centella', label: '센텔라' },
    { key: 'vitamin_c', label: '비타민C' },
  ],
  workout_prefer: [
    { key: 'cardio', label: '유산소' },
    { key: 'weight', label: '웨이트' },
    { key: 'yoga', label: '요가' },
    { key: 'pilates', label: '필라테스' },
    { key: 'running', label: '달리기' },
    { key: 'swimming', label: '수영' },
  ],
  workout_avoid: [
    { key: 'high_impact', label: '고강도 운동' },
    { key: 'outdoor', label: '야외 운동' },
    { key: 'group', label: '그룹 운동' },
  ],
  style_prefer: [
    { key: 'casual', label: '캐주얼' },
    { key: 'minimal', label: '미니멀' },
    { key: 'classic', label: '클래식' },
    { key: 'street', label: '스트릿' },
    { key: 'romantic', label: '로맨틱' },
  ],
  color_prefer: [
    { key: 'warm', label: '웜톤' },
    { key: 'cool', label: '쿨톤' },
    { key: 'neutral', label: '뉴트럴' },
    { key: 'vivid', label: '비비드' },
    { key: 'muted', label: '뮤트' },
  ],
  color_avoid: [
    { key: 'neon', label: '네온 컬러' },
    { key: 'pastel', label: '파스텔' },
    { key: 'dark', label: '다크 톤' },
  ],
  skin_concern: [
    { key: 'acne', label: '여드름' },
    { key: 'wrinkle', label: '주름' },
    { key: 'pigment', label: '색소침착' },
    { key: 'dryness', label: '건조함' },
    { key: 'sensitivity', label: '민감성' },
    { key: 'pore', label: '모공' },
    { key: 'redness', label: '홍조' },
  ],
};

// ─── CRUD ─────────────────────────────────────────────

/**
 * 사용자 선호도 전체 조회
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreference[]> {
  const { data } = await supabase
    .from('user_preferences')
    .select('id, category, item, created_at')
    .eq('clerk_user_id', userId)
    .order('category')
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    item: row.item,
    createdAt: row.created_at,
  }));
}

/**
 * 카테고리별 선호도 조회
 */
export async function getPreferencesByCategory(
  supabase: SupabaseClient,
  userId: string,
  category: PreferenceCategory
): Promise<string[]> {
  const { data } = await supabase
    .from('user_preferences')
    .select('item')
    .eq('clerk_user_id', userId)
    .eq('category', category);

  return (data ?? []).map((row) => row.item);
}

/**
 * 선호도 추가
 */
export async function addPreference(
  supabase: SupabaseClient,
  userId: string,
  category: PreferenceCategory,
  item: string
): Promise<boolean> {
  // 중복 확인
  const { count } = await supabase
    .from('user_preferences')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('category', category)
    .eq('item', item);

  if ((count ?? 0) > 0) return true; // 이미 존재

  const { error } = await supabase.from('user_preferences').insert({
    clerk_user_id: userId,
    category,
    item,
  });

  return !error;
}

/**
 * 선호도 삭제
 */
export async function removePreference(
  supabase: SupabaseClient,
  userId: string,
  category: PreferenceCategory,
  item: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_preferences')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('category', category)
    .eq('item', item);

  return !error;
}

/**
 * 선호도 전체 초기화
 */
export async function clearPreferences(
  supabase: SupabaseClient,
  userId: string,
  category?: PreferenceCategory
): Promise<boolean> {
  let query = supabase
    .from('user_preferences')
    .delete()
    .eq('clerk_user_id', userId);

  if (category) {
    query = query.eq('category', category);
  }

  const { error } = await query;
  return !error;
}

// ─── 유틸리티 ─────────────────────────────────────────

/**
 * 선호도를 카테고리별 요약으로 변환
 */
export function summarizePreferences(
  preferences: UserPreference[]
): PreferenceSummary[] {
  const grouped = new Map<PreferenceCategory, string[]>();

  preferences.forEach((pref) => {
    const items = grouped.get(pref.category) ?? [];
    items.push(pref.item);
    grouped.set(pref.category, items);
  });

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    label: PREFERENCE_CATEGORY_LABELS[category],
    items,
  }));
}

/**
 * 선호도 라벨 조회
 */
export function getPreferenceLabel(
  category: PreferenceCategory,
  item: string
): string {
  const items = PREFERENCE_ITEMS[category];
  const found = items?.find((i) => i.key === item);
  return found?.label ?? item;
}
