/**
 * P3-5.3: 통합 알림 시스템 - 알림 생성 로직 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createCalorieSurplusAlert,
  createPostWorkoutNutritionAlert,
  createPostWorkoutSkinAlert,
  createHydrationReminderAlert,
  createWeightChangeAlert,
  createScalpHealthNutritionAlert,
  createHairLossPreventionAlert,
  createHairShineBoostAlert,
  createSkinToneNutritionAlert,
  createCollagenBoostAlert,
  sortAlertsByPriority,
  filterExpiredAlerts,
  getVisibleAlerts,
} from '@/lib/alerts';
import type { CrossModuleAlertData } from '@/lib/alerts';

describe('알림 생성 함수', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createCalorieSurplusAlert', () => {
    it('칼로리 초과 알림을 생성한다', () => {
      const alert = createCalorieSurplusAlert(300, 30, 200);

      expect(alert.type).toBe('calorie_surplus');
      expect(alert.sourceModule).toBe('nutrition');
      expect(alert.targetModule).toBe('workout');
      expect(alert.title).toBe('칼로리 초과');
      expect(alert.level).toBe('warning');
      expect(alert.priority).toBe('high');
    });

    it('400kcal 이상이면 danger 레벨이다', () => {
      const alert = createCalorieSurplusAlert(500, 45, 350);

      expect(alert.level).toBe('danger');
      expect(alert.title).toBe('칼로리 초과 주의!');
    });

    it('메타데이터에 상세 정보가 포함된다', () => {
      const alert = createCalorieSurplusAlert(300, 30, 200);

      expect(alert.metadata).toEqual({
        surplusCalories: 300,
        recommendedDuration: 30,
        estimatedBurn: 200,
      });
    });
  });

  describe('createPostWorkoutNutritionAlert', () => {
    it('운동 후 영양 추천 알림을 생성한다', () => {
      const alert = createPostWorkoutNutritionAlert('builder', 15, 24, '단백질 섭취 권장');

      expect(alert.type).toBe('post_workout_nutrition');
      expect(alert.sourceModule).toBe('workout');
      expect(alert.targetModule).toBe('nutrition');
      expect(alert.priority).toBe('medium');
    });

    it('2시간 후 만료된다', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));
      const alert = createPostWorkoutNutritionAlert('builder', 15, 24, '팁');

      expect(alert.expiresAt).toEqual(new Date('2024-01-01T14:00:00'));
    });
  });

  describe('createPostWorkoutSkinAlert', () => {
    it('운동 후 피부 관리 알림을 생성한다', () => {
      const alert = createPostWorkoutSkinAlert(true);

      expect(alert.type).toBe('post_workout_skin');
      expect(alert.sourceModule).toBe('workout');
      expect(alert.targetModule).toBe('skin');
      expect(alert.message).toContain('땀을 많이 흘렸으니');
    });

    it('땀을 적게 흘린 경우 다른 메시지를 표시한다', () => {
      const alert = createPostWorkoutSkinAlert(false);

      expect(alert.message).toContain('가벼운 세안');
    });

    it('1시간 후 만료된다', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));
      const alert = createPostWorkoutSkinAlert();

      expect(alert.expiresAt).toEqual(new Date('2024-01-01T13:00:00'));
    });
  });

  describe('createHydrationReminderAlert', () => {
    it('수분 섭취 권장 알림을 생성한다', () => {
      const alert = createHydrationReminderAlert(1000, 2000);

      expect(alert.type).toBe('hydration_reminder');
      expect(alert.sourceModule).toBe('skin');
      expect(alert.targetModule).toBe('nutrition');
      expect(alert.message).toContain('1000ml 더 섭취');
    });
  });

  describe('createWeightChangeAlert', () => {
    it('체중 증가 알림을 생성한다', () => {
      const alert = createWeightChangeAlert(2, '1주일');

      expect(alert.type).toBe('weight_change');
      expect(alert.title).toBe('체중 증가 알림');
      expect(alert.message).toContain('2kg 증가');
    });

    it('체중 감소 알림을 생성한다', () => {
      const alert = createWeightChangeAlert(-1.5, '2주');

      expect(alert.title).toBe('체중 감소 알림');
      expect(alert.message).toContain('1.5kg 감소');
    });
  });

  describe('createScalpHealthNutritionAlert', () => {
    it('두피 건강 영양 추천 알림을 생성한다', () => {
      const alert = createScalpHealthNutritionAlert(60);

      expect(alert.type).toBe('scalp_health_nutrition');
      expect(alert.sourceModule).toBe('hair');
      expect(alert.targetModule).toBe('nutrition');
      expect(alert.level).toBe('info');
    });

    it('두피 건강 점수가 낮으면 warning 레벨이다', () => {
      const alert = createScalpHealthNutritionAlert(30);

      expect(alert.level).toBe('warning');
      expect(alert.message).toContain('비오틴, 아연');
    });
  });

  describe('createHairLossPreventionAlert', () => {
    it('탈모 예방 식단 알림을 생성한다', () => {
      const alert = createHairLossPreventionAlert(45, 'medium');

      expect(alert.type).toBe('hair_loss_prevention');
      expect(alert.sourceModule).toBe('hair');
      expect(alert.targetModule).toBe('nutrition');
      expect(alert.level).toBe('warning');
    });

    it('고위험은 danger 레벨이다', () => {
      const alert = createHairLossPreventionAlert(30, 'high');

      expect(alert.level).toBe('danger');
      expect(alert.priority).toBe('high');
      expect(alert.message).toContain('단백질, 철분');
    });

    it('저위험은 info 레벨이다', () => {
      const alert = createHairLossPreventionAlert(70, 'low');

      expect(alert.level).toBe('info');
    });
  });

  describe('createHairShineBoostAlert', () => {
    it('모발 윤기 영양 추천 알림을 생성한다', () => {
      const alert = createHairShineBoostAlert(40);

      expect(alert.type).toBe('hair_shine_boost');
      expect(alert.sourceModule).toBe('hair');
      expect(alert.targetModule).toBe('nutrition');
    });

    it('손상도가 높으면 회복 메시지를 표시한다', () => {
      const alert = createHairShineBoostAlert(60);

      expect(alert.message).toContain('손상된 모발 회복');
    });
  });

  describe('createSkinToneNutritionAlert', () => {
    it('피부톤 개선 영양 추천 알림을 생성한다', () => {
      const alert = createSkinToneNutritionAlert('warm', ['dull']);

      expect(alert.type).toBe('skin_tone_nutrition');
      expect(alert.sourceModule).toBe('makeup');
      expect(alert.targetModule).toBe('nutrition');
      expect(alert.message).toContain('비타민C');
    });

    it('피부 고민별 맞춤 메시지를 표시한다', () => {
      const unevenAlert = createSkinToneNutritionAlert('cool', ['uneven']);
      expect(unevenAlert.message).toContain('비타민E');

      const yellowishAlert = createSkinToneNutritionAlert('neutral', ['yellowish']);
      expect(yellowishAlert.message).toContain('녹황색 채소');
    });
  });

  describe('createCollagenBoostAlert', () => {
    it('콜라겐 섭취 추천 알림을 생성한다', () => {
      const alert = createCollagenBoostAlert(60);

      expect(alert.type).toBe('collagen_boost');
      expect(alert.sourceModule).toBe('makeup');
      expect(alert.targetModule).toBe('nutrition');
    });

    it('탄력 점수가 낮으면 개선 메시지를 표시한다', () => {
      const alert = createCollagenBoostAlert(40);

      expect(alert.message).toContain('탄력 개선');
    });

    it('탄력 점수가 높으면 유지 메시지를 표시한다', () => {
      const alert = createCollagenBoostAlert(60);

      expect(alert.message).toContain('탄력 유지');
    });
  });
});

describe('알림 정렬 및 필터링', () => {
  const now = new Date('2024-01-01T12:00:00');

  const createMockAlert = (
    id: string,
    priority: 'high' | 'medium' | 'low',
    createdAt: Date,
    expiresAt?: Date
  ): CrossModuleAlertData => ({
    id,
    type: 'calorie_surplus',
    sourceModule: 'nutrition',
    targetModule: 'workout',
    title: 'Test',
    message: 'Test message',
    priority,
    level: 'info',
    ctaText: 'CTA',
    ctaHref: '/test',
    createdAt,
    expiresAt,
  });

  describe('sortAlertsByPriority', () => {
    it('우선순위 순으로 정렬한다 (high > medium > low)', () => {
      const alerts = [
        createMockAlert('low', 'low', now),
        createMockAlert('high', 'high', now),
        createMockAlert('medium', 'medium', now),
      ];

      const sorted = sortAlertsByPriority(alerts);

      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('low');
    });

    it('같은 우선순위면 최신순으로 정렬한다', () => {
      const alerts = [
        createMockAlert('old', 'high', new Date('2024-01-01T10:00:00')),
        createMockAlert('new', 'high', new Date('2024-01-01T12:00:00')),
      ];

      const sorted = sortAlertsByPriority(alerts);

      expect(sorted[0].id).toBe('new');
      expect(sorted[1].id).toBe('old');
    });
  });

  describe('filterExpiredAlerts', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('만료된 알림을 필터링한다', () => {
      const alerts = [
        createMockAlert('expired', 'high', now, new Date('2024-01-01T11:00:00')),
        createMockAlert('valid', 'high', now, new Date('2024-01-01T13:00:00')),
      ];

      const filtered = filterExpiredAlerts(alerts);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('valid');
    });

    it('만료 시간이 없는 알림은 유지된다', () => {
      const alerts = [createMockAlert('no-expiry', 'high', now)];

      const filtered = filterExpiredAlerts(alerts);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('getVisibleAlerts', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('만료 필터링 + 정렬 + 개수 제한을 적용한다', () => {
      const alerts = [
        createMockAlert('low', 'low', now),
        createMockAlert('expired', 'high', now, new Date('2024-01-01T11:00:00')),
        createMockAlert('high1', 'high', new Date('2024-01-01T11:00:00')),
        createMockAlert('high2', 'high', new Date('2024-01-01T12:00:00')),
        createMockAlert('medium', 'medium', now),
      ];

      const visible = getVisibleAlerts(alerts, 3);

      expect(visible).toHaveLength(3);
      expect(visible[0].id).toBe('high2'); // 최신 high
      expect(visible[1].id).toBe('high1'); // 이전 high
      expect(visible[2].id).toBe('medium'); // medium
    });

    it('기본 최대 개수는 3개다', () => {
      const alerts = [
        createMockAlert('1', 'high', now),
        createMockAlert('2', 'high', now),
        createMockAlert('3', 'high', now),
        createMockAlert('4', 'high', now),
      ];

      const visible = getVisibleAlerts(alerts);

      expect(visible).toHaveLength(3);
    });
  });
});
