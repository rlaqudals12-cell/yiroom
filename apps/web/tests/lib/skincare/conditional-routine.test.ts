/**
 * 조건부 루틴 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  applyConditionalModifications,
  getHydrationLabel,
  getTodayConcernLabel,
  createQuickConditionCheck,
  HYGIENE_PREP_STEPS,
} from '@/lib/skincare/conditional-routine';
import type { RoutineStep } from '@/types/skincare-routine';

describe('conditional-routine', () => {
  // 테스트용 기본 루틴
  const baseRoutine: RoutineStep[] = [
    {
      order: 1,
      category: 'cleanser',
      name: '클렌저',
      purpose: '노폐물 제거',
      tips: ['미온수로 세안'],
      isOptional: false,
    },
    {
      order: 2,
      category: 'toner',
      name: '토너',
      purpose: '피부 정돈',
      tips: ['패팅으로 흡수'],
      isOptional: false,
    },
    {
      order: 3,
      category: 'serum',
      name: '세럼',
      purpose: '집중 케어',
      tips: ['소량씩 덧바르기'],
      isOptional: true,
    },
    {
      order: 4,
      category: 'cream',
      name: '크림',
      purpose: '수분 잠금',
      tips: ['펴바르기'],
      isOptional: false,
    },
  ];

  describe('applyConditionalModifications', () => {
    it('매우 건조할 때 토너 2회 수정이 적용되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'very_dry', concerns: [] },
        'normal'
      );

      // 토너 단계가 2회로 변경되었는지 확인
      const tonerStep = result.adjustedRoutine.find((s) => s.category === 'toner');
      expect(tonerStep?.name).toContain('2회');
    });

    it('유분기 매우 많을 때 크림 단계가 제거되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'very_oily', concerns: [] },
        'oily'
      );

      // 크림 단계가 제거되었는지 확인
      const creamStep = result.adjustedRoutine.find((s) => s.category === 'cream');
      expect(creamStep).toBeUndefined();
    });

    it('홍조 고민이 있을 때 세럼에 진정 팁이 추가되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'normal', concerns: ['redness'] },
        'sensitive'
      );

      const serumStep = result.adjustedRoutine.find((s) => s.category === 'serum');
      expect(serumStep?.tips.some((t) => t.includes('진정'))).toBe(true);
    });

    it('민감도가 심할 때 추가 팁이 반환되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'normal', concerns: [], sensitivityLevel: 'severe' },
        'sensitive'
      );

      expect(result.additionalTips.some((t) => t.includes('순한 제품'))).toBe(true);
    });

    it('수면 부족 시 아이크림 관련 팁이 추가되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'normal', concerns: [], sleepQuality: 'poor' },
        'normal'
      );

      expect(result.additionalTips.some((t) => t.includes('아이크림'))).toBe(true);
    });

    it('위생 단계가 포함되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'normal', concerns: [] },
        'normal'
      );

      expect(result.hygienePrepSteps).toBeDefined();
      expect(result.hygienePrepSteps.length).toBeGreaterThan(0);
      // 손 씻기가 포함되어야 함
      expect(result.hygienePrepSteps.some((s) => s.name === '손 씻기')).toBe(true);
    });

    it('민감성 피부는 미온수 단계가 추가되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'normal', concerns: [] },
        'sensitive'
      );

      expect(result.hygienePrepSteps.some((s) => s.name === '미온수 준비')).toBe(true);
    });

    it('수정 내역이 modifications에 기록되어야 함', () => {
      const result = applyConditionalModifications(
        [...baseRoutine],
        { hydration: 'very_dry', concerns: ['redness'] },
        'normal'
      );

      expect(result.modifications.length).toBeGreaterThan(0);
    });
  });

  describe('getHydrationLabel', () => {
    it('수분 레벨을 한국어 라벨로 변환해야 함', () => {
      expect(getHydrationLabel('very_dry')).toBe('매우 건조');
      expect(getHydrationLabel('dry')).toBe('건조');
      expect(getHydrationLabel('normal')).toBe('보통');
      expect(getHydrationLabel('oily')).toBe('유분기 있음');
      expect(getHydrationLabel('very_oily')).toBe('매우 유분기 많음');
    });
  });

  describe('getTodayConcernLabel', () => {
    it('오늘 고민을 한국어 라벨로 변환해야 함', () => {
      expect(getTodayConcernLabel('acne')).toBe('여드름');
      expect(getTodayConcernLabel('redness')).toBe('홍조');
      expect(getTodayConcernLabel('dullness')).toBe('칙칙함');
      expect(getTodayConcernLabel('tightness')).toBe('당김');
      expect(getTodayConcernLabel('oiliness')).toBe('유분');
    });
  });

  describe('createQuickConditionCheck', () => {
    it('수분 옵션이 5개여야 함', () => {
      const check = createQuickConditionCheck();

      expect(check.hydrationOptions.length).toBe(5);
    });

    it('고민 옵션이 5개여야 함', () => {
      const check = createQuickConditionCheck();

      expect(check.concernOptions.length).toBe(5);
    });

    it('각 옵션에 value, label, emoji가 있어야 함', () => {
      const check = createQuickConditionCheck();

      check.hydrationOptions.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.emoji).toBeDefined();
      });

      check.concernOptions.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.emoji).toBeDefined();
      });
    });
  });

  describe('HYGIENE_PREP_STEPS', () => {
    it('손 씻기 단계가 필수로 포함되어야 함', () => {
      const handWash = HYGIENE_PREP_STEPS.find((s) => s.name === '손 씻기');

      expect(handWash).toBeDefined();
      expect(handWash?.isRequired).toBe(true);
    });

    it('머리카락 정리 단계가 선택적으로 포함되어야 함', () => {
      const hairPrep = HYGIENE_PREP_STEPS.find((s) => s.name === '머리카락 정리');

      expect(hairPrep).toBeDefined();
      expect(hairPrep?.isRequired).toBe(false);
    });
  });
});
