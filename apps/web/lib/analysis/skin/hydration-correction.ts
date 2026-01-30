/**
 * 수분도-Roughness 보정 알고리즘 모듈
 *
 * @module lib/analysis/skin/hydration-correction
 * @description S-2 고도화: Ra 기반 수분도 추정 및 TEWL/환경 보정
 * @see {@link docs/principles/skin-physiology.md} Section 6
 *
 * 핵심 원리:
 * - 수분 손실 → 각질층 효소 반응 저하 → 각질 축적 → 거친 표면 (Ra 증가)
 * - Ra와 수분도는 역상관 관계 (R² = 0.524, Koseki et al.)
 * - TEWL은 Roughness보다 더 강력한 수분 예측 인자
 *
 * 보정 모델:
 * 1. Ra 기반 기본 추정: Hydration = 100 - (Ra - 15) × 2.5
 * 2. TEWL 기반 보정: 장벽 기능 상태 반영
 * 3. 환경 보정: 습도/온도에 따른 TEWL 변동 고려
 */

// =============================================================================
// 타입 정의
// =============================================================================

/**
 * 수분도 보정 입력 파라미터
 */
export interface HydrationCorrectionInput {
  /** 평균 조도 Ra (μm) - 필수 */
  roughnessRa: number;
  /** 경피수분손실 TEWL (g/m²/h) - 옵션, 있으면 더 정확 */
  tewl?: number;
  /** 주변 습도 (%) - 옵션, 환경 보정에 사용 */
  ambientHumidity?: number;
  /** 온도 (°C) - 옵션, 환경 보정에 사용 */
  temperature?: number;
}

/**
 * 수분도 수준 분류 (5단계)
 */
export type HydrationLevel =
  | 'very_dry'     // 매우 건조
  | 'dry'          // 건조
  | 'normal'       // 정상
  | 'hydrated'     // 촉촉
  | 'very_hydrated'; // 매우 촉촉

/**
 * 수분도 보정 결과
 */
export interface HydrationCorrectionResult {
  /** 추정 수분도 (0-100) */
  estimatedHydration: number;
  /** 수분도 수준 */
  hydrationLevel: HydrationLevel;
  /** 신뢰도 (0-1) - 입력 데이터 완성도에 따라 결정 */
  confidence: number;
  /** 보정 요소 분석 */
  correctionFactors: {
    /** Ra 기반 기여도 (0-100) */
    roughnessContribution: number;
    /** TEWL 기반 기여도 (있는 경우) */
    tewlContribution?: number;
    /** 환경 보정 계수 (1.0 기준) */
    environmentalAdjustment: number;
  };
  /** 관리 권장 사항 */
  recommendations: string[];
}

// =============================================================================
// 상수 정의
// =============================================================================

/**
 * Ra 기반 수분도 모델 파라미터
 *
 * 선형 모델: Hydration = 100 - (Ra - RA_OPTIMAL) × RA_SLOPE
 * - Ra 15μm = 100% (최적)
 * - Ra 55μm = 0% (극건조)
 *
 * @see docs/principles/skin-physiology.md Section 4.2
 */
export const RA_MODEL = {
  /** 최적 Ra 값 (μm) - 100% 수분도 기준 */
  RA_OPTIMAL: 15,
  /** 극건조 Ra 값 (μm) - 0% 수분도 기준 */
  RA_EXTREME_DRY: 55,
  /** 선형 모델 기울기: (100 - 0) / (55 - 15) = 2.5 */
  RA_SLOPE: 2.5,
} as const;

/**
 * TEWL 기준값 (g/m²/h)
 *
 * @see docs/principles/skin-physiology.md Section 6.1
 */
export const TEWL_THRESHOLDS = {
  /** 정상 장벽 기능 */
  NORMAL: 10,
  /** 약간 손상 */
  MILD_DAMAGE: 15,
  /** 중등도 손상 */
  MODERATE_DAMAGE: 25,
  /** 심각한 장벽 손상 */
  SEVERE_DAMAGE: 35,
} as const;

/**
 * 환경 보정 기준값
 */
