/**
 * 운동기구 추천 서비스 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getEquipmentRecommendations,
  getHomeGymSetup,
  getCategoryLabel,
  getGoalLabel,
  formatPrice,
  getBudgetLabel,
} from '@/lib/smart-matching/equipment-recommend';

describe('getEquipmentRecommendations', () => {
  it('체중 감량 목표에 맞는 추천을 반환한다', () => {
    const result = getEquipmentRecommendations('weight_loss', 'beginner', true);

    expect(result.workoutGoal).toBe('weight_loss');
    expect(result.fitnessLevel).toBe('beginner');
    expect(result.homeGym).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);

    // 체중 감량은 유산소가 필수
    const cardioCategory = result.recommendations.find((r) => r.category === 'cardio');
    expect(cardioCategory).toBeDefined();
    expect(cardioCategory?.priority).toBe('essential');
  });

  it('근육 증가 목표에 맞는 추천을 반환한다', () => {
    const result = getEquipmentRecommendations('muscle_gain', 'intermediate', true);

    expect(result.workoutGoal).toBe('muscle_gain');

    // 근육 증가는 근력이 필수
    const strengthCategory = result.recommendations.find((r) => r.category === 'strength');
    expect(strengthCategory).toBeDefined();
    expect(strengthCategory?.priority).toBe('essential');
  });

  it('유연성 목표에 맞는 추천을 반환한다', () => {
    const result = getEquipmentRecommendations('flexibility', 'beginner', true);

    expect(result.workoutGoal).toBe('flexibility');

    // 유연성은 flexibility 카테고리가 필수
    const flexCategory = result.recommendations.find((r) => r.category === 'flexibility');
    expect(flexCategory).toBeDefined();
    expect(flexCategory?.priority).toBe('essential');
  });

  it('초보자에게는 optional 장비를 제외한다', () => {
    const result = getEquipmentRecommendations('weight_loss', 'beginner', true);

    result.recommendations.forEach((rec) => {
      rec.items.forEach((item) => {
        expect(item.priority).not.toBe('optional');
      });
    });
  });

  it('홈짐 여부에 따라 장비를 조정한다', () => {
    const homeGymResult = getEquipmentRecommendations('weight_loss', 'beginner', true);
    const gymResult = getEquipmentRecommendations('weight_loss', 'beginner', false);

    // 헬스장 사용 시 유산소 장비가 줄어듦 (줄넘기만 포함)
    const homeCardio = homeGymResult.recommendations.find((r) => r.category === 'cardio');
    const gymCardio = gymResult.recommendations.find((r) => r.category === 'cardio');

    expect(homeCardio?.items.length).toBeGreaterThanOrEqual(gymCardio?.items.length ?? 0);
  });

  it('모든 추천에 이유가 포함된다', () => {
    const result = getEquipmentRecommendations('health', 'intermediate', true);

    result.recommendations.forEach((rec) => {
      expect(rec.reason).toBeDefined();
      expect(rec.reason.length).toBeGreaterThan(0);
    });
  });

  it('선호 운동 타입을 반환한다', () => {
    const result = getEquipmentRecommendations('endurance', 'intermediate', true);

    expect(result.preferredWorkouts).toBeDefined();
    expect(result.preferredWorkouts.length).toBeGreaterThan(0);
    expect(result.preferredWorkouts).toContain('mover');
  });
});

describe('getHomeGymSetup', () => {
  it('기본 예산에 맞는 홈짐 구성을 반환한다', () => {
    const result = getHomeGymSetup('basic', 'small', ['weight_loss']);

    expect(result.budget).toBe('basic');
    expect(result.spaceSize).toBe('small');
    expect(result.goals).toContain('weight_loss');
    expect(result.essentialSet.items.length).toBeGreaterThan(0);
    // 기본 예산은 확장 세트가 없음
    expect(result.expandedSet).toBeUndefined();
  });

  it('중급 예산에 확장 세트를 포함한다', () => {
    const result = getHomeGymSetup('intermediate', 'medium', ['muscle_gain']);

    expect(result.expandedSet).toBeDefined();
    expect(result.expandedSet?.items.length).toBeGreaterThan(0);
  });

  it('고급 예산에 더 많은 장비를 포함한다', () => {
    const basicResult = getHomeGymSetup('basic', 'medium', ['health']);
    const advancedResult = getHomeGymSetup('advanced', 'medium', ['health']);

    const basicTotal = basicResult.essentialSet.totalCost;
    const advancedTotal =
      advancedResult.essentialSet.totalCost + (advancedResult.expandedSet?.totalCost ?? 0);

    expect(advancedTotal).toBeGreaterThan(basicTotal);
  });

  it('소형 공간에서 큰 장비를 제외한다', () => {
    const result = getHomeGymSetup('advanced', 'small', ['endurance']);

    const hasRunningMachine = result.essentialSet.items.some(
      (item) => item.id === 'eq-1'
    );
    const hasBarbell = result.essentialSet.items.some((item) => item.id === 'eq-5');

    expect(hasRunningMachine).toBe(false);
    expect(hasBarbell).toBe(false);
  });

  it('단계별 구매 계획을 반환한다', () => {
    const result = getHomeGymSetup('intermediate', 'medium', ['weight_loss', 'health']);

    expect(result.purchasePlan.length).toBeGreaterThan(0);
    expect(result.purchasePlan[0].phase).toBe(1);
    expect(result.purchasePlan[0].description).toBeDefined();
    expect(result.purchasePlan[0].cost).toBeGreaterThan(0);
  });

  it('필수 세트에 설명을 포함한다', () => {
    const result = getHomeGymSetup('basic', 'small', ['flexibility']);

    expect(result.essentialSet.description).toBeDefined();
    expect(result.essentialSet.description.length).toBeGreaterThan(0);
  });
});

describe('Helper Functions', () => {
  describe('getCategoryLabel', () => {
    it('카테고리 라벨을 한글로 반환한다', () => {
      expect(getCategoryLabel('cardio')).toBe('유산소');
      expect(getCategoryLabel('strength')).toBe('근력');
      expect(getCategoryLabel('flexibility')).toBe('유연성');
      expect(getCategoryLabel('wearable')).toBe('웨어러블');
    });
  });

  describe('getGoalLabel', () => {
    it('목표 라벨을 한글로 반환한다', () => {
      expect(getGoalLabel('weight_loss')).toBe('체중 감량');
      expect(getGoalLabel('muscle_gain')).toBe('근육 증가');
      expect(getGoalLabel('health')).toBe('건강 유지');
    });
  });

  describe('formatPrice', () => {
    it('가격을 한국어 형식으로 포맷팅한다', () => {
      expect(formatPrice(10000)).toBe('10,000원');
      expect(formatPrice(1500000)).toBe('1,500,000원');
      expect(formatPrice(0)).toBe('0원');
    });
  });

  describe('getBudgetLabel', () => {
    it('예산 라벨을 한글로 반환한다', () => {
      expect(getBudgetLabel('basic')).toBe('입문 (20만원 이하)');
      expect(getBudgetLabel('intermediate')).toBe('중급 (50만원 이하)');
      expect(getBudgetLabel('advanced')).toBe('고급 (100만원 이하)');
    });
  });
});
