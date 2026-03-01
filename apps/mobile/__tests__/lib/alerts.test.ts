/**
 * 교차 모듈 알림 테스트
 */

import {
  createCalorieSurplusAlert,
  createPostWorkoutNutritionAlert,
  createPostWorkoutSkinAlert,
  createHydrationReminderAlert,
  createWeightChangeAlert,
  createSkinToneNutritionAlert,
  createCollagenBoostAlert,
  sortAlertsByPriority,
  filterExpiredAlerts,
  getVisibleAlerts,
  ALERT_TYPE_CONFIG,
  MODULE_LABELS,
} from '../../lib/alerts';

describe('alerts', () => {
  describe('알림 생성', () => {
    it('칼로리 잉여 알림', () => {
      const alert = createCalorieSurplusAlert(300);
      expect(alert.type).toBe('calorie_surplus');
      expect(alert.message).toContain('300kcal');
      expect(alert.priority).toBe('medium');
    });

    it('운동 후 영양 알림', () => {
      const alert = createPostWorkoutNutritionAlert(500);
      expect(alert.type).toBe('post_workout_nutrition');
      expect(alert.message).toContain('500kcal');
      expect(alert.priority).toBe('high');
    });

    it('운동 후 피부 관리 알림', () => {
      const alert = createPostWorkoutSkinAlert();
      expect(alert.type).toBe('post_workout_skin');
      expect(alert.sourceModule).toBe('workout');
      expect(alert.targetModule).toBe('skin');
    });

    it('수분 섭취 알림', () => {
      const alert = createHydrationReminderAlert();
      expect(alert.type).toBe('hydration_reminder');
      expect(alert.priority).toBe('low');
    });

    it('체중 증가 알림', () => {
      const alert = createWeightChangeAlert(2, 'increase');
      expect(alert.message).toContain('2kg');
      expect(alert.message).toContain('증가');
    });

    it('체중 감소 알림', () => {
      const alert = createWeightChangeAlert(1.5, 'decrease');
      expect(alert.message).toContain('1.5kg');
      expect(alert.message).toContain('감소');
    });

    it('피부톤 영양 알림', () => {
      const alert = createSkinToneNutritionAlert();
      expect(alert.type).toBe('skin_tone_nutrition');
    });

    it('콜라겐 부스트 알림', () => {
      const alert = createCollagenBoostAlert();
      expect(alert.type).toBe('collagen_boost');
    });

    it('모든 알림에 createdAt/expiresAt 포함', () => {
      const alert = createCalorieSurplusAlert(100);
      expect(alert.createdAt).toBeTruthy();
      expect(alert.expiresAt).toBeTruthy();
    });
  });

  describe('sortAlertsByPriority', () => {
    it('high → medium → low 순서', () => {
      const alerts = [
        createHydrationReminderAlert(),      // low
        createPostWorkoutNutritionAlert(300), // high
        createCalorieSurplusAlert(200),       // medium
      ];

      const sorted = sortAlertsByPriority(alerts);
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });

    it('빈 배열 처리', () => {
      expect(sortAlertsByPriority([])).toEqual([]);
    });
  });

  describe('filterExpiredAlerts', () => {
    it('만료되지 않은 알림 유지', () => {
      const alerts = [createCalorieSurplusAlert(100)];
      expect(filterExpiredAlerts(alerts).length).toBe(1);
    });

    it('만료된 알림 제거', () => {
      const alert = createCalorieSurplusAlert(100);
      alert.expiresAt = new Date(Date.now() - 1000).toISOString(); // 과거
      expect(filterExpiredAlerts([alert]).length).toBe(0);
    });

    it('expiresAt 없는 알림 유지', () => {
      const alert = createCalorieSurplusAlert(100);
      alert.expiresAt = undefined;
      expect(filterExpiredAlerts([alert]).length).toBe(1);
    });
  });

  describe('getVisibleAlerts', () => {
    it('최대 개수 제한', () => {
      const alerts = Array.from({ length: 10 }, (_, i) =>
        createCalorieSurplusAlert(i * 100)
      );

      expect(getVisibleAlerts(alerts, 3).length).toBe(3);
    });

    it('기본 최대 5개', () => {
      const alerts = Array.from({ length: 10 }, (_, i) =>
        createCalorieSurplusAlert(i * 100)
      );

      expect(getVisibleAlerts(alerts).length).toBe(5);
    });
  });

  describe('상수 검증', () => {
    it('10개 알림 타입 설정', () => {
      expect(Object.keys(ALERT_TYPE_CONFIG).length).toBe(10);
    });

    it('5개 모듈 라벨', () => {
      expect(Object.keys(MODULE_LABELS).length).toBe(5);
    });
  });
});
