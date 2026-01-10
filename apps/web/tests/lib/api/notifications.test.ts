/**
 * Notifications API 테스트
 * @description lib/api/notifications.ts의 알림 설정 조회/저장 및 타입 변환 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// =====================================================
// Supabase Mock 설정
// =====================================================

// 체이닝 메서드 Mock 결과를 저장
let mockSelectResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockUpsertResult: { data: unknown; error: unknown } = { data: null, error: null };

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(mockSelectResult)),
      })),
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(mockUpsertResult)),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabaseClient,
}));

import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/lib/api/notifications';
import {
  dbToClientSettings,
  clientToDbSettings,
  NotificationSettingsDb,
  NotificationSettings,
} from '@/types/notifications';

// =====================================================
// 테스트 픽스처
// =====================================================

const mockDbSettings: NotificationSettingsDb = {
  id: 'ns-123',
  clerk_user_id: 'user_abc',
  enabled: true,
  workout_reminder: true,
  workout_reminder_time: '09:00:00',
  streak_warning: true,
  nutrition_reminder: true,
  meal_reminder_breakfast: '08:30:00',
  meal_reminder_lunch: '12:30:00',
  meal_reminder_dinner: '18:30:00',
  water_reminder: true,
  water_reminder_interval: 2,
  social_notifications: true,
  achievement_notifications: false,
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-01-10T10:00:00Z',
};

const mockClientSettings: NotificationSettings = {
  enabled: true,
  workoutReminder: true,
  workoutReminderTime: '09:00',
  streakWarning: true,
  nutritionReminder: true,
  mealReminderBreakfast: '08:30',
  mealReminderLunch: '12:30',
  mealReminderDinner: '18:30',
  waterReminder: true,
  waterReminderInterval: 2,
  socialNotifications: true,
  achievementNotifications: false,
};

// =====================================================
// dbToClientSettings 변환 함수 테스트
// =====================================================

describe('dbToClientSettings 변환 함수', () => {
  it('DB 형식(snake_case)을 클라이언트 형식(camelCase)으로 변환', () => {
    const result = dbToClientSettings(mockDbSettings);

    expect(result.enabled).toBe(true);
    expect(result.workoutReminder).toBe(true);
    expect(result.workoutReminderTime).toBe('09:00');
    expect(result.streakWarning).toBe(true);
    expect(result.nutritionReminder).toBe(true);
    expect(result.mealReminderBreakfast).toBe('08:30');
    expect(result.mealReminderLunch).toBe('12:30');
    expect(result.mealReminderDinner).toBe('18:30');
    expect(result.waterReminder).toBe(true);
    expect(result.waterReminderInterval).toBe(2);
    expect(result.socialNotifications).toBe(true);
    expect(result.achievementNotifications).toBe(false);
  });

  it('TIME 형식(HH:MM:SS)을 HH:MM으로 변환', () => {
    const dbSettings: NotificationSettingsDb = {
      ...mockDbSettings,
      workout_reminder_time: '14:30:00',
      meal_reminder_breakfast: '07:00:00',
      meal_reminder_lunch: '12:00:00',
      meal_reminder_dinner: '19:00:00',
    };

    const result = dbToClientSettings(dbSettings);

    expect(result.workoutReminderTime).toBe('14:30');
    expect(result.mealReminderBreakfast).toBe('07:00');
    expect(result.mealReminderLunch).toBe('12:00');
    expect(result.mealReminderDinner).toBe('19:00');
  });

  it('null 식사 알림 시간은 기본값으로 처리', () => {
    const dbSettings: NotificationSettingsDb = {
      ...mockDbSettings,
      meal_reminder_breakfast: null,
      meal_reminder_lunch: null,
      meal_reminder_dinner: null,
    };

    const result = dbToClientSettings(dbSettings);

    // null인 경우 기본값 사용 (08:30, 12:30, 18:30)
    expect(result.mealReminderBreakfast).toBe('08:30');
    expect(result.mealReminderLunch).toBe('12:30');
    expect(result.mealReminderDinner).toBe('18:30');
  });

  it('모든 알림 비활성화 상태 변환', () => {
    const dbSettings: NotificationSettingsDb = {
      ...mockDbSettings,
      enabled: false,
      workout_reminder: false,
      streak_warning: false,
      nutrition_reminder: false,
      water_reminder: false,
      social_notifications: false,
      achievement_notifications: false,
    };

    const result = dbToClientSettings(dbSettings);

    expect(result.enabled).toBe(false);
    expect(result.workoutReminder).toBe(false);
    expect(result.streakWarning).toBe(false);
    expect(result.nutritionReminder).toBe(false);
    expect(result.waterReminder).toBe(false);
    expect(result.socialNotifications).toBe(false);
    expect(result.achievementNotifications).toBe(false);
  });
});

// =====================================================
// clientToDbSettings 변환 함수 테스트
// =====================================================

describe('clientToDbSettings 변환 함수', () => {
  it('클라이언트 형식(camelCase)을 DB 형식(snake_case)으로 변환', () => {
    const result = clientToDbSettings(mockClientSettings, 'user_abc');

    expect(result.clerk_user_id).toBe('user_abc');
    expect(result.enabled).toBe(true);
    expect(result.workout_reminder).toBe(true);
    expect(result.workout_reminder_time).toBe('09:00:00');
    expect(result.streak_warning).toBe(true);
    expect(result.nutrition_reminder).toBe(true);
    expect(result.meal_reminder_breakfast).toBe('08:30:00');
    expect(result.meal_reminder_lunch).toBe('12:30:00');
    expect(result.meal_reminder_dinner).toBe('18:30:00');
    expect(result.water_reminder).toBe(true);
    expect(result.water_reminder_interval).toBe(2);
    expect(result.social_notifications).toBe(true);
    expect(result.achievement_notifications).toBe(false);
  });

  it('HH:MM 형식을 DB TIME 형식(HH:MM:SS)으로 변환', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      workoutReminderTime: '14:30',
      mealReminderBreakfast: '07:00',
      mealReminderLunch: '12:00',
      mealReminderDinner: '19:00',
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.workout_reminder_time).toBe('14:30:00');
    expect(result.meal_reminder_breakfast).toBe('07:00:00');
    expect(result.meal_reminder_lunch).toBe('12:00:00');
    expect(result.meal_reminder_dinner).toBe('19:00:00');
  });

  it('이미 HH:MM:SS 형식이면 그대로 유지', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      workoutReminderTime: '14:30:00',
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.workout_reminder_time).toBe('14:30:00');
  });

  it('ID, created_at, updated_at 필드는 포함하지 않음', () => {
    const result = clientToDbSettings(mockClientSettings, 'user_abc');

    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });

  it('다른 사용자 ID로 변환', () => {
    const result = clientToDbSettings(mockClientSettings, 'user_xyz');

    expect(result.clerk_user_id).toBe('user_xyz');
  });
});

// =====================================================
// getUserNotificationSettings 함수 테스트
// =====================================================

describe('getUserNotificationSettings 함수', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = { data: null, error: null };
  });

  it('설정이 있을 때 변환된 설정 반환', async () => {
    mockSelectResult = { data: mockDbSettings, error: null };

    const result = await getUserNotificationSettings('user_abc');

    expect(result.settings).not.toBeNull();
    expect(result.settings?.enabled).toBe(true);
    expect(result.settings?.workoutReminderTime).toBe('09:00');
    expect(result.error).toBeNull();
  });

  it('설정이 없을 때 (PGRST116) null 반환', async () => {
    mockSelectResult = {
      data: null,
      error: { code: 'PGRST116', message: 'no rows returned' },
    };

    const result = await getUserNotificationSettings('user_new');

    expect(result.settings).toBeNull();
    expect(result.error).toBeNull(); // PGRST116은 에러로 취급하지 않음
  });

  it('DB 에러 시 에러 메시지와 함께 null 반환', async () => {
    mockSelectResult = {
      data: null,
      error: { code: 'PGRST500', message: 'Internal server error' },
    };

    const result = await getUserNotificationSettings('user_abc');

    expect(result.settings).toBeNull();
    expect(result.error).toBe('Internal server error');
  });

  it('예외 발생 시 에러 메시지 반환', async () => {
    // Mock이 예외를 던지도록 설정
    mockSupabaseClient.from = vi.fn(() => {
      throw new Error('Connection failed');
    });

    const result = await getUserNotificationSettings('user_abc');

    expect(result.settings).toBeNull();
    expect(result.error).toBe('Connection failed');

    // Mock 복원
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockSelectResult)),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockUpsertResult)),
        })),
      })),
    }));
  });
});

// =====================================================
// saveUserNotificationSettings 함수 테스트
// =====================================================

describe('saveUserNotificationSettings 함수', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertResult = { data: null, error: null };
    // Mock 복원
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockSelectResult)),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockUpsertResult)),
        })),
      })),
    }));
  });

  it('새 설정 저장 성공 (insert)', async () => {
    mockUpsertResult = { data: mockDbSettings, error: null };

    const result = await saveUserNotificationSettings('user_abc', mockClientSettings);

    expect(result.success).toBe(true);
    expect(result.settings).not.toBeNull();
    expect(result.settings?.enabled).toBe(true);
    expect(result.error).toBeNull();
  });

  it('기존 설정 업데이트 성공 (upsert)', async () => {
    const updatedDbSettings = {
      ...mockDbSettings,
      enabled: false,
      workout_reminder: false,
    };
    mockUpsertResult = { data: updatedDbSettings, error: null };

    const updatedClientSettings = {
      ...mockClientSettings,
      enabled: false,
      workoutReminder: false,
    };

    const result = await saveUserNotificationSettings('user_abc', updatedClientSettings);

    expect(result.success).toBe(true);
    expect(result.settings?.enabled).toBe(false);
    expect(result.settings?.workoutReminder).toBe(false);
  });

  it('DB 에러 시 false 반환', async () => {
    mockUpsertResult = {
      data: null,
      error: { code: 'PGRST500', message: 'Database connection error' },
    };

    const result = await saveUserNotificationSettings('user_abc', mockClientSettings);

    expect(result.success).toBe(false);
    expect(result.settings).toBeNull();
    expect(result.error).toBe('Database connection error');
  });

  it('예외 발생 시 에러 메시지 반환', async () => {
    mockSupabaseClient.from = vi.fn(() => {
      throw new Error('Unexpected error occurred');
    });

    const result = await saveUserNotificationSettings('user_abc', mockClientSettings);

    expect(result.success).toBe(false);
    expect(result.settings).toBeNull();
    expect(result.error).toBe('Unexpected error occurred');
  });

  it('RLS 위반 에러 처리', async () => {
    mockUpsertResult = {
      data: null,
      error: { code: '42501', message: 'Row level security violation' },
    };

    const result = await saveUserNotificationSettings('user_abc', mockClientSettings);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Row level security violation');
  });
});

// =====================================================
// 기본값 상수 테스트
// =====================================================

describe('DEFAULT_NOTIFICATION_SETTINGS 기본값', () => {
  it('기본값이 올바르게 설정됨', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_NOTIFICATION_SETTINGS.workoutReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.workoutReminderTime).toBe('09:00');
    expect(DEFAULT_NOTIFICATION_SETTINGS.streakWarning).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.nutritionReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderBreakfast).toBe('08:30');
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderLunch).toBe('12:30');
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderDinner).toBe('18:30');
    expect(DEFAULT_NOTIFICATION_SETTINGS.waterReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.waterReminderInterval).toBe(2);
    expect(DEFAULT_NOTIFICATION_SETTINGS.socialNotifications).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.achievementNotifications).toBe(true);
  });

  it('기본값은 불변 객체 패턴 확인', () => {
    // 기본값을 수정해도 원본에 영향 없음 확인
    const copy = { ...DEFAULT_NOTIFICATION_SETTINGS };
    copy.enabled = true;

    expect(DEFAULT_NOTIFICATION_SETTINGS.enabled).toBe(false);
  });
});

// =====================================================
// 엣지 케이스 테스트
// =====================================================

describe('엣지 케이스', () => {
  it('빈 문자열 clerk_user_id 처리', () => {
    const result = clientToDbSettings(mockClientSettings, '');

    expect(result.clerk_user_id).toBe('');
  });

  it('특수 문자 포함 clerk_user_id 처리', () => {
    const specialUserId = 'user_abc-123_xyz';
    const result = clientToDbSettings(mockClientSettings, specialUserId);

    expect(result.clerk_user_id).toBe(specialUserId);
  });

  it('waterReminderInterval 경계값 (최소값 1)', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      waterReminderInterval: 1,
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.water_reminder_interval).toBe(1);
  });

  it('waterReminderInterval 경계값 (최대값)', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      waterReminderInterval: 24,
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.water_reminder_interval).toBe(24);
  });

  it('자정 시간(00:00) 처리', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      workoutReminderTime: '00:00',
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.workout_reminder_time).toBe('00:00:00');
  });

  it('자정 직전 시간(23:59) 처리', () => {
    const settings: NotificationSettings = {
      ...mockClientSettings,
      workoutReminderTime: '23:59',
    };

    const result = clientToDbSettings(settings, 'user_abc');

    expect(result.workout_reminder_time).toBe('23:59:00');
  });
});

// =====================================================
// 양방향 변환 일관성 테스트
// =====================================================

describe('양방향 변환 일관성', () => {
  it('DB -> Client -> DB 변환 후 핵심 필드 일치', () => {
    const clientSettings = dbToClientSettings(mockDbSettings);
    const backToDb = clientToDbSettings(clientSettings, mockDbSettings.clerk_user_id);

    expect(backToDb.clerk_user_id).toBe(mockDbSettings.clerk_user_id);
    expect(backToDb.enabled).toBe(mockDbSettings.enabled);
    expect(backToDb.workout_reminder).toBe(mockDbSettings.workout_reminder);
    expect(backToDb.workout_reminder_time).toBe(mockDbSettings.workout_reminder_time);
    expect(backToDb.streak_warning).toBe(mockDbSettings.streak_warning);
    expect(backToDb.nutrition_reminder).toBe(mockDbSettings.nutrition_reminder);
    expect(backToDb.water_reminder).toBe(mockDbSettings.water_reminder);
    expect(backToDb.water_reminder_interval).toBe(mockDbSettings.water_reminder_interval);
    expect(backToDb.social_notifications).toBe(mockDbSettings.social_notifications);
    expect(backToDb.achievement_notifications).toBe(mockDbSettings.achievement_notifications);
  });

  it('Client -> DB -> Client 변환 후 필드 일치', () => {
    const dbSettings = clientToDbSettings(mockClientSettings, 'user_abc');
    // DB에서 반환되는 형식 시뮬레이션
    const fullDbSettings: NotificationSettingsDb = {
      ...dbSettings,
      id: 'ns-new',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    } as NotificationSettingsDb;

    const backToClient = dbToClientSettings(fullDbSettings);

    expect(backToClient.enabled).toBe(mockClientSettings.enabled);
    expect(backToClient.workoutReminder).toBe(mockClientSettings.workoutReminder);
    expect(backToClient.workoutReminderTime).toBe(mockClientSettings.workoutReminderTime);
    expect(backToClient.streakWarning).toBe(mockClientSettings.streakWarning);
    expect(backToClient.nutritionReminder).toBe(mockClientSettings.nutritionReminder);
    expect(backToClient.mealReminderBreakfast).toBe(mockClientSettings.mealReminderBreakfast);
    expect(backToClient.mealReminderLunch).toBe(mockClientSettings.mealReminderLunch);
    expect(backToClient.mealReminderDinner).toBe(mockClientSettings.mealReminderDinner);
    expect(backToClient.waterReminder).toBe(mockClientSettings.waterReminder);
    expect(backToClient.waterReminderInterval).toBe(mockClientSettings.waterReminderInterval);
    expect(backToClient.socialNotifications).toBe(mockClientSettings.socialNotifications);
    expect(backToClient.achievementNotifications).toBe(mockClientSettings.achievementNotifications);
  });
});