export const ENVIRONMENT_BASELINE = {
  /** 습도 기준 (%) */
  HUMIDITY: 40,
  /** 온도 기준 (°C) */
  TEMPERATURE: 22,
  /** 습도 변화 10%당 보정률 */
  HUMIDITY_FACTOR_PER_10: 0.05,
  /** 온도 변화 5°C당 보정률 */
  TEMP_FACTOR_PER_5: 0.03,
} as const;

/**
 * 수분도 수준별 임계값
 */
export const HYDRATION_THRESHOLDS = {
  VERY_DRY: 20,
  DRY: 40,
  NORMAL: 60,
  HYDRATED: 80,
} as const;

// =============================================================================
// 시그모이드 함수 (극단값 보정)
// =============================================================================

/**
 * 시그모이드 함수로 극단값 부드럽게 처리
 *
 * 선형 모델의 한계 (0 미만, 100 초과)를 자연스럽게 클램핑
 *
 * @param x - 입력값
 * @param midpoint - 중간점 (기본 50)
 * @param steepness - 기울기 (기본 0.1)
 * @returns 0-100 범위의 부드러운 출력
 */
function sigmoid(x: number, midpoint = 50, steepness = 0.1): number {
  return 100 / (1 + Math.exp(-steepness * (x - midpoint)));
}

// =============================================================================
// 핵심 함수
// =============================================================================

/**
 * Ra 기반 기본 수분도 추정
 *
 * 선형 모델 적용 후 시그모이드 보정으로 극단값 처리
 *
 * @param ra - 평균 조도 Ra (μm)
 * @returns 추정 수분도 (0-100)
 *
 * @example
 * ```typescript
 * estimateHydrationFromRoughness(15);  // 100 (최적)
 * estimateHydrationFromRoughness(35);  // 약 50 (중간)
 * estimateHydrationFromRoughness(55);  // 약 0 (극건조)
 * ```
 *
 * @see docs/principles/skin-physiology.md Section 6.4
 */
export function estimateHydrationFromRoughness(ra: number): number {
  // Ra 유효성 검사
  if (ra < 0) {
    return 100;
  }

  // 선형 모델: Hydration = 100 - (Ra - 15) × 2.5
  const linearEstimate = 100 - (ra - RA_MODEL.RA_OPTIMAL) * RA_MODEL.RA_SLOPE;

  // 극단값 시그모이드 보정
  // 선형 결과가 0-100 범위 밖이면 시그모이드로 부드럽게 처리
  if (linearEstimate < 0 || linearEstimate > 100) {
    return sigmoid(linearEstimate, 50, 0.08);
  }

  return Math.round(linearEstimate);
}

/**
 * TEWL 기반 수분도 보정
 *
 * TEWL은 피부 장벽 기능의 직접적 지표
 * - 낮은 TEWL = 건강한 장벽 = 수분 유지력 높음
 * - 높은 TEWL = 손상된 장벽 = 수분 손실 증가
 *
 * @param baseHydration - Ra 기반 기본 수분도 (0-100)
 * @param tewl - 경피수분손실 (g/m²/h)
 * @returns 보정된 수분도 (0-100)
 *
 * @example
 * ```typescript
 * correctHydrationWithTEWL(60, 8);   // > 60 (정상 장벽)
 * correctHydrationWithTEWL(60, 20);  // < 60 (손상된 장벽)
 * ```
 *
 * @see docs/principles/skin-physiology.md Section 6.1
 */
