import { describe, it, expect } from 'vitest';
import {
  validateStep,
  validateAllSteps,
  getStepRequirements,
} from '@/lib/utils/workoutValidation';

describe('workoutValidation', () => {
  describe('validateStep', () => {
    // Step 1: C-1 데이터
    it('returns false for step 1 without body data', () => {
      expect(validateStep(1, { bodyTypeData: null })).toBe(false);
    });

    it('returns true for step 1 with body data', () => {
      expect(validateStep(1, { bodyTypeData: { type: 'H', proportions: { shoulder: 50, waist: 50, hip: 50 } } })).toBe(true);
    });

    // Step 2: 목표
    it('requires at least 1 goal for step 2', () => {
      expect(validateStep(2, { goals: [] })).toBe(false);
      expect(validateStep(2, { goals: ['weight_loss'] })).toBe(true);
    });

    it('accepts multiple goals for step 2', () => {
      expect(validateStep(2, { goals: ['weight_loss', 'strength'] })).toBe(true);
    });

    // Step 3: 신체 고민
    it('requires at least 1 concern for step 3', () => {
      expect(validateStep(3, { concerns: [] })).toBe(false);
      expect(validateStep(3, { concerns: ['belly'] })).toBe(true);
    });

    // Step 4: 운동 빈도
    it('requires frequency for step 4', () => {
      expect(validateStep(4, { frequency: '' })).toBe(false);
      expect(validateStep(4, { frequency: '3-4' })).toBe(true);
    });

    // Step 5: 장소 + 장비
    it('requires location and equipment for step 5', () => {
      expect(validateStep(5, { location: '', equipment: [] })).toBe(false);
      expect(validateStep(5, { location: 'home', equipment: [] })).toBe(false);
      expect(validateStep(5, { location: '', equipment: ['bodyweight'] })).toBe(false);
      expect(validateStep(5, { location: 'home', equipment: ['bodyweight'] })).toBe(true);
    });

    // Step 6-7: 선택 사항
    it('always returns true for optional steps 6-7', () => {
      expect(validateStep(6, {})).toBe(true);
      expect(validateStep(7, {})).toBe(true);
    });

    // Invalid step
    it('returns false for invalid step number', () => {
      expect(validateStep(0, {})).toBe(false);
      expect(validateStep(8, {})).toBe(false);
    });
  });

  describe('validateAllSteps', () => {
    it('returns errors for invalid data', () => {
      const result = validateAllSteps({
        bodyTypeData: null,
        goals: [],
        concerns: ['belly'],
        frequency: '3-4',
        location: 'home',
        equipment: ['bodyweight'],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('체형 분석이 필요합니다');
      expect(result.errors).toContain('목표를 선택해주세요');
    });

    it('returns valid for complete data', () => {
      const result = validateAllSteps({
        bodyTypeData: { type: 'H', proportions: { shoulder: 50, waist: 50, hip: 50 } },
        goals: ['weight_loss'],
        concerns: ['belly'],
        frequency: '3-4',
        location: 'home',
        equipment: ['bodyweight'],
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('collects all errors at once', () => {
      const result = validateAllSteps({
        bodyTypeData: null,
        goals: [],
        concerns: [],
        frequency: '',
        location: '',
        equipment: [],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getStepRequirements', () => {
    it('returns requirements for each step', () => {
      expect(getStepRequirements(1)).toContain('C-1 체형 분석 완료');
      expect(getStepRequirements(2)).toContain('최소 1개 운동 목표 선택');
      expect(getStepRequirements(5).length).toBe(2);
    });

    it('returns optional requirements for steps 6-7', () => {
      expect(getStepRequirements(6)[0]).toContain('선택');
      expect(getStepRequirements(7)[0]).toContain('선택');
    });

    it('returns empty array for invalid step', () => {
      expect(getStepRequirements(0)).toEqual([]);
      expect(getStepRequirements(10)).toEqual([]);
    });
  });
});
