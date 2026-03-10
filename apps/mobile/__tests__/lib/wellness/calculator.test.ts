/**
 * 웰니스 계산기 단위 테스트
 *
 * 대상: lib/wellness/calculator.ts
 * 순수 함수 테스트 (convertToWellnessInput, calculateWellnessFromData, generateWeeklySummary)
 */
import {
  convertToWellnessInput,
  calculateWellnessFromData,
  generateWeeklySummary,
} from '../../../lib/wellness/calculator';
import type { WellnessDataInput } from '../../../lib/wellness/types';

// ============================================================
// 팩토리 함수
// ============================================================

function createMockDataInput(overrides: Partial<WellnessDataInput> = {}): WellnessDataInput {
  return {
    userId: 'user_123',
    workoutSessions: [
      { date: '2026-03-01', durationMinutes: 45, caloriesBurned: 300 },
      { date: '2026-03-03', durationMinutes: 60, caloriesBurned: 400 },
      { date: '2026-03-05', durationMinutes: 30, caloriesBurned: 200 },
    ],
    mealRecords: [
      { date: '2026-03-01', totalCalories: 2000, targetCalories: 2200, macroBalance: 0.8 },
      { date: '2026-03-02', totalCalories: 2100, targetCalories: 2200, macroBalance: 0.7 },
    ],
    waterIntake: [
      { date: '2026-03-01', amountMl: 2000, targetMl: 2500 },
      { date: '2026-03-02', amountMl: 2500, targetMl: 2500 },
    ],
    skinScore: 75,
    bodyScore: 60,
    postureScore: 70,
    skinRoutineDays: 5,
    currentStreak: 7,
    ...overrides,
  };
}

// ============================================================
// 테스트
// ============================================================

describe('convertToWellnessInput', () => {
  it('운동 세션의 총 시간과 일수를 계산한다', () => {
    const data = createMockDataInput();
    const input = convertToWellnessInput(data);

    // 45 + 60 + 30 = 135분
    expect(input.weeklyWorkoutMinutes).toBe(135);
    // 3개 다른 날짜
    expect(input.weeklyWorkoutDays).toBe(3);
  });

  it('식사 기록이 없으면 기본값 0.5를 반환한다', () => {
    const data = createMockDataInput({ mealRecords: [] });
    const input = convertToWellnessInput(data);

    expect(input.avgCalorieAccuracy).toBe(0.5);
    expect(input.avgMacroBalance).toBe(0.5);
  });

  it('수분 섭취가 없으면 기본값 0.5를 반환한다', () => {
    const data = createMockDataInput({ waterIntake: [] });
    const input = convertToWellnessInput(data);

    expect(input.waterIntakeRatio).toBe(0.5);
  });

  it('피부 루틴 일관성을 7일 기준 비율로 계산한다', () => {
    const data = createMockDataInput({ skinRoutineDays: 5 });
    const input = convertToWellnessInput(data);

    expect(input.skinRoutineConsistency).toBeCloseTo(5 / 7, 5);
  });

  it('분석 점수와 스트릭을 그대로 전달한다', () => {
    const data = createMockDataInput({ skinScore: 80, bodyScore: null, postureScore: 65, currentStreak: 14 });
    const input = convertToWellnessInput(data);

    expect(input.skinScore).toBe(80);
    expect(input.bodyScore).toBeNull();
    expect(input.postureScore).toBe(65);
    expect(input.currentStreak).toBe(14);
  });
});

describe('calculateWellnessFromData', () => {
  it('종합 웰니스 점수와 등급을 반환한다', () => {
    const data = createMockDataInput();
    const result = calculateWellnessFromData(data);

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.breakdown).toHaveProperty('workout');
    expect(result.breakdown).toHaveProperty('nutrition');
    expect(result.breakdown).toHaveProperty('skin');
    expect(result.breakdown).toHaveProperty('body');
  });

  it('스트릭 보너스가 포함된다', () => {
    const data = createMockDataInput({ currentStreak: 30 });
    const result = calculateWellnessFromData(data);

    expect(result.streakBonus).toBe(15);
  });

  it('데이터가 비어있으면 낮은 점수를 반환한다', () => {
    const data = createMockDataInput({
      workoutSessions: [],
      mealRecords: [],
      waterIntake: [],
      skinScore: null,
      bodyScore: null,
      postureScore: null,
      skinRoutineDays: 0,
      currentStreak: 0,
    });
    const result = calculateWellnessFromData(data);

    // 분석 미완료 시 중간값이 적용되므로 0은 아님
    expect(result.total).toBeLessThan(50);
  });
});

describe('generateWeeklySummary', () => {
  it('빈 배열이면 기본 요약을 반환한다', () => {
    const summary = generateWeeklySummary([], null);

    expect(summary.averageScore).toBe(0);
    expect(summary.trend).toBe('stable');
    expect(summary.improvements).toEqual([]);
  });

  it('일별 점수에서 평균, 최고, 최저를 계산한다', () => {
    const dailyScores = [
      { date: '2026-03-01', score: 60 },
      { date: '2026-03-02', score: 80 },
      { date: '2026-03-03', score: 70 },
    ];
    const summary = generateWeeklySummary(dailyScores, null);

    expect(summary.averageScore).toBe(70);
    expect(summary.bestDay.score).toBe(80);
    expect(summary.worstDay.score).toBe(60);
    expect(summary.weekStart).toBe('2026-03-01');
    expect(summary.weekEnd).toBe('2026-03-03');
  });

  it('이전 주 대비 상승 트렌드를 감지한다', () => {
    const dailyScores = [
      { date: '2026-03-01', score: 80 },
      { date: '2026-03-02', score: 85 },
    ];
    // 평균 82.5, 이전 주 70 → diff > 3 → up
    const summary = generateWeeklySummary(dailyScores, 70);

    expect(summary.trend).toBe('up');
  });

  it('높은 평균 점수에 우수 메시지가 포함된다', () => {
    const dailyScores = [
      { date: '2026-03-01', score: 85 },
      { date: '2026-03-02', score: 90 },
    ];
    const summary = generateWeeklySummary(dailyScores, null);

    expect(summary.improvements).toContain('전체적으로 우수한 웰니스 상태입니다');
  });
});
