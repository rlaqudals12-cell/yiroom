/**
 * 사용자 설정 Repository
 * @description 예산, 브랜드 선호, 알림 설정 관리
 */

import { supabase } from '@/lib/supabase/client';
import { smartMatchingLogger } from '@/lib/utils/logger';
import type {
  UserPreferences,
  UserPreferencesDB,
  BudgetSettings,
  NotificationFrequency,
} from '@/types/smart-matching';
import { mapPreferencesRow } from '@/types/smart-matching';

/**
 * 사용자 설정 조회
 */
export async function getPreferences(clerkUserId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPreferencesRow(data as UserPreferencesDB);
}

/**
 * 사용자 설정 생성/업데이트 (Upsert)
 */
export async function upsertPreferences(
  clerkUserId: string,
  preferences: Partial<Omit<UserPreferences, 'clerkUserId' | 'createdAt' | 'updatedAt'>>
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      clerk_user_id: clerkUserId,
      budget: preferences.budget ?? {},
      favorite_brands: preferences.favoriteBrands ?? [],
      blocked_brands: preferences.blockedBrands ?? [],
      preferred_platforms: preferences.preferredPlatforms ?? [],
      prioritize_free_delivery: preferences.prioritizeFreeDelivery ?? true,
      prioritize_fast_delivery: preferences.prioritizeFastDelivery ?? false,
      prioritize_points: preferences.prioritizePoints ?? false,
      show_alternatives: preferences.showAlternatives ?? true,
      show_price_comparison: preferences.showPriceComparison ?? true,
      notify_price_drop: preferences.notifyPriceDrop ?? true,
      notify_restock: preferences.notifyRestock ?? true,
      notification_email: preferences.notificationEmail ?? true,
      notification_push: preferences.notificationPush ?? true,
      notification_frequency: preferences.notificationFrequency ?? 'daily',
    })
    .select()
    .single();

  if (error) {
    smartMatchingLogger.error('설정 Upsert 실패:', error);
    return null;
  }

  return mapPreferencesRow(data as UserPreferencesDB);
}

/**
 * 예산 설정 업데이트
 */
export async function updateBudget(clerkUserId: string, budget: BudgetSettings): Promise<boolean> {
  const { error } = await supabase
    .from('user_preferences')
    .update({ budget })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 예산 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 즐겨찾기 브랜드 추가
 */
export async function addFavoriteBrand(clerkUserId: string, brand: string): Promise<boolean> {
  // 현재 설정 조회
  const current = await getPreferences(clerkUserId);
  const favoriteBrands = current?.favoriteBrands ?? [];

  // 이미 추가된 경우
  if (favoriteBrands.includes(brand)) {
    return true;
  }

  const { error } = await supabase
    .from('user_preferences')
    .update({
      favorite_brands: [...favoriteBrands, brand],
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 즐겨찾기 브랜드 추가 실패:', error);
    return false;
  }

  return true;
}

/**
 * 즐겨찾기 브랜드 제거
 */
export async function removeFavoriteBrand(clerkUserId: string, brand: string): Promise<boolean> {
  const current = await getPreferences(clerkUserId);
  const favoriteBrands = (current?.favoriteBrands ?? []).filter((b) => b !== brand);

  const { error } = await supabase
    .from('user_preferences')
    .update({ favorite_brands: favoriteBrands })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 즐겨찾기 브랜드 제거 실패:', error);
    return false;
  }

  return true;
}

/**
 * 차단 브랜드 추가
 */
export async function addBlockedBrand(clerkUserId: string, brand: string): Promise<boolean> {
  const current = await getPreferences(clerkUserId);
  const blockedBrands = current?.blockedBrands ?? [];

  if (blockedBrands.includes(brand)) {
    return true;
  }

  const { error } = await supabase
    .from('user_preferences')
    .update({
      blocked_brands: [...blockedBrands, brand],
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 차단 브랜드 추가 실패:', error);
    return false;
  }

  return true;
}

/**
 * 차단 브랜드 제거
 */
export async function removeBlockedBrand(clerkUserId: string, brand: string): Promise<boolean> {
  const current = await getPreferences(clerkUserId);
  const blockedBrands = (current?.blockedBrands ?? []).filter((b) => b !== brand);

  const { error } = await supabase
    .from('user_preferences')
    .update({ blocked_brands: blockedBrands })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 차단 브랜드 제거 실패:', error);
    return false;
  }

  return true;
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSettings(
  clerkUserId: string,
  settings: {
    email?: boolean;
    push?: boolean;
    frequency?: NotificationFrequency;
    priceDrop?: boolean;
    restock?: boolean;
  }
): Promise<boolean> {
  const updates: Record<string, unknown> = {};

  if (settings.email !== undefined) updates.notification_email = settings.email;
  if (settings.push !== undefined) updates.notification_push = settings.push;
  if (settings.frequency !== undefined) updates.notification_frequency = settings.frequency;
  if (settings.priceDrop !== undefined) updates.notify_price_drop = settings.priceDrop;
  if (settings.restock !== undefined) updates.notify_restock = settings.restock;

  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    smartMatchingLogger.error('설정 알림 설정 업데이트 실패:', error);
    return false;
  }

  return true;
}
