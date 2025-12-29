/**
 * 사이즈 추천 서비스
 * @description 3단계 추론으로 최적 사이즈 추천
 * 1. 동일 브랜드 구매 기록
 * 2. 브랜드 사이즈 차트 + 신체 치수
 * 3. 일반 사이즈 추론
 */

import type {
  SizeRecommendation,
  SizeRecommendationBasis,
  UserBodyMeasurements,
  UserSizeHistory,
  ClothingCategory,
  SizeFit,
} from '@/types/smart-matching';
import { getMeasurements } from './measurements';
import {
  getSizeHistoryByBrand,
  getPerfectFitHistory,
} from './size-history';
import {
  getSizeChart,
  recommendSizeFromMeasurements,
} from './size-charts';

// ============================================
// 메인 추천 함수
// ============================================

/**
 * 사이즈 추천 (3단계 추론)
 */
export async function getSizeRecommendation(
  clerkUserId: string,
  brandId: string,
  brandName: string,
  category: ClothingCategory
): Promise<SizeRecommendation> {
  // 1단계: 동일 브랜드 구매 기록 확인
  const historyResult = await recommendFromHistory(clerkUserId, brandId, category);
  if (historyResult && historyResult.confidence >= 80) {
    return historyResult;
  }

  // 2단계: 브랜드 사이즈 차트 + 신체 치수
  const chartResult = await recommendFromBrandChart(clerkUserId, brandId, category);
  if (chartResult && chartResult.confidence >= 60) {
    return chartResult;
  }

  // 3단계: 일반 사이즈 추론
  const generalResult = await recommendGeneral(clerkUserId, category);
  if (generalResult) {
    return generalResult;
  }

  // Fallback: 기본값 반환
  return {
    recommendedSize: 'M',
    confidence: 20,
    basis: 'general',
    alternatives: [
      { size: 'S', note: '타이트한 핏을 선호하시면' },
      { size: 'L', note: '여유로운 핏을 선호하시면' },
    ],
  };
}

// ============================================
// 1단계: 구매 기록 기반 추천
// ============================================

async function recommendFromHistory(
  clerkUserId: string,
  brandId: string,
  category: ClothingCategory
): Promise<SizeRecommendation | null> {
  // 동일 브랜드 + 동일 카테고리 기록 조회
  const brandHistory = await getSizeHistoryByBrand(clerkUserId, brandId);
  const categoryHistory = brandHistory.filter((h) => h.category === category);

  if (categoryHistory.length === 0) {
    return null;
  }

  // 가장 최근 + perfect fit 우선
  const perfectFits = categoryHistory.filter((h) => h.fit === 'perfect');
  const baseHistory = perfectFits.length > 0 ? perfectFits[0] : categoryHistory[0];

  // 핏 피드백 기반 사이즈 조정
  let recommendedSize = baseHistory.size;
  let sizeNote = '';

  if (baseHistory.fit === 'small') {
    recommendedSize = adjustSizeUp(baseHistory.size);
    sizeNote = '이전에 작다고 느끼셨어서 한 사이즈 업 추천';
  } else if (baseHistory.fit === 'large') {
    recommendedSize = adjustSizeDown(baseHistory.size);
    sizeNote = '이전에 크다고 느끼셨어서 한 사이즈 다운 추천';
  }

  // 신뢰도 계산
  const confidence = calculateHistoryConfidence(categoryHistory);

  return {
    recommendedSize,
    confidence,
    basis: 'history',
    alternatives: generateAlternatives(recommendedSize, baseHistory.fit),
    brandInfo: {
      sizeNote: sizeNote || `${brandHistory.length}번의 구매 기록 기반`,
    },
  };
}

function calculateHistoryConfidence(history: UserSizeHistory[]): number {
  let confidence = 70;

  // perfect fit 기록이 있으면 +20
  if (history.some((h) => h.fit === 'perfect')) {
    confidence += 20;
  }

  // 기록 수에 따라 +5 (최대 10)
  confidence += Math.min(history.length * 5, 10);

  return Math.min(confidence, 100);
}

