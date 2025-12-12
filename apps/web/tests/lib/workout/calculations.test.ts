/**
 * W-1 무게/횟수 계산 로직 테스트 (Task 3.8)
 */
import { describe, it, expect } from 'vitest';
import {
  estimate1RM,
  estimate1RMBrzycki,
  calculateTrainingWeightFrom1RM,
  generateSetSchemeFrom1RM,
  checkPRAchievement,
  calculateRecommendedWeight,
  calculateProgressiveOverload,
  getRecommendedRepsAndSets,
  roundToNearest,
  calculateTotalVolume,
  calculateVolumeChange,
  mapGoalToTrainingGoal,
} from '@/lib/workout/calculations';

describe('estimate1RM (Epley 공식)', () => {
  it('1회 반복은 그대로 반환', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('10회 반복으로 1RM 추정', () => {
    // 50kg x 10회 → 1RM = 50 × (1 + 10/30) = 50 × 1.333 = 66.7kg
    const result = estimate1RM(50, 10);
    expect(result).toBeCloseTo(66.7, 1);
  });

  it('5회 반복으로 1RM 추정', () => {
    // 80kg x 5회 → 1RM = 80 × (1 + 5/30) = 80 × 1.167 = 93.3kg
    const result = estimate1RM(80, 5);
    expect(result).toBeCloseTo(93.3, 1);
  });

  it('무게가 0이면 0 반환', () => {
    expect(estimate1RM(0, 10)).toBe(0);
  });

  it('횟수가 0이면 0 반환', () => {
    expect(estimate1RM(50, 0)).toBe(0);
  });

  it('음수 무게는 0 반환', () => {
    expect(estimate1RM(-10, 5)).toBe(0);
  });
});

describe('estimate1RMBrzycki (Brzycki 공식)', () => {
  it('1회 반복은 그대로 반환', () => {
    expect(estimate1RMBrzycki(100, 1)).toBe(100);
  });

  it('10회 반복으로 1RM 추정', () => {
    // 50kg x 10회 → 1RM = 50 × (36 / (37-10)) = 50 × 1.333 = 66.7kg
    const result = estimate1RMBrzycki(50, 10);
    expect(result).toBeCloseTo(66.7, 1);
  });

  it('37회 이상은 상한값 반환', () => {
    const result = estimate1RMBrzycki(50, 40);
    expect(result).toBe(100); // weight * 2
  });
});

describe('mapGoalToTrainingGoal', () => {
  it('muscle → strength', () => {
    expect(mapGoalToTrainingGoal('muscle')).toBe('strength');
  });

  it('toning → hypertrophy', () => {
    expect(mapGoalToTrainingGoal('toning')).toBe('hypertrophy');
  });

  it('diet → endurance', () => {
    expect(mapGoalToTrainingGoal('diet')).toBe('endurance');
  });

  it('알 수 없는 목표 → hypertrophy (기본값)', () => {
    expect(mapGoalToTrainingGoal('unknown')).toBe('hypertrophy');
  });
});

describe('calculateTrainingWeightFrom1RM', () => {
  it('1RM 100kg, 근비대 목표, 10회 → 75kg', () => {
    // 100kg × 0.75 = 75kg
    const result = calculateTrainingWeightFrom1RM(100, 'toning', 10);
    expect(result).toBe(75);
  });

  it('1RM 100kg, 근력 목표, 5회 → 87.5kg → 반올림 87.5kg', () => {
    // 100kg × 0.87 = 87kg → 2.5 단위로 반올림
    const result = calculateTrainingWeightFrom1RM(100, 'strength', 5);
    expect(result).toBe(87.5);
  });

  it('1RM 100kg, 지구력 목표, 15회 → 65kg', () => {
    // 100kg × 0.65 = 65kg
    const result = calculateTrainingWeightFrom1RM(100, 'diet', 15);
    expect(result).toBe(65);
  });

  it('목표 횟수가 정확히 매칭되지 않으면 보간 사용', () => {
    // 7회 → 0.83 비율 사용 (근력 범위)
    const result = calculateTrainingWeightFrom1RM(100, 'strength', 7);
    expect(result).toBeGreaterThan(0);
  });

  it('1RM이 0이면 0 반환', () => {
    expect(calculateTrainingWeightFrom1RM(0, 'toning', 10)).toBe(0);
  });

  it('결과는 2.5kg 단위로 반올림', () => {
    // 불규칙한 1RM도 2.5kg 단위로
    const result = calculateTrainingWeightFrom1RM(67, 'toning', 10);
    expect(result % 2.5).toBe(0);
  });
});

describe('generateSetSchemeFrom1RM', () => {
  it('근비대 목표 세트 구성 생성', () => {
    const scheme = generateSetSchemeFrom1RM(100, 'toning');

    expect(scheme).toHaveLength(5);
    expect(scheme[0].label).toBe('웜업');
    expect(scheme[0].reps).toBe(10);
    expect(scheme[0].percentage).toBe(0.6);
    expect(scheme[0].weight).toBe(60); // 100 × 0.6 = 60kg
  });

  it('근력 목표 세트 구성 생성', () => {
    const scheme = generateSetSchemeFrom1RM(100, 'strength');

    expect(scheme).toHaveLength(5);
    expect(scheme[0].reps).toBe(5); // 웜업 5회
    expect(scheme[2].label).toBe('탑세트');
    expect(scheme[2].reps).toBe(3); // 탑세트 3회
  });

  it('지구력 목표 세트 구성 생성', () => {
    const scheme = generateSetSchemeFrom1RM(100, 'diet');

    expect(scheme).toHaveLength(4);
    expect(scheme[scheme.length - 1].reps).toBe(20); // 마무리 20회
  });

  it('세트 번호가 순차적으로 증가', () => {
    const scheme = generateSetSchemeFrom1RM(100, 'toning');

    scheme.forEach((set, index) => {
      expect(set.setNumber).toBe(index + 1);
    });
  });

  it('1RM이 0이면 빈 배열 반환', () => {
    expect(generateSetSchemeFrom1RM(0, 'toning')).toEqual([]);
  });
});

describe('checkPRAchievement', () => {
  it('기존 기록 없으면 PR 달성', () => {
    const result = checkPRAchievement('squat', 50, 10, {});

    expect(result.isPR).toBe(true);
    expect(result.previous1RM).toBe(0);
    expect(result.new1RM).toBeCloseTo(66.7, 1);
  });

  it('기존 기록보다 높으면 PR 달성', () => {
    const previousRecords = {
      squat: [{ weight: 50, reps: 10 }], // 1RM ≈ 66.7kg
    };

    // 새 기록: 60kg x 10회 → 1RM ≈ 80kg
    const result = checkPRAchievement('squat', 60, 10, previousRecords);

    expect(result.isPR).toBe(true);
    expect(result.improvement).toBeGreaterThan(10);
    expect(result.message).toContain('PR 달성');
  });

  it('기존 기록보다 낮으면 PR 아님', () => {
    const previousRecords = {
      squat: [{ weight: 60, reps: 10 }], // 1RM ≈ 80kg
    };

    // 새 기록: 50kg x 10회 → 1RM ≈ 66.7kg
    const result = checkPRAchievement('squat', 50, 10, previousRecords);

    expect(result.isPR).toBe(false);
  });

  it('여러 기존 기록 중 최고 기록과 비교', () => {
    const previousRecords = {
      squat: [
        { weight: 40, reps: 10 }, // 1RM ≈ 53.3kg
        { weight: 60, reps: 10 }, // 1RM ≈ 80kg (최고)
        { weight: 50, reps: 10 }, // 1RM ≈ 66.7kg
      ],
    };

    // 80kg보다 높아야 PR
    const result1 = checkPRAchievement('squat', 70, 10, previousRecords); // 1RM ≈ 93.3kg
    expect(result1.isPR).toBe(true);

    const result2 = checkPRAchievement('squat', 55, 10, previousRecords); // 1RM ≈ 73.3kg
    expect(result2.isPR).toBe(false);
  });
});

describe('calculateRecommendedWeight', () => {
  it('초보자 상체 운동 무게 추천', () => {
    // 60kg × 0.08 × 1.0 = 4.8kg → 5kg
    const result = calculateRecommendedWeight(60, 'upper', 'beginner', 'toning');

    expect(result.recommendedWeight).toBe(5);
    expect(result.unit).toBe('kg');
  });

  it('중급자 하체 운동 무게 추천', () => {
    // 60kg × 0.25 × 1.0 = 15kg
    const result = calculateRecommendedWeight(60, 'lower', 'intermediate', 'toning');

    expect(result.recommendedWeight).toBe(15);
  });

  it('고급자 하체 + 근력 목표 무게 추천', () => {
    // 60kg × 0.40 × 1.2 = 28.8kg → 30kg
    const result = calculateRecommendedWeight(60, 'lower', 'advanced', 'muscle');

    expect(result.recommendedWeight).toBe(30);
  });

  it('최소/최대 범위 포함', () => {
    const result = calculateRecommendedWeight(60, 'lower', 'intermediate', 'toning');

    expect(result.minWeight).toBeLessThanOrEqual(result.recommendedWeight);
    expect(result.maxWeight).toBeGreaterThanOrEqual(result.recommendedWeight);
    expect(result.minWeight).toBeGreaterThanOrEqual(2.5); // 최소 2.5kg
  });

  it('체중이 0이면 0 반환', () => {
    const result = calculateRecommendedWeight(0, 'lower', 'beginner', 'toning');

    expect(result.recommendedWeight).toBe(0);
  });

  it('core 카테고리는 lower_body로 분류', () => {
    const lowerResult = calculateRecommendedWeight(60, 'lower', 'beginner', 'toning');
    const coreResult = calculateRecommendedWeight(60, 'core', 'beginner', 'toning');

    expect(coreResult.recommendedWeight).toBe(lowerResult.recommendedWeight);
  });
});

describe('calculateProgressiveOverload', () => {
  it('1주차: 2.5% 증가', () => {
    // 100kg × 1.025 = 102.5kg
    const result = calculateProgressiveOverload(100, 1);
    expect(result).toBe(102.5);
  });

  it('2주차: 5% 증가', () => {
    // 100kg × 1.05 = 105kg
    const result = calculateProgressiveOverload(100, 2);
    expect(result).toBe(105);
  });

  it('4주 이상: 최대 10% 증가', () => {
    // 100kg × 1.10 = 110kg
    const result4 = calculateProgressiveOverload(100, 4);
    const result5 = calculateProgressiveOverload(100, 5);
    const result10 = calculateProgressiveOverload(100, 10);

    expect(result4).toBe(110);
    expect(result5).toBe(110);
    expect(result10).toBe(110);
  });

  it('결과는 2.5kg 단위로 반올림', () => {
    const result = calculateProgressiveOverload(67, 1);
    expect(result % 2.5).toBe(0);
  });

  it('무게가 0이면 0 반환', () => {
    expect(calculateProgressiveOverload(0, 2)).toBe(0);
  });

  it('주차가 0이면 현재 무게 반환', () => {
    expect(calculateProgressiveOverload(100, 0)).toBe(100);
  });
});

describe('getRecommendedRepsAndSets', () => {
  it('근력 목표 추천', () => {
    const result = getRecommendedRepsAndSets('strength', 'intermediate');

    expect(result.reps).toBe(5);
    expect(result.sets).toBe(4);
    expect(result.restSeconds).toBe(180);
  });

  it('근비대 목표 추천', () => {
    const result = getRecommendedRepsAndSets('toning', 'intermediate');

    expect(result.reps).toBe(10);
    expect(result.restSeconds).toBe(90);
  });

  it('지구력 목표 추천', () => {
    const result = getRecommendedRepsAndSets('diet', 'intermediate');

    expect(result.reps).toBe(15);
    expect(result.restSeconds).toBe(60);
  });

  it('레벨별 세트 수 조정', () => {
    const beginner = getRecommendedRepsAndSets('toning', 'beginner');
    const intermediate = getRecommendedRepsAndSets('toning', 'intermediate');
    const advanced = getRecommendedRepsAndSets('toning', 'advanced');

    expect(beginner.sets).toBe(3);
    expect(intermediate.sets).toBe(4);
    expect(advanced.sets).toBe(5);
  });
});

describe('유틸리티 함수', () => {
  describe('roundToNearest', () => {
    it('2.5 단위로 반올림', () => {
      expect(roundToNearest(10.1, 2.5)).toBe(10);
      expect(roundToNearest(11.3, 2.5)).toBe(12.5);
      expect(roundToNearest(13.7, 2.5)).toBe(12.5);
      expect(roundToNearest(14.0, 2.5)).toBe(15);
    });

    it('5 단위로 반올림', () => {
      expect(roundToNearest(12, 5)).toBe(10);
      expect(roundToNearest(13, 5)).toBe(15);
    });
  });

  describe('calculateTotalVolume', () => {
    it('볼륨 계산: sets × reps × weight', () => {
      expect(calculateTotalVolume(4, 10, 50)).toBe(2000);
      expect(calculateTotalVolume(3, 8, 60)).toBe(1440);
    });
  });

  describe('calculateVolumeChange', () => {
    it('볼륨 증가율 계산', () => {
      // 1000 → 1200 = 20% 증가
      expect(calculateVolumeChange(1200, 1000)).toBe(0.2);
    });

    it('볼륨 감소율 계산', () => {
      // 1000 → 800 = -20%
      expect(calculateVolumeChange(800, 1000)).toBe(-0.2);
    });

    it('이전 볼륨이 0이면 0 반환', () => {
      expect(calculateVolumeChange(1000, 0)).toBe(0);
    });
  });
});