export function correctHydrationWithTEWL(
  baseHydration: number,
  tewl: number
): number {
  // TEWL 유효성 검사
  if (tewl < 0) {
    return baseHydration;
  }

  // TEWL 기반 보정 계수 계산
  // 정상 범위 (<10): 보정 +10%까지
  // 경미한 손상 (10-15): 보정 없음 (기준점)
  // 중등도 손상 (15-25): 보정 -10~-20%
  // 심각한 손상 (>25): 보정 -20% 이상

  let correctionFactor: number;

  if (tewl < TEWL_THRESHOLDS.NORMAL) {
    // 정상: TEWL이 낮을수록 수분 유지력 높음
    correctionFactor = 1 + (TEWL_THRESHOLDS.NORMAL - tewl) / TEWL_THRESHOLDS.NORMAL * 0.15;
  } else if (tewl < TEWL_THRESHOLDS.MILD_DAMAGE) {
    // 경미한 손상: 미세 하락
    const ratio = (tewl - TEWL_THRESHOLDS.NORMAL) /
      (TEWL_THRESHOLDS.MILD_DAMAGE - TEWL_THRESHOLDS.NORMAL);
    correctionFactor = 1 - ratio * 0.05;
  } else if (tewl < TEWL_THRESHOLDS.MODERATE_DAMAGE) {
    // 중등도 손상
    const ratio = (tewl - TEWL_THRESHOLDS.MILD_DAMAGE) /
      (TEWL_THRESHOLDS.MODERATE_DAMAGE - TEWL_THRESHOLDS.MILD_DAMAGE);
    correctionFactor = 0.95 - ratio * 0.15;
  } else {
    // 심각한 손상: 최대 30% 감소
    const ratio = Math.min(
      1,
      (tewl - TEWL_THRESHOLDS.MODERATE_DAMAGE) /
        (TEWL_THRESHOLDS.SEVERE_DAMAGE - TEWL_THRESHOLDS.MODERATE_DAMAGE)
    );
    correctionFactor = 0.80 - ratio * 0.10;
  }

  const correctedHydration = baseHydration * correctionFactor;
  return Math.max(0, Math.min(100, Math.round(correctedHydration)));
}

/**
 * 환경 조건에 따른 수분도 보정
 *
 * 습도와 온도가 피부 수분 상태에 미치는 영향 반영
 * - 높은 습도: TEWL 감소 → 수분 유지 향상
 * - 높은 온도: TEWL 증가 → 수분 손실 증가
 *
 * @param hydration - 기존 수분도 (0-100)
 * @param humidity - 주변 습도 (%)
 * @param temperature - 온도 (°C)
 * @returns 환경 보정된 수분도 (0-100)
 *
 * @example
 * ```typescript
 * // 습도 60%, 온도 22°C (좋은 환경)
 * applyEnvironmentalCorrection(50, 60, 22);  // > 50
 *
 * // 습도 20%, 온도 30°C (건조한 환경)
 * applyEnvironmentalCorrection(50, 20, 30);  // < 50
 * ```
 */
export function applyEnvironmentalCorrection(
  hydration: number,
  humidity: number,
  temperature: number
): number {
  // 습도 보정: 40% 기준, ±10%마다 ±5% 보정
  const humidityDelta = humidity - ENVIRONMENT_BASELINE.HUMIDITY;
  const humidityFactor = 1 + (humidityDelta / 10) * ENVIRONMENT_BASELINE.HUMIDITY_FACTOR_PER_10;

  // 온도 보정: 22°C 기준, ±5°C마다 ∓3% 보정 (온도 높으면 수분 손실)
  const tempDelta = temperature - ENVIRONMENT_BASELINE.TEMPERATURE;
  const tempFactor = 1 - (tempDelta / 5) * ENVIRONMENT_BASELINE.TEMP_FACTOR_PER_5;

  // 복합 보정 계수 (0.7 ~ 1.3 범위로 제한)
  const combinedFactor = Math.max(0.7, Math.min(1.3, humidityFactor * tempFactor));

  const correctedHydration = hydration * combinedFactor;
  return Math.max(0, Math.min(100, Math.round(correctedHydration)));
}

/**
 * 수분도 수준 분류
 *
 * @param hydration - 수분도 (0-100)
 * @returns 수분도 수준
 */
export function classifyHydrationLevel(hydration: number): HydrationLevel {
  if (hydration < HYDRATION_THRESHOLDS.VERY_DRY) return 'very_dry';
  if (hydration < HYDRATION_THRESHOLDS.DRY) return 'dry';
  if (hydration < HYDRATION_THRESHOLDS.NORMAL) return 'normal';
  if (hydration < HYDRATION_THRESHOLDS.HYDRATED) return 'hydrated';
  return 'very_hydrated';
}

/**
 * 수분도 수준별 권장 사항 생성
 *
 * @param level - 수분도 수준
 * @param hasTewl - TEWL 데이터 유무
 * @param tewl - TEWL 값 (옵션)
 * @returns 권장 사항 목록
 */