// ============================================
// 2단계: 브랜드 사이즈 차트 기반 추천
// ============================================

async function recommendFromBrandChart(
  clerkUserId: string,
  brandId: string,
  category: ClothingCategory
): Promise<SizeRecommendation | null> {
  // 브랜드 사이즈 차트 조회
  const sizeChart = await getSizeChart(brandId, category);
  if (!sizeChart) {
    return null;
  }

  // 사용자 신체 치수 조회
  const measurements = await getMeasurements(clerkUserId);
  if (!measurements) {
    return null;
  }

  // 사이즈 차트 기반 추천
  const chartRecommendation = recommendSizeFromMeasurements(sizeChart, {
    height: measurements.height,
    weight: measurements.weight,
    chest: measurements.chest,
    waist: measurements.waist,
    hip: measurements.hip,
  });

  if (!chartRecommendation) {
    return null;
  }

  // 선호 핏 반영
  let recommendedSize = chartRecommendation.size;
  if (measurements.preferredFit === 'tight') {
    recommendedSize = adjustSizeDown(chartRecommendation.size);
  } else if (measurements.preferredFit === 'loose') {
    recommendedSize = adjustSizeUp(chartRecommendation.size);
  }

  return {
    recommendedSize,
    confidence: chartRecommendation.confidence,
    basis: 'brand_chart',
    alternatives: generateAlternatives(recommendedSize),
    brandInfo: {
      fitStyle: sizeChart.fitStyle,
      sizeNote: chartRecommendation.reason,
    },
  };
}

// ============================================
// 3단계: 일반 사이즈 추론
// ============================================

async function recommendGeneral(
  clerkUserId: string,
  category: ClothingCategory
): Promise<SizeRecommendation | null> {
  // 다른 브랜드의 perfect fit 기록 참조
  const perfectFits = await getPerfectFitHistory(clerkUserId, category);

  if (perfectFits.length > 0) {
    // 가장 많이 입는 사이즈 찾기
    const sizeCounts = perfectFits.reduce<Record<string, number>>((acc, h) => {
      acc[h.size] = (acc[h.size] || 0) + 1;
      return acc;
    }, {});

    const sortedSizes = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonSize = sortedSizes[0][0];

    return {
      recommendedSize: mostCommonSize,
      confidence: 50 + Math.min(perfectFits.length * 5, 20),
      basis: 'general',
      alternatives: generateAlternatives(mostCommonSize),
    };
  }

  // 신체 치수만으로 추론
  const measurements = await getMeasurements(clerkUserId);
  if (measurements && (measurements.height || measurements.weight)) {
    const generalSize = inferSizeFromBasicMeasurements(measurements, category);
    return {
      recommendedSize: generalSize,
      confidence: 40,
      basis: 'general',
      alternatives: generateAlternatives(generalSize),
    };
  }

  return null;
}

/**
 * 기본 신체 정보로 일반 사이즈 추론
 */
function inferSizeFromBasicMeasurements(
  measurements: UserBodyMeasurements,
  category: ClothingCategory
): string {
  const { height, weight, preferredFit } = measurements;

  // BMI 기반 추론 (간단한 휴리스틱)
  let baseSize = 'M';

  if (height && weight) {
    const bmi = weight / ((height / 100) ** 2);

    if (category === 'top' || category === 'outer') {
      if (bmi < 18.5) baseSize = 'S';
      else if (bmi < 23) baseSize = 'M';
      else if (bmi < 27) baseSize = 'L';
      else baseSize = 'XL';
    } else if (category === 'bottom') {
      // 하의는 키 고려
      if (height < 165) {
        if (bmi < 20) baseSize = 'S';
        else if (bmi < 24) baseSize = 'M';
        else baseSize = 'L';
      } else if (height < 175) {
        if (bmi < 21) baseSize = 'M';
        else if (bmi < 25) baseSize = 'L';
        else baseSize = 'XL';
      } else {
        if (bmi < 22) baseSize = 'L';
        else baseSize = 'XL';
      }
    } else if (category === 'shoes') {
      // 신발은 발 길이 또는 키 기반
      if (measurements.footLength) {
        baseSize = String(Math.round(measurements.footLength * 10)); // mm → 사이즈
      } else if (height) {
        // 키 기반 추정 (매우 대략적)
        baseSize = String(Math.round(height * 0.152 + 10) * 5); // 예: 170cm → 260~270
      }
    }
  }

  // 선호 핏 반영
  if (preferredFit === 'tight' && category !== 'shoes') {
    baseSize = adjustSizeDown(baseSize);
  } else if (preferredFit === 'loose' && category !== 'shoes') {
    baseSize = adjustSizeUp(baseSize);
  }

  return baseSize;
}

