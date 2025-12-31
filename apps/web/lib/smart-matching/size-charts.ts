/**
 * 브랜드 사이즈 차트 Repository
 * @description 브랜드별 사이즈 매핑, 제품 실측 데이터 관리
 */

import { supabase } from '@/lib/supabase/client';
import { smartMatchingLogger } from '@/lib/utils/logger';
import type {
  BrandSizeChart,
  BrandSizeChartDB,
  ProductMeasurements,
  ProductMeasurementsDB,
  ClothingCategory,
  SizeMapping,
  SizeMeasurement,
  MeasurementSource,
} from '@/types/smart-matching';

// ============================================
// 변환 함수
// ============================================

function mapSizeChartRow(row: BrandSizeChartDB): BrandSizeChart {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    country: row.country ?? undefined,
    category: row.category as ClothingCategory,
    fitStyle: row.fit_style as BrandSizeChart['fitStyle'],
    sizeMappings: row.size_mappings,
    source: row.source ?? undefined,
    lastVerified: row.last_verified ? new Date(row.last_verified) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapProductMeasurementsRow(row: ProductMeasurementsDB): ProductMeasurements {
  return {
    id: row.id,
    productId: row.product_id,
    sizeMeasurements: row.size_measurements,
    source: row.source as MeasurementSource | undefined,
    reliability: row.reliability,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================
// 브랜드 사이즈 차트
// ============================================

/**
 * 브랜드 사이즈 차트 조회
 */
export async function getSizeChart(
  brandId: string,
  category: ClothingCategory
): Promise<BrandSizeChart | null> {
  const { data, error } = await supabase
    .from('brand_size_charts')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', category)
    .single();

  if (error || !data) {
    return null;
  }

  return mapSizeChartRow(data as BrandSizeChartDB);
}

/**
 * 브랜드의 모든 사이즈 차트 조회
 */
export async function getSizeChartsByBrand(brandId: string): Promise<BrandSizeChart[]> {
  const { data, error } = await supabase
    .from('brand_size_charts')
    .select('*')
    .eq('brand_id', brandId);

  if (error || !data) {
    return [];
  }

  return (data as BrandSizeChartDB[]).map(mapSizeChartRow);
}

/**
 * 사이즈 차트 검색
 */
export async function searchSizeCharts(query: {
  brandName?: string;
  category?: ClothingCategory;
  country?: string;
}): Promise<BrandSizeChart[]> {
  let dbQuery = supabase.from('brand_size_charts').select('*');

  if (query.brandName) {
    dbQuery = dbQuery.ilike('brand_name', `%${query.brandName}%`);
  }

  if (query.category) {
    dbQuery = dbQuery.eq('category', query.category);
  }

  if (query.country) {
    dbQuery = dbQuery.eq('country', query.country);
  }

  const { data, error } = await dbQuery;

  if (error || !data) {
    return [];
  }

  return (data as BrandSizeChartDB[]).map(mapSizeChartRow);
}

/**
 * 사이즈 차트 생성/업데이트
 */
export async function upsertSizeChart(input: {
  brandId: string;
  brandName: string;
  category: ClothingCategory;
  country?: string;
  fitStyle?: BrandSizeChart['fitStyle'];
  sizeMappings: SizeMapping[];
  source?: string;
}): Promise<BrandSizeChart | null> {
  const { data, error } = await supabase
    .from('brand_size_charts')
    .upsert({
      brand_id: input.brandId,
      brand_name: input.brandName,
      category: input.category,
      country: input.country ?? null,
      fit_style: input.fitStyle ?? null,
      size_mappings: input.sizeMappings,
      source: input.source ?? null,
      last_verified: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    smartMatchingLogger.error('사이즈차트 Upsert 실패:', error);
    return null;
  }

  return mapSizeChartRow(data as BrandSizeChartDB);
}

// ============================================
// 제품 실측 데이터
// ============================================

/**
 * 제품 실측 데이터 조회
 */
export async function getProductMeasurements(
  productId: string
): Promise<ProductMeasurements | null> {
  const { data, error } = await supabase
    .from('product_measurements')
    .select('*')
    .eq('product_id', productId)
    .order('reliability', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProductMeasurementsRow(data as ProductMeasurementsDB);
}

/**
 * 제품 실측 데이터 생성/업데이트
 */
export async function upsertProductMeasurements(input: {
  productId: string;
  sizeMeasurements: SizeMeasurement[];
  source?: MeasurementSource;
  reliability?: number;
}): Promise<ProductMeasurements | null> {
  const { data, error } = await supabase
    .from('product_measurements')
    .upsert({
      product_id: input.productId,
      size_measurements: input.sizeMeasurements,
      source: input.source ?? 'user_report',
      reliability: input.reliability ?? 0.5,
    })
    .select()
    .single();

  if (error) {
    smartMatchingLogger.error('제품실측 Upsert 실패:', error);
    return null;
  }

  return mapProductMeasurementsRow(data as ProductMeasurementsDB);
}

// ============================================
// 사이즈 추천 로직
// ============================================

/**
 * 신체 치수로 사이즈 추천
 */
export function recommendSizeFromMeasurements(
  sizeChart: BrandSizeChart,
  userMeasurements: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hip?: number;
  }
): { size: string; confidence: number; reason: string } | null {
  const mappings = sizeChart.sizeMappings;
  let bestMatch: { size: string; score: number; reason: string } | null = null;

  for (const mapping of mappings) {
    let score = 0;
    let factors = 0;
    const reasons: string[] = [];

    // 키 체크
    if (userMeasurements.height && mapping.minHeight && mapping.maxHeight) {
      if (
        userMeasurements.height >= mapping.minHeight &&
        userMeasurements.height <= mapping.maxHeight
      ) {
        score += 1;
        reasons.push('키');
      }
      factors++;
    }

    // 몸무게 체크
    if (userMeasurements.weight && mapping.minWeight && mapping.maxWeight) {
      if (
        userMeasurements.weight >= mapping.minWeight &&
        userMeasurements.weight <= mapping.maxWeight
      ) {
        score += 1;
        reasons.push('몸무게');
      }
      factors++;
    }

    // 가슴 치수 체크
    if (userMeasurements.chest && mapping.measurements.chest) {
      if (
        userMeasurements.chest >= mapping.measurements.chest.min &&
        userMeasurements.chest <= mapping.measurements.chest.max
      ) {
        score += 1.5;
        reasons.push('가슴둘레');
      }
      factors += 1.5;
    }

    // 허리 치수 체크
    if (userMeasurements.waist && mapping.measurements.waist) {
      if (
        userMeasurements.waist >= mapping.measurements.waist.min &&
        userMeasurements.waist <= mapping.measurements.waist.max
      ) {
        score += 1.5;
        reasons.push('허리둘레');
      }
      factors += 1.5;
    }

    if (factors > 0) {
      const confidence = score / factors;
      if (!bestMatch || confidence > bestMatch.score) {
        bestMatch = {
          size: mapping.label,
          score: confidence,
          reason: reasons.join(', ') + ' 기준',
        };
      }
    }
  }

  if (!bestMatch) {
    return null;
  }

  return {
    size: bestMatch.size,
    confidence: Math.round(bestMatch.score * 100),
    reason: bestMatch.reason,
  };
}

/**
 * 사이즈 기록으로 다른 브랜드 사이즈 추천
 */
export async function recommendSizeFromHistory(
  targetBrandId: string,
  targetCategory: ClothingCategory,
  userSizeHistory: Array<{
    brandId: string;
    category: string;
    size: string;
    fit?: 'small' | 'perfect' | 'large';
  }>
): Promise<{ size: string; confidence: number; basis: string } | null> {
  // 동일 브랜드 기록이 있으면 우선 사용
  const sameBrandHistory = userSizeHistory.find(
    (h) => h.brandId === targetBrandId && h.category === targetCategory
  );

  if (sameBrandHistory) {
    // 핏 피드백 기반 조정
    let recommendedSize = sameBrandHistory.size;
    if (sameBrandHistory.fit === 'small') {
      recommendedSize = adjustSizeUp(sameBrandHistory.size);
    } else if (sameBrandHistory.fit === 'large') {
      recommendedSize = adjustSizeDown(sameBrandHistory.size);
    }

    return {
      size: recommendedSize,
      confidence: 95,
      basis: '동일 브랜드 구매 기록',
    };
  }

  // 동일 카테고리의 다른 브랜드 기록 참조
  const sameCategoryHistory = userSizeHistory.filter(
    (h) => h.category === targetCategory && h.fit === 'perfect'
  );

  if (sameCategoryHistory.length > 0) {
    // 가장 많이 입는 사이즈
    const sizeCounts = sameCategoryHistory.reduce<Record<string, number>>((acc, h) => {
      acc[h.size] = (acc[h.size] || 0) + 1;
      return acc;
    }, {});

    const mostCommonSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      size: mostCommonSize,
      confidence: 70,
      basis: '유사 카테고리 구매 기록',
    };
  }

  return null;
}

// 사이즈 조정 헬퍼
function adjustSizeUp(size: string): string {
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const numericMatch = size.match(/^(\d+)$/);

  if (numericMatch) {
    return String(parseInt(numericMatch[1]) + 1);
  }

  const idx = sizeOrder.indexOf(size.toUpperCase());
  if (idx >= 0 && idx < sizeOrder.length - 1) {
    return sizeOrder[idx + 1];
  }

  return size;
}

function adjustSizeDown(size: string): string {
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const numericMatch = size.match(/^(\d+)$/);

  if (numericMatch) {
    return String(parseInt(numericMatch[1]) - 1);
  }

  const idx = sizeOrder.indexOf(size.toUpperCase());
  if (idx > 0) {
    return sizeOrder[idx - 1];
  }

  return size;
}
