/**
 * BMI 계산기 테스트
 *
 * @module tests/lib/body/bmi-calculator
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  classifyBMI,
  checkAbdominalObesity,
  analyzeBodyMass,
  getBMICategoryLabel,
  getBMILabelFromValue,
  calculateTargetWeight,
  getBMIColor,
  type BMICategory,
} from '@/lib/body/bmi-calculator';

// ============================================================================
// classifyBMI
// ============================================================================

describe('classifyBMI', () => {
  describe('아시아 기준 BMI 분류', () => {
    it('should classify underweight (< 18.5)', () => {
      expect(classifyBMI(16)).toBe('underweight');
      expect(classifyBMI(18)).toBe('underweight');
      expect(classifyBMI(18.4)).toBe('underweight');
    });

    it('should classify normal (18.5-22.9)', () => {
      expect(classifyBMI(18.5)).toBe('normal');
      expect(classifyBMI(20)).toBe('normal');
      expect(classifyBMI(22)).toBe('normal');
      expect(classifyBMI(22.9)).toBe('normal');
    });

    it('should classify overweight (23.0-24.9) - 아시아 기준', () => {
      expect(classifyBMI(23)).toBe('overweight');
      expect(classifyBMI(24)).toBe('overweight');
      expect(classifyBMI(24.9)).toBe('overweight');
    });

    it('should classify obese1 (25.0-29.9)', () => {
      expect(classifyBMI(25)).toBe('obese1');
      expect(classifyBMI(27)).toBe('obese1');
      expect(classifyBMI(29.9)).toBe('obese1');
    });

    it('should classify obese2 (30.0-34.9)', () => {
      expect(classifyBMI(30)).toBe('obese2');
      expect(classifyBMI(32)).toBe('obese2');
      expect(classifyBMI(34.9)).toBe('obese2');
    });

    it('should classify obese3 (≥ 35)', () => {
      expect(classifyBMI(35)).toBe('obese3');
      expect(classifyBMI(40)).toBe('obese3');
      expect(classifyBMI(50)).toBe('obese3');
    });
  });

  describe('경계값 테스트', () => {
    it('should handle boundary values correctly', () => {
      // 저체중/정상 경계
      expect(classifyBMI(18.49)).toBe('underweight');
      expect(classifyBMI(18.5)).toBe('normal');

      // 정상/과체중 경계 (아시아 기준 23.0)
      expect(classifyBMI(22.99)).toBe('normal');
      expect(classifyBMI(23.0)).toBe('overweight');

      // 과체중/비만1 경계
      expect(classifyBMI(24.99)).toBe('overweight');
      expect(classifyBMI(25.0)).toBe('obese1');
    });
  });
});

// ============================================================================
// calculateBMI
// ============================================================================

describe('calculateBMI', () => {
  describe('기본 계산', () => {
    it('should calculate BMI correctly', () => {
      // 170cm, 65kg → BMI ≈ 22.5
      const result = calculateBMI(170, 65);
      expect(result.value).toBeCloseTo(22.5, 1);
      expect(result.category).toBe('normal');
    });

    it('should round BMI to 1 decimal place', () => {
      const result = calculateBMI(175, 70);
      expect(result.value).toBe(Math.round((70 / 1.75 / 1.75) * 10) / 10);
    });

    it('should include healthy weight range', () => {
      const result = calculateBMI(170, 65);
      expect(result.healthyWeightRange).toBeDefined();
      expect(result.healthyWeightRange.min).toBeLessThan(result.healthyWeightRange.max);
    });

    it('should include weight difference', () => {
      // 과체중인 경우 양수
      const overweight = calculateBMI(170, 80);
      expect(overweight.weightDifference).toBeGreaterThan(0);

      // 저체중인 경우 음수
      const underweight = calculateBMI(170, 50);
      expect(underweight.weightDifference).toBeLessThan(0);
    });

    it('should include Korean category label', () => {
      const result = calculateBMI(170, 65);
      expect(result.categoryLabel).toBe('정상');
    });

    it('should include medical disclaimer', () => {
      const result = calculateBMI(170, 65);
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer.length).toBeGreaterThan(0);
    });
  });

  describe('입력 검증', () => {
    it('should throw error for invalid height', () => {
      expect(() => calculateBMI(50, 65)).toThrow();
      expect(() => calculateBMI(300, 65)).toThrow();
    });

    it('should throw error for invalid weight', () => {
      expect(() => calculateBMI(170, 10)).toThrow();
      expect(() => calculateBMI(170, 400)).toThrow();
    });

    it('should accept valid range', () => {
      expect(() => calculateBMI(100, 20)).not.toThrow();
      expect(() => calculateBMI(250, 300)).not.toThrow();
    });
  });

  describe('다양한 시나리오', () => {
    it('should handle typical Korean adult male', () => {
      // 한국 성인 남성 평균: 174cm, 74kg
      const result = calculateBMI(174, 74);
      expect(result.value).toBeCloseTo(24.4, 1);
      expect(result.category).toBe('overweight'); // 아시아 기준
    });

    it('should handle typical Korean adult female', () => {
      // 한국 성인 여성 평균: 161cm, 56kg
      const result = calculateBMI(161, 56);
      expect(result.value).toBeCloseTo(21.6, 1);
      expect(result.category).toBe('normal');
    });

    it('should handle athletic build', () => {
      // 근육질 (BMI만으로는 과체중으로 분류될 수 있음)
      const result = calculateBMI(180, 90);
      expect(result.value).toBeCloseTo(27.8, 1);
      expect(result.category).toBe('obese1');
      // disclaimer에서 근육량 관련 언급 확인
      expect(result.disclaimer).toContain('근육량');
    });
  });
});

// ============================================================================
// checkAbdominalObesity
// ============================================================================

describe('checkAbdominalObesity', () => {
  describe('남성 기준 (90cm)', () => {
    it('should detect abdominal obesity for waist >= 90cm', () => {
      expect(checkAbdominalObesity(90, 'male').isAbdominalObesity).toBe(true);
      expect(checkAbdominalObesity(95, 'male').isAbdominalObesity).toBe(true);
      expect(checkAbdominalObesity(100, 'male').isAbdominalObesity).toBe(true);
    });

    it('should not detect abdominal obesity for waist < 90cm', () => {
      expect(checkAbdominalObesity(89, 'male').isAbdominalObesity).toBe(false);
      expect(checkAbdominalObesity(80, 'male').isAbdominalObesity).toBe(false);
    });

    it('should return correct threshold for male', () => {
      const result = checkAbdominalObesity(85, 'male');
      expect(result.threshold).toBe(90);
    });
  });

  describe('여성 기준 (85cm)', () => {
    it('should detect abdominal obesity for waist >= 85cm', () => {
      expect(checkAbdominalObesity(85, 'female').isAbdominalObesity).toBe(true);
      expect(checkAbdominalObesity(90, 'female').isAbdominalObesity).toBe(true);
    });

    it('should not detect abdominal obesity for waist < 85cm', () => {
      expect(checkAbdominalObesity(84, 'female').isAbdominalObesity).toBe(false);
      expect(checkAbdominalObesity(75, 'female').isAbdominalObesity).toBe(false);
    });

    it('should return correct threshold for female', () => {
      const result = checkAbdominalObesity(80, 'female');
      expect(result.threshold).toBe(85);
    });
  });

  describe('설명 메시지', () => {
    it('should include waist value in description', () => {
      const result = checkAbdominalObesity(92, 'male');
      expect(result.description).toContain('92');
    });

    it('should indicate obesity status in description', () => {
      const obese = checkAbdominalObesity(92, 'male');
      expect(obese.description).toContain('복부비만');

      const normal = checkAbdominalObesity(80, 'male');
      expect(normal.description).toContain('정상');
    });
  });
});

// ============================================================================
// analyzeBodyMass
// ============================================================================

describe('analyzeBodyMass', () => {
  describe('BMI만 분석', () => {
    it('should analyze with just height and weight', () => {
      const result = analyzeBodyMass(170, 65);
      expect(result.bmi).toBeDefined();
      expect(result.abdominalObesity).toBeUndefined();
    });

    it('should return healthy status for normal BMI', () => {
      const result = analyzeBodyMass(170, 65);
      expect(result.overallStatus).toBe('healthy');
    });

    it('should return caution status for underweight', () => {
      const result = analyzeBodyMass(170, 50);
      expect(result.overallStatus).toBe('caution');
    });

    it('should return warning status for obese', () => {
      const result = analyzeBodyMass(170, 100);
      expect(result.overallStatus).toBe('warning');
    });
  });

  describe('복부비만 포함 분석', () => {
    it('should include abdominal obesity when waist provided', () => {
      const result = analyzeBodyMass(170, 65, 85, 'male');
      expect(result.abdominalObesity).toBeDefined();
    });

    it('should affect status with abdominal obesity', () => {
      // 정상 BMI + 복부비만 = caution
      const result = analyzeBodyMass(170, 65, 95, 'male');
      expect(result.bmi.category).toBe('normal');
      expect(result.abdominalObesity?.isAbdominalObesity).toBe(true);
      expect(result.overallStatus).toBe('caution');
    });
  });

  describe('권장사항 생성', () => {
    it('should generate recommendations for underweight', () => {
      const result = analyzeBodyMass(170, 50);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('체중 증가'))).toBe(true);
    });

    it('should generate recommendations for normal weight', () => {
      const result = analyzeBodyMass(170, 65);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('유지'))).toBe(true);
    });

    it('should generate recommendations for overweight', () => {
      const result = analyzeBodyMass(170, 75);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should add abdominal obesity recommendations when applicable', () => {
      const result = analyzeBodyMass(170, 65, 95, 'male');
      expect(result.recommendations.some((r) => r.includes('복부') || r.includes('유산소'))).toBe(
        true
      );
    });
  });
});

// ============================================================================
// 유틸리티 함수
// ============================================================================

describe('getBMICategoryLabel', () => {
  it('should return correct Korean labels', () => {
    expect(getBMICategoryLabel('underweight')).toBe('저체중');
    expect(getBMICategoryLabel('normal')).toBe('정상');
    expect(getBMICategoryLabel('overweight')).toBe('과체중');
    expect(getBMICategoryLabel('obese1')).toBe('1단계 비만');
    expect(getBMICategoryLabel('obese2')).toBe('2단계 비만');
    expect(getBMICategoryLabel('obese3')).toBe('3단계 비만 (고도비만)');
  });
});

describe('getBMILabelFromValue', () => {
  it('should return label directly from BMI value', () => {
    expect(getBMILabelFromValue(18)).toBe('저체중');
    expect(getBMILabelFromValue(21)).toBe('정상');
    expect(getBMILabelFromValue(24)).toBe('과체중');
    expect(getBMILabelFromValue(27)).toBe('1단계 비만');
  });
});

describe('calculateTargetWeight', () => {
  it('should calculate target weight range for given height', () => {
    const result = calculateTargetWeight(170);
    expect(result.min).toBeLessThan(result.ideal);
    expect(result.ideal).toBeLessThan(result.max);
  });

  it('should use default target BMI of 21', () => {
    const result = calculateTargetWeight(170);
    const expectedIdeal = 21 * 1.7 * 1.7;
    expect(result.ideal).toBeCloseTo(expectedIdeal, 0);
  });

  it('should allow custom target BMI', () => {
    const result = calculateTargetWeight(170, 22);
    const expectedIdeal = 22 * 1.7 * 1.7;
    expect(result.ideal).toBeCloseTo(expectedIdeal, 0);
  });

  it('should calculate for different heights', () => {
    const short = calculateTargetWeight(155);
    const tall = calculateTargetWeight(185);
    expect(short.ideal).toBeLessThan(tall.ideal);
  });
});

describe('getBMIColor', () => {
  it('should return appropriate colors for each category', () => {
    const categories: BMICategory[] = [
      'underweight',
      'normal',
      'overweight',
      'obese1',
      'obese2',
      'obese3',
    ];

    for (const category of categories) {
      const color = getBMIColor(category);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('should return green for normal', () => {
    expect(getBMIColor('normal')).toBe('#22C55E');
  });

  it('should return progressively warmer colors for higher BMI', () => {
    // 색상이 점점 빨간색 계열로 변해야 함
    const normalColor = getBMIColor('normal');
    const obese3Color = getBMIColor('obese3');
    expect(normalColor).not.toBe(obese3Color);
  });
});

// ============================================================================
// 통합 시나리오
// ============================================================================

describe('통합 시나리오', () => {
  it('should handle complete health assessment workflow', () => {
    // 1. BMI 계산 (172cm, 70kg → BMI ≈ 23.7 → 과체중)
    const bmi = calculateBMI(172, 70);
    expect(bmi.category).toBe('overweight');

    // 2. 복부비만 체크
    const abdominal = checkAbdominalObesity(92, 'male');
    expect(abdominal.isAbdominalObesity).toBe(true);

    // 3. 종합 분석
    const analysis = analyzeBodyMass(172, 70, 92, 'male');
    expect(analysis.overallStatus).toBe('caution');
    expect(analysis.recommendations.length).toBeGreaterThan(0);

    // 4. 목표 체중 확인
    const target = calculateTargetWeight(172);
    expect(target.ideal).toBeLessThan(70);
  });

  it('should handle healthy individual correctly', () => {
    const analysis = analyzeBodyMass(165, 55, 70, 'female');

    expect(analysis.bmi.category).toBe('normal');
    expect(analysis.abdominalObesity?.isAbdominalObesity).toBe(false);
    expect(analysis.overallStatus).toBe('healthy');
  });
});
