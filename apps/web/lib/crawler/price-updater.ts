/**
 * 가격 업데이트 서비스
 * @description 제품 가격을 조회하고 DB를 업데이트하는 서비스
 * @version 1.0
 * @date 2025-12-09
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { crawlerLogger } from '@/lib/utils/logger';
import { recordPriceHistory } from '@/lib/products';
import type { ProductType } from '@/types/product';
import type {
  PriceFetchRequest,
  PriceResult,
  BatchUpdateResult,
  PriceChange,
  CrawlerConfig,
  PriceSource,
} from './types';
import { DEFAULT_CRAWLER_CONFIG } from './types';
import { fetchPrices, calculatePriceChange, validatePriceChange } from './price-fetcher';

/**
 * 제품 타입별 테이블 이름
 */
const TABLE_NAMES: Record<ProductType, string> = {
  cosmetic: 'cosmetic_products',
  supplement: 'supplement_products',
  workout_equipment: 'workout_equipment',
  health_food: 'health_foods',
};

/**
 * DB에서 제품 목록 조회
 */
async function getProductsForUpdate(
  productType: ProductType,
  limit?: number
): Promise<PriceFetchRequest[]> {
  const supabase = createServiceRoleClient();
  const tableName = TABLE_NAMES[productType];

  let query = supabase
    .from(tableName)
    .select('id, name, brand, price_krw')
    .eq('is_active', true)
    .order('updated_at', { ascending: true }); // 오래된 것부터

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    crawlerLogger.error(`Failed to fetch ${productType}:`, error);
    return [];
  }

  return (data || []).map((row) => ({
    productId: row.id,
    productType,
    productName: row.name,
    brand: row.brand,
    currentPrice: row.price_krw,
  }));
}

/**
 * 단일 제품 가격 업데이트
 */
async function updateProductPrice(
  productType: ProductType,
  productId: string,
  newPrice: number,
  source: PriceSource
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const tableName = TABLE_NAMES[productType];

  const { error } = await supabase
    .from(tableName)
    .update({
      price_krw: newPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    crawlerLogger.error(`Failed to update ${productId}:`, error);
    return false;
  }

  // 가격 히스토리 기록
  await recordPriceHistory(productType, productId, newPrice, source);

  return true;
}

/**
 * 특정 제품 타입의 모든 가격 업데이트
 */
export async function updatePricesForType(
  productType: ProductType,
  options: {
    limit?: number;
    source?: PriceSource;
    config?: Partial<CrawlerConfig>;
    onProgress?: (completed: number, total: number, result: PriceResult) => void;
  } = {}
): Promise<BatchUpdateResult> {
  const startedAt = new Date();
  const config = { ...DEFAULT_CRAWLER_CONFIG, ...options.config };

  // 제품 목록 조회
  const products = await getProductsForUpdate(productType, options.limit);

  if (products.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      results: [],
      startedAt,
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  crawlerLogger.info(`Starting update for ${products.length} ${productType} products`);

  // 가격 조회
  const priceResults = await fetchPrices(products, {
    source: options.source,
    delayMs: config.requestDelay,
  });

  // 결과 처리
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const priceChanges: PriceChange[] = [];

  for (let i = 0; i < priceResults.length; i++) {
    const result = priceResults[i];
    const product = products[i];

    // 진행 상황 콜백
    if (options.onProgress) {
      options.onProgress(i + 1, products.length, result);
    }

    // 실패한 경우 스킵
    if (!result.success) {
      failed++;
      continue;
    }

    // 가격 유효성 검증
    const validation = validatePriceChange(
      product.currentPrice || 0,
      result.price,
      config.priceChangeThreshold
    );

    if (!validation.isValid) {
      crawlerLogger.warn(`Skipping ${product.productId}: ${validation.reason}`);
      skipped++;
      continue;
    }

    // 가격 변동 계산
    if (product.currentPrice) {
      const change = calculatePriceChange(product.currentPrice, result.price);
      if (change.changeType !== 'unchanged') {
        priceChanges.push({
          productId: product.productId,
          productType,
          previousPrice: product.currentPrice,
          newPrice: result.price,
          changePercent: change.changePercent,
          changeType: change.changeType,
        });
      }
    }

    // DB 업데이트
    const updated = await updateProductPrice(
      productType,
      result.productId,
      result.price,
      result.source
    );

    if (updated) {
      success++;
    } else {
      failed++;
    }
  }

  const completedAt = new Date();

  // 가격 변동 로그
  if (priceChanges.length > 0) {
    crawlerLogger.info(`Price changes detected: ${priceChanges.length}`);
    const significantDrops = priceChanges.filter(
      (c) => c.changeType === 'decrease' && Math.abs(c.changePercent) >= 10
    );
    if (significantDrops.length > 0) {
      crawlerLogger.info(`Significant price drops: ${significantDrops.length}`);
    }
  }

  return {
    total: products.length,
    success,
    failed,
    skipped,
    results: priceResults,
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
  };
}

/**
 * 모든 제품 타입의 가격 업데이트
 */
export async function updateAllPrices(
  options: {
    limitPerType?: number;
    source?: PriceSource;
    config?: Partial<CrawlerConfig>;
  } = {}
): Promise<Record<ProductType, BatchUpdateResult>> {
  const productTypes: ProductType[] = [
    'cosmetic',
    'supplement',
    'workout_equipment',
    'health_food',
  ];

  const results: Record<string, BatchUpdateResult> = {};

  for (const productType of productTypes) {
    crawlerLogger.debug(`Processing ${productType}...`);
    results[productType] = await updatePricesForType(productType, {
      limit: options.limitPerType,
      source: options.source,
      config: options.config,
    });
  }

  return results as Record<ProductType, BatchUpdateResult>;
}

/**
 * 특정 제품들의 가격 업데이트
 */
export async function updateSpecificProducts(
  products: Array<{
    id: string;
    type: ProductType;
    name: string;
    brand: string;
    currentPrice?: number;
  }>,
  source?: PriceSource
): Promise<BatchUpdateResult> {
  const startedAt = new Date();

  const requests: PriceFetchRequest[] = products.map((p) => ({
    productId: p.id,
    productType: p.type,
    productName: p.name,
    brand: p.brand,
    currentPrice: p.currentPrice,
  }));

  const priceResults = await fetchPrices(requests, { source });

  let success = 0;
  let failed = 0;

  for (const result of priceResults) {
    if (!result.success) {
      failed++;
      continue;
    }

    const updated = await updateProductPrice(
      result.productType,
      result.productId,
      result.price,
      result.source
    );

    if (updated) {
      success++;
    } else {
      failed++;
    }
  }

  const completedAt = new Date();

  return {
    total: products.length,
    success,
    failed,
    skipped: 0,
    results: priceResults,
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
  };
}
