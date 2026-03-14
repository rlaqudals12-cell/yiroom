import { describe, it, expect } from 'vitest';
import {
  calculateBiorhythm,
  applyBiorhythmModifier,
  getCyclePhase,
  getCyclePhaseInfo,
} from '@/lib/wellness/biorhythm';
import { calculateWellnessScoreWithBiorhythm } from '@/lib/wellness/calculator';
import type { BiorhythmInput } from '@/types/wellness';

// 기본 입력 헬퍼
function createInput(overrides: Partial<BiorhythmInput> = {}): BiorhythmInput {
  return {
    sleepHours: 7,
    sleepQuality: 3,
    stressLevel: 5,
    energyLevel: 3,
    moodScore: 3,
    ...overrides,
  };
}

describe('바이오리듬 계산기', () => {
  // ============================================================
  // 수면 시간 점수 (0-12)
  // ============================================================
  describe('수면 시간 점수', () => {
    it('7-9시간 최적 수면이면 최대 수면 시간 점수', () => {
      const result = calculateBiorhythm(createInput({ sleepHours: 8 }));
      // 수면 시간 12 + 질 5 + 일관성 6 = 23 → clamped 23
      expect(result.breakdown.sleep).toBeGreaterThanOrEqual(20);
    });

    it('6시간이면 수면 시간 점수 감소', () => {
      const r7 = calculateBiorhythm(createInput({ sleepHours: 7 }));
      const r6 = calculateBiorhythm(createInput({ sleepHours: 6 }));
      expect(r6.breakdown.sleep).toBeLessThan(r7.breakdown.sleep);
    });

    it('4시간 이하면 최저 수면 시간 점수', () => {
      const result = calculateBiorhythm(createInput({ sleepHours: 3 }));
      // 수면 시간 0 + 질 5 + 일관성 6 = 11
      expect(result.breakdown.sleep).toBeLessThanOrEqual(15);
    });

    it('11시간 이상 과수면도 점수 감소', () => {
      const r8 = calculateBiorhythm(createInput({ sleepHours: 8 }));
      const r12 = calculateBiorhythm(createInput({ sleepHours: 12 }));
      expect(r12.breakdown.sleep).toBeLessThan(r8.breakdown.sleep);
    });
  });

  // ============================================================
  // 수면 질 점수 (0-10)
  // ============================================================
  describe('수면 질 점수', () => {
    it('수면 질 5면 최대 점수 기여', () => {
      const r5 = calculateBiorhythm(createInput({ sleepQuality: 5 }));
      const r1 = calculateBiorhythm(createInput({ sleepQuality: 1 }));
      expect(r5.breakdown.sleep).toBeGreaterThan(r1.breakdown.sleep);
    });

    it('수면 질 1이면 질 점수 0', () => {
      // quality=1 → (1-1)*2.5 = 0
      const result = calculateBiorhythm(createInput({ sleepQuality: 1 }));
      // sleep = duration(12) + quality(0) + consistency(6) = 18
      expect(result.breakdown.sleep).toBeLessThanOrEqual(20);
    });
  });

  // ============================================================
  // 수면 일관성 점수 (0-8)
  // ============================================================
  describe('수면 일관성 점수', () => {
    it('일관성이 좋으면(편차 0.5h 이내) 높은 점수', () => {
      const r1 = calculateBiorhythm(createInput({ sleepConsistency: 0.3 }));
      const r2 = calculateBiorhythm(createInput({ sleepConsistency: 2.5 }));
      expect(r1.breakdown.sleep).toBeGreaterThan(r2.breakdown.sleep);
    });

    it('일관성 미제공 시 기본값 1.0 적용', () => {
      const result = calculateBiorhythm(createInput({}));
      // consistency=1.0 → 점수 6
      expect(result.breakdown.sleep).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 스트레스 점수 (0-25, 역방향)
  // ============================================================
  describe('스트레스 점수', () => {
    it('스트레스 1(최저)이면 스트레스 점수 25', () => {
      const result = calculateBiorhythm(createInput({ stressLevel: 1 }));
      expect(result.breakdown.stress).toBe(25);
    });

    it('스트레스 10(최고)이면 스트레스 점수 0', () => {
      const result = calculateBiorhythm(createInput({ stressLevel: 10 }));
      expect(result.breakdown.stress).toBe(0);
    });

    it('스트레스 5이면 중간 점수', () => {
      const result = calculateBiorhythm(createInput({ stressLevel: 5 }));
      expect(result.breakdown.stress).toBeGreaterThan(5);
      expect(result.breakdown.stress).toBeLessThan(20);
    });
  });

  // ============================================================
  // 에너지 점수 (0-20)
  // ============================================================
  describe('에너지 점수', () => {
    it('에너지 5면 최대 점수 20', () => {
      const result = calculateBiorhythm(createInput({ energyLevel: 5 }));
      expect(result.breakdown.energy).toBe(20);
    });

    it('에너지 1이면 점수 0', () => {
      const result = calculateBiorhythm(createInput({ energyLevel: 1 }));
      expect(result.breakdown.energy).toBe(0);
    });

    it('에너지 3이면 중간 점수', () => {
      const result = calculateBiorhythm(createInput({ energyLevel: 3 }));
      expect(result.breakdown.energy).toBe(10);
    });
  });

  // ============================================================
  // 기분 점수 (0-25)
  // ============================================================
  describe('기분 점수', () => {
    it('기분 5면 최대 점수 25', () => {
      const result = calculateBiorhythm(createInput({ moodScore: 5 }));
      expect(result.breakdown.mood).toBe(25);
    });

    it('기분 1이면 점수 0', () => {
      const result = calculateBiorhythm(createInput({ moodScore: 1 }));
      expect(result.breakdown.mood).toBe(0);
    });
  });

  // ============================================================
  // 총점 및 보정 계수
  // ============================================================
  describe('총점 및 보정 계수', () => {
    it('총점은 0-100 범위', () => {
      const low = calculateBiorhythm(
        createInput({
          sleepHours: 3,
          sleepQuality: 1,
          stressLevel: 10,
          energyLevel: 1,
          moodScore: 1,
        })
      );
      const high = calculateBiorhythm(
        createInput({
          sleepHours: 8,
          sleepQuality: 5,
          stressLevel: 1,
          energyLevel: 5,
          moodScore: 5,
          sleepConsistency: 0.3,
        })
      );
      expect(low.totalScore).toBeGreaterThanOrEqual(0);
      expect(low.totalScore).toBeLessThanOrEqual(100);
      expect(high.totalScore).toBeGreaterThanOrEqual(0);
      expect(high.totalScore).toBeLessThanOrEqual(100);
    });

    it('최적 컨디션일 때 총점 90+', () => {
      const result = calculateBiorhythm(
        createInput({
          sleepHours: 8,
          sleepQuality: 5,
          stressLevel: 1,
          energyLevel: 5,
          moodScore: 5,
          sleepConsistency: 0.3,
        })
      );
      expect(result.totalScore).toBeGreaterThanOrEqual(90);
    });

    it('최악 컨디션일 때 총점 20 미만', () => {
      const result = calculateBiorhythm(
        createInput({
          sleepHours: 3,
          sleepQuality: 1,
          stressLevel: 10,
          energyLevel: 1,
          moodScore: 1,
          sleepConsistency: 3,
        })
      );
      expect(result.totalScore).toBeLessThan(20);
    });

    it('modifier 범위는 0.85-1.15', () => {
      const low = calculateBiorhythm(
        createInput({
          sleepHours: 3,
          sleepQuality: 1,
          stressLevel: 10,
          energyLevel: 1,
          moodScore: 1,
        })
      );
      const high = calculateBiorhythm(
        createInput({
          sleepHours: 8,
          sleepQuality: 5,
          stressLevel: 1,
          energyLevel: 5,
          moodScore: 5,
        })
      );
      expect(low.modifier).toBeGreaterThanOrEqual(0.85);
      expect(low.modifier).toBeLessThanOrEqual(1.15);
      expect(high.modifier).toBeGreaterThanOrEqual(0.85);
      expect(high.modifier).toBeLessThanOrEqual(1.15);
    });

    it('총점 0이면 modifier 0.85', () => {
      // modifier = 0.85 + (0/100) * 0.30 = 0.85
      const result = calculateBiorhythm(
        createInput({
          sleepHours: 2,
          sleepQuality: 1,
          stressLevel: 10,
          energyLevel: 1,
          moodScore: 1,
          sleepConsistency: 5,
        })
      );
      expect(result.modifier).toBe(0.85);
    });

    it('총점 100이면 modifier 1.15', () => {
      const result = calculateBiorhythm(
        createInput({
          sleepHours: 8,
          sleepQuality: 5,
          stressLevel: 1,
          energyLevel: 5,
          moodScore: 5,
          sleepConsistency: 0.3,
        })
      );
      expect(result.modifier).toBe(1.15);
    });
  });

  // ============================================================
  // 생리주기 단계
  // ============================================================
  describe('getCyclePhase', () => {
    it('1-5일은 생리기', () => {
      expect(getCyclePhase(1)).toBe('menstrual');
      expect(getCyclePhase(5)).toBe('menstrual');
    });

    it('6-13일은 여포기', () => {
      expect(getCyclePhase(6)).toBe('follicular');
      expect(getCyclePhase(13)).toBe('follicular');
    });

    it('14-16일은 배란기', () => {
      expect(getCyclePhase(14)).toBe('ovulation');
      expect(getCyclePhase(16)).toBe('ovulation');
    });

    it('17일 이후는 황체기', () => {
      expect(getCyclePhase(17)).toBe('luteal');
      expect(getCyclePhase(28)).toBe('luteal');
    });
  });

  describe('getCyclePhaseInfo', () => {
    it('각 단계별 정보가 올바르게 반환됨', () => {
      const menstrual = getCyclePhaseInfo('menstrual');
      expect(menstrual.phase).toBe('menstrual');
      expect(menstrual.label).toBe('생리기');
      expect(menstrual.skinTip).toBeTruthy();
      expect(menstrual.workoutTip).toBeTruthy();
      expect(menstrual.nutritionTip).toBeTruthy();

      const ovulation = getCyclePhaseInfo('ovulation');
      expect(ovulation.label).toBe('배란기');
    });
  });

  // ============================================================
  // 생리주기 연동
  // ============================================================
  describe('생리주기 연동', () => {
    it('cycleDay 제공 시 cyclePhase가 결과에 포함됨', () => {
      const result = calculateBiorhythm(createInput({ cycleDay: 3 }));
      expect(result.cyclePhase).toBe('menstrual');
    });

    it('cycleDay null이면 cyclePhase undefined', () => {
      const result = calculateBiorhythm(createInput({ cycleDay: null }));
      expect(result.cyclePhase).toBeUndefined();
    });

    it('cycleDay 미제공이면 cyclePhase undefined', () => {
      const result = calculateBiorhythm(createInput({}));
      expect(result.cyclePhase).toBeUndefined();
    });

    it('cycleDay 제공 시 생리주기 관련 인사이트 생성', () => {
      const result = calculateBiorhythm(createInput({ cycleDay: 3 }));
      const cycleInsights = result.insights.filter((i) => i.message.includes('생리기'));
      expect(cycleInsights.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // 인사이트 생성
  // ============================================================
  describe('인사이트 생성', () => {
    it('수면 부족 시 피부 관련 인사이트 생성', () => {
      const result = calculateBiorhythm(createInput({ sleepHours: 4 }));
      const skinInsight = result.insights.find(
        (i) => i.type === 'skin' && i.message.includes('수면')
      );
      expect(skinInsight).toBeDefined();
    });

    it('높은 스트레스 시 피부/운동 인사이트 생성', () => {
      const result = calculateBiorhythm(createInput({ stressLevel: 8 }));
      const stressInsights = result.insights.filter((i) => i.message.includes('스트레스'));
      expect(stressInsights.length).toBeGreaterThanOrEqual(1);
    });

    it('낮은 에너지 시 운동/영양 인사이트 생성', () => {
      const result = calculateBiorhythm(createInput({ energyLevel: 1 }));
      const energyInsights = result.insights.filter((i) => i.message.includes('에너지'));
      expect(energyInsights.length).toBeGreaterThanOrEqual(1);
    });

    it('좋은 컨디션 시 긍정적 인사이트 생성', () => {
      const result = calculateBiorhythm(
        createInput({
          moodScore: 5,
          energyLevel: 5,
          sleepHours: 8,
          sleepQuality: 5,
        })
      );
      const positiveInsights = result.insights.filter((i) => i.message.includes('좋아요'));
      expect(positiveInsights.length).toBeGreaterThanOrEqual(1);
    });

    it('인사이트는 우선순위로 정렬됨', () => {
      const result = calculateBiorhythm(
        createInput({
          sleepHours: 4,
          stressLevel: 9,
          energyLevel: 1,
        })
      );
      for (let i = 1; i < result.insights.length; i++) {
        expect(result.insights[i].priority).toBeGreaterThanOrEqual(result.insights[i - 1].priority);
      }
    });
  });

  // ============================================================
  // applyBiorhythmModifier
  // ============================================================
  describe('applyBiorhythmModifier', () => {
    it('modifier 1.0이면 점수 변동 없음', () => {
      expect(applyBiorhythmModifier(80, 1.0)).toBe(80);
    });

    it('modifier 1.15면 점수 15% 증가', () => {
      expect(applyBiorhythmModifier(80, 1.15)).toBe(92);
    });

    it('modifier 0.85면 점수 15% 감소', () => {
      expect(applyBiorhythmModifier(80, 0.85)).toBe(68);
    });

    it('보정 결과 100 초과하지 않음', () => {
      expect(applyBiorhythmModifier(95, 1.15)).toBeLessThanOrEqual(100);
    });

    it('보정 결과 0 미만이 되지 않음', () => {
      expect(applyBiorhythmModifier(5, 0.85)).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // 엣지케이스
  // ============================================================
  describe('엣지케이스', () => {
    it('클램핑: 스트레스 0이면 1로 제한', () => {
      const r1 = calculateBiorhythm(createInput({ stressLevel: 0 }));
      const r2 = calculateBiorhythm(createInput({ stressLevel: 1 }));
      expect(r1.breakdown.stress).toBe(r2.breakdown.stress);
    });

    it('클램핑: 에너지 10이면 5로 제한', () => {
      const r1 = calculateBiorhythm(createInput({ energyLevel: 10 }));
      const r2 = calculateBiorhythm(createInput({ energyLevel: 5 }));
      expect(r1.breakdown.energy).toBe(r2.breakdown.energy);
    });

    it('클램핑: 수면 질 0이면 1로 제한', () => {
      const r1 = calculateBiorhythm(createInput({ sleepQuality: 0 }));
      const r2 = calculateBiorhythm(createInput({ sleepQuality: 1 }));
      expect(r1.breakdown.sleep).toBe(r2.breakdown.sleep);
    });

    it('클램핑: 기분 6이면 5로 제한', () => {
      const r1 = calculateBiorhythm(createInput({ moodScore: 6 }));
      const r2 = calculateBiorhythm(createInput({ moodScore: 5 }));
      expect(r1.breakdown.mood).toBe(r2.breakdown.mood);
    });
  });

  // ============================================================
  // calculateWellnessScoreWithBiorhythm 통합
  // ============================================================
  describe('calculateWellnessScoreWithBiorhythm', () => {
    const workoutInput = {
      currentStreak: 7,
      weeklyWorkouts: 3,
      targetWorkouts: 5,
      completedGoals: 2,
      totalGoals: 3,
    };
    const nutritionInput = {
      calorieAchievement: 80,
      proteinAchievement: 70,
      carbsAchievement: 60,
      fatAchievement: 90,
      waterCups: 6,
      targetWaterCups: 8,
    };
    const skinInput = {
      hasAnalysis: true,
      analysisAge: 5,
      routineCompleted: true,
      productMatchScore: 80,
    };
    const bodyInput = {
      hasAnalysis: true,
      analysisAge: 5,
      targetWeight: 70,
      currentWeight: 75,
      initialWeight: 80,
      hasWorkoutPlan: true,
    };

    it('바이오리듬 없으면 adjustedScore = totalScore', () => {
      const result = calculateWellnessScoreWithBiorhythm(
        workoutInput,
        nutritionInput,
        skinInput,
        bodyInput
      );
      expect(result.adjustedScore).toBe(result.totalScore);
      expect(result.biorhythm).toBeUndefined();
    });

    it('바이오리듬 null이면 adjustedScore = totalScore', () => {
      const result = calculateWellnessScoreWithBiorhythm(
        workoutInput,
        nutritionInput,
        skinInput,
        bodyInput,
        null
      );
      expect(result.adjustedScore).toBe(result.totalScore);
    });

    it('좋은 바이오리듬이면 adjustedScore > totalScore', () => {
      const bio = createInput({
        sleepHours: 8,
        sleepQuality: 5,
        stressLevel: 1,
        energyLevel: 5,
        moodScore: 5,
      });
      const result = calculateWellnessScoreWithBiorhythm(
        workoutInput,
        nutritionInput,
        skinInput,
        bodyInput,
        bio
      );
      expect(result.adjustedScore).toBeGreaterThan(result.totalScore);
      expect(result.biorhythm).toBeDefined();
      expect(result.biorhythm!.modifier).toBeGreaterThan(1.0);
    });

    it('나쁜 바이오리듬이면 adjustedScore < totalScore', () => {
      const bio = createInput({
        sleepHours: 3,
        sleepQuality: 1,
        stressLevel: 10,
        energyLevel: 1,
        moodScore: 1,
      });
      const result = calculateWellnessScoreWithBiorhythm(
        workoutInput,
        nutritionInput,
        skinInput,
        bodyInput,
        bio
      );
      expect(result.adjustedScore).toBeLessThan(result.totalScore);
    });

    it('바이오리듬 제공 시 biorhythm 결과 포함', () => {
      const bio = createInput({ cycleDay: 10 });
      const result = calculateWellnessScoreWithBiorhythm(
        workoutInput,
        nutritionInput,
        skinInput,
        bodyInput,
        bio
      );
      expect(result.biorhythm).toBeDefined();
      expect(result.biorhythm!.cyclePhase).toBe('follicular');
      expect(result.biorhythm!.insights.length).toBeGreaterThan(0);
    });
  });
});
