/**
 * C-1 체형 분석 Mock 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockBodyAnalysis,
  getBodyTypeColor,
  getBodyTypeBgColor,
  BODY_TYPES,
  LOADING_TIPS,
  type BodyType,
  type UserBodyInput,
} from '@/lib/mock/body-analysis';

describe('C-1 체형 분석 Mock', () => {
  describe('generateMockBodyAnalysis', () => {
    it('분석 결과를 반환한다', () => {
      const result = generateMockBodyAnalysis();

      expect(result).toBeDefined();
      expect(result.bodyType).toBeDefined();
      expect(result.bodyTypeLabel).toBeDefined();
      expect(result.bodyTypeDescription).toBeDefined();
      expect(result.measurements).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.insight).toBeDefined();
      expect(result.styleRecommendations).toBeDefined();
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('8가지 체형 타입 중 하나를 반환한다', () => {
      const validTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

      for (let i = 0; i < 20; i++) {
        const result = generateMockBodyAnalysis();
        expect(validTypes).toContain(result.bodyType);
      }
    });

    it('3가지 측정값(어깨, 허리, 골반)을 반환한다', () => {
      const result = generateMockBodyAnalysis();
      expect(result.measurements).toHaveLength(3);

      const measurementNames = result.measurements.map((m) => m.name);
      expect(measurementNames).toContain('어깨');
      expect(measurementNames).toContain('허리');
      expect(measurementNames).toContain('골반');
    });

    it('측정값은 0~100 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockBodyAnalysis();
        result.measurements.forEach((m) => {
          expect(m.value).toBeGreaterThanOrEqual(0);
          expect(m.value).toBeLessThanOrEqual(100);
        });
      }
    });

    it('강점 리스트를 반환한다', () => {
      const result = generateMockBodyAnalysis();
      expect(result.strengths.length).toBeGreaterThan(0);
      result.strengths.forEach((strength) => {
        expect(typeof strength).toBe('string');
        expect(strength.length).toBeGreaterThan(0);
      });
    });

    it('스타일 추천을 반환한다', () => {
      const result = generateMockBodyAnalysis();
      expect(result.styleRecommendations.length).toBeGreaterThan(0);
      result.styleRecommendations.forEach((rec) => {
        expect(rec.item).toBeDefined();
        expect(rec.reason).toBeDefined();
      });
    });

    it('인사이트는 문자열이다', () => {
      const result = generateMockBodyAnalysis();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });

    it('체형 타입과 라벨이 일치한다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockBodyAnalysis();
        const expectedLabel = BODY_TYPES[result.bodyType].label;
        expect(result.bodyTypeLabel).toBe(expectedLabel);
      }
    });
  });

  describe('BMI 계산', () => {
    it('userInput이 있으면 BMI를 계산한다', () => {
      const userInput: UserBodyInput = {
        height: 170,
        weight: 65,
      };

      const result = generateMockBodyAnalysis(userInput);

      expect(result.userInput).toEqual(userInput);
      expect(result.bmi).toBeDefined();
      expect(result.bmiCategory).toBeDefined();
    });

    it('BMI가 올바르게 계산된다', () => {
      const userInput: UserBodyInput = {
        height: 170,
        weight: 65,
      };

      const result = generateMockBodyAnalysis(userInput);
      const expectedBmi = 65 / (1.7 * 1.7); // ~22.49

      expect(result.bmi).toBeCloseTo(expectedBmi, 1);
    });

    it('BMI 카테고리가 올바르게 분류된다', () => {
      // 저체중
      const underweight = generateMockBodyAnalysis({ height: 170, weight: 50 });
      expect(underweight.bmiCategory).toBe('저체중');

      // 정상
      const normal = generateMockBodyAnalysis({ height: 170, weight: 65 });
      expect(normal.bmiCategory).toBe('정상');

      // 과체중 (BMI 23-25: 70kg/1.7^2 = 24.2)
      const overweight = generateMockBodyAnalysis({ height: 170, weight: 70 });
      expect(overweight.bmiCategory).toBe('과체중');

      // 비만
      const obese = generateMockBodyAnalysis({ height: 170, weight: 85 });
      expect(obese.bmiCategory).toBe('비만');
    });

    it('userInput이 없으면 BMI가 undefined이다', () => {
      const result = generateMockBodyAnalysis();

      expect(result.userInput).toBeUndefined();
      expect(result.bmi).toBeUndefined();
      expect(result.bmiCategory).toBeUndefined();
    });

    it('targetWeight는 선택적이다', () => {
      const userInput: UserBodyInput = {
        height: 170,
        weight: 65,
        targetWeight: 60,
      };

      const result = generateMockBodyAnalysis(userInput);
      expect(result.userInput?.targetWeight).toBe(60);
    });
  });

  describe('상수 데이터 검증', () => {
    it('BODY_TYPES에 8가지 체형이 모두 정의되어 있다', () => {
      const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

      bodyTypes.forEach((type) => {
        expect(BODY_TYPES[type]).toBeDefined();
        expect(BODY_TYPES[type].label).toBeDefined();
        expect(BODY_TYPES[type].description).toBeDefined();
        expect(BODY_TYPES[type].characteristics).toBeDefined();
        expect(BODY_TYPES[type].emoji).toBeDefined();
      });
    });

    it('LOADING_TIPS에 4개의 팁이 있다', () => {
      expect(LOADING_TIPS).toHaveLength(4);
      LOADING_TIPS.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  describe('유틸리티 함수', () => {
    it('getBodyTypeColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getBodyTypeColor('X')).toBe('text-purple-500');
      expect(getBodyTypeColor('A')).toBe('text-pink-500');
      expect(getBodyTypeColor('V')).toBe('text-blue-500');
      expect(getBodyTypeColor('H')).toBe('text-green-500');
      expect(getBodyTypeColor('O')).toBe('text-orange-500');
      expect(getBodyTypeColor('I')).toBe('text-cyan-500');
      expect(getBodyTypeColor('Y')).toBe('text-indigo-500');
      expect(getBodyTypeColor('8')).toBe('text-rose-500');
    });

    it('getBodyTypeBgColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getBodyTypeBgColor('X')).toBe('bg-purple-500');
      expect(getBodyTypeBgColor('A')).toBe('bg-pink-500');
      expect(getBodyTypeBgColor('V')).toBe('bg-blue-500');
      expect(getBodyTypeBgColor('H')).toBe('bg-green-500');
      expect(getBodyTypeBgColor('O')).toBe('bg-orange-500');
      expect(getBodyTypeBgColor('I')).toBe('bg-cyan-500');
      expect(getBodyTypeBgColor('Y')).toBe('bg-indigo-500');
      expect(getBodyTypeBgColor('8')).toBe('bg-rose-500');
    });
  });

  describe('체형별 측정값 범위 테스트', () => {
    const runMultipleTests = (
      bodyType: BodyType,
      expectedRanges: {
        shoulder: [number, number];
        waist: [number, number];
        hip: [number, number];
      }
    ) => {
      // 체형이 랜덤하게 선택되므로 여러 번 실행해서 해당 체형이 나올 때 검증
      let foundType = false;
      for (let i = 0; i < 100 && !foundType; i++) {
        const result = generateMockBodyAnalysis();
        if (result.bodyType === bodyType) {
          foundType = true;
          const shoulder = result.measurements.find((m) => m.name === '어깨');
          const waist = result.measurements.find((m) => m.name === '허리');
          const hip = result.measurements.find((m) => m.name === '골반');

          expect(shoulder?.value).toBeGreaterThanOrEqual(expectedRanges.shoulder[0]);
          expect(shoulder?.value).toBeLessThanOrEqual(expectedRanges.shoulder[1]);
          expect(waist?.value).toBeGreaterThanOrEqual(expectedRanges.waist[0]);
          expect(waist?.value).toBeLessThanOrEqual(expectedRanges.waist[1]);
          expect(hip?.value).toBeGreaterThanOrEqual(expectedRanges.hip[0]);
          expect(hip?.value).toBeLessThanOrEqual(expectedRanges.hip[1]);
        }
      }
      // 최소 한 번은 해당 체형이 나와야 함
      expect(foundType).toBe(true);
    };

    it('X자형 측정값은 올바른 범위이다', () => {
      runMultipleTests('X', {
        shoulder: [78, 88],
        waist: [60, 70],
        hip: [78, 88],
      });
    });

    it('A자형 측정값은 올바른 범위이다', () => {
      runMultipleTests('A', {
        shoulder: [65, 75],
        waist: [65, 75],
        hip: [82, 92],
      });
    });

    it('V자형 측정값은 올바른 범위이다', () => {
      runMultipleTests('V', {
        shoulder: [82, 92],
        waist: [68, 78],
        hip: [65, 75],
      });
    });

    it('H자형 측정값은 올바른 범위이다', () => {
      runMultipleTests('H', {
        shoulder: [73, 83],
        waist: [73, 83],
        hip: [73, 83],
      });
    });
  });
});

/**
 * TODO: 배포 전 마이그레이션 파일 작성 필요
 * - supabase/migrations/에 Phase 1 테이블 생성 SQL 추가
 * - body_analyses 테이블 마이그레이션
 * - 관련 RLS 정책 설정
 * - storage bucket (body-images) 설정
 */