// ============================================
// 헬퍼 함수
// ============================================

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function adjustSizeUp(size: string): string {
  // 숫자 사이즈 (바지, 신발)
  const numericMatch = size.match(/^(\d+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1]);
    // 바지: 28 → 29, 신발: 260 → 265
    return String(num < 100 ? num + 1 : num + 5);
  }

  // 문자 사이즈
  const idx = SIZE_ORDER.indexOf(size.toUpperCase());
  if (idx >= 0 && idx < SIZE_ORDER.length - 1) {
    return SIZE_ORDER[idx + 1];
  }

  return size;
}

function adjustSizeDown(size: string): string {
  const numericMatch = size.match(/^(\d+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1]);
    return String(num < 100 ? num - 1 : num - 5);
  }

  const idx = SIZE_ORDER.indexOf(size.toUpperCase());
  if (idx > 0) {
    return SIZE_ORDER[idx - 1];
  }

  return size;
}

function generateAlternatives(
  recommendedSize: string,
  previousFit?: SizeFit
): { size: string; note: string }[] {
  const alternatives: { size: string; note: string }[] = [];

  const sizeUp = adjustSizeUp(recommendedSize);
  const sizeDown = adjustSizeDown(recommendedSize);

  if (sizeDown !== recommendedSize) {
    alternatives.push({
      size: sizeDown,
      note: previousFit === 'large' ? '이전 피드백 반영' : '타이트한 핏을 원하시면',
    });
  }

  if (sizeUp !== recommendedSize) {
    alternatives.push({
      size: sizeUp,
      note: previousFit === 'small' ? '이전 피드백 반영' : '여유로운 핏을 원하시면',
    });
  }

  return alternatives;
}

// ============================================
// 추가 유틸리티
// ============================================

/**
 * 제품별 사이즈 추천
 * @description 제품에 실측 데이터가 있으면 더 정확한 추천
 */
export async function getProductSizeRecommendation(
  clerkUserId: string,
  productId: string,
  brandId: string,
  brandName: string,
  category: ClothingCategory
): Promise<SizeRecommendation> {
  // 기본 추천 먼저 수행
  const baseRecommendation = await getSizeRecommendation(
    clerkUserId,
    brandId,
    brandName,
    category
  );

  // TODO: 제품별 실측 데이터가 있으면 보정
  // const productMeasurements = await getProductMeasurements(productId);
  // if (productMeasurements) { ... }

  return baseRecommendation;
}

/**
 * 사이즈 추천 신뢰도 레이블
 */
export function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'green' | 'yellow' | 'gray';
} {
  if (confidence >= 80) {
    return { label: '매우 정확', color: 'green' };
  } else if (confidence >= 60) {
    return { label: '정확', color: 'green' };
  } else if (confidence >= 40) {
    return { label: '참고용', color: 'yellow' };
  } else {
    return { label: '추정', color: 'gray' };
  }
}

/**
 * 추천 근거 설명 텍스트
 */
export function getBasisDescription(basis: SizeRecommendationBasis): string {
  switch (basis) {
    case 'history':
      return '이전 구매 기록 기반';
    case 'brand_chart':
      return '브랜드 사이즈 차트 + 내 치수 기반';
    case 'measurements':
      return '내 신체 치수 기반';
    case 'general':
      return '일반적인 사이즈 추정';
    default:
      return '';
  }
}
