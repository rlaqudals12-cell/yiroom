/**
 * 수분도-Roughness 보정 알고리즘 테스트
 *
 * @module tests/lib/analysis/skin/hydration-correction.test
 * @description S-2: Ra 기반 수분도 추정 및 TEWL/환경 보정 테스트
 * @see {@link lib/analysis/skin/hydration-correction}
 */

import { describe, it, expect } from 'vitest';
import {
  estimateHydrationFromRoughness,
  correctHydrationWithTEWL,
  applyEnvironmentalCorrection,
  classifyHydrationLevel,
  calculateCorrectedHydration,
  validateRoughnessRa,
  interpretTEWL,
  RA_MODEL,
  TEWL_THRESHOLDS,
  ENVIRONMENT_BASELINE,
  HYDRATION_THRESHOLDS,
} from '@/lib/analysis/skin/hydration-correction';
import type {
  HydrationCorrectionInput,
} from '@/lib/analysis/skin/hydration-correction';

// =============================================================================
// estimateHydrationFromRoughness 테스트
// =============================================================================

describe('estimateHydrationFromRoughness', () => {
  it('should return 100 for optimal Ra (15μm)', () => {
    const result = estimateHydrationFromRoughness(RA_MODEL.RA_OPTIMAL);
    expect(result).toBe(100);
  });

  it('should return approximately 50 for Ra 35μm (중간값)', () => {
    // 선형 모델: 100 - (35 - 15) × 2.5 = 100 - 50 = 50
    const result = estimateHydrationFromRoughness(35);
    expect(result).toBeCloseTo(50, 0);
  });

  it('should return near 0 for extreme dry Ra (55μm)', () => {
    // 선형 모델: 100 - (55 - 15) × 2.5 = 100 - 100 = 0
    const result = estimateHydrationFromRoughness(RA_MODEL.RA_EXTREME_DRY);
    expect(result).toBeLessThanOrEqual(5); // 시그모이드 보정으로 완전 0은 아님
  });

  it('should handle Ra values below optimal', () => {
    // Ra < 15: 선형 모델상 100 초과, 시그모이드 보정
    const result = estimateHydrationFromRoughness(10);
    expect(result).toBeGreaterThanOrEqual(95);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should handle very high Ra values with sigmoid correction', () => {
    // Ra 70: 선형 모델상 음수, 시그모이드 보정으로 0에 가깝게
    const result = estimateHydrationFromRoughness(70);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(20);
  });

  it('should return 100 for negative Ra (invalid but handled)', () => {
    const result = estimateHydrationFromRoughness(-5);
    expect(result).toBe(100);
  });

  it('should show inverse correlation: higher Ra = lower hydration', () => {
    const ra20 = estimateHydrationFromRoughness(20);
    const ra30 = estimateHydrationFromRoughness(30);
    const ra40 = estimateHydrationFromRoughness(40);
    const ra50 = estimateHydrationFromRoughness(50);

    expect(ra20).toBeGreaterThan(ra30);
    expect(ra30).toBeGreaterThan(ra40);
    expect(ra40).toBeGreaterThan(ra50);
  });
});

// =============================================================================
// correctHydrationWithTEWL 테스트
// =============================================================================

describe('correctHydrationWithTEWL', () => {
  const baseHydration = 60;

  it('should increase hydration for low TEWL (healthy barrier)', () => {
    // TEWL < 10: 정상 장벽, 수분 유지력 높음
    const result = correctHydrationWithTEWL(baseHydration, 5);
    expect(result).toBeGreaterThan(baseHydration);
  });

  it('should maintain similar hydration for normal TEWL', () => {
    // TEWL 10-15: 경미한 변화
    const result = correctHydrationWithTEWL(baseHydration, 12);
    expect(result).toBeCloseTo(baseHydration, -1); // 10% 이내 차이
  });

  it('should decrease hydration for high TEWL (damaged barrier)', () => {
    // TEWL > 15: 장벽 손상, 수분 손실 증가
    const result = correctHydrationWithTEWL(baseHydration, 20);
    expect(result).toBeLessThan(baseHydration);
  });

  it('should significantly decrease hydration for very high TEWL', () => {
    // TEWL > 25: 심각한 장벽 손상
    const result = correctHydrationWithTEWL(baseHydration, 30);
    expect(result).toBeLessThan(baseHydration * 0.85);
  });

  it('should handle negative TEWL gracefully', () => {
    const result = correctHydrationWithTEWL(baseHydration, -5);
    expect(result).toBe(baseHydration);
  });

  it('should not exceed 100 even with very low TEWL', () => {
    const result = correctHydrationWithTEWL(95, 2);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should not go below 0 even with very high TEWL', () => {
    const result = correctHydrationWithTEWL(20, 50);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should show progressive decrease as TEWL increases', () => {
    const tewl5 = correctHydrationWithTEWL(baseHydration, 5);
    const tewl15 = correctHydrationWithTEWL(baseHydration, 15);
    const tewl25 = correctHydrationWithTEWL(baseHydration, 25);
    const tewl35 = correctHydrationWithTEWL(baseHydration, 35);

    expect(tewl5).toBeGreaterThan(tewl15);
    expect(tewl15).toBeGreaterThan(tewl25);
    expect(tewl25).toBeGreaterThan(tewl35);
  });
});

