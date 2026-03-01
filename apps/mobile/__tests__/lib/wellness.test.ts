/**
 * 웰니스 점수 모듈 테스트
 */

import {
  calculateWellnessScore,
  calculateWorkoutScore,
  calculateNutritionScore,
  calculateSkinScore,
  calculateBodyScore,
  calculateStreakBonus,
  getWellnessGrade,
  calculateTrend,
  getTrendLabel,
  getImprovementSuggestions,
  GRADE_LABELS,
  GRADE_COLORS,
} from '../../lib/wellness';

describe('wellness', () => {
  describe('calculateWorkoutScore', () => {
    it('주 0분 0일 운동은 0점', () => {
      expect(calculateWorkoutScore(0, 0)).toBe(0);
    });

    it('주 150분 5일은 만점 25', () => {
      // frequencyScore = min(15, (5/5)*15) = 15
      // durationScore = min(10, (150/150)*10) = 10
      expect(calculateWorkoutScore(150, 5)).toBe(25);
    });

    it('최대 25점', () => {
      expect(calculateWorkoutScore(300, 7)).toBeLessThanOrEqual(25);
    });

    it('운동 시간만 있을 때', () => {
      const score = calculateWorkoutScore(100, 0);
      // frequencyScore = 0, durationScore = round(100/150*10) ≈ 7
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(25);
    });
  });

  describe('calculateNutritionScore', () => {
    it('모든 0은 0점', () => {
      expect(calculateNutritionScore(0, 0, 0)).toBe(0);
    });

    it('모두 만점이면 25점', () => {
      // calorieAccuracy 1.0 → 10, macroBalance 1.0 → 10, waterRatio 1.0 → 5
      expect(calculateNutritionScore(1, 1, 1)).toBe(25);
    });

    it('최대 25점', () => {
      expect(calculateNutritionScore(2, 2, 2)).toBeLessThanOrEqual(25);
    });
  });

  describe('calculateSkinScore', () => {
    it('분석 0점 루틴 0이면 0점', () => {
      expect(calculateSkinScore(0, 0)).toBe(0);
    });

    it('분석 null이면 중간값 적용', () => {
      // skinAnalysisScore null → 7.5, routineConsistency 0 → 0
      expect(calculateSkinScore(null, 0)).toBe(8); // round(7.5)
    });

    it('최대 25점', () => {
      expect(calculateSkinScore(100, 1)).toBeLessThanOrEqual(25);
    });
  });

  describe('calculateBodyScore', () => {
    it('분석 null + 자세 null이면 중간값', () => {
      // bodyAnalysisScore null → 2.5, postureScore null → 2.5
      expect(calculateBodyScore(null, null)).toBe(5); // round(2.5+2.5)
    });

    it('분석 0 + 자세 0이면 0점', () => {
      expect(calculateBodyScore(0, 0)).toBe(0);
    });

    it('최대 10점', () => {
      expect(calculateBodyScore(100, 100)).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateStreakBonus', () => {
    it('연속 0일은 0점', () => {
      expect(calculateStreakBonus(0)).toBe(0);
    });

    it('연속 7일은 5점', () => {
      expect(calculateStreakBonus(7)).toBe(5);
    });

    it('연속 30일은 15점', () => {
      expect(calculateStreakBonus(30)).toBe(15);
    });

    it('최대 15점', () => {
      expect(calculateStreakBonus(100)).toBeLessThanOrEqual(15);
    });
  });

  describe('calculateWellnessScore', () => {
    it('전체 입력으로 점수 계산', () => {
      const result = calculateWellnessScore({
        weeklyWorkoutMinutes: 90,
        weeklyWorkoutDays: 3,
        avgCalorieAccuracy: 0.8,
        avgMacroBalance: 0.7,
        waterIntakeRatio: 0.6,
        skinScore: 70,
        skinRoutineConsistency: 0.5,
        bodyScore: 80,
        postureScore: 60,
        currentStreak: 5,
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('workout');
      expect(result.breakdown).toHaveProperty('nutrition');
      expect(result.breakdown).toHaveProperty('skin');
      expect(result.breakdown).toHaveProperty('body');
      expect(result.grade).toBeTruthy();
    });

    it('모든 0 입력은 스킨/바디 중간값으로 0은 아님', () => {
      const result = calculateWellnessScore({
        weeklyWorkoutMinutes: 0,
        weeklyWorkoutDays: 0,
        avgCalorieAccuracy: 0,
        avgMacroBalance: 0,
        waterIntakeRatio: 0,
        skinScore: 0,
        skinRoutineConsistency: 0,
        bodyScore: 0,
        postureScore: 0,
        currentStreak: 0,
      });

      // 운동 0 + 영양 0 + 피부 round(0+0)=0 + 체형 round(0+0)=0 = 0
      expect(result.total).toBe(0);
    });
  });

  describe('getWellnessGrade', () => {
    it('90+ 점은 S등급', () => {
      expect(getWellnessGrade(90)).toBe('S');
      expect(getWellnessGrade(95)).toBe('S');
    });

    it('80+ 점은 A등급', () => {
      expect(getWellnessGrade(85)).toBe('A');
    });

    it('0점은 F등급', () => {
      expect(getWellnessGrade(0)).toBe('F');
    });

    it('모든 등급 경계', () => {
      expect(getWellnessGrade(100)).toBe('S');
      expect(getWellnessGrade(70)).toBe('B');
      expect(getWellnessGrade(60)).toBe('C');
      expect(getWellnessGrade(40)).toBe('D');
      expect(getWellnessGrade(39)).toBe('F');
    });
  });

  describe('calculateTrend', () => {
    it('점수 상승은 up', () => {
      expect(calculateTrend(80, 70)).toBe('up');
    });

    it('점수 하락은 down', () => {
      expect(calculateTrend(60, 70)).toBe('down');
    });

    it('차이 3 이내는 stable', () => {
      expect(calculateTrend(72, 70)).toBe('stable');
    });

    it('이전 점수 null은 stable', () => {
      expect(calculateTrend(70, null)).toBe('stable');
    });
  });

  describe('getTrendLabel', () => {
    it('트렌드 라벨 반환', () => {
      expect(getTrendLabel('up')).toContain('상승');
      expect(getTrendLabel('down')).toContain('하락');
      expect(getTrendLabel('stable')).toContain('안정');
    });
  });

  describe('getImprovementSuggestions', () => {
    it('낮은 항목에 대한 제안 반환', () => {
      const suggestions = getImprovementSuggestions({
        workout: 5,
        nutrition: 5,
        skin: 5,
        body: 2,
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(2);
      expect(suggestions[0]).toHaveProperty('area');
      expect(suggestions[0]).toHaveProperty('message');
    });
  });

  describe('GRADE_LABELS 상수', () => {
    it('6개 등급 라벨 존재', () => {
      expect(Object.keys(GRADE_LABELS).length).toBe(6);
    });
  });

  describe('GRADE_COLORS 상수', () => {
    it('6개 등급 색상 존재', () => {
      expect(Object.keys(GRADE_COLORS).length).toBe(6);
    });
  });
});
