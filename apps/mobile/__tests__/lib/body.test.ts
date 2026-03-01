/**
 * 체형 측정 모듈 테스트
 */

import {
  calculateWHR,
  calculateSHR,
  calculateWHtR,
  classifyWHR,
  classifyWHtR,
  classifyBodyType,
  calculateBMI,
  classifyBMI,
  analyzeBMI,
  calculateAllRatios,
  ageToAgeGroup,
  normalizeToKorean,
  BODY_SHAPE_LABELS,
  BMI_LABELS,
  KOREAN_STANDARDS,
} from '../../lib/body';

describe('body', () => {
  describe('calculateWHR', () => {
    it('허리/엉덩이 비율 계산', () => {
      expect(calculateWHR(70, 95)).toBeCloseTo(0.737, 2);
    });

    it('동일 값이면 1.0', () => {
      expect(calculateWHR(90, 90)).toBeCloseTo(1.0, 2);
    });
  });

  describe('calculateSHR', () => {
    it('어깨/엉덩이 비율 계산', () => {
      expect(calculateSHR(42, 95)).toBeCloseTo(0.442, 2);
    });
  });

  describe('calculateWHtR', () => {
    it('허리/키 비율 계산', () => {
      expect(calculateWHtR(70, 165)).toBeCloseTo(0.424, 2);
    });
  });

  describe('classifyWHR', () => {
    it('여성 WHR 0.7은 healthy', () => {
      expect(classifyWHR(0.7, 'female').status).toBe('healthy');
    });

    it('여성 WHR 0.82은 moderate', () => {
      expect(classifyWHR(0.82, 'female').status).toBe('moderate');
    });

    it('여성 WHR 0.9은 high', () => {
      expect(classifyWHR(0.9, 'female').status).toBe('high');
    });

    it('남성 WHR 0.8은 healthy', () => {
      expect(classifyWHR(0.8, 'male').status).toBe('healthy');
    });
  });

  describe('classifyWHtR', () => {
    it('0.35는 thin', () => {
      expect(classifyWHtR(0.35).status).toBe('thin');
    });

    it('0.45는 healthy', () => {
      expect(classifyWHtR(0.45).status).toBe('healthy');
    });

    it('0.55는 overweight', () => {
      expect(classifyWHtR(0.55).status).toBe('overweight');
    });

    it('0.65는 obese', () => {
      expect(classifyWHtR(0.65).status).toBe('obese');
    });
  });

  describe('classifyBodyType', () => {
    it('모래시계형 체형 분류', () => {
      const result = classifyBodyType({
        bust: 90,
        waist: 65,
        hip: 90,
        height: 165,
        gender: 'female',
      });

      expect(result.shape).toBe('hourglass');
      expect(result.label).toBe('모래시계형');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('배형 체형 분류', () => {
      const result = classifyBodyType({
        bust: 80,
        waist: 68,
        hip: 100,
        height: 160,
        gender: 'female',
      });

      expect(result.shape).toBe('pear');
    });

    it('직사각형 체형 (기본)', () => {
      const result = classifyBodyType({
        waist: 80,
        hip: 85,
        height: 170,
        gender: 'male',
      });

      expect(result).toHaveProperty('shape');
      expect(result).toHaveProperty('ratios');
    });

    it('7가지 체형 라벨 모두 존재', () => {
      expect(Object.keys(BODY_SHAPE_LABELS).length).toBe(7);
    });
  });

  describe('calculateBMI', () => {
    it('정상 BMI 계산', () => {
      expect(calculateBMI(65, 170)).toBeCloseTo(22.5, 0);
    });

    it('BMI는 양수', () => {
      expect(calculateBMI(50, 160)).toBeGreaterThan(0);
    });
  });

  describe('classifyBMI', () => {
    it('BMI 17은 underweight', () => {
      expect(classifyBMI(17)).toBe('underweight');
    });

    it('BMI 22는 normal', () => {
      expect(classifyBMI(22)).toBe('normal');
    });

    it('BMI 24는 overweight', () => {
      expect(classifyBMI(24)).toBe('overweight');
    });

    it('BMI 27은 obese1', () => {
      expect(classifyBMI(27)).toBe('obese1');
    });
  });

  describe('analyzeBMI', () => {
    it('BMI 분석 결과 전체 구조', () => {
      const result = analyzeBMI(65, 170);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('idealWeightRange');
      expect(result.idealWeightRange.min).toBeLessThan(result.idealWeightRange.max);
    });

    it('BMI 라벨 6개 존재', () => {
      expect(Object.keys(BMI_LABELS).length).toBe(6);
    });
  });

  describe('calculateAllRatios', () => {
    it('어깨 있으면 SHR 포함', () => {
      const ratios = calculateAllRatios({
        waist: 70,
        hip: 95,
        shoulder: 40,
        height: 165,
        gender: 'female',
      });

      expect(ratios.whr).toBeGreaterThan(0);
      expect(ratios.shr).not.toBeNull();
      expect(ratios.whtr).toBeGreaterThan(0);
    });

    it('어깨 없으면 SHR null', () => {
      const ratios = calculateAllRatios({
        waist: 70,
        hip: 95,
        height: 165,
        gender: 'female',
      });

      expect(ratios.shr).toBeNull();
    });
  });

  describe('ageToAgeGroup', () => {
    it('25세는 20s', () => {
      expect(ageToAgeGroup(25)).toBe('20s');
    });

    it('35세는 30s', () => {
      expect(ageToAgeGroup(35)).toBe('30s');
    });

    it('55세는 50s', () => {
      expect(ageToAgeGroup(55)).toBe('50s');
    });
  });

  describe('normalizeToKorean', () => {
    it('여성 20대 허리 68.5는 평균', () => {
      const result = normalizeToKorean(68.5, 'waist', 'female', '20s');
      expect(Math.abs(result.zScore)).toBeLessThan(0.1);
    });

    it('z-score와 백분위 반환', () => {
      const result = normalizeToKorean(75, 'waist', 'female', '20s');
      expect(result).toHaveProperty('zScore');
      expect(result).toHaveProperty('percentile');
    });
  });

  describe('KOREAN_STANDARDS 상수', () => {
    it('남녀 모두 4개 연령대 데이터', () => {
      expect(Object.keys(KOREAN_STANDARDS.female).length).toBe(4);
      expect(Object.keys(KOREAN_STANDARDS.male).length).toBe(4);
    });
  });
});
