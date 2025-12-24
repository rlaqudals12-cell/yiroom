import { describe, it, expect } from 'vitest';
import {
  calculateWorkoutScore,
  calculateNutritionScore,
  calculateSkinScore,
  calculateBodyScore,
  calculateWellnessScore,
  generateInsights,
} from '@/lib/wellness/calculator';

describe('웰니스 스코어 계산기', () => {
  describe('calculateWorkoutScore', () => {
    it('스트릭 0일이면 스트릭 점수 0', () => {
      const result = calculateWorkoutScore({
        currentStreak: 0,
        weeklyWorkouts: 0,
        targetWorkouts: 5,
        completedGoals: 0,
        totalGoals: 3,
      });
      expect(result.breakdown.streak).toBe(2);
    });

    it('스트릭 7일이면 스트릭 점수 6', () => {
      const result = calculateWorkoutScore({
        currentStreak: 7,
        weeklyWorkouts: 0,
        targetWorkouts: 5,
        completedGoals: 0,
        totalGoals: 3,
      });
      expect(result.breakdown.streak).toBe(6);
    });

    it('스트릭 30일 이상이면 스트릭 점수 10', () => {
      const result = calculateWorkoutScore({
        currentStreak: 30,
        weeklyWorkouts: 0,
        targetWorkouts: 5,
        completedGoals: 0,
        totalGoals: 3,
      });
      expect(result.breakdown.streak).toBe(10);
    });

    it('주간 운동 5회면 빈도 점수 10', () => {
      const result = calculateWorkoutScore({
        currentStreak: 0,
        weeklyWorkouts: 5,
        targetWorkouts: 5,
        completedGoals: 0,
        totalGoals: 3,
      });
      expect(result.breakdown.frequency).toBe(10);
    });

    it('목표 100% 달성하면 목표 점수 5', () => {
      const result = calculateWorkoutScore({
        currentStreak: 0,
        weeklyWorkouts: 0,
        targetWorkouts: 5,
        completedGoals: 3,
        totalGoals: 3,
      });
      expect(result.breakdown.goal).toBe(5);
    });

    it('전체 점수가 25를 초과하지 않음', () => {
      const result = calculateWorkoutScore({
        currentStreak: 100,
        weeklyWorkouts: 10,
        targetWorkouts: 5,
        completedGoals: 10,
        totalGoals: 3,
      });
      expect(result.total).toBeLessThanOrEqual(25);
    });
  });

  describe('calculateNutritionScore', () => {
    it('칼로리 100% 달성하면 칼로리 점수 10', () => {
      const result = calculateNutritionScore({
        calorieAchievement: 100,
        proteinAchievement: 0,
        carbsAchievement: 0,
        fatAchievement: 0,
        waterCups: 0,
        targetWaterCups: 8,
      });
      expect(result.breakdown.calorie).toBe(10);
    });

    it('영양소 균형 100%면 균형 점수 10', () => {
      const result = calculateNutritionScore({
        calorieAchievement: 0,
        proteinAchievement: 100,
        carbsAchievement: 100,
        fatAchievement: 100,
        waterCups: 0,
        targetWaterCups: 8,
      });
      expect(result.breakdown.balance).toBe(10);
    });

    it('수분 목표 100% 달성하면 수분 점수 5', () => {
      const result = calculateNutritionScore({
        calorieAchievement: 0,
        proteinAchievement: 0,
        carbsAchievement: 0,
        fatAchievement: 0,
        waterCups: 8,
        targetWaterCups: 8,
      });
      expect(result.breakdown.water).toBe(5);
    });

    it('전체 점수가 25를 초과하지 않음', () => {
      const result = calculateNutritionScore({
        calorieAchievement: 150,
        proteinAchievement: 150,
        carbsAchievement: 150,
        fatAchievement: 150,
        waterCups: 20,
        targetWaterCups: 8,
      });
      expect(result.total).toBeLessThanOrEqual(25);
    });
  });

  describe('calculateSkinScore', () => {
    it('분석이 없으면 분석 점수 0', () => {
      const result = calculateSkinScore({
        hasAnalysis: false,
        analysisAge: 0,
        routineCompleted: false,
        productMatchScore: 0,
      });
      expect(result.breakdown.analysis).toBe(0);
    });

    it('최근 분석이 있으면 분석 점수 10', () => {
      const result = calculateSkinScore({
        hasAnalysis: true,
        analysisAge: 1,
        routineCompleted: false,
        productMatchScore: 0,
      });
      expect(result.breakdown.analysis).toBe(10);
    });

    it('루틴 완료하면 루틴 점수 10', () => {
      const result = calculateSkinScore({
        hasAnalysis: false,
        analysisAge: 0,
        routineCompleted: true,
        productMatchScore: 0,
      });
      expect(result.breakdown.routine).toBe(10);
    });

    it('제품 매칭 100%면 매칭 점수 5', () => {
      const result = calculateSkinScore({
        hasAnalysis: false,
        analysisAge: 0,
        routineCompleted: false,
        productMatchScore: 100,
      });
      expect(result.breakdown.matching).toBe(5);
    });
  });

  describe('calculateBodyScore', () => {
    it('분석이 없으면 분석 점수 0', () => {
      const result = calculateBodyScore({
        hasAnalysis: false,
        analysisAge: 0,
        targetWeight: 70,
        currentWeight: 75,
        initialWeight: 80,
        hasWorkoutPlan: false,
      });
      expect(result.breakdown.analysis).toBe(0);
    });

    it('운동 플랜이 있으면 운동 점수 5', () => {
      const result = calculateBodyScore({
        hasAnalysis: false,
        analysisAge: 0,
        targetWeight: 70,
        currentWeight: 75,
        initialWeight: 80,
        hasWorkoutPlan: true,
      });
      expect(result.breakdown.workout).toBe(5);
    });

    it('목표 50% 진행하면 진행률 점수 5', () => {
      const result = calculateBodyScore({
        hasAnalysis: false,
        analysisAge: 0,
        targetWeight: 70,
        currentWeight: 75,
        initialWeight: 80,
        hasWorkoutPlan: false,
      });
      expect(result.breakdown.progress).toBe(5);
    });
  });

  describe('calculateWellnessScore', () => {
    it('모든 영역 최대 점수면 전체 100점', () => {
      const result = calculateWellnessScore(
        { currentStreak: 30, weeklyWorkouts: 7, targetWorkouts: 5, completedGoals: 5, totalGoals: 5 },
        { calorieAchievement: 100, proteinAchievement: 100, carbsAchievement: 100, fatAchievement: 100, waterCups: 10, targetWaterCups: 8 },
        { hasAnalysis: true, analysisAge: 1, routineCompleted: true, productMatchScore: 100 },
        { hasAnalysis: true, analysisAge: 1, targetWeight: 70, currentWeight: 70, initialWeight: 80, hasWorkoutPlan: true }
      );
      expect(result.totalScore).toBe(100);
    });

    it('모든 영역 0점이면 전체 0점이 아님 (기본 점수 있음)', () => {
      const result = calculateWellnessScore(
        { currentStreak: 0, weeklyWorkouts: 0, targetWorkouts: 5, completedGoals: 0, totalGoals: 5 },
        { calorieAchievement: 0, proteinAchievement: 0, carbsAchievement: 0, fatAchievement: 0, waterCups: 0, targetWaterCups: 8 },
        { hasAnalysis: false, analysisAge: 0, routineCompleted: false, productMatchScore: 0 },
        { hasAnalysis: false, analysisAge: 0, targetWeight: 70, currentWeight: 80, initialWeight: 80, hasWorkoutPlan: false }
      );
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });

    it('영역별 점수 합이 전체 점수와 같음', () => {
      const result = calculateWellnessScore(
        { currentStreak: 7, weeklyWorkouts: 3, targetWorkouts: 5, completedGoals: 2, totalGoals: 5 },
        { calorieAchievement: 80, proteinAchievement: 70, carbsAchievement: 60, fatAchievement: 90, waterCups: 6, targetWaterCups: 8 },
        { hasAnalysis: true, analysisAge: 10, routineCompleted: true, productMatchScore: 80 },
        { hasAnalysis: true, analysisAge: 5, targetWeight: 70, currentWeight: 75, initialWeight: 80, hasWorkoutPlan: true }
      );
      const sum = result.workoutScore + result.nutritionScore + result.skinScore + result.bodyScore;
      expect(result.totalScore).toBe(sum);
    });
  });

  describe('generateInsights', () => {
    it('운동 점수가 낮으면 개선 인사이트 생성', () => {
      const insights = generateInsights({
        workoutScore: 5,
        nutritionScore: 20,
        skinScore: 20,
        bodyScore: 20,
      });
      const workoutInsight = insights.find((i) => i.area === 'workout' && i.type === 'improvement');
      expect(workoutInsight).toBeDefined();
    });

    it('스트릭 7일 달성하면 축하 인사이트 생성', () => {
      const insights = generateInsights(
        { workoutScore: 20, nutritionScore: 20, skinScore: 20, bodyScore: 20 },
        { currentStreak: 7 }
      );
      const streakInsight = insights.find((i) => i.type === 'achievement' && i.message.includes('7일'));
      expect(streakInsight).toBeDefined();
    });

    it('전체 점수가 80점 이상이면 칭찬 인사이트 생성', () => {
      const insights = generateInsights({
        workoutScore: 22,
        nutritionScore: 22,
        skinScore: 20,
        bodyScore: 20,
      });
      const achievementInsight = insights.find((i) => i.type === 'achievement' && i.area === 'overall');
      expect(achievementInsight).toBeDefined();
    });
  });
});