function generateRecommendations(
  level: HydrationLevel,
  hasTewl: boolean,
  tewl?: number
): string[] {
  const recommendations: string[] = [];

  switch (level) {
    case 'very_dry':
      recommendations.push('피부가 매우 건조합니다. 집중 보습 케어가 필요합니다.');
      recommendations.push('세라마이드, 히알루론산 함유 고보습 제품을 사용하세요.');
      recommendations.push('하루 2회 이상 보습제를 바르고, 세안 후 3분 이내에 보습하세요.');
      recommendations.push('실내 가습기 사용을 권장합니다.');
      recommendations.push('증상이 지속되면 피부과 상담을 권장합니다.');
      break;

    case 'dry':
      recommendations.push('피부가 건조한 편입니다. 보습 케어를 강화하세요.');
      recommendations.push('수분 크림 사용량을 늘리고, 에센스를 추가하세요.');
      recommendations.push('각질 제거는 주 1회로 제한하세요.');
      break;

    case 'normal':
      recommendations.push('피부 수분 상태가 양호합니다.');
      recommendations.push('현재 케어 루틴을 유지하세요.');
      recommendations.push('계절 변화에 따라 보습력을 조절하세요.');
      break;

    case 'hydrated':
      recommendations.push('피부 수분이 충분합니다.');
      recommendations.push('가벼운 수분 제품으로 유지 관리하세요.');
      recommendations.push('과도한 유분 제품은 피하세요.');
      break;

    case 'very_hydrated':
      recommendations.push('피부 수분이 매우 좋은 상태입니다.');
      recommendations.push('현재 상태를 유지하세요.');
      recommendations.push('가벼운 로션이나 젤 타입 제품이 적합합니다.');
      break;
  }

  // TEWL 기반 추가 권장 사항
  if (hasTewl && tewl !== undefined) {
    if (tewl > TEWL_THRESHOLDS.MODERATE_DAMAGE) {
      recommendations.push('피부 장벽이 손상되었습니다. 장벽 강화 제품을 사용하세요.');
      recommendations.push('자극적인 성분(레티놀, AHA 등)은 일시 중단하세요.');
    } else if (tewl > TEWL_THRESHOLDS.MILD_DAMAGE) {
      recommendations.push('피부 장벽 기능이 약간 저하되었습니다.');
      recommendations.push('세라마이드, 판테놀 성분이 도움이 됩니다.');
    }
  }

  return recommendations;
}

/**
 * 신뢰도 계산
 *
 * 입력 데이터 완성도에 따라 결과 신뢰도 결정
 * - Ra만: 0.6
 * - Ra + TEWL: 0.8
 * - Ra + TEWL + 환경: 0.95
 *
 * @param input - 입력 파라미터
 * @returns 신뢰도 (0-1)
 */
function calculateConfidence(input: HydrationCorrectionInput): number {
  let confidence = 0.6; // Ra만 있을 때 기본 신뢰도

  // TEWL 있으면 신뢰도 증가
  if (input.tewl !== undefined) {
    confidence += 0.2;
  }

  // 환경 데이터 있으면 신뢰도 추가 증가
  if (input.ambientHumidity !== undefined && input.temperature !== undefined) {
    confidence += 0.15;
  } else if (input.ambientHumidity !== undefined || input.temperature !== undefined) {
    confidence += 0.08;
  }

  // Ra 값 유효 범위에 따른 신뢰도 조정
  // 정상 범위(13-60μm) 내: 신뢰도 유지
  // 범위 밖: 신뢰도 감소
  if (input.roughnessRa < 10 || input.roughnessRa > 70) {
    confidence -= 0.1;
  }

  return Math.max(0.3, Math.min(1.0, confidence));
}

// =============================================================================
// 종합 계산 함수
// =============================================================================

/**
 * 종합 수분도 계산 (메인 함수)
 *
 * 입력 데이터에 따라 단계별 보정 적용:
 * 1. Ra 기반 기본 추정
 * 2. TEWL 기반 보정 (있는 경우)
 * 3. 환경 조건 보정 (있는 경우)
 *
 * @param input - 수분도 보정 입력 파라미터
 * @returns 종합 수분도 보정 결과
 *
 * @example
 * ```typescript
 * // Ra만 사용
 * const result1 = calculateCorrectedHydration({ roughnessRa: 30 });
 *
 * // Ra + TEWL
 * const result2 = calculateCorrectedHydration({
 *   roughnessRa: 30,
 *   tewl: 12,
 * });
 *
 * // 전체 파라미터
 * const result3 = calculateCorrectedHydration({
 *   roughnessRa: 30,
 *   tewl: 12,
 *   ambientHumidity: 55,
 *   temperature: 24,
 * });
 * ```
 *
 * @see docs/principles/skin-physiology.md Section 6
 */
