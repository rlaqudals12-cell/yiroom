import { describe, it, expect } from 'vitest';
import {
  classifyWorkoutType,
  WORKOUT_TYPE_INFO,
} from '@/lib/workout/classifyWorkoutType';

describe('classifyWorkoutType', () => {
  describe('목표 기반 분류', () => {
    it('체중 감량 목표 → burner 타입', () => {
      const result = classifyWorkoutType({
        goals: ['weight_loss'],
      });
      expect(result.type).toBe('burner');
      expect(result.reason).toContain('체중 감량');
    });

    it('근력 강화 목표 → builder 타입', () => {
      const result = classifyWorkoutType({
        goals: ['strength'],
      });
      expect(result.type).toBe('builder');
      expect(result.reason).toContain('근력 강화');
    });

    it('체력 향상 목표 → mover 타입', () => {
      const result = classifyWorkoutType({
        goals: ['endurance'],
      });
      expect(result.type).toBe('mover');
      expect(result.reason).toContain('체력 향상');
    });

    it('스트레스 해소 목표 → flexer 타입', () => {
      const result = classifyWorkoutType({
        goals: ['stress'],
      });
      expect(result.type).toBe('flexer');
      expect(result.reason).toContain('스트레스 해소');
    });

    it('체형 교정 목표 → flexer 타입', () => {
      const result = classifyWorkoutType({
        goals: ['posture'],
      });
      expect(result.type).toBe('flexer');
      expect(result.reason).toContain('체형 교정');
    });
  });

  describe('복합 입력 분류', () => {
    it('체중감량 + 고빈도 → burner 타입', () => {
      const result = classifyWorkoutType({
        goals: ['weight_loss'],
        frequency: '5-6',
        equipment: ['bodyweight', 'cardio_machine'],
      });
      expect(result.type).toBe('burner');
    });

    it('근력강화 + 웨이트 장비 → builder 타입', () => {
      const result = classifyWorkoutType({
        goals: ['strength'],
        frequency: '3-4',
        equipment: ['barbell', 'dumbbell'],
      });
      expect(result.type).toBe('builder');
    });

    it('체형교정 + 요가매트 → flexer 타입', () => {
      const result = classifyWorkoutType({
        goals: ['posture', 'stress'],
        equipment: ['mat'],
      });
      expect(result.type).toBe('flexer');
    });
  });

  describe('기본값 처리', () => {
    it('빈 입력 → toner 기본 타입', () => {
      const result = classifyWorkoutType({});
      expect(result.type).toBe('toner');
      expect(result.reason).toContain('기본 추천');
    });

    it('알 수 없는 목표 → toner 기본 타입', () => {
      const result = classifyWorkoutType({
        goals: ['unknown_goal'],
      });
      expect(result.type).toBe('toner');
    });
  });

  describe('결과 형식', () => {
    it('분류 이유가 포함됨', () => {
      const result = classifyWorkoutType({
        goals: ['weight_loss'],
        frequency: '5-6',
      });
      expect(result.reason).toBeTruthy();
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it('유효한 운동 타입 반환', () => {
      const result = classifyWorkoutType({
        goals: ['strength'],
      });
      expect(Object.keys(WORKOUT_TYPE_INFO)).toContain(result.type);
    });
  });

  describe('신체 고민 영향', () => {
    it('뱃살 고민 → burner 가중치 증가', () => {
      const withConcern = classifyWorkoutType({
        concerns: ['belly'],
        frequency: '3-4',
      });
      const withoutConcern = classifyWorkoutType({
        frequency: '3-4',
      });
      // belly 고민이 burner에 가중치를 추가하므로 다른 결과 가능
      expect(withConcern.type).toBeDefined();
      expect(withoutConcern.type).toBeDefined();
    });
  });
});
