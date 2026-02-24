/**
 * useWellnessScore 훅 순수 로직 테스트
 *
 * 대상: hooks/useWellnessScore.ts
 * 검증: 점수 계산, 레벨 결정, 업적 잠금/해제
 */
import { renderHook } from '@testing-library/react-native';

import {
  useWellnessScore,
  calcAnalysisScore,
  calcWorkoutScore,
  calcNutritionScore,
  calcLevel,
} from '../../hooks/useWellnessScore';

// --- calcAnalysisScore ---
describe('calcAnalysisScore', () => {
  it('분석 0개 → 0점', () => {
    expect(calcAnalysisScore(null, null, null)).toBe(0);
  });

  it('분석 1개 → 40점', () => {
    const pc = { season: 'spring' } as any;
    expect(calcAnalysisScore(pc, null, null)).toBe(40);
  });

  it('분석 2개 → 70점', () => {
    const pc = { season: 'spring' } as any;
    const skin = { skinType: 'oily' } as any;
    expect(calcAnalysisScore(pc, skin, null)).toBe(70);
  });

  it('분석 3개 → 100점', () => {
    const pc = { season: 'spring' } as any;
    const skin = { skinType: 'oily' } as any;
    const body = { bodyType: 'rectangle' } as any;
    expect(calcAnalysisScore(pc, skin, body)).toBe(100);
  });
});