export function calculateCorrectedHydration(
  input: HydrationCorrectionInput
): HydrationCorrectionResult {
  const { roughnessRa, tewl, ambientHumidity, temperature } = input;

  // 1단계: Ra 기반 기본 추정
  const roughnessContribution = estimateHydrationFromRoughness(roughnessRa);
  let estimatedHydration = roughnessContribution;

  // 2단계: TEWL 기반 보정 (옵션)
  let tewlContribution: number | undefined;
  if (tewl !== undefined) {
    const beforeTewl = estimatedHydration;
    estimatedHydration = correctHydrationWithTEWL(estimatedHydration, tewl);
    tewlContribution = estimatedHydration - beforeTewl;
  }

  // 3단계: 환경 보정 (옵션)
  // 습도와 온도 모두 있거나, 둘 중 하나만 있어도 적용
  let environmentalAdjustment = 1.0;
  if (ambientHumidity !== undefined || temperature !== undefined) {
    const humidity = ambientHumidity ?? ENVIRONMENT_BASELINE.HUMIDITY;
    const temp = temperature ?? ENVIRONMENT_BASELINE.TEMPERATURE;

    const beforeEnv = estimatedHydration;
    estimatedHydration = applyEnvironmentalCorrection(estimatedHydration, humidity, temp);

    // 환경 보정 계수 역산
    if (beforeEnv > 0) {
      environmentalAdjustment = estimatedHydration / beforeEnv;
    }
  }

  // 최종 수분도 수준 분류
  const hydrationLevel = classifyHydrationLevel(estimatedHydration);

  // 신뢰도 계산
  const confidence = calculateConfidence(input);

  // 권장 사항 생성
  const recommendations = generateRecommendations(
    hydrationLevel,
    tewl !== undefined,
    tewl
  );

  return {
    estimatedHydration,
    hydrationLevel,
    confidence,
    correctionFactors: {
      roughnessContribution,
      tewlContribution,
      environmentalAdjustment: Math.round(environmentalAdjustment * 1000) / 1000,
    },
    recommendations,
  };
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * Ra 값 유효성 검사
 *
 * @param ra - 평균 조도 (μm)
 * @returns 유효 여부와 경고 메시지
 */
export function validateRoughnessRa(
  ra: number
): { valid: boolean; warning?: string } {
  if (ra < 0) {
    return { valid: false, warning: 'Ra 값은 0 이상이어야 합니다.' };
  }
  if (ra < 10) {
    return { valid: true, warning: 'Ra 값이 매우 낮습니다. 측정 오류일 수 있습니다.' };
  }
  if (ra > 80) {
    return { valid: true, warning: 'Ra 값이 매우 높습니다. 측정 오류일 수 있습니다.' };
  }
  return { valid: true };
}

/**
 * TEWL 값 해석
 *
 * @param tewl - 경피수분손실 (g/m²/h)
 * @returns 장벽 상태 설명
 */
export function interpretTEWL(tewl: number): {
  status: 'normal' | 'mild' | 'moderate' | 'severe';
  description: string;
} {
  if (tewl < TEWL_THRESHOLDS.NORMAL) {
    return {
      status: 'normal',
      description: '피부 장벽 기능이 정상입니다. 수분 손실이 적습니다.',
    };
  }
  if (tewl < TEWL_THRESHOLDS.MILD_DAMAGE) {
    return {
      status: 'mild',
      description: '피부 장벽이 약간 손상되었습니다. 보습 강화를 권장합니다.',
    };
  }
  if (tewl < TEWL_THRESHOLDS.MODERATE_DAMAGE) {
    return {
      status: 'moderate',
      description: '피부 장벽이 중등도 손상되었습니다. 장벽 복구 케어가 필요합니다.',
    };
  }
  return {
    status: 'severe',
    description: '피부 장벽이 심각하게 손상되었습니다. 피부과 상담을 권장합니다.',
  };
}
