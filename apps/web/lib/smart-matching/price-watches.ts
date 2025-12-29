/**
 * 가격 모니터링 Repository
 * @description 가격 알림, 히스토리 관리
 */

import { supabase } from '@/lib/supabase/client';
import type {
  PriceWatch,
  PriceWatchDB,
  PriceHistory,
  PriceHistoryDB,
} from '@/types/smart-matching';
import { mapPriceWatchRow } from '@/types/smart-matching';

// ============================================
// 가격 알림
// ============================================

/**
 * 사용자의 가격 알림 목록 조회
 */
export async function getPriceWatches(clerkUserId: string): Promise<PriceWatch[]> {
  const { data, error } = await supabase
    .from('price_watches')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as PriceWatchDB[]).map(mapPriceWatchRow);
}

/**
 * 제품별 가격 알림 조회
 */
export async function getPriceWatchByProduct(
  clerkUserId: string,
  productId: string
): Promise<PriceWatch | null> {
  const { data, error } = await supabase
    .from('price_watches')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('product_id', productId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPriceWatchRow(data as PriceWatchDB);
}

/**
 * 가격 알림 생성
 */
export async function createPriceWatch(input: {
  clerkUserId: string;
  productId: string;
  targetPrice?: number;
  percentDrop?: number;
  platforms?: string[];
  expiresAt?: Date;
}): Promise<PriceWatch | null> {
  const { data, error } = await supabase
    .from('price_watches')
    .insert({
      clerk_user_id: input.clerkUserId,
      product_id: input.productId,
      target_price: input.targetPrice ?? null,
      percent_drop: input.percentDrop ?? null,
      platforms: input.platforms ?? [],
      expires_at: input.expiresAt?.toISOString() ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[PriceWatch] 생성 실패:', error);
    return null;
  }

  return mapPriceWatchRow(data as PriceWatchDB);
}

/**
 * 가격 알림 조건 업데이트
 */
export async function updatePriceWatch(
  watchId: string,
  updates: {
    targetPrice?: number;
    percentDrop?: number;
    platforms?: string[];
    expiresAt?: Date;
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.targetPrice !== undefined) updateData.target_price = updates.targetPrice;
  if (updates.percentDrop !== undefined) updateData.percent_drop = updates.percentDrop;
  if (updates.platforms !== undefined) updateData.platforms = updates.platforms;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt.toISOString();

  const { error } = await supabase
    .from('price_watches')
    .update(updateData)
    .eq('id', watchId);

  if (error) {
    console.error('[PriceWatch] 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 현재 최저가 업데이트
 */
export async function updateCurrentPrice(
  watchId: string,
  lowestPrice: number,
  platform: string
): Promise<boolean> {
  const { error } = await supabase
    .from('price_watches')
    .update({
      current_lowest_price: lowestPrice,
      lowest_platform: platform,
    })
    .eq('id', watchId);

  if (error) {
    console.error('[PriceWatch] 최저가 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 알림 발송 완료 처리
 */
export async function markAsNotified(watchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('price_watches')
    .update({
      notified: true,
      notified_at: new Date().toISOString(),
    })
    .eq('id', watchId);

  if (error) {
    console.error('[PriceWatch] 알림 처리 실패:', error);
    return false;
  }

  return true;
}

/**
 * 가격 알림 삭제
 */
export async function deletePriceWatch(watchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('price_watches')
    .delete()
    .eq('id', watchId);

  if (error) {
    console.error('[PriceWatch] 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 만료된 알림 정리
 */
export async function cleanupExpiredWatches(): Promise<number> {
  const { data, error } = await supabase
    .from('price_watches')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    console.error('[PriceWatch] 만료 정리 실패:', error);
    return 0;
  }

  return data?.length ?? 0;
}

// ============================================
// 가격 히스토리
// ============================================

function mapPriceHistoryRow(row: PriceHistoryDB): PriceHistory {
  return {
    id: row.id,
    productId: row.product_id,
    platform: row.platform,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    recordedAt: new Date(row.recorded_at),
  };
}

/**
 * 제품 가격 히스토리 조회
 */
export async function getPriceHistory(
  productId: string,
  options?: {
    platform?: string;
    days?: number;
    limit?: number;
  }
): Promise<PriceHistory[]> {
  let query = supabase
    .from('price_history')
    .select('*')
    .eq('product_id', productId);

  if (options?.platform) {
    query = query.eq('platform', options.platform);
  }

  if (options?.days) {
    const since = new Date();
    since.setDate(since.getDate() - options.days);
    query = query.gte('recorded_at', since.toISOString());
  }

  query = query.order('recorded_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as PriceHistoryDB[]).map(mapPriceHistoryRow);
}

/**
 * 가격 히스토리 기록
 */
export async function recordPrice(input: {
  productId: string;
  platform: string;
  price: number;
  originalPrice?: number;
}): Promise<PriceHistory | null> {
  const { data, error } = await supabase
    .from('price_history')
    .insert({
      product_id: input.productId,
      platform: input.platform,
      price: input.price,
      original_price: input.originalPrice ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[PriceHistory] 기록 실패:', error);
    return null;
  }

  return mapPriceHistoryRow(data as PriceHistoryDB);
}

/**
 * 제품의 역대 최저가 조회
 */
export async function getLowestPrice(
  productId: string,
  platform?: string
): Promise<{ price: number; platform: string; recordedAt: Date } | null> {
  let query = supabase
    .from('price_history')
    .select('*')
    .eq('product_id', productId);

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query.order('price', { ascending: true }).limit(1).single();

  if (error || !data) {
    return null;
  }

  const row = data as PriceHistoryDB;
  return {
    price: row.price,
    platform: row.platform,
    recordedAt: new Date(row.recorded_at),
  };
}

/**
 * 가격 변동률 계산
 */
export async function getPriceChangePercent(
  productId: string,
  days: number = 7
): Promise<number | null> {
  const history = await getPriceHistory(productId, { days, limit: 100 });

  if (history.length < 2) {
    return null;
  }

  const latestPrice = history[0].price;
  const oldestPrice = history[history.length - 1].price;

  return ((latestPrice - oldestPrice) / oldestPrice) * 100;
}
