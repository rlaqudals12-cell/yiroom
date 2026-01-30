/**
 * W-1 ������� �Լ� �׽�Ʈ
 * ���� ����: docs/principles/exercise-physiology.md
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

describe('calculateMaxHR (Tanaka ����)', () => {
  it('30���� �ִ� �ɹڼ��� ����Ѵ�', () => {
    expect(calculateMaxHR(30)).toBe(187);
  });

  it('20���� �ִ� �ɹڼ��� ����Ѵ�', () => {
    expect(calculateMaxHR(20)).toBe(194);
  });

  it('50���� �ִ� �ɹڼ��� ����Ѵ�', () => {
    expect(calculateMaxHR(50)).toBe(173);
  });
});

describe('calculateTargetHRZone (Karvonen ����)', () => {
  it('30��, ���� �ɹڼ� 60, 70% ������ ��ǥ �ɹڼ��� ����Ѵ�', () => {
    expect(calculateTargetHRZone(30, 60, 70)).toBe(149);
  });

  it('40��, ���� �ɹڼ� 65, 80% ������ ��ǥ �ɹڼ��� ����Ѵ�', () => {
    expect(calculateTargetHRZone(40, 65, 80)).toBe(157);
  });
});

describe('calculateWorkVolume', () => {
  it('��Ʈ x �ݺ� x ���Ը� ����Ѵ�', () => {
    expect(calculateWorkVolume(3, 10, 50)).toBe(1500);
    expect(calculateWorkVolume(4, 8, 60)).toBe(1920);
    expect(calculateWorkVolume(5, 5, 100)).toBe(2500);
  });
});

describe('calculateWeeklyVolume', () => {
  it('�ְ� � ����� �� ������ ����Ѵ�', () => {
    const records = [
      { sets: 3, reps: 10, weight: 50 },
      { sets: 4, reps: 8, weight: 60 },
      { sets: 3, reps: 12, weight: 40 },
    ];
    expect(calculateWeeklyVolume(records)).toBe(4860);
  });

  it('�� �迭�� 0�� ��ȯ�Ѵ�', () => {
    expect(calculateWeeklyVolume([])).toBe(0);
  });
});

describe('calculateVolumeChangeRate', () => {
  it('���� �������� ����Ѵ�', () => {
    expect(calculateVolumeChangeRate(1100, 1000)).toBe(10);
    expect(calculateVolumeChangeRate(1200, 1000)).toBe(20);
  });

  it('���� �������� ����Ѵ�', () => {
    expect(calculateVolumeChangeRate(900, 1000)).toBe(-10);
  });

  it('���� ������ 0�̸� 0�� ��ȯ�Ѵ�', () => {
    expect(calculateVolumeChangeRate(1000, 0)).toBe(0);
  });
});

describe('estimateRPE', () => {
  it('Zone 1 (50-60% HRmax)���� RPE 1-2�� ��ȯ�Ѵ�', () => {
    const result = estimateRPE(95, 180);
    expect(result.zone).toBe(1);
    expect(result.rpe).toBeGreaterThanOrEqual(1);
    expect(result.rpe).toBeLessThanOrEqual(2);
    expect(result.intensity).toBe('very_light');
  });

  it('Zone 4 (80-90% HRmax)���� RPE 7-8�� ��ȯ�Ѵ�', () => {
    const result = estimateRPE(153, 180);
    expect(result.zone).toBe(4);
    expect(result.rpe).toBeGreaterThanOrEqual(7);
    expect(result.rpe).toBeLessThanOrEqual(8);
    expect(result.intensity).toBe('vigorous');
  });

  it('�ִ� �ɹڼ� �ʰ� �� RPE 10�� ��ȯ�Ѵ�', () => {
    const result = estimateRPE(200, 180);
    expect(result.rpe).toBe(10);
    expect(result.zone).toBe(5);
  });
});

describe('suggestProgressiveOverload', () => {
  it('�̷��� �����ϸ� ���� ���� ������ �����Ѵ�', () => {
    const history = {
      exerciseId: 'squat',
      records: [{ date: '2026-01-15', sets: 3, reps: 10, weight: 60 }],
    };
    const result = suggestProgressiveOverload(history);
    expect(result.reason).toContain('�̷�');
  });

  it('RPE�� ������ ���� ������ �����Ѵ�', () => {
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
  it('5-Type �Ķ���͸� �ùٸ��� ��ȯ�Ѵ�', () => {
    const toner = getWorkoutTypeParams('toner');
    expect(toner.repRange).toEqual([12, 20]);
    expect(toner.restSeconds).toBe(45);

    const builder = getWorkoutTypeParams('builder');
    expect(builder.repRange).toEqual([6, 12]);
    expect(builder.restSeconds).toBe(90);
  });
});

describe('getIntensityLevel', () => {
  it('MET ���� ���� ���� ������ ��ȯ�Ѵ�', () => {
    expect(getIntensityLevel(2.0)).toBe('low');
    expect(getIntensityLevel(4.0)).toBe('moderate');
    expect(getIntensityLevel(7.0)).toBe('high');
    expect(getIntensityLevel(10.0)).toBe('very_high');
  });
});

describe('roundToNearest', () => {
  it('������ ������ �ݿø��Ѵ�', () => {
    expect(roundToNearest(52.3, 2.5)).toBe(52.5);
    expect(roundToNearest(53.8, 2.5)).toBe(55);
    expect(roundToNearest(67, 5)).toBe(65);
    expect(roundToNearest(68, 5)).toBe(70);
  });
});

describe('WORKOUT_TYPE_PARAMS', () => {
  it('��� 5-Type�� ���ǵǾ� �ִ�', () => {
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('toner');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('builder');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('burner');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('mover');
    expect(WORKOUT_TYPE_PARAMS).toHaveProperty('flexer');
  });

  it('ADR-031 �Ķ���Ϳ� ��ġ�Ѵ�', () => {
    const builder = WORKOUT_TYPE_PARAMS.builder;
    expect(builder.repRange).toEqual([6, 12]);
    expect(builder.sets).toEqual([4, 5]);
    expect(builder.restSeconds).toBe(90);
  });
});
