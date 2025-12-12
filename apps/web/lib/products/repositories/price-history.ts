/**
 * 가격 히스토리 Repository
 * @description 제품 가격 히스토리 CRUD 함수
 */

import { supabase } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { ProductType, ProductPriceHistory } from '@/types/product';

interface ProductPriceHistoryRow {
  id: string;
  product_type: string;
  product_id: string;
  price_krw: number;
  source: string | null;
  recorded_at: string;
}

/**
 * 가격 히스토리 기록 (Service Role 필요)
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param priceKrw 가격 (원)
 * @param source 가격 출처
 */
export async function recordPriceHistory(
  productType: ProductType,
  productId: string,
  priceKrw: number,
  source?: string
): Promise<boolean> {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from('product_price_history')
    .insert({
      product_type: productType,
      product_id: productId,
      price_krw: priceKrw,
      source: source || null,
    });

  if (error) {
    console.error('가격 히스토리 기록 실패:', error);
    return false;
  }

  return true;
}

/**
 * 제품의 가격 히스토리 조회
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param limit 최대 개수 (기본 30)
 */
export async function getPriceHistory(
  productType: ProductType,
  productId: string,
  limit = 30
): Promise<ProductPriceHistory[]> {
  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('가격 히스토리 조회 실패:', error);
    return [];
  }

  return (data as ProductPriceHistoryRow[]).map((row) => ({
    id: row.id,
    productType: row.product_type as ProductType,
    productId: row.product_id,
    priceKrw: row.price_krw,
    source: row.source ?? undefined,
    recordedAt: row.recorded_at,
  }));
}

/**
 * 제품의 최저가 조회 (특정 기간)
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param days 기간 (일, 기본 30)
 */
export async function getLowestPrice(
  productType: ProductType,
  productId: string,
  days = 30
): Promise<number | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('product_price_history')
    .select('price_krw')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .gte('recorded_at', startDate.toISOString())
    .order('price_krw', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.price_krw;
}

/**
 * 가격 변동 알림용 - 가격이 하락한 제품 조회
 * @param productType 제품 타입
 * @param percentDrop 하락률 (%, 기본 10)
 */
export async function getPriceDropProducts(
  productType: ProductType,
  percentDrop = 10
): Promise<Array<{ productId: string; previousPrice: number; currentPrice: number; dropPercent: number }>> {
  // 최근 2개 가격 기록을 비교하여 하락한 제품 찾기
  const { data, error } = await supabase
    .from('product_price_history')
    .select('product_id, price_krw, recorded_at')
    .eq('product_type', productType)
    .order('recorded_at', { ascending: false });

  if (error || !data) {
    console.error('가격 하락 조회 실패:', error);
    return [];
  }

  // 제품별로 그룹화
  const byProduct: Record<string, { price_krw: number; recorded_at: string }[]> = {};
  for (const record of data) {
    if (!byProduct[record.product_id]) {
      byProduct[record.product_id] = [];
    }
    byProduct[record.product_id].push(record);
  }

  // 가격 하락 제품 필터링
  const drops: Array<{ productId: string; previousPrice: number; currentPrice: number; dropPercent: number }> = [];

  for (const [productId, records] of Object.entries(byProduct)) {
    if (records.length < 2) continue;

    const currentPrice = records[0].price_krw;
    const previousPrice = records[1].price_krw;

    if (previousPrice > currentPrice) {
      const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
      if (dropPercent >= percentDrop) {
        drops.push({
          productId,
          previousPrice,
          currentPrice,
          dropPercent: Math.round(dropPercent * 10) / 10,
        });
      }
    }
  }

  return drops.sort((a, b) => b.dropPercent - a.dropPercent);
}
