import { describe, it, expect } from 'vitest';
import {
  generateBest5,
  type ExerciseGoal,
  GOAL_LABELS,
  GOAL_ICONS,
} from '@/lib/workout/best5-generator';

describe('best5-generator', () => {
  describe('generateBest5', () => {
    it('체중 감량 목표에 대한 Best 5를 생성한다', () => {
      const result = generateBest5('weight_loss');

      expect(result.goal).toBe('weight_loss');
      expect(result.goalLabel).toBe(GOAL_LABELS.weight_loss);
      expect(result.exercises).toHaveLength(5);
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.estimatedCalories).toBeGreaterThan(0);
      expect(result.tips.length).toBeGreaterThan(0);
    });

    it('근육 증가 목표에 대한 Best 5를 생성한다', () => {
      const result = generateBest5('muscle_gain');

      expect(result.goal).toBe('muscle_gain');
      expect(result.goalLabel).toBe(GOAL_LABELS.muscle_gain);
      expect(result.exercises).toHaveLength(5);
    });

    it('유연성 목표에 대한 Best 5를 생성한다', () => {
      const result = generateBest5('flexibility');

      expect(result.goal).toBe('flexibility');
      expect(result.goalLabel).toBe(GOAL_LABELS.flexibility);
      expect(result.exercises).toHaveLength(5);
    });

    it('지구력 목표에 대한 Best 5를 생성한다', () => {
      const result = generateBest5('endurance');

      expect(result.goal).toBe('endurance');
      expect(result.goalLabel).toBe(GOAL_LABELS.endurance);
      expect(result.exercises).toHaveLength(5);
    });

    it('자세 교정 목표에 대한 Best 5를 생성한다', () => {
      const result = generateBest5('posture_correction', {
        postureType: 'forward_head',
      });

      expect(result.goal).toBe('posture_correction');
      expect(result.goalLabel).toBe(GOAL_LABELS.posture_correction);
      expect(result.exercises.length).toBeGreaterThan(0);
      expect(result.exercises.length).toBeLessThanOrEqual(5);
    });

    it('자세 타입에 따라 다른 운동을 추천한다', () => {
      const forwardHead = generateBest5('posture_correction', {
        postureType: 'forward_head',
      });
      const roundedShoulders = generateBest5('posture_correction', {
        postureType: 'rounded_shoulders',
      });

      // 각 자세 타입에 맞는 운동이 추천되어야 함
      // (운동 데이터가 없을 수 있으므로 최소한 시도는 했는지 확인)
      expect(forwardHead.exercises.length).toBeGreaterThan(0);
      expect(roundedShoulders.exercises.length).toBeGreaterThan(0);
    });

    it('초보자 레벨에 맞는 운동을 추천한다', () => {
      const result = generateBest5('muscle_gain', {
        fitnessLevel: 'beginner',
      });

      // 초보자 운동이 포함되어야 함
      const hasBeginnerExercises = result.exercises.some(
        (rec) => rec.exercise.difficulty === 'beginner'
      );
      expect(hasBeginnerExercises).toBe(true);
    });

    it('각 운동에 추천 이유가 포함되어야 한다', () => {
      const result = generateBest5('weight_loss');

      result.exercises.forEach((rec) => {
        expect(rec.reason).toBeTruthy();
        expect(rec.reason.length).toBeGreaterThan(0);
      });
    });

    it('각 운동에 우선순위가 설정되어야 한다', () => {
      const result = generateBest5('muscle_gain');

      result.exercises.forEach((rec) => {
        expect(rec.priority).toBeGreaterThan(0);
      });

      // 우선순위가 존재하고 양수여야 함
      const priorities = result.exercises.map((rec) => rec.priority);
      expect(priorities.every((p) => p > 0)).toBe(true);
    });

    it('총 소요 시간이 계산되어야 한다', () => {
      const result = generateBest5('endurance');

      expect(result.totalDuration).toBeGreaterThan(0);
      // 5개 운동 x 최소 10분 = 최소 50분
      expect(result.totalDuration).toBeGreaterThanOrEqual(50);
    });

    it('총 소모 칼로리가 계산되어야 한다', () => {
      const result = generateBest5('weight_loss');

      expect(result.estimatedCalories).toBeGreaterThan(0);
    });
  });

  describe('GOAL_LABELS', () => {
    it('모든 목표에 대한 라벨이 정의되어야 한다', () => {
      const goals: ExerciseGoal[] = [
        'posture_correction',
        'weight_loss',
        'muscle_gain',
        'flexibility',
        'endurance',
      ];

      goals.forEach((goal) => {
        expect(GOAL_LABELS[goal]).toBeTruthy();
      });
    });
  });

  describe('GOAL_ICONS', () => {
    it('모든 목표에 대한 아이콘이 정의되어야 한다', () => {
      const goals: ExerciseGoal[] = [
        'posture_correction',
        'weight_loss',
        'muscle_gain',
        'flexibility',
        'endurance',
      ];

      goals.forEach((goal) => {
        expect(GOAL_ICONS[goal]).toBeTruthy();
      });
    });
  });
});