// --- calcWorkoutScore ---
describe('calcWorkoutScore', () => {
  it('null → 0점', () => {
    expect(calcWorkoutScore(null)).toBe(0);
  });

  it('streak 0 → 0점', () => {
    expect(calcWorkoutScore({ currentStreak: 0, longestStreak: 0 } as any)).toBe(0);
  });

  it('streak 1 → 30점', () => {
    expect(calcWorkoutScore({ currentStreak: 1, longestStreak: 1 } as any)).toBe(30);
  });

  it('streak 3 → 55점', () => {
    expect(calcWorkoutScore({ currentStreak: 3, longestStreak: 3 } as any)).toBe(55);
  });

  it('streak 7 → 72점', () => {
    expect(calcWorkoutScore({ currentStreak: 7, longestStreak: 7 } as any)).toBe(72);
  });

  it('streak 14 → 86점', () => {
    expect(calcWorkoutScore({ currentStreak: 14, longestStreak: 14 } as any)).toBe(86);
  });

  it('streak 30 → 최대 100점', () => {
    const score = calcWorkoutScore({ currentStreak: 30, longestStreak: 30 } as any);
    expect(score).toBeGreaterThanOrEqual(86);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// --- calcNutritionScore ---
describe('calcNutritionScore', () => {
  it('null → 0점', () => {
    expect(calcNutritionScore(null)).toBe(0);
  });

  it('streak 5 → 65점', () => {
    expect(calcNutritionScore({ currentStreak: 5, longestStreak: 5 } as any)).toBe(65);
  });
});

// --- calcLevel ---
describe('calcLevel', () => {
  it('0점 → 레벨 1 시작', () => {
    const level = calcLevel(0);
    expect(level.level).toBe(1);
    expect(level.title).toBe('시작');
  });

  it('20점 → 레벨 2 초보 탐험가', () => {
    const level = calcLevel(20);
    expect(level.level).toBe(2);
    expect(level.title).toBe('초보 탐험가');
  });

  it('40점 → 레벨 3 성장하는 나', () => {
    const level = calcLevel(40);
    expect(level.level).toBe(3);
    expect(level.title).toBe('성장하는 나');
  });

  it('60점 → 레벨 4 꾸준한 관리자', () => {
    const level = calcLevel(60);
    expect(level.level).toBe(4);
    expect(level.title).toBe('꾸준한 관리자');
  });

  it('80점 → 레벨 5 웰니스 달인', () => {
    const level = calcLevel(80);
    expect(level.level).toBe(5);
    expect(level.title).toBe('웰니스 달인');
  });

  it('95점 → 레벨 6 완벽한 균형', () => {
    const level = calcLevel(95);
    expect(level.level).toBe(6);
    expect(level.title).toBe('완벽한 균형');
  });

  it('19점 → 레벨 1 (경계값)', () => {
    const level = calcLevel(19);
    expect(level.level).toBe(1);
  });

  it('xp, nextLevelXp가 존재해야 한다', () => {
    const level = calcLevel(50);
    expect(level.xp).toBe(50);
    expect(level.nextLevelXp).toBeGreaterThan(0);
  });
});

// --- useWellnessScore (통합) ---
describe('useWellnessScore', () => {
  it('전부 null → score 0, level 1', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: null,
        skinAnalysis: null,
        bodyAnalysis: null,
        workoutStreak: null,
        nutritionStreak: null,
      })
    );

    expect(result.current.score).toBe(0);
    expect(result.current.level.level).toBe(1);
    expect(result.current.breakdown.analysis).toBe(0);
    expect(result.current.breakdown.workout).toBe(0);
    expect(result.current.breakdown.nutrition).toBe(0);
  });

  it('분석 3개 + streak 7 → 높은 점수', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: { season: 'spring' } as any,
        skinAnalysis: { skinType: 'oily' } as any,
        bodyAnalysis: { bodyType: 'rectangle' } as any,
        workoutStreak: { currentStreak: 7, longestStreak: 7 } as any,
        nutritionStreak: { currentStreak: 7, longestStreak: 7 } as any,
      })
    );

    expect(result.current.score).toBeGreaterThan(60);
    expect(result.current.level.level).toBeGreaterThanOrEqual(4);
    expect(result.current.breakdown.analysis).toBe(100);
  });

  it('업적 12개가 반환되어야 한다', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: null,
        skinAnalysis: null,
        bodyAnalysis: null,
        workoutStreak: null,
        nutritionStreak: null,
      })
    );

    expect(result.current.achievements).toHaveLength(12);
  });

  it('퍼스널 컬러 완료 → color-master 업적 해제', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: { season: 'autumn' } as any,
        skinAnalysis: null,
        bodyAnalysis: null,
        workoutStreak: null,
        nutritionStreak: null,
      })
    );

    const colorMaster = result.current.achievements.find((a) => a.id === 'color-master');
    expect(colorMaster?.unlocked).toBe(true);

    const firstAnalysis = result.current.achievements.find((a) => a.id === 'first-analysis');
    expect(firstAnalysis?.unlocked).toBe(true);
  });

  it('3가지 분석 완료 → all-analyzed 업적 해제', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: { season: 'spring' } as any,
        skinAnalysis: { skinType: 'oily' } as any,
        bodyAnalysis: { bodyType: 'rectangle' } as any,
        workoutStreak: null,
        nutritionStreak: null,
      })
    );

    const allAnalyzed = result.current.achievements.find((a) => a.id === 'all-analyzed');
    expect(allAnalyzed?.unlocked).toBe(true);
  });

  it('운동 3일 연속 → workout-3 업적 해제', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: null,
        skinAnalysis: null,
        bodyAnalysis: null,
        workoutStreak: { currentStreak: 3, longestStreak: 3 } as any,
        nutritionStreak: null,
      })
    );

    const w3 = result.current.achievements.find((a) => a.id === 'workout-3');
    expect(w3?.unlocked).toBe(true);
  });

  it('wellness-50 업적은 점수 50+ 시 해제', () => {
    const { result } = renderHook(() =>
      useWellnessScore({
        personalColor: { season: 'spring' } as any,
        skinAnalysis: { skinType: 'oily' } as any,
        bodyAnalysis: { bodyType: 'rectangle' } as any,
        workoutStreak: { currentStreak: 7, longestStreak: 7 } as any,
        nutritionStreak: { currentStreak: 7, longestStreak: 7 } as any,
      })
    );

    const w50 = result.current.achievements.find((a) => a.id === 'wellness-50');
    expect(w50?.unlocked).toBe(true);
  });
});
