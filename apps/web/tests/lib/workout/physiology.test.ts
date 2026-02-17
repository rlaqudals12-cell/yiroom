/**
 * W-1 운동생리학 함수 테스트
 * 원리 문서: docs/principles/exercise-physiology.md
 */
import { describe, it, expect } from 'vitest';
import {
  calculateMaxHR,
  calculateTargetHRZone,
  calculateWorkVolume,
  calculateWeeklyVolume,
  calculateVolumeChangeRate,
  estimateRPE,
  suggestProgressiveOverload,
  getWorkoutTypeParams,
  getIntensityLevel,
  roundToNearest,
  WORKOUT_TYPE_PARAMS,
} from '@/lib/workout/physiology';

describe('calculateMaxHR (Tanaka 공식)', () => {
  it('30세의 최대 심박수를 계산한다', () => {
    expect(calculateMaxHR(30)).toBe(187);
  });

  it('20세의 최대 심박수를 계산한다', () => {
    expect(calculateMaxHR(20)).toBe(194);
  });

  it('50세의 최대 심박수를 계산한다', () => {
    expect(calculateMaxHR(50)).toBe(173);
  });
});

describe('calculateTargetHRZone (Karvonen 공식)', () => {
  it('30세, 안정 심박수 60, 70% 강도의 목표 심박수를 계산한다', () => {
    expect(calculateTargetHRZone(30, 60, 70)).toBe(149);
  });

  it('40세, 안정 심박수 65, 80% 강도의 목표 심박수를 계산한다', () => {
    expect(calculateTargetHRZone(40, 65, 80)).toBe(157);
  });
});

describe('calculateWorkVolume', () => {
  it('세트 x 반복 x 무게를 계산한다', () => {
    expect(calculateWorkVolume(3, 10, 50)).toBe(1500);
    expect(calculateWorkVolume(4, 8, 60)).toBe(1920);
    expect(calculateWorkVolume(5, 5, 100)).toBe(2500);
  });
});

describe('calculateWeeklyVolume', () => {
  it('주간 운동 볼륨의 총 합계를 계산한다', () => {
    const records = [
      { sets: 3, reps: 10, weight: 50 },
      { sets: 4, reps: 8, weight: 60 },
      { sets: 3, reps: 12, weight: 40 },
    ];
    expect(calculateWeeklyVolume(records)).toBe(4860);
  });

  it('빈 배열은 0을 반환한다', () => {
    expect(calculateWeeklyVolume([])).toBe(0);
  });
});

describe('calculateVolumeChangeRate', () => {
  it('양의 변화율을 계산한다', () => {
    expect(calculateVolumeChangeRate(1100, 1000)).toBe(10);
    expect(calculateVolumeChangeRate(1200, 1000)).toBe(20);
  });

  it('음의 변화율을 계산한다', () => {
    expect(calculateVolumeChangeRate(900, 1000)).toBe(-10);
  });

  it('이전 볼륨이 0이면 0을 반환한다', () => {
    expect(calculateVolumeChangeRate(1000, 0)).toBe(0);
  });
});

describe('estimateRPE', () => {
  it('Zone 1 (50-60% HRmax)에서 RPE 1-2를 반환한다', () => {
    const result = estimateRPE(95, 180);
    expect(result.zone).toBe(1);
    expect(result.rpe).toBeGreaterThanOrEqual(1);
    expect(result.rpe).toBeLessThanOrEqual(2);
    expect(result.intensity).toBe('very_light');
  });

  it('Zone 4 (80-90% HRmax)에서 RPE 7-8을 반환한다', () => {
    const result = estimateRPE(153, 180);
    expect(result.zone).toBe(4);
    expect(result.rpe).toBeGreaterThanOrEqual(7);
    expect(result.rpe).toBeLessThanOrEqual(8);
    expect(result.intensity).toBe('vigorous');
  });

  it('최대 심박수 초과 시 RPE 10을 반환한다', () => {
    const result = estimateRPE(200, 180);
    expect(result.rpe).toBe(10);
    expect(result.zone).toBe(5);
  });
});

describe('suggestProgressiveOverload', () => {
  it('이력이 부족하면 현재 수준 유지를 제안한다', () => {
    const history = {
      exerciseId: 'squat',
      records: [{ date: '2026-01-15', sets: 3, reps: 10, weight: 60 }],
    };
    const result = suggestProgressiveOverload(history);
    expect(result.reason).toContain('이력');
  });

  it('RPE가 낮으면 강도 증가를 제안한다', () => {
    const history = {
      exerciseId: 'squat',
      records: [
        { date: '2026-01-15', sets: 4, reps: 10, weight: 60, rpe: 5 },
        { date: '2026-01-14', sets: 4, reps: 10, weight: 60, rpe: 5 },
        { date: '2026-01-13', sets: 4, reps: 10, weight: 60, rpe: 5 },
      ],
    };
    const result = suggestProgressiveOverload(history, { workoutType: 'builder' });
    expect(result.reason).toContain('RPE');
  });
});

describe('getWorkoutTypeParams', () => {
  it('5-Type 파라미터를 올바르게 반환한다', () => {
    const toner = getWorkoutTypeParams('toner');
    expect(toner.repRange).toEqual([12, 20]);
    expect(toner.restSeconds).toBe(45);

    const builder = getWorkoutTypeParams('builder');
    expect(builder.repRange).toEqual([6, 12]);
    expect(builder.restSeconds).toBe(90);
  });
});

describe('getIntensityLevel', () => {
  it('MET 값에 따라 강도 수준을 반환한다', () => {
    expect(getIntensityLevel(2.0)).toBe('low');
    expect(getIntensityLevel(4.0)).toBe('moderate');
    expect(getIntensityLevel(7.0)).toBe('high');
    expect(getIntensityLevel(10.0)).toBe('very_high');
  });
});

describe('roundToNearest', () => {
  it('지정된 단위로 반올림한다', () => {
    expect(roundToNearest(52.3, 2.5)).toBe(52.5);
    expect(roundToNearest(53.8, 2.5)).toBe(55);
    expect(roundToNearest(67, 5)).toBe(65);
    expect(roundToNearest(68, 5)).toBe(70);
  });
});

describe('WORKOUT_TYPE_PARAMS', () => {
  it('모든 5-Type이 정의되어 있다', () => {
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('toner');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('builder');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('burner');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('mover');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('flexer');
  });

  it('ADR-031 파라미터와 일치한다', () => {
    const builder = WORKOUT_TYPE_PARAMS.builder;
    expect(builder.repRange).toEqual([6, 12]);
    expect(builder.sets).toEqual([4, 5]);
    expect(builder.restSeconds).toBe(90);
  });
});
