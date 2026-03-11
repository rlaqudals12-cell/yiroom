/**
 * 한국 주요 브랜드 사이즈 차트 정적 데이터
 *
 * @description DB에 브랜드 데이터가 없을 때 사용하는 폴백 사이즈 차트.
 * 한국 상위 20+ 브랜드의 표준 사이즈 매핑을 제공합니다.
 * @see {@link docs/adr/ADR-032-smart-matching.md} Smart Matching ADR
 */

import type { ClothingCategory, SizeMapping } from '@/types/smart-matching';

// =============================================================================
// 타입
// =============================================================================

export interface KoreanBrandSizeChart {
  brandId: string;
  brandName: string;
  /** 핏 경향: slim(작게 나옴), regular, oversized(크게 나옴) */
  fitTendency: 'slim' | 'regular' | 'oversized';
  categories: Partial<Record<ClothingCategory, SizeMapping[]>>;
}

export interface FitTendencyInfo {
  label: string;
  description: string;
  /** 사이즈 조정값 (-1: 한 사이즈 업 권장, 0: 그대로, 1: 한 사이즈 다운 가능) */
  adjustment: number;
}

// =============================================================================
// 핏 경향 정보
// =============================================================================

export const FIT_TENDENCY_INFO: Record<string, FitTendencyInfo> = {
  slim: {
    label: '슬림핏',
    description: '작게 나오는 편이에요. 한 사이즈 업을 추천합니다.',
    adjustment: -1,
  },
  regular: {
    label: '레귤러핏',
    description: '표준 사이즈입니다.',
    adjustment: 0,
  },
  oversized: {
    label: '오버사이즈',
    description: '크게 나오는 편이에요. 평소 사이즈로 충분합니다.',
    adjustment: 1,
  },
};

// =============================================================================
// 표준 한국 사이즈 매핑 (공통 기반)
// =============================================================================

// 남녀공용 상의 표준 (한국 사이즈 90~110)
const STANDARD_TOP_MAPPINGS: SizeMapping[] = [
  {
    label: 'S',
    minHeight: 155,
    maxHeight: 168,
    minWeight: 45,
    maxWeight: 58,
    measurements: {
      chest: { min: 82, max: 88 },
      shoulder: { min: 38, max: 41 },
    },
  },
  {
    label: 'M',
    minHeight: 163,
    maxHeight: 175,
    minWeight: 55,
    maxWeight: 68,
    measurements: {
      chest: { min: 88, max: 94 },
      shoulder: { min: 41, max: 44 },
    },
  },
  {
    label: 'L',
    minHeight: 170,
    maxHeight: 182,
    minWeight: 65,
    maxWeight: 80,
    measurements: {
      chest: { min: 94, max: 102 },
      shoulder: { min: 44, max: 47 },
    },
  },
  {
    label: 'XL',
    minHeight: 175,
    maxHeight: 188,
    minWeight: 75,
    maxWeight: 95,
    measurements: {
      chest: { min: 102, max: 112 },
      shoulder: { min: 47, max: 50 },
    },
  },
];

// 남녀공용 하의 표준
const STANDARD_BOTTOM_MAPPINGS: SizeMapping[] = [
  {
    label: 'S',
    minHeight: 155,
    maxHeight: 168,
    minWeight: 45,
    maxWeight: 58,
    measurements: {
      waist: { min: 64, max: 70 },
      hip: { min: 84, max: 90 },
    },
  },
  {
    label: 'M',
    minHeight: 163,
    maxHeight: 175,
    minWeight: 55,
    maxWeight: 68,
    measurements: {
      waist: { min: 70, max: 78 },
      hip: { min: 90, max: 96 },
    },
  },
  {
    label: 'L',
    minHeight: 170,
    maxHeight: 182,
    minWeight: 65,
    maxWeight: 80,
    measurements: {
      waist: { min: 78, max: 86 },
      hip: { min: 96, max: 104 },
    },
  },
  {
    label: 'XL',
    minHeight: 175,
    maxHeight: 188,
    minWeight: 75,
    maxWeight: 95,
    measurements: {
      waist: { min: 86, max: 96 },
      hip: { min: 104, max: 112 },
    },
  },
];

// =============================================================================
// 한국 브랜드 20+ 데이터
// =============================================================================

