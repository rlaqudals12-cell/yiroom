import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockUpsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({ from: mockFrom }),
}));

import { patchUserNotificationSettings } from '@/lib/api/notifications';

describe('patchUserNotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'settings-1',
        clerk_user_id: 'user-123',
        enabled: false,
        workout_reminder: true,
        workout_reminder_time: '09:00:00',
        streak_warning: true,
        nutrition_reminder: true,
        meal_reminder_breakfast: '08:30:00',
        meal_reminder_lunch: '12:30:00',
        meal_reminder_dinner: '18:30:00',
        water_reminder: true,
        water_reminder_interval: 2,
        social_notifications: false,
        achievement_notifications: true,
        created_at: '2026-08-18T00:00:00Z',
        updated_at: '2026-08-18T00:00:00Z',
      },
      error: null,
    });
  });

  it('다른 설정을 재전송하지 않고 해당 DB 컬럼만 원자적으로 upsert한다', async () => {
    await patchUserNotificationSettings('user-123', { socialNotifications: false });

    expect(mockFrom).toHaveBeenCalledWith('user_notification_settings');
    expect(mockUpsert).toHaveBeenCalledWith(
      { clerk_user_id: 'user-123', social_notifications: false },
      { onConflict: 'clerk_user_id' }
    );
  });

  it('시간 필드는 DB TIME 형식으로 변환한다', async () => {
    await patchUserNotificationSettings('user-123', { workoutReminderTime: '10:30' });

    expect(mockUpsert).toHaveBeenCalledWith(
      { clerk_user_id: 'user-123', workout_reminder_time: '10:30:00' },
      { onConflict: 'clerk_user_id' }
    );
  });
});
