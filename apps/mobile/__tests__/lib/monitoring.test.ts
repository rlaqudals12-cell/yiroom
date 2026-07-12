/**
 * 모니터링 유틸리티 테스트
 */

import { AnalyticsEventType, ErrorSeverity } from '../../lib/monitoring/types';

describe('AnalyticsEventType', () => {
  // AnalyticsEventType 정본(lib/monitoring/types.ts)에 실재하는 이벤트만 검증한다.
  // 과거 목록에 있던 onboarding_step·onboarding_completed·feature_used·share_action·
  // notification_opened는 정본 유니온에 없고, 프로덕션 코드(analytics.ts의 logEvent 호출부
  // 및 앱 전체 grep)에서 실제로 방출하는 곳도 없어 제거함. (테스트가 stale, 유니온이 정본)
  const expectedTypes: AnalyticsEventType[] = [
    'screen_view',
    'workout_started',
    'workout_completed',
    'meal_recorded',
    'water_added',
    'product_viewed',
    'product_clicked',
    'analysis_started',
    'analysis_completed',
    'error_occurred',
    'notification_received',
  ];

  expectedTypes.forEach((type) => {
    it(`"${type}" 이벤트 타입이 유효해야 함`, () => {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    });
  });
});

describe('ErrorSeverity', () => {
  const expectedSeverities: ErrorSeverity[] = ['fatal', 'error', 'warning', 'info', 'debug'];

  expectedSeverities.forEach((severity) => {
    it(`"${severity}" 심각도가 유효해야 함`, () => {
      expect(typeof severity).toBe('string');
      expect(expectedSeverities).toContain(severity);
    });
  });
});

describe('ErrorContext', () => {
  it('ErrorContext 구조가 올바라야 함', () => {
    // ErrorContext 타입 구조 검증
    const context = {
      userId: 'user-123',
      screen: '/workout/session',
      tags: { module: 'workout' },
      extra: { workoutId: 'w-123' },
    };

    expect(context.userId).toBeDefined();
    expect(context.screen).toBeDefined();
    expect(context.tags).toBeInstanceOf(Object);
    expect(context.extra).toBeInstanceOf(Object);
  });
});

describe('AnalyticsEventProperties', () => {
  it('workout_completed 이벤트 속성이 올바라야 함', () => {
    const props = {
      workout_id: 'w-123',
      duration: 1800,
      calories_burned: 250,
      exercises_completed: 5,
    };

    expect(typeof props.workout_id).toBe('string');
    expect(typeof props.duration).toBe('number');
    expect(typeof props.calories_burned).toBe('number');
    expect(typeof props.exercises_completed).toBe('number');
  });

  it('product_viewed 이벤트 속성이 올바라야 함', () => {
    const props = {
      product_id: 'p-123',
      product_name: '테스트 제품',
      category: 'skincare',
      price: 35000,
    };

    expect(typeof props.product_id).toBe('string');
    expect(typeof props.product_name).toBe('string');
    expect(typeof props.category).toBe('string');
    expect(typeof props.price).toBe('number');
  });

  it('screen_view 이벤트 속성이 올바라야 함', () => {
    const props = {
      screen_name: '/workout/session',
      previous_screen: '/home',
    };

    expect(typeof props.screen_name).toBe('string');
    expect(typeof props.previous_screen).toBe('string');
  });
});