// =============================================================================
// applyEnvironmentalCorrection 테스트
// =============================================================================

describe('applyEnvironmentalCorrection', () => {
  const baseHydration = 50;

  it('should not change hydration at baseline conditions', () => {
    const result = applyEnvironmentalCorrection(
      baseHydration,
      ENVIRONMENT_BASELINE.HUMIDITY,
      ENVIRONMENT_BASELINE.TEMPERATURE
    );
    expect(result).toBe(baseHydration);
  });

  it('should increase hydration for high humidity', () => {
    // 습도 60% (기준 40% + 20%)
    const result = applyEnvironmentalCorrection(baseHydration, 60, 22);
    expect(result).toBeGreaterThan(baseHydration);
  });

  it('should decrease hydration for low humidity', () => {
    // 습도 20% (기준 40% - 20%)
    const result = applyEnvironmentalCorrection(baseHydration, 20, 22);
    expect(result).toBeLessThan(baseHydration);
  });

  it('should decrease hydration for high temperature', () => {
    // 온도 32°C (기준 22°C + 10°C)
    const result = applyEnvironmentalCorrection(baseHydration, 40, 32);
    expect(result).toBeLessThan(baseHydration);
  });

  it('should increase hydration for low temperature', () => {
    // 온도 17°C (기준 22°C - 5°C)
    const result = applyEnvironmentalCorrection(baseHydration, 40, 17);
    expect(result).toBeGreaterThan(baseHydration);
  });

  it('should handle combined favorable conditions', () => {
    // 높은 습도 + 낮은 온도 = 수분 유지에 좋음
    const result = applyEnvironmentalCorrection(baseHydration, 70, 18);
    expect(result).toBeGreaterThan(baseHydration * 1.1);
  });

  it('should handle combined unfavorable conditions', () => {
    // 낮은 습도 + 높은 온도 = 수분 손실 증가
    const result = applyEnvironmentalCorrection(baseHydration, 20, 35);
    expect(result).toBeLessThan(baseHydration * 0.9);
  });

  it('should not exceed 100', () => {
    const result = applyEnvironmentalCorrection(95, 80, 15);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should not go below 0', () => {
    const result = applyEnvironmentalCorrection(10, 10, 40);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// classifyHydrationLevel 테스트
// =============================================================================

describe('classifyHydrationLevel', () => {
  it('should classify as very_dry for hydration < 20', () => {
    expect(classifyHydrationLevel(15)).toBe('very_dry');
    expect(classifyHydrationLevel(0)).toBe('very_dry');
    expect(classifyHydrationLevel(19)).toBe('very_dry');
  });

  it('should classify as dry for hydration 20-39', () => {
    expect(classifyHydrationLevel(20)).toBe('dry');
    expect(classifyHydrationLevel(30)).toBe('dry');
    expect(classifyHydrationLevel(39)).toBe('dry');
  });

  it('should classify as normal for hydration 40-59', () => {
    expect(classifyHydrationLevel(40)).toBe('normal');
    expect(classifyHydrationLevel(50)).toBe('normal');
    expect(classifyHydrationLevel(59)).toBe('normal');
  });

  it('should classify as hydrated for hydration 60-79', () => {
    expect(classifyHydrationLevel(60)).toBe('hydrated');
    expect(classifyHydrationLevel(70)).toBe('hydrated');
    expect(classifyHydrationLevel(79)).toBe('hydrated');
  });

  it('should classify as very_hydrated for hydration >= 80', () => {
    expect(classifyHydrationLevel(80)).toBe('very_hydrated');
    expect(classifyHydrationLevel(90)).toBe('very_hydrated');
    expect(classifyHydrationLevel(100)).toBe('very_hydrated');
  });
});

// =============================================================================
// calculateCorrectedHydration 테스트 (종합 함수)
// =============================================================================

describe('calculateCorrectedHydration', () => {
  describe('with Ra only', () => {
    it('should calculate hydration from Ra', () => {
      const input: HydrationCorrectionInput = { roughnessRa: 30 };
      const result = calculateCorrectedHydration(input);

      expect(result.estimatedHydration).toBeCloseTo(62, -1); // 약 62
      expect(result.hydrationLevel).toBe('hydrated');
      expect(result.confidence).toBeCloseTo(0.6, 1);
      expect(result.correctionFactors.roughnessContribution).toBeDefined();
      expect(result.correctionFactors.tewlContribution).toBeUndefined();
      expect(result.correctionFactors.environmentalAdjustment).toBe(1);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return proper level for dry skin (high Ra)', () => {
      const input: HydrationCorrectionInput = { roughnessRa: 45 };
      const result = calculateCorrectedHydration(input);

      expect(result.hydrationLevel).toBe('dry');
    });

    it('should return proper level for hydrated skin (low Ra)', () => {
      const input: HydrationCorrectionInput = { roughnessRa: 18 };
      const result = calculateCorrectedHydration(input);

      expect(result.hydrationLevel).toBe('very_hydrated');
    });
  });

  describe('with Ra and TEWL', () => {
    it('should apply TEWL correction', () => {
      const inputRaOnly: HydrationCorrectionInput = { roughnessRa: 30 };
      const inputWithTewl: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 20, // 중등도 손상
      };

      const resultRaOnly = calculateCorrectedHydration(inputRaOnly);
      const resultWithTewl = calculateCorrectedHydration(inputWithTewl);

      // TEWL이 높으면 수분도 감소
      expect(resultWithTewl.estimatedHydration).toBeLessThan(resultRaOnly.estimatedHydration);
      expect(resultWithTewl.correctionFactors.tewlContribution).toBeDefined();
      expect(resultWithTewl.correctionFactors.tewlContribution).toBeLessThan(0);
    });

    it('should increase confidence with TEWL data', () => {
      const inputRaOnly: HydrationCorrectionInput = { roughnessRa: 30 };
      const inputWithTewl: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
      };

      const resultRaOnly = calculateCorrectedHydration(inputRaOnly);
      const resultWithTewl = calculateCorrectedHydration(inputWithTewl);

      expect(resultWithTewl.confidence).toBeGreaterThan(resultRaOnly.confidence);
    });

    it('should add barrier recommendations for high TEWL', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 28,
      };
      const result = calculateCorrectedHydration(input);

      // 장벽 손상 관련 권장 사항 포함 확인
      const hasBarrierRecommendation = result.recommendations.some(
        (r) => r.includes('장벽') || r.includes('barrier')
      );
      expect(hasBarrierRecommendation).toBe(true);
    });
  });

  describe('with full parameters', () => {
    it('should apply all corrections', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
        ambientHumidity: 55,
        temperature: 24,
      };
      const result = calculateCorrectedHydration(input);

      expect(result.correctionFactors.roughnessContribution).toBeDefined();
      expect(result.correctionFactors.tewlContribution).toBeDefined();
      expect(result.correctionFactors.environmentalAdjustment).not.toBe(1);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should improve with favorable environment', () => {
      const inputBase: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
      };
      const inputFavorable: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
        ambientHumidity: 65, // 높은 습도
        temperature: 20,     // 낮은 온도
      };

      const resultBase = calculateCorrectedHydration(inputBase);
      const resultFavorable = calculateCorrectedHydration(inputFavorable);

      expect(resultFavorable.estimatedHydration).toBeGreaterThan(resultBase.estimatedHydration);
    });

    it('should worsen with unfavorable environment', () => {
      const inputBase: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
      };
      const inputUnfavorable: HydrationCorrectionInput = {
        roughnessRa: 30,
        tewl: 12,
        ambientHumidity: 25, // 낮은 습도
        temperature: 30,     // 높은 온도
      };

      const resultBase = calculateCorrectedHydration(inputBase);
      const resultUnfavorable = calculateCorrectedHydration(inputUnfavorable);

      expect(resultUnfavorable.estimatedHydration).toBeLessThan(resultBase.estimatedHydration);
    });
  });

  describe('edge cases', () => {
    it('should handle very dry skin (high Ra, high TEWL)', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 55,
        tewl: 30,
        ambientHumidity: 20,
        temperature: 35,
      };
      const result = calculateCorrectedHydration(input);

      expect(result.hydrationLevel).toBe('very_dry');
      expect(result.estimatedHydration).toBeLessThan(20);
      expect(result.recommendations.length).toBeGreaterThan(2);
    });

    it('should handle very hydrated skin (low Ra, low TEWL)', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 15,
        tewl: 5,
        ambientHumidity: 60,
        temperature: 20,
      };
      const result = calculateCorrectedHydration(input);

      expect(result.hydrationLevel).toBe('very_hydrated');
      expect(result.estimatedHydration).toBeGreaterThan(90);
    });

    it('should handle partial environment data (humidity only)', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 30,
        ambientHumidity: 60,
      };
      const result = calculateCorrectedHydration(input);

      expect(result.correctionFactors.environmentalAdjustment).not.toBe(1);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should handle partial environment data (temperature only)', () => {
      const input: HydrationCorrectionInput = {
        roughnessRa: 30,
        temperature: 28,
      };
      const result = calculateCorrectedHydration(input);

      expect(result.correctionFactors.environmentalAdjustment).not.toBe(1);
    });
  });
});