export const KOREAN_BRAND_SIZE_CHARTS: KoreanBrandSizeChart[] = [
  // ─── 무신사 계열 ───
  {
    brandId: 'musinsa-standard',
    brandName: '무신사 스탠다드',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'covernat',
    brandName: '커버낫',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'thisisneverthat',
    brandName: '디스이즈네버댓',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'iab-studio',
    brandName: 'IAB Studio',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'emis',
    brandName: '이미스',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
    },
  },

  // ─── 지그재그/여성 브랜드 ───
  {
    brandId: 'chuu',
    brandName: '츄',
    fitTendency: 'slim',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      dress: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'mixxmix',
    brandName: '미쏘',
    fitTendency: 'slim',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'stylenanda',
    brandName: '스타일난다',
    fitTendency: 'slim',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      dress: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'romand',
    brandName: '로아주',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      dress: STANDARD_TOP_MAPPINGS,
    },
  },

  // ─── W컨셉/프리미엄 ───
  {
    brandId: 'wconcept-exclusive',
    brandName: 'W컨셉 익스클루시브',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'anderssonbell',
    brandName: '앤더슨벨',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'instantfunk',
    brandName: '인스턴트펑크',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'low-classic',
    brandName: '로우클래식',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },

  // ─── SPA/대중 브랜드 ───
  {
    brandId: 'topten',
    brandName: '탑텐',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'spao',
    brandName: '스파오',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: '8seconds',
    brandName: '에잇세컨즈',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'lfmall-hazzys',
    brandName: '헤지스',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
      outer: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'beanpole',
    brandName: '빈폴',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },

  // ─── 스트릿/캐주얼 ───
  {
    brandId: 'kirsh',
    brandName: '키르시',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'mahagrid',
    brandName: '마하그리드',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'markm',
    brandName: '마크엠',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },

  // ─── 온라인 전용 ───
  {
    brandId: 'mardi-mercredi',
    brandName: '마르디 메크르디',
    fitTendency: 'regular',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
    },
  },
  {
    brandId: 'nerdy',
    brandName: '널디',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
      bottom: STANDARD_BOTTOM_MAPPINGS,
    },
  },
  {
    brandId: 'groove-rhyme',
    brandName: '그루브라임',
    fitTendency: 'oversized',
    categories: {
      top: STANDARD_TOP_MAPPINGS,
    },
  },
];

// =============================================================================
// 조회 함수
// =============================================================================

/**
 * 브랜드 ID로 정적 사이즈 차트 조회
 */
export function getKoreanBrandChart(brandId: string): KoreanBrandSizeChart | undefined {
  return KOREAN_BRAND_SIZE_CHARTS.find((b) => b.brandId === brandId);
}

/**
 * 브랜드명으로 정적 사이즈 차트 검색 (부분 일치)
 */
export function searchKoreanBrands(query: string): KoreanBrandSizeChart[] {
  const lowerQuery = query.toLowerCase();
  return KOREAN_BRAND_SIZE_CHARTS.filter(
    (b) =>
      b.brandName.toLowerCase().includes(lowerQuery) || b.brandId.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 브랜드의 카테고리별 사이즈 매핑 조회
 * @returns DB 형식의 SizeMapping[] 또는 null
 */
export function getKoreanBrandSizeMappings(
  brandId: string,
  category: ClothingCategory
): SizeMapping[] | null {
  const brand = getKoreanBrandChart(brandId);
  if (!brand) return null;
  return brand.categories[category] ?? null;
}

/**
 * 브랜드 핏 경향에 따른 사이즈 조정값 조회
 * @returns -1(한 사이즈 업 필요), 0(표준), 1(한 사이즈 다운 가능)
 */
export function getBrandFitAdjustment(brandId: string): number {
  const brand = getKoreanBrandChart(brandId);
  if (!brand) return 0;
  return FIT_TENDENCY_INFO[brand.fitTendency]?.adjustment ?? 0;
}

/**
 * 전체 브랜드 목록 반환
 */
export function getAllKoreanBrands(): Array<{
  brandId: string;
  brandName: string;
  fitTendency: string;
}> {
  return KOREAN_BRAND_SIZE_CHARTS.map((b) => ({
    brandId: b.brandId,
    brandName: b.brandName,
    fitTendency: b.fitTendency,
  }));
}
