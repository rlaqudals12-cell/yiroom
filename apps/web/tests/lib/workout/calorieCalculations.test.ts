/**
 * W-1 칼로리 계산 로직 테스트 (Task 3.9)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCaloriesBurned,
  calculateCaloriesWithMET,
  calculateCaloriesDetailed,
  calculateExerciseCalories,
  calculateSessionCalories,
  calculateWeeklyCalories,
  calculateCalorieAchievement,
  inferExerciseType,
  getMETValue,
  getAllMETValues,
  calculateCaloriesPerMinute,
  calculateRequiredDuration,
  calculateCaloriesPerSet,
  calculateCaloriesPerSetFromCPM,
  calculateExerciseTotalCalories,
  MET_VALUES,
} from '@/lib/workout/calorieCalculations';

describe('칼로리 계산 로직 (Task 3.9)', () => {
  // ============================================
  // MET 값 상수 테스트
  // ============================================
  describe('MET_VALUES', () => {
    it('웨이트 트레이닝 MET 값이 정의되어 있음', () => {
      expect(MET_VALUES.weight_light).toBe(3.0);
      expect(MET_VALUES.weight_moderate).toBe(5.0);
      expect(MET_VALUES.weight_vigorous).toBe(6.0);
    });

    it('유산소 MET 값이 정의되어 있음 (스펙 7.2)', () => {
      expect(MET_VALUES.jogging).toBe(7.0); // 스펙: jogging = 7.0
      expect(MET_VALUES.running).toBe(10.0); // 스펙: running = 10.0
    });

    it('기타 운동 MET 값이 정의되어 있음 (스펙 7.2)', () => {
      expect(MET_VALUES.cycling).toBe(6.0); // 스펙: cycling = 6.0
      expect(MET_VALUES.swimming).toBe(8.0);
      expect(MET_VALUES.walking).toBe(3.5);
      expect(MET_VALUES.yoga).toBe(2.5);
      expect(MET_VALUES.pilates).toBe(3.0);
      expect(MET_VALUES.hiit).toBe(8.0);
      expect(MET_VALUES.stretching).toBe(2.0);
    });
  });

  // ============================================
  // calculateCaloriesBurned 테스트
  // ============================================
  describe('calculateCaloriesBurned', () => {
    it('60kg, 30분, 중강도 웨이트 → 150kcal', () => {
      // 60 × 0.5 × 5.0 = 150
      const result = calculateCaloriesBurned(60, 30, 'weight_moderate');
      expect(result).toBe(150);
    });

    it('70kg, 60분, HIIT → 560kcal', () => {
      // 70 × 1.0 × 8.0 = 560
      const result = calculateCaloriesBurned(70, 60, 'hiit');
      expect(result).toBe(560);
    });

    it('50kg, 45분, 요가 → 94kcal', () => {
      // 50 × 0.75 × 2.5 = 93.75 → 94 (반올림)
      const result = calculateCaloriesBurned(50, 45, 'yoga');
      expect(result).toBe(94);
    });

    it('80kg, 20분, 달리기 → 267kcal (스펙 7.2: running = 10.0)', () => {
      // 80 × (20/60) × 10.0 = 80 × 0.333 × 10 = 266.67 → 267
      const result = calculateCaloriesBurned(80, 20, 'running');
      expect(result).toBe(267);
    });

    it('체중 0 → 0kcal', () => {
      const result = calculateCaloriesBurned(0, 30, 'weight_moderate');
      expect(result).toBe(0);
    });

    it('시간 0 → 0kcal', () => {
      const result = calculateCaloriesBurned(60, 0, 'weight_moderate');
      expect(result).toBe(0);
    });

    it('음수 체중 → 0kcal', () => {
      const result = calculateCaloriesBurned(-60, 30, 'weight_moderate');
      expect(result).toBe(0);
    });

    it('음수 시간 → 0kcal', () => {
      const result = calculateCaloriesBurned(60, -30, 'weight_moderate');
      expect(result).toBe(0);
    });
  });

  // ============================================
  // calculateCaloriesWithMET 테스트
  // ============================================
  describe('calculateCaloriesWithMET', () => {
    it('60kg, 60분, MET 5.0 → 300kcal', () => {
      // 60 × 1.0 × 5.0 = 300
      const result = calculateCaloriesWithMET(60, 60, 5.0);
      expect(result).toBe(300);
    });

    it('75kg, 45분, MET 6.5 → 366kcal', () => {
      // 75 × 0.75 × 6.5 = 365.625 → 366
      const result = calculateCaloriesWithMET(75, 45, 6.5);
      expect(result).toBe(366);
    });

    it('MET 0 → 0kcal', () => {
      const result = calculateCaloriesWithMET(60, 30, 0);
      expect(result).toBe(0);
    });

    it('음수 MET → 0kcal', () => {
      const result = calculateCaloriesWithMET(60, 30, -5);
      expect(result).toBe(0);
    });
  });

  // ============================================
  // calculateCaloriesDetailed 테스트
  // ============================================
  describe('calculateCaloriesDetailed', () => {
    it('상세 결과에 모든 필드가 포함됨', () => {
      const result = calculateCaloriesDetailed(70, 45, 'swimming');

      expect(result).toHaveProperty('calories');
      expect(result).toHaveProperty('met');
      expect(result).toHaveProperty('durationMinutes');
      expect(result).toHaveProperty('weightKg');
    });

    it('70kg, 45분, 수영 → 420kcal, MET 8.0', () => {
      // 70 × 0.75 × 8.0 = 420
      const result = calculateCaloriesDetailed(70, 45, 'swimming');

      expect(result.calories).toBe(420);
      expect(result.met).toBe(8.0);
      expect(result.durationMinutes).toBe(45);
      expect(result.weightKg).toBe(70);
    });
  });

  // ============================================
  // calculateExerciseCalories 테스트
  // ============================================
  describe('calculateExerciseCalories', () => {
    it('Exercise 객체의 MET 값 사용', () => {
      const exercise = { met: 6.0, category: 'upper' as const, difficulty: 'intermediate' as const };
      // 60 × 0.5 × 6.0 × 1.0 = 180
      const result = calculateExerciseCalories(exercise, 60, 30);
      expect(result).toBe(180);
    });

    it('MET 값이 0이면 카테고리 기본값 사용', () => {
      const exercise = { met: 0, category: 'cardio' as const, difficulty: 'intermediate' as const };
      // 60 × 0.5 × 8.0 × 1.0 = 240
      const result = calculateExerciseCalories(exercise, 60, 30);
      expect(result).toBe(240);
    });

    it('난이도 beginner → -20% 조정', () => {
      const exercise = { met: 5.0, category: 'upper' as const, difficulty: 'beginner' as const };
      // 60 × 0.5 × 5.0 × 0.8 = 120
      const result = calculateExerciseCalories(exercise, 60, 30);
      expect(result).toBe(120);
    });

    it('난이도 advanced → +20% 조정', () => {
      const exercise = { met: 5.0, category: 'upper' as const, difficulty: 'advanced' as const };
      // 60 × 0.5 × 5.0 × 1.2 = 180
      const result = calculateExerciseCalories(exercise, 60, 30);
      expect(result).toBe(180);
    });

    it('체중 0 → 0kcal', () => {
      const exercise = { met: 5.0, category: 'upper' as const, difficulty: 'intermediate' as const };
      const result = calculateExerciseCalories(exercise, 0, 30);
      expect(result).toBe(0);
    });
  });

  // ============================================
  // calculateSessionCalories 테스트
  // ============================================
  describe('calculateSessionCalories', () => {
    it('여러 운동의 칼로리 합산', () => {
      const exercises = [
        { id: 'ex1', name: '벤치프레스', durationMinutes: 20, met: 5.0 },
        { id: 'ex2', name: '스쿼트', durationMinutes: 20, met: 6.0 },
        { id: 'ex3', name: '런닝', durationMinutes: 15, met: 9.5 },
      ];

      const result = calculateSessionCalories(exercises, 70);

      // 벤치프레스: 70 × (20/60) × 5.0 = 116.67 → 117
      // 스쿼트: 70 × (20/60) × 6.0 = 140
      // 런닝: 70 × (15/60) × 9.5 = 166.25 → 166
      // 총합: 117 + 140 + 166 = 423
      expect(result.totalCalories).toBe(423);
      expect(result.exercises).toHaveLength(3);
      expect(result.totalDurationMinutes).toBe(55);
    });

    it('운동별 상세 정보가 포함됨', () => {
      const exercises = [
        { id: 'ex1', name: '푸쉬업', durationMinutes: 10, met: 3.5 },
      ];

      const result = calculateSessionCalories(exercises, 60);

      expect(result.exercises[0]).toEqual({
        exerciseId: 'ex1',
        exerciseName: '푸쉬업',
        calories: 35, // 60 × (10/60) × 3.5 = 35
        durationMinutes: 10,
        met: 3.5,
      });
    });

    it('빈 운동 목록 → 0 반환', () => {
      const result = calculateSessionCalories([], 70);

      expect(result.totalCalories).toBe(0);
      expect(result.exercises).toHaveLength(0);
      expect(result.totalDurationMinutes).toBe(0);
    });

    it('체중 0 → 0 반환', () => {
      const exercises = [
        { id: 'ex1', name: '운동', durationMinutes: 30, met: 5.0 },
      ];

      const result = calculateSessionCalories(exercises, 0);

      expect(result.totalCalories).toBe(0);
    });
  });

  // ============================================
  // calculateWeeklyCalories 테스트
  // ============================================
  describe('calculateWeeklyCalories', () => {
    it('주간 총 칼로리와 평균 계산', () => {
      const dailyRecords = {
        '2025-11-24': 300,
        '2025-11-25': 450,
        '2025-11-26': 0, // 휴식일
        '2025-11-27': 380,
        '2025-11-28': 500,
      };

      const result = calculateWeeklyCalories(dailyRecords);

      expect(result.totalCalories).toBe(1630); // 300+450+0+380+500
      expect(result.activeDays).toBe(4); // 0 제외
      expect(result.dailyAverage).toBe(408); // 1630 / 4 = 407.5 → 408
    });

    it('모든 날이 휴식일이면 평균 0', () => {
      const dailyRecords = {
        '2025-11-24': 0,
        '2025-11-25': 0,
      };

      const result = calculateWeeklyCalories(dailyRecords);

      expect(result.totalCalories).toBe(0);
      expect(result.activeDays).toBe(0);
      expect(result.dailyAverage).toBe(0);
    });

    it('빈 기록 → 0 반환', () => {
      const result = calculateWeeklyCalories({});

      expect(result.totalCalories).toBe(0);
      expect(result.activeDays).toBe(0);
    });

    it('일별 칼로리가 복사됨 (원본 보존)', () => {
      const dailyRecords = { '2025-11-24': 300 };
      const result = calculateWeeklyCalories(dailyRecords);

      expect(result.caloriesByDay).toEqual(dailyRecords);
      expect(result.caloriesByDay).not.toBe(dailyRecords); // 참조가 다름
    });
  });

  // ============================================
  // calculateCalorieAchievement 테스트
  // ============================================
  describe('calculateCalorieAchievement', () => {
    it('목표의 50% 달성', () => {
      const result = calculateCalorieAchievement(250, 500);
      expect(result).toBe(50);
    });

    it('목표 100% 달성', () => {
      const result = calculateCalorieAchievement(500, 500);
      expect(result).toBe(100);
    });

    it('목표 초과 시 100%로 제한', () => {
      const result = calculateCalorieAchievement(600, 500);
      expect(result).toBe(100);
    });

    it('목표 0 → 0%', () => {
      const result = calculateCalorieAchievement(300, 0);
      expect(result).toBe(0);
    });

    it('현재 0 → 0%', () => {
      const result = calculateCalorieAchievement(0, 500);
      expect(result).toBe(0);
    });

    it('67% 달성 (반올림)', () => {
      // 333 / 500 = 0.666 → 67%
      const result = calculateCalorieAchievement(333, 500);
      expect(result).toBe(67);
    });
  });

  // ============================================
  // inferExerciseType 테스트
  // ============================================
  describe('inferExerciseType', () => {
    it('cardio + beginner → walking', () => {
      expect(inferExerciseType('cardio', 'beginner')).toBe('walking');
    });

    it('cardio + intermediate → jogging (스펙 7.2)', () => {
      expect(inferExerciseType('cardio', 'intermediate')).toBe('jogging');
    });

    it('cardio + advanced → running (스펙 7.2)', () => {
      expect(inferExerciseType('cardio', 'advanced')).toBe('running');
    });

    it('upper + beginner → weight_light', () => {
      expect(inferExerciseType('upper', 'beginner')).toBe('weight_light');
    });

    it('lower + intermediate → weight_moderate', () => {
      expect(inferExerciseType('lower', 'intermediate')).toBe('weight_moderate');
    });

    it('core + advanced → weight_vigorous', () => {
      expect(inferExerciseType('core', 'advanced')).toBe('weight_vigorous');
    });
  });

  // ============================================
  // getMETValue / getAllMETValues 테스트
  // ============================================
  describe('getMETValue', () => {
    it('유효한 운동 타입의 MET 값 반환', () => {
      expect(getMETValue('hiit')).toBe(8.0);
      expect(getMETValue('yoga')).toBe(2.5);
    });
  });

  describe('getAllMETValues', () => {
    it('모든 MET 값이 포함됨 (스펙 7.2 기준 12개)', () => {
      const values = getAllMETValues();

      expect(Object.keys(values)).toHaveLength(12);
      expect(values).toHaveProperty('weight_light');
      expect(values).toHaveProperty('jogging');
      expect(values).toHaveProperty('running');
      expect(values).toHaveProperty('hiit');
    });

    it('원본 MET_VALUES와 분리됨', () => {
      const values = getAllMETValues();
      values.hiit = 100; // 수정 시도

      expect(MET_VALUES.hiit).toBe(8.0); // 원본 보존
    });
  });

  // ============================================
  // calculateCaloriesPerMinute 테스트
  // ============================================
  describe('calculateCaloriesPerMinute', () => {
    it('60kg, MET 6.0 → 6kcal/분', () => {
      // (60 × 6.0) / 60 = 6.0
      const result = calculateCaloriesPerMinute(60, 6.0);
      expect(result).toBe(6);
    });

    it('70kg, MET 8.0 → 9.33kcal/분', () => {
      // (70 × 8.0) / 60 = 9.333...
      const result = calculateCaloriesPerMinute(70, 8.0);
      expect(result).toBeCloseTo(9.33, 2);
    });

    it('체중 0 → 0', () => {
      expect(calculateCaloriesPerMinute(0, 5.0)).toBe(0);
    });

    it('MET 0 → 0', () => {
      expect(calculateCaloriesPerMinute(60, 0)).toBe(0);
    });
  });

  // ============================================
  // calculateRequiredDuration 테스트
  // ============================================
  describe('calculateRequiredDuration', () => {
    it('300kcal 소모에 필요한 시간 (60kg, MET 5.0)', () => {
      // 시간(시간) = 300 / (60 × 5.0) = 1.0시간 = 60분
      const result = calculateRequiredDuration(300, 60, 5.0);
      expect(result).toBe(60);
    });

    it('500kcal 소모에 필요한 시간 (70kg, MET 8.0)', () => {
      // 시간(시간) = 500 / (70 × 8.0) = 0.893시간 = 53.57분 → 54분
      const result = calculateRequiredDuration(500, 70, 8.0);
      expect(result).toBe(54);
    });

    it('목표 칼로리 0 → 0분', () => {
      expect(calculateRequiredDuration(0, 60, 5.0)).toBe(0);
    });

    it('체중 0 → 0분', () => {
      expect(calculateRequiredDuration(300, 0, 5.0)).toBe(0);
    });

    it('MET 0 → 0분', () => {
      expect(calculateRequiredDuration(300, 60, 0)).toBe(0);
    });
  });

  // ============================================
  // calculateCaloriesPerSet 테스트 (UI용: "10kcal/세트")
  // ============================================
  describe('calculateCaloriesPerSet', () => {
    it('70kg, MET 5.0, 45초 → 4kcal/세트', () => {
      // 70 × (45/3600) × 5.0 = 70 × 0.0125 × 5 = 4.375 → 4
      const result = calculateCaloriesPerSet(70, 5.0, 45);
      expect(result).toBe(4);
    });

    it('60kg, MET 8.0, 30초 → 4kcal/세트', () => {
      // 60 × (30/3600) × 8.0 = 60 × 0.00833 × 8 = 4.0 → 4
      const result = calculateCaloriesPerSet(60, 8.0, 30);
      expect(result).toBe(4);
    });

    it('기본값 45초 사용', () => {
      const withDefault = calculateCaloriesPerSet(70, 5.0);
      const explicit = calculateCaloriesPerSet(70, 5.0, 45);
      expect(withDefault).toBe(explicit);
    });

    it('체중 0 → 0', () => {
      expect(calculateCaloriesPerSet(0, 5.0, 45)).toBe(0);
    });

    it('MET 0 → 0', () => {
      expect(calculateCaloriesPerSet(70, 0, 45)).toBe(0);
    });

    it('시간 0 → 0', () => {
      expect(calculateCaloriesPerSet(70, 5.0, 0)).toBe(0);
    });
  });

  // ============================================
  // calculateCaloriesPerSetFromCPM 테스트
  // ============================================
  describe('calculateCaloriesPerSetFromCPM', () => {
    it('분당 6kcal, 45초 → 5kcal/세트', () => {
      // 6 × (45/60) = 6 × 0.75 = 4.5 → 5 (반올림)
      const result = calculateCaloriesPerSetFromCPM(6, 45);
      expect(result).toBe(5);
    });

    it('분당 10kcal, 30초 → 5kcal/세트', () => {
      // 10 × (30/60) = 10 × 0.5 = 5
      const result = calculateCaloriesPerSetFromCPM(10, 30);
      expect(result).toBe(5);
    });

    it('기본값 45초 사용', () => {
      const withDefault = calculateCaloriesPerSetFromCPM(6);
      const explicit = calculateCaloriesPerSetFromCPM(6, 45);
      expect(withDefault).toBe(explicit);
    });

    it('caloriesPerMinute 0 → 0', () => {
      expect(calculateCaloriesPerSetFromCPM(0, 45)).toBe(0);
    });

    it('시간 0 → 0', () => {
      expect(calculateCaloriesPerSetFromCPM(6, 0)).toBe(0);
    });
  });

  // ============================================
  // calculateExerciseTotalCalories 테스트 (UI용: "30초 x 3세트 | 🔥 45kcal")
  // ============================================
  describe('calculateExerciseTotalCalories', () => {
    it('70kg, MET 5.0, 3세트 x 45초 + 휴식 60초 → 총 칼로리 계산', () => {
      // 운동: 70 × (45/3600) × 5.0 × 3 = 13.125
      // 휴식: 70 × (120/3600) × 1.5 = 3.5 (2세트 휴식)
      // 총합: 13.125 + 3.5 = 16.625 → 약 17
      const result = calculateExerciseTotalCalories(70, 5.0, 3, 45, 60);
      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThan(25);
    });

    it('휴식 시간 포함하여 계산', () => {
      const withRest = calculateExerciseTotalCalories(70, 5.0, 3, 45, 60);
      const minimalRest = calculateExerciseTotalCalories(70, 5.0, 3, 45, 0);
      expect(withRest).toBeGreaterThan(minimalRest);
    });

    it('세트 수 증가 시 칼로리 증가', () => {
      const threeSets = calculateExerciseTotalCalories(70, 5.0, 3, 45);
      const fiveSets = calculateExerciseTotalCalories(70, 5.0, 5, 45);
      expect(fiveSets).toBeGreaterThan(threeSets);
    });

    it('체중 0 → 0', () => {
      expect(calculateExerciseTotalCalories(0, 5.0, 3, 45)).toBe(0);
    });

    it('MET 0 → 0', () => {
      expect(calculateExerciseTotalCalories(70, 0, 3, 45)).toBe(0);
    });

    it('세트 0 → 0', () => {
      expect(calculateExerciseTotalCalories(70, 5.0, 0, 45)).toBe(0);
    });

    it('세트 시간 0 → 0', () => {
      expect(calculateExerciseTotalCalories(70, 5.0, 3, 0)).toBe(0);
    });
  });

  // ============================================
  // 스펙 예시 검증 (Feature Spec 7.2)
  // ============================================
  describe('Feature Spec 7.2 예시 검증', () => {
    it('스펙 공식: 칼로리 = 체중(kg) × 시간(시간) × MET', () => {
      // 예시: 70kg 사용자가 30분간 중강도 웨이트(MET 5.0) 운동
      // 칼로리 = 70 × 0.5 × 5.0 = 175kcal
      const result = calculateCaloriesBurned(70, 30, 'weight_moderate');
      expect(result).toBe(175);
    });

    it('스펙 MET 값: jogging = 7.0', () => {
      expect(MET_VALUES.jogging).toBe(7.0);
    });

    it('스펙 MET 값: running = 10.0', () => {
      expect(MET_VALUES.running).toBe(10.0);
    });

    it('스펙 MET 값: cycling = 6.0', () => {
      expect(MET_VALUES.cycling).toBe(6.0);
    });

    it('스펙 MET 값: swimming = 8.0', () => {
      expect(MET_VALUES.swimming).toBe(8.0);
    });

    it('스펙 MET 값: HIIT = 8.0', () => {
      expect(MET_VALUES.hiit).toBe(8.0);
    });

    it('스펙 MET 값: stretching = 2.0', () => {
      expect(MET_VALUES.stretching).toBe(2.0);
    });
  });
});