// =============================================================================
// validateRoughnessRa 테스트
// =============================================================================

describe('validateRoughnessRa', () => {
  it('should return invalid for negative Ra', () => {
    const result = validateRoughnessRa(-5);
    expect(result.valid).toBe(false);
    expect(result.warning).toBeDefined();
  });

  it('should return valid with warning for very low Ra', () => {
    const result = validateRoughnessRa(5);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it('should return valid with warning for very high Ra', () => {
    const result = validateRoughnessRa(90);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it('should return valid without warning for normal Ra range', () => {
    const result = validateRoughnessRa(30);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('should return valid without warning at boundaries', () => {
    expect(validateRoughnessRa(10).warning).toBeUndefined();
    expect(validateRoughnessRa(80).warning).toBeUndefined();
  });
});

// =============================================================================
// interpretTEWL 테스트
// =============================================================================

describe('interpretTEWL', () => {
  it('should interpret normal TEWL', () => {
    const result = interpretTEWL(8);
    expect(result.status).toBe('normal');
    expect(result.description).toContain('정상');
  });

  it('should interpret mild damage', () => {
    const result = interpretTEWL(12);
    expect(result.status).toBe('mild');
    expect(result.description).toContain('약간');
  });

  it('should interpret moderate damage', () => {
    const result = interpretTEWL(20);
    expect(result.status).toBe('moderate');
    expect(result.description).toContain('중등도');
  });

  it('should interpret severe damage', () => {
    const result = interpretTEWL(30);
    expect(result.status).toBe('severe');
    expect(result.description).toContain('심각');
  });

  it('should handle boundary values correctly', () => {
    expect(interpretTEWL(TEWL_THRESHOLDS.NORMAL - 0.1).status).toBe('normal');
    expect(interpretTEWL(TEWL_THRESHOLDS.NORMAL).status).toBe('mild');
    expect(interpretTEWL(TEWL_THRESHOLDS.MILD_DAMAGE).status).toBe('moderate');
    expect(interpretTEWL(TEWL_THRESHOLDS.MODERATE_DAMAGE).status).toBe('severe');
  });
});

// =============================================================================
// 상수 검증 테스트
// =============================================================================

describe('Constants', () => {
  describe('RA_MODEL', () => {
    it('should have valid linear model parameters', () => {
      // 선형 모델 검증: slope = (100 - 0) / (55 - 15) = 2.5
      const calculatedSlope =
        100 / (RA_MODEL.RA_EXTREME_DRY - RA_MODEL.RA_OPTIMAL);
      expect(RA_MODEL.RA_SLOPE).toBeCloseTo(calculatedSlope, 2);
    });
  });

  describe('TEWL_THRESHOLDS', () => {
    it('should be in ascending order', () => {
      expect(TEWL_THRESHOLDS.NORMAL).toBeLessThan(TEWL_THRESHOLDS.MILD_DAMAGE);
      expect(TEWL_THRESHOLDS.MILD_DAMAGE).toBeLessThan(TEWL_THRESHOLDS.MODERATE_DAMAGE);
      expect(TEWL_THRESHOLDS.MODERATE_DAMAGE).toBeLessThan(TEWL_THRESHOLDS.SEVERE_DAMAGE);
    });
  });

  describe('HYDRATION_THRESHOLDS', () => {
    it('should be in ascending order and cover 0-100 range', () => {
      expect(HYDRATION_THRESHOLDS.VERY_DRY).toBeLessThan(HYDRATION_THRESHOLDS.DRY);
      expect(HYDRATION_THRESHOLDS.DRY).toBeLessThan(HYDRATION_THRESHOLDS.NORMAL);
      expect(HYDRATION_THRESHOLDS.NORMAL).toBeLessThan(HYDRATION_THRESHOLDS.HYDRATED);
      expect(HYDRATION_THRESHOLDS.HYDRATED).toBeLessThanOrEqual(100);
    });
  });

  describe('ENVIRONMENT_BASELINE', () => {
    it('should have reasonable baseline values', () => {
      expect(ENVIRONMENT_BASELINE.HUMIDITY).toBeGreaterThan(20);
      expect(ENVIRONMENT_BASELINE.HUMIDITY).toBeLessThan(60);
      expect(ENVIRONMENT_BASELINE.TEMPERATURE).toBeGreaterThan(15);
      expect(ENVIRONMENT_BASELINE.TEMPERATURE).toBeLessThan(30);
    });
  });
});

// =============================================================================
// 통합 시나리오 테스트
// =============================================================================

describe('Integration Scenarios', () => {
  it('건조한 겨울철 환경 시뮬레이션', () => {
    const input: HydrationCorrectionInput = {
      roughnessRa: 38, // 다소 거친 피부
      tewl: 18,        // 약간 손상된 장벽
      ambientHumidity: 25, // 낮은 습도
      temperature: 18,     // 난방된 실내
    };
    const result = calculateCorrectedHydration(input);

    // 건조한 환경에서 수분도 감소 예상
    expect(result.hydrationLevel).toBe('dry');
    expect(result.recommendations.some((r) => r.includes('보습'))).toBe(true);
  });

  it('습한 여름철 환경 시뮬레이션', () => {
    const input: HydrationCorrectionInput = {
      roughnessRa: 25, // 비교적 매끄러운 피부
      tewl: 9,         // 건강한 장벽
      ambientHumidity: 70, // 높은 습도
      temperature: 28,     // 더운 환경
    };
    const result = calculateCorrectedHydration(input);

    // 습한 환경이지만 온도가 높아 중립적 효과
    expect(result.estimatedHydration).toBeGreaterThan(60);
  });

  it('심각한 피부 건조 시나리오', () => {
    const input: HydrationCorrectionInput = {
      roughnessRa: 50, // 매우 거친 피부
      tewl: 28,        // 심각한 장벽 손상
      ambientHumidity: 30,
      temperature: 25,
    };
    const result = calculateCorrectedHydration(input);

    expect(result.hydrationLevel).toBe('very_dry');
    // 피부과 상담 권장 포함 확인
    expect(
      result.recommendations.some(
        (r) => r.includes('피부과') || r.includes('상담')
      )
    ).toBe(true);
  });

  it('건강한 피부 시나리오', () => {
    const input: HydrationCorrectionInput = {
      roughnessRa: 20,
      tewl: 7,
      ambientHumidity: 50,
      temperature: 22,
    };
    const result = calculateCorrectedHydration(input);

    expect(result.hydrationLevel).toBe('very_hydrated');
    expect(result.confidence).toBeGreaterThan(0.9);
    // 유지 관리 권장 확인
    expect(
      result.recommendations.some(
        (r) => r.includes('유지') || r.includes('상태')
      )
    ).toBe(true);
  });
});
