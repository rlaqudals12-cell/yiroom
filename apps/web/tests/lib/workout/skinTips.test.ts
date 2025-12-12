import { describe, it, expect } from 'vitest';
import {
  getPostWorkoutSkinCareTips,
  getQuickPostWorkoutMessage,
  inferWorkoutCategory,
  inferWorkoutIntensity,
  convertToSkinSummary,
  WORKOUT_CATEGORY_TIPS,
  INTENSITY_TIPS,
  SKIN_METRIC_TIPS,
  GENERAL_TIPS,
  type SkinAnalysisSummary,
  type WorkoutCategory,
} from '@/lib/workout/skinTips';

describe('skinTips', () => {
  describe('inferWorkoutCategory', () => {
    it('유산소 운동을 cardio로 분류한다', () => {
      expect(inferWorkoutCategory('burner')).toBe('cardio');
      expect(inferWorkoutCategory('running')).toBe('cardio');
      expect(inferWorkoutCategory('cycling')).toBe('cardio');
      expect(inferWorkoutCategory('cardio workout')).toBe('cardio');
    });

    it('HIIT 운동을 hiit로 분류한다', () => {
      expect(inferWorkoutCategory('hiit')).toBe('hiit');
      expect(inferWorkoutCategory('crossfit')).toBe('hiit');
      expect(inferWorkoutCategory('circuit training')).toBe('hiit');
    });

    it('유연성 운동을 flexibility로 분류한다', () => {
      expect(inferWorkoutCategory('flexer')).toBe('flexibility');
      expect(inferWorkoutCategory('yoga')).toBe('flexibility');
      expect(inferWorkoutCategory('pilates')).toBe('flexibility');
      expect(inferWorkoutCategory('stretch')).toBe('flexibility');
    });

    it('회복 운동을 recovery로 분류한다', () => {
      expect(inferWorkoutCategory('recovery')).toBe('recovery');
      expect(inferWorkoutCategory('foam rolling')).toBe('recovery');
      expect(inferWorkoutCategory('rest day')).toBe('recovery');
    });

    it('기타 운동은 strength로 분류한다', () => {
      expect(inferWorkoutCategory('toner')).toBe('strength');
      expect(inferWorkoutCategory('builder')).toBe('strength');
      expect(inferWorkoutCategory('mover')).toBe('strength');
    });
  });

  describe('inferWorkoutIntensity', () => {
    it('유연성 운동은 항상 low 강도다', () => {
      expect(inferWorkoutIntensity(60, 'flexibility')).toBe('low');
      expect(inferWorkoutIntensity(90, 'flexibility')).toBe('low');
    });

    it('회복 운동은 항상 low 강도다', () => {
      expect(inferWorkoutIntensity(60, 'recovery')).toBe('low');
    });

    it('HIIT는 15분 이상이면 high 강도다', () => {
      expect(inferWorkoutIntensity(15, 'hiit')).toBe('high');
      expect(inferWorkoutIntensity(30, 'hiit')).toBe('high');
    });

    it('HIIT는 15분 미만이면 medium 강도다', () => {
      expect(inferWorkoutIntensity(10, 'hiit')).toBe('medium');
    });

    it('유산소/근력은 시간에 따라 강도가 결정된다', () => {
      // low: < 20분
      expect(inferWorkoutIntensity(15, 'cardio')).toBe('low');
      expect(inferWorkoutIntensity(15, 'strength')).toBe('low');

      // medium: 20~44분
      expect(inferWorkoutIntensity(30, 'cardio')).toBe('medium');
      expect(inferWorkoutIntensity(30, 'strength')).toBe('medium');

      // high: 45분 이상
      expect(inferWorkoutIntensity(45, 'cardio')).toBe('high');
      expect(inferWorkoutIntensity(60, 'strength')).toBe('high');
    });
  });

  describe('getPostWorkoutSkinCareTips', () => {
    it('운동 카테고리별 팁을 반환한다', () => {
      const result = getPostWorkoutSkinCareTips('cardio', 30, null);

      expect(result.immediateActions.length).toBeGreaterThan(0);
      // cardio 팁이 포함되어 있어야 함
      const hasSweatingTip = result.immediateActions.some(
        (tip) => tip.description.includes('땀') || tip.description.includes('수분')
      );
      expect(hasSweatingTip).toBe(true);
    });

    it('고강도 운동 시 강도 팁을 추가한다', () => {
      const result = getPostWorkoutSkinCareTips('cardio', 60, null);

      // high intensity tip
      const hasHighIntensityTip = result.immediateActions.some(
        (tip) => tip.title.includes('샤워') || tip.description.includes('샤워')
      );
      expect(hasHighIntensityTip).toBe(true);
    });

    it('피부 분석 데이터가 있으면 맞춤 팁을 생성한다', () => {
      const skinAnalysis: SkinAnalysisSummary = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'normal',
        wrinkles: 'good',
        elasticity: 'good',
        pigmentation: 'normal',
        trouble: 'warning',
      };

      const result = getPostWorkoutSkinCareTips('strength', 30, skinAnalysis);

      expect(result.skinMetricTips.length).toBeGreaterThan(0);
      // hydration warning 팁이 있어야 함
      const hasHydrationTip = result.skinMetricTips.some(
        (tip) => tip.title.includes('수분')
      );
      expect(hasHydrationTip).toBe(true);
    });

    it('피부 분석 데이터가 없으면 skinMetricTips가 비어있다', () => {
      const result = getPostWorkoutSkinCareTips('yoga', 30, null);

      expect(result.skinMetricTips).toEqual([]);
    });

    it('일반 팁은 1~2개 반환된다', () => {
      const result = getPostWorkoutSkinCareTips('strength', 30, null);

      expect(result.generalTips.length).toBeGreaterThanOrEqual(1);
      expect(result.generalTips.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getQuickPostWorkoutMessage', () => {
    it('고강도 운동 메시지를 반환한다', () => {
      const result = getQuickPostWorkoutMessage('hiit', 30);

      expect(result.icon).toBe('💧');
      expect(result.message).toContain('고강도');
      expect(result.message).toContain('30분');
    });

    it('중간 강도 운동 메시지를 반환한다', () => {
      const result = getQuickPostWorkoutMessage('strength', 30);

      expect(result.icon).toBe('✨');
      expect(result.message).toContain('30분');
      expect(result.message).toContain('30분 이내');
    });

    it('저강도 운동 메시지를 반환한다', () => {
      const result = getQuickPostWorkoutMessage('yoga', 15);

      expect(result.icon).toBe('🌿');
      expect(result.message).toContain('가벼운');
    });
  });

  describe('convertToSkinSummary', () => {
    it('SkinMetric 배열을 SkinAnalysisSummary로 변환한다', () => {
      const metrics = [
        { id: 'hydration', status: 'warning' as const },
        { id: 'oil', status: 'good' as const },
        { id: 'pores', status: 'normal' as const },
        { id: 'wrinkles', status: 'good' as const },
        { id: 'elasticity', status: 'normal' as const },
        { id: 'pigmentation', status: 'warning' as const },
        { id: 'trouble', status: 'normal' as const },
      ];

      const result = convertToSkinSummary(metrics);

      expect(result.hydration).toBe('warning');
      expect(result.oil).toBe('good');
      expect(result.pores).toBe('normal');
      expect(result.wrinkles).toBe('good');
      expect(result.elasticity).toBe('normal');
      expect(result.pigmentation).toBe('warning');
      expect(result.trouble).toBe('normal');
    });

    it('누락된 지표는 normal로 기본값 설정한다', () => {
      const metrics = [
        { id: 'hydration', status: 'good' as const },
      ];

      const result = convertToSkinSummary(metrics);

      expect(result.hydration).toBe('good');
      expect(result.oil).toBe('normal');
      expect(result.pores).toBe('normal');
    });
  });

  describe('상수 검증', () => {
    describe('WORKOUT_CATEGORY_TIPS', () => {
      const categories: WorkoutCategory[] = ['cardio', 'strength', 'flexibility', 'hiit', 'recovery'];

      it.each(categories)('카테고리 %s에 팁이 있다', (category) => {
        const tips = WORKOUT_CATEGORY_TIPS[category];
        expect(tips.length).toBeGreaterThan(0);

        tips.forEach((tip) => {
          expect(tip.icon).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.description).toBeDefined();
          expect(['high', 'medium', 'low']).toContain(tip.priority);
        });
      });
    });

    describe('INTENSITY_TIPS', () => {
      it('low 강도는 팁이 없다', () => {
        expect(INTENSITY_TIPS.low).toBeNull();
      });

      it('medium, high 강도에는 팁이 있다', () => {
        expect(INTENSITY_TIPS.medium).not.toBeNull();
        expect(INTENSITY_TIPS.high).not.toBeNull();

        expect(INTENSITY_TIPS.medium?.title).toBeDefined();
        expect(INTENSITY_TIPS.high?.title).toBeDefined();
      });
    });

    describe('SKIN_METRIC_TIPS', () => {
      it('각 피부 지표에 대한 팁이 정의되어 있다', () => {
        const metrics = ['hydration', 'oil', 'pores', 'wrinkles', 'elasticity', 'pigmentation', 'trouble'];

        metrics.forEach((metric) => {
          const tipsByStatus = SKIN_METRIC_TIPS[metric as keyof typeof SKIN_METRIC_TIPS];
          expect(tipsByStatus).toBeDefined();
          expect(tipsByStatus.good).toBeDefined();
          expect(tipsByStatus.normal).toBeDefined();
          expect(tipsByStatus.warning).toBeDefined();
        });
      });

      it('hydration warning에 수분 관련 팁이 있다', () => {
        const tip = SKIN_METRIC_TIPS.hydration.warning;
        expect(tip).not.toBeNull();
        expect(tip?.title).toContain('수분');
      });

      it('trouble warning에 트러블 관련 팁이 있다', () => {
        const tip = SKIN_METRIC_TIPS.trouble.warning;
        expect(tip).not.toBeNull();
        expect(tip?.title).toContain('트러블');
      });
    });

    describe('GENERAL_TIPS', () => {
      it('일반 팁이 3개 이상 있다', () => {
        expect(GENERAL_TIPS.length).toBeGreaterThanOrEqual(3);
      });

      it('각 팁에 필수 필드가 있다', () => {
        GENERAL_TIPS.forEach((tip) => {
          expect(tip.icon).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.description).toBeDefined();
          expect(['high', 'medium', 'low']).toContain(tip.priority);
        });
      });
    });
  });
});
