/**
 * 사이즈 추천 서비스
 * @description 3단계 추론으로 최적 사이즈 추천
 * 1. 동일 브랜드 구매 기록
 * 2. 브랜드 사이즈 차트 + 신체 치수
 * 3. 일반 사이즈 추론
 *
 * Phase L-3-2 고도화:
 * - 체형별 사이즈 조정 규칙
 * - 상세 치수 기반 정밀 추천
 * - 선호 핏 반영
 */

import type {
  SizeRecommendation,
  SizeRecommendationBasis,
  UserBodyMeasurements,
  UserSizeHistory,
  ClothingCategory,
  SizeFit,
  ProductMeasurements,
} from '@/types/smart-matching';
import { smartMatchingLogger } from '@/lib/utils/logger';
import { getMeasurements } from './measurements';
import { getSizeHistoryByBrand, getPerfectFitHistory } from './size-history';
import { getSizeChart, recommendSizeFromMeasurements, getProductMeasurements } from './size-charts';

// Phase L-3-2: 체형 타입 정의
type BodyType = 'S' | 'W' | 'N' | 'X' | 'A' | 'V' | 'H' | 'O' | 'I' | 'Y' | '8';
type PreferredFit = 'tight' | 'regular' | 'loose';

// Phase L-3-2: 강화된 사이즈 추천 결과
export interface EnhancedSizeRecommendation {
  size: string;
  confidence: number;
  reasoning: string;
  adjustments?: {
    reason: string;
    fromSize: string;
    toSize: string;
  };
}

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
    const bmi = weight / (height / 100) ** 2;

    if (category === 'top' || category === 'outer') {
      if (bmi < 18.5) baseSize = 'S';
      else if (bmi >= 23 && bmi < 27) baseSize = 'L';
      else if (bmi >= 27) baseSize = 'XL';
      // bmi 18.5~23: 기본값 'M' 유지
    } else if (category === 'bottom') {
      // 하의는 키 고려
      if (height < 165) {
        if (bmi < 20) baseSize = 'S';
        else if (bmi >= 24) baseSize = 'L';
        // bmi 20~24: 기본값 'M' 유지
      } else if (height < 175) {
        if (bmi >= 21 && bmi < 25) baseSize = 'L';
        else if (bmi >= 25) baseSize = 'XL';
        // bmi < 21: 기본값 'M' 유지
      } else {
        if (bmi < 22) baseSize = 'L';
        else baseSize = 'XL';
      }
    } else if (category === 'shoes') {
      // 신발은 발 길이 또는 키 기반
      if (measurements.footLength) {
        baseSize = String(Math.round(measurements.footLength * 10)); // mm → 사이즈
      } else {
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
  const baseRecommendation = await getSizeRecommendation(clerkUserId, brandId, brandName, category);

  // 제품별 실측 데이터로 보정
  try {
    const productMeasurementsData = await getProductMeasurements(productId);
    if (productMeasurementsData && productMeasurementsData.sizeMeasurements.length > 0) {
      // 사용자 신체 치수 조회
      const userMeasurements = await getMeasurements(clerkUserId);
      if (userMeasurements) {
        smartMatchingLogger.debug(
          `[Size] 실측 데이터 보정 적용 - product: ${productId}, reliability: ${productMeasurementsData.reliability}`
        );
        return calibrateWithProductMeasurements(
          baseRecommendation,
          productMeasurementsData,
          userMeasurements,
          category
        );
      }
    }
  } catch (error) {
    smartMatchingLogger.error('[Size] 실측 데이터 보정 실패:', error);
  }

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

// ============================================
// 실측 데이터 보정 로직
// ============================================

/**
 * 실측 데이터로 추천 사이즈 보정
 * @description 사용자 신체 치수와 제품 실측 데이터 비교하여 사이즈 조정
 */
function calibrateWithProductMeasurements(
  recommendation: SizeRecommendation,
  productMeasurements: ProductMeasurements,
  userMeasurements: UserBodyMeasurements,
  category: ClothingCategory
): SizeRecommendation {
  // 현재 추천 사이즈의 실측 데이터 찾기
  const currentSizeMeasurement = productMeasurements.sizeMeasurements.find(
    (sm) => sm.size === recommendation.recommendedSize
  );

  if (!currentSizeMeasurement) {
    return recommendation;
  }

  const actual = currentSizeMeasurement.actualMeasurements;

  // 카테고리별 주요 비교 기준
  let needsSizeUp = false;
  let needsSizeDown = false;
  let reason = '';

  if (category === 'top' || category === 'outer') {
    // 상의: 가슴 너비, 어깨 너비 비교
    if (userMeasurements.chest && actual.chestWidth) {
      // 제품 실측은 단면 기준, 사용자 치수는 둘레 기준
      const productChestCircumference = actual.chestWidth * 2;
      const diff = userMeasurements.chest - productChestCircumference;

      if (diff > 6) {
        // 6cm 이상 작으면 사이즈업
        needsSizeUp = true;
        reason = '가슴 둘레 기준 한 사이즈 업 권장';
      } else if (diff < -10) {
        // 10cm 이상 여유 있으면 사이즈다운 고려
        needsSizeDown = true;
        reason = '가슴 둘레 기준 여유 있어 사이즈 다운 가능';
      }
    }

    if (!needsSizeUp && !needsSizeDown && userMeasurements.shoulder && actual.shoulderWidth) {
      const diff = userMeasurements.shoulder - actual.shoulderWidth;
      if (diff > 3) {
        needsSizeUp = true;
        reason = '어깨 너비 기준 한 사이즈 업 권장';
      }
    }
  } else if (category === 'bottom') {
    // 하의: 허리 너비, 엉덩이 너비 비교
    if (userMeasurements.waist && actual.waistWidth) {
      const productWaistCircumference = actual.waistWidth * 2;
      const diff = userMeasurements.waist - productWaistCircumference;

      if (diff > 4) {
        needsSizeUp = true;
        reason = '허리 둘레 기준 한 사이즈 업 권장';
      } else if (diff < -8) {
        needsSizeDown = true;
        reason = '허리 둘레 기준 여유 있어 사이즈 다운 가능';
      }
    }

    if (!needsSizeUp && !needsSizeDown && userMeasurements.hip && actual.hipWidth) {
      const productHipCircumference = actual.hipWidth * 2;
      const diff = userMeasurements.hip - productHipCircumference;

      if (diff > 4) {
        needsSizeUp = true;
        reason = '엉덩이 둘레 기준 한 사이즈 업 권장';
      }
    }
  }

  // 사이즈 조정
  if (needsSizeUp || needsSizeDown) {
    const calibratedSize = needsSizeUp
      ? adjustSizeUp(recommendation.recommendedSize)
      : adjustSizeDown(recommendation.recommendedSize);

    // 신뢰도 조정: 실측 데이터 신뢰도 반영
    const confidenceBoost = productMeasurements.reliability * 10;

    return {
      ...recommendation,
      recommendedSize: calibratedSize,
      confidence: Math.min(recommendation.confidence + confidenceBoost, 95),
      alternatives: [
        {
          size: recommendation.recommendedSize,
          note: `기본 추천 (${reason})`,
        },
        ...recommendation.alternatives.filter((a) => a.size !== calibratedSize),
      ],
      brandInfo: {
        ...recommendation.brandInfo,
        sizeNote: `실측 데이터 기반: ${reason}`,
      },
    };
  }

  // 보정 불필요 시 신뢰도만 소폭 상향
  return {
    ...recommendation,
    confidence: Math.min(recommendation.confidence + 5, 95),
    brandInfo: {
      ...recommendation.brandInfo,
      sizeNote: recommendation.brandInfo?.sizeNote
        ? `${recommendation.brandInfo.sizeNote} (실측 확인됨)`
        : '제품 실측 데이터 확인됨',
    },
  };
}

// ============================================
// Phase L-3-2: 체형별 사이즈 조정 (고도화)
// ============================================

/**
 * 체형별 사이즈 조정 규칙
 * @description 카테고리별로 체형에 따른 사이즈 조정값 (숫자: 사이즈 단계)
 */
const BODY_TYPE_SIZE_ADJUSTMENTS: Record<BodyType, Partial<Record<ClothingCategory, number>>> = {
  // S/W/N 체형 (새 체형 시스템)
  S: { top: 0, bottom: 0 }, // 스트레이트: 표준
  W: { top: 0, bottom: 1 }, // 웨이브: 하의 한 사이즈 업 (하체 볼륨)
  N: { top: 1, bottom: 0 }, // 내추럴: 상의 한 사이즈 업 (어깨 넓음)

  // 레거시 체형 (8타입)
  X: { top: 0, bottom: 0 }, // 모래시계: 표준
  A: { top: -1, bottom: 1 }, // 배형(하체발달): 상의 다운, 하의 업
  V: { top: 1, bottom: -1 }, // 역삼각(상체발달): 상의 업, 하의 다운
  H: { top: 0, bottom: 0 }, // 직사각: 표준
  O: { top: 1, bottom: 1 }, // 원형: 전체 업
  I: { top: 0, bottom: 0 }, // I자형: 표준
  Y: { top: 1, bottom: 0 }, // Y자형(어깨 넓음): 상의 업
  '8': { top: 0, bottom: 0 }, // 8자형: 표준
};

/**
 * 체형별 사이즈 조정 라벨
 */
const BODY_TYPE_LABELS: Record<BodyType, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
  X: 'X자형',
  A: 'A자형',
  V: 'V자형',
  H: 'H자형',
  O: 'O자형',
  I: 'I자형',
  Y: 'Y자형',
  '8': '8자형',
};

/**
 * 강화된 사이즈 추천 (Phase L-3-2)
 * @description 체형 + 상세 치수 + 선호 핏을 모두 고려한 정밀 추천
 */
export function recommendSizeEnhanced(
  product: {
    category: ClothingCategory;
    sizeChart?: any; // 제품별 사이즈 차트 (있는 경우)
  },
  userProfile: {
    height: number;
    weight: number;
    bodyType: BodyType;
    measurements?: UserBodyMeasurements;
    preferredFit: PreferredFit;
  }
): EnhancedSizeRecommendation {
  const reasoningSteps: string[] = [];

  // 1. 기본 BMI 기반 추론
  const bmi = userProfile.weight / (userProfile.height / 100) ** 2;
  let baseSize = bmiToSize(bmi, product.category);
  reasoningSteps.push(`BMI ${bmi.toFixed(1)} 기준 기본 사이즈: ${baseSize}`);

  const originalSize = baseSize;

  // 2. 체형별 조정
  const bodyTypeAdjustment = BODY_TYPE_SIZE_ADJUSTMENTS[userProfile.bodyType]?.[product.category];
  if (bodyTypeAdjustment && bodyTypeAdjustment !== 0) {
    const beforeAdjust = baseSize;
    baseSize = adjustSizeBySteps(baseSize, bodyTypeAdjustment);
    const bodyTypeLabel = BODY_TYPE_LABELS[userProfile.bodyType] || userProfile.bodyType;

    if (bodyTypeAdjustment > 0) {
      reasoningSteps.push(
        `${bodyTypeLabel} 체형으로 ${Math.abs(bodyTypeAdjustment)}단계 업 (${beforeAdjust} → ${baseSize})`
      );
    } else {
      reasoningSteps.push(
        `${bodyTypeLabel} 체형으로 ${Math.abs(bodyTypeAdjustment)}단계 다운 (${beforeAdjust} → ${baseSize})`
      );
    }
  } else {
    const bodyTypeLabel = BODY_TYPE_LABELS[userProfile.bodyType] || userProfile.bodyType;
    reasoningSteps.push(`${bodyTypeLabel} 체형은 표준 사이즈 적용`);
  }

  // 3. 상세 치수 기반 조정 (있는 경우)
  if (userProfile.measurements && product.sizeChart) {
    const measurementSize = measurementsToSize(
      userProfile.measurements,
      product.category,
      product.sizeChart
    );

    if (measurementSize && measurementSize !== baseSize) {
      reasoningSteps.push(`상세 치수 기준 사이즈: ${measurementSize} (치수 우선 적용)`);
      baseSize = measurementSize;
    } else if (userProfile.measurements) {
      reasoningSteps.push('상세 치수 확인 완료 (조정 불필요)');
    }
  }

  // 4. 선호 핏 반영
  if (userProfile.preferredFit === 'tight') {
    const beforeFit = baseSize;
    baseSize = adjustSizeDown(baseSize);
    if (beforeFit !== baseSize) {
      reasoningSteps.push(`타이트 핏 선호로 한 사이즈 다운 (${beforeFit} → ${baseSize})`);
    }
  } else if (userProfile.preferredFit === 'loose') {
    const beforeFit = baseSize;
    baseSize = adjustSizeUp(baseSize);
    if (beforeFit !== baseSize) {
      reasoningSteps.push(`루즈 핏 선호로 한 사이즈 업 (${beforeFit} → ${baseSize})`);
    }
  } else {
    reasoningSteps.push('레귤러 핏 적용');
  }

  // 신뢰도 계산
  let confidence = 60; // 기본 신뢰도

  // 체형 정보 있으면 +15
  if (userProfile.bodyType) {
    confidence += 15;
  }

  // 상세 치수 있으면 +20
  if (
    userProfile.measurements &&
    (userProfile.measurements.chest || userProfile.measurements.waist)
  ) {
    confidence += 20;
  }

  // 키/몸무게 있으면 +5
  if (userProfile.height && userProfile.weight) {
    confidence += 5;
  }

  confidence = Math.min(confidence, 95); // 최대 95%

  // 조정 내역 기록
  let adjustments: EnhancedSizeRecommendation['adjustments'] = undefined;
  if (originalSize !== baseSize) {
    adjustments = {
      reason: reasoningSteps.slice(1).join(', '),
      fromSize: originalSize,
      toSize: baseSize,
    };
  }

  return {
    size: baseSize,
    confidence,
    reasoning: reasoningSteps.join('\n'),
    adjustments,
  };
}

/**
 * BMI를 기본 사이즈로 변환
 */
function bmiToSize(bmi: number, category: ClothingCategory): string {
  // 상의/아우터/드레스는 동일한 BMI 기준 적용
  if (category === 'top' || category === 'outer' || category === 'dress') {
    if (bmi < 18.5) return 'S';
    if (bmi < 23) return 'M';
    if (bmi < 27) return 'L';
    return 'XL';
  } else if (category === 'bottom') {
    // 하의는 BMI보다 허리 치수가 중요하지만, 기본값으로 제공
    if (bmi < 19) return 'S';
    if (bmi < 24) return 'M';
    if (bmi < 28) return 'L';
    return 'XL';
  } else if (category === 'shoes') {
    // 신발은 BMI와 무관, 기본 평균 사이즈
    return '260';
  }

  return 'M'; // 기본값
}

/**
 * 사이즈를 N단계 조정
 * @param size 현재 사이즈
 * @param steps 조정 단계 (양수: 업, 음수: 다운)
 */
function adjustSizeBySteps(size: string, steps: number): string {
  if (steps === 0) return size;

  let result = size;
  const absSteps = Math.abs(steps);

  for (let i = 0; i < absSteps; i++) {
    result = steps > 0 ? adjustSizeUp(result) : adjustSizeDown(result);
  }

  return result;
}

/**
 * 상세 치수로 사이즈 추론
 * @description 사용자 치수와 사이즈 차트 비교하여 최적 사이즈 반환
 */
function measurementsToSize(
  measurements: UserBodyMeasurements,
  category: ClothingCategory,
  sizeChart: any
): string | null {
  // 사이즈 차트가 없으면 null 반환
  if (!sizeChart || !sizeChart.sizeMappings) {
    return null;
  }

  // 카테고리별 주요 치수 확인
  let primaryMeasurement: number | undefined;
  let measurementKey: string;

  if (category === 'top' || category === 'outer') {
    primaryMeasurement = measurements.chest;
    measurementKey = 'chest';
  } else if (category === 'bottom') {
    primaryMeasurement = measurements.waist;
    measurementKey = 'waist';
  } else {
    return null; // 신발이나 드레스는 간단한 차트 필요
  }

  if (!primaryMeasurement) {
    return null;
  }

  // 사이즈 매핑에서 가장 적합한 사이즈 찾기
  for (const mapping of sizeChart.sizeMappings) {
    const range = mapping.measurements[measurementKey];
    if (range && primaryMeasurement >= range.min && primaryMeasurement <= range.max) {
      return mapping.label;
    }
  }

  return null;
}
