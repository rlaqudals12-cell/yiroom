import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPatchSettings } = vi.hoisted(() => ({ mockPatchSettings: vi.fn() }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}));

vi.mock('@/lib/api/notifications', () => ({
  getUserNotificationSettings: vi.fn(),
  saveUserNotificationSettings: vi.fn(),
  patchUserNotificationSettings: mockPatchSettings,
}));

import { PATCH } from '@/app/api/user/notification-settings/route';

function patchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/user/notification-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/user/notification-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatchSettings.mockResolvedValue({
      success: true,
      settings: { socialNotifications: false },
      error: null,
    });
  });

  it('정확히 한 필드만 저장 서비스에 전달한다', async () => {
    const response = await PATCH(patchRequest({ socialNotifications: false }));

    expect(response.status).toBe(200);
    expect(mockPatchSettings).toHaveBeenCalledWith('user-123', {
      socialNotifications: false,
    });
  });

  it('여러 필드를 한 요청으로 보내면 400으로 거부한다', async () => {
    const response = await PATCH(
      patchRequest({ socialNotifications: false, achievementNotifications: false })
    );

    expect(response.status).toBe(400);
    expect(mockPatchSettings).not.toHaveBeenCalled();
  });

  it('알 수 없는 필드와 잘못된 시간은 400으로 거부한다', async () => {
    const unknownField = await PATCH(patchRequest({ marketing: true }));
    const invalidTime = await PATCH(patchRequest({ workoutReminderTime: '29:90' }));

    expect(unknownField.status).toBe(400);
    expect(invalidTime.status).toBe(400);
    expect(mockPatchSettings).not.toHaveBeenCalled();
  });
});
