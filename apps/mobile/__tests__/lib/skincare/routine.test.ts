/**
 * 스킨케어 루틴 테스트
 * @description 루틴 생성 로직 및 Mock 데이터 검증
 */

import {
  generateRoutine,
  calculateEstimatedTime,
  formatDuration,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  PRODUCT_CATEGORIES,
  getCategoryInfo,
} from '@/lib/skincare';
import type { SkinTypeId, SkinConcernId, TimeOfDay, ProductCategory } from '@/lib/skincare';

describe('스킨케어 루틴', () => {
  describe('generateRoutine', () => {
    it('아침 루틴을 정상적으로 생성한다', () => {
      const result = generateRoutine({
        skinType: 'normal',
        concerns: [],
        timeOfDay: 'morning',
        includeOptional: true,
      });

      expect(result.routine).toBeDefined();
      expect(result.routine.length).toBeGreaterThan(0);
      expect(result.estimatedTime).toBeGreaterThan(0);
      expect(result.personalizationNote).toContain('중성');
    });

    it('저녁 루틴을 정상적으로 생성한다', () => {
      const result = generateRoutine({
        skinType: 'oily',
        concerns: ['acne'],
        timeOfDay: 'evening',
        includeOptional: true,
      });

      expect(result.routine).toBeDefined();
      expect(result.routine.length).toBeGreaterThan(0);
      expect(result.personalizationNote).toContain('지성');
    });

    it('건성 피부에는 오일 단계가 추가된다', () => {
      const result = generateRoutine({
        skinType: 'dry',
        concerns: [],
        timeOfDay: 'evening',
        includeOptional: true,
      });

      const hasOil = result.routine.some((step) => step.category === 'oil');
      expect(hasOil).toBe(true);
    });

    it('지성 피부에서는 오일 단계가 제외된다', () => {
      const result = generateRoutine({
        skinType: 'oily',
        concerns: [],
        timeOfDay: 'evening',
        includeOptional: true,
      });

      const hasOil = result.routine.some((step) => step.category === 'oil');
      expect(hasOil).toBe(false);
    });

    it('민감성 피부에서는 앰플/스팟 케어가 제외된다', () => {
      const result = generateRoutine({
        skinType: 'sensitive',
        concerns: [],
        timeOfDay: 'evening',
        includeOptional: true,
      });

      const hasAmpoule = result.routine.some((step) => step.category === 'ampoule');
      const hasSpot = result.routine.some((step) => step.category === 'spot_treatment');
      expect(hasAmpoule).toBe(false);
      expect(hasSpot).toBe(false);
    });

    it('includeOptional이 false면 선택적 단계가 제외된다', () => {
      const withOptional = generateRoutine({
        skinType: 'normal',
        concerns: [],
        timeOfDay: 'morning',
        includeOptional: true,
      });

      const withoutOptional = generateRoutine({
        skinType: 'normal',
        concerns: [],
        timeOfDay: 'morning',
        includeOptional: false,
      });

      expect(withOptional.routine.length).toBeGreaterThan(withoutOptional.routine.length);
      expect(withoutOptional.routine.every((step) => !step.isOptional)).toBe(true);
    });

    it('단계 순서가 올바르게 정렬된다', () => {
      const result = generateRoutine({
        skinType: 'normal',
        concerns: [],
        timeOfDay: 'morning',
        includeOptional: true,
      });

      for (let i = 0; i < result.routine.length; i++) {
        expect(result.routine[i].order).toBe(i + 1);
      }
    });

    it('고민에 따른 개인화 노트가 생성된다', () => {
      const result = generateRoutine({
        skinType: 'oily',
        concerns: ['acne', 'pores'],
        timeOfDay: 'morning',
        includeOptional: true,
      });

      // 여드름 고민 → BHA 성분 추천
      expect(result.personalizationNote).toMatch(/BHA|도움/);
    });
  });

  describe('calculateEstimatedTime', () => {
    it('분 단위 시간을 정확히 계산한다', () => {
      const steps = [
        { order: 1, category: 'cleanser' as ProductCategory, name: '클렌저', purpose: '', tips: [], isOptional: false, duration: '1분' },
        { order: 2, category: 'toner' as ProductCategory, name: '토너', purpose: '', tips: [], isOptional: false, duration: '30초' },
      ];

      const time = calculateEstimatedTime(steps);
      expect(time).toBeCloseTo(1.5, 1);
    });

    it('duration이 없는 단계는 0으로 처리한다', () => {
      const steps = [
        { order: 1, category: 'cleanser' as ProductCategory, name: '클렌저', purpose: '', tips: [], isOptional: false },
        { order: 2, category: 'toner' as ProductCategory, name: '토너', purpose: '', tips: [], isOptional: false, duration: '30초' },
      ];

      const time = calculateEstimatedTime(steps);
      expect(time).toBeCloseTo(0.5, 1);
    });
  });

  describe('formatDuration', () => {
    it('정수 분은 "X분"으로 표시한다', () => {
      expect(formatDuration(5)).toBe('5분');
      expect(formatDuration(10)).toBe('10분');
    });

    it('소수점 분은 "X분 Y초"로 표시한다', () => {
      expect(formatDuration(5.5)).toBe('5분 30초');
    });
  });

  describe('getSkinTypeLabel', () => {
    it('모든 피부 타입에 대해 한글 라벨을 반환한다', () => {
      const types: SkinTypeId[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
      const labels = ['건성', '지성', '복합성', '중성', '민감성'];

      types.forEach((type, index) => {
        expect(getSkinTypeLabel(type)).toBe(labels[index]);
      });
    });
  });

  describe('getTimeOfDayLabel', () => {
    it('시간대에 대해 한글 라벨을 반환한다', () => {
      expect(getTimeOfDayLabel('morning')).toBe('아침');
      expect(getTimeOfDayLabel('evening')).toBe('저녁');
    });
  });

  describe('Mock 데이터 구조', () => {
    it('아침 루틴 템플릿이 올바른 구조를 가진다', () => {
      expect(MORNING_ROUTINE_STEPS.length).toBeGreaterThan(0);
      MORNING_ROUTINE_STEPS.forEach((step) => {
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('category');
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('purpose');
        expect(step).toHaveProperty('tips');
        expect(step).toHaveProperty('isOptional');
      });
    });

    it('저녁 루틴 템플릿이 올바른 구조를 가진다', () => {
      expect(EVENING_ROUTINE_STEPS.length).toBeGreaterThan(0);
      EVENING_ROUTINE_STEPS.forEach((step) => {
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('category');
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('purpose');
        expect(step).toHaveProperty('tips');
        expect(step).toHaveProperty('isOptional');
      });
    });

    it('모든 피부 타입에 대한 수정자가 정의되어 있다', () => {
      const types: SkinTypeId[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
      types.forEach((type) => {
        expect(SKIN_TYPE_MODIFIERS[type]).toBeDefined();
        expect(SKIN_TYPE_MODIFIERS[type]).toHaveProperty('addCategories');
        expect(SKIN_TYPE_MODIFIERS[type]).toHaveProperty('removeCategories');
        expect(SKIN_TYPE_MODIFIERS[type]).toHaveProperty('adjustTips');
        expect(SKIN_TYPE_MODIFIERS[type]).toHaveProperty('warnings');
      });
    });

    it('모든 카테고리에 대한 정보가 정의되어 있다', () => {
      const categories: ProductCategory[] = [
        'cleanser', 'toner', 'essence', 'serum', 'ampoule',
        'cream', 'sunscreen', 'mask', 'eye_cream', 'oil', 'spot_treatment'
      ];

      categories.forEach((category) => {
        const info = getCategoryInfo(category);
        expect(info).toBeDefined();
        expect(info.id).toBe(category);
        expect(info.name).toBeDefined();
        expect(info.emoji).toBeDefined();
        expect(info.description).toBeDefined();
      });
    });
  });
});
