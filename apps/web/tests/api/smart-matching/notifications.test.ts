import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { DELETE, PATCH } from '@/app/api/smart-matching/notifications/[id]/route';
import { GET, POST } from '@/app/api/smart-matching/notifications/route';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}));

const mockDb = { from: vi.fn() };
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => mockDb),
}));

vi.mock('@/lib/smart-matching', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  createNotification: vi.fn(),
  markAllAsRead: vi.fn(),
  markAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

import {
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/lib/smart-matching';

const NOTIFICATION_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_AT = new Date('2026-08-21T00:00:00.000Z');

describe('smart-matching notifications API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNotifications).mockResolvedValue([]);
    vi.mocked(getUnreadCount).mockResolvedValue(0);
  });

  it('미인증 요청은 저장소 호출 전에 401 표준 봉투로 거부한다', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const response = await GET(
      new NextRequest('http://localhost/api/smart-matching/notifications')
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'AUTH_ERROR' },
    });
    expect(getNotifications).not.toHaveBeenCalled();
  });

  it('목록과 미확인 개수를 표준 성공 봉투로 반환한다', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/smart-matching/notifications?unread=true')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { notifications: [], unreadCount: 0 },
    });
    expect(getNotifications).toHaveBeenCalledWith(
      'user-1',
      { unreadOnly: true, type: undefined, limit: 50 },
      mockDb
    );
  });

  it('지원하지 않는 알림 유형은 DB 호출 전에 거부한다', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/smart-matching/notifications?type=unknown')
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(getNotifications).not.toHaveBeenCalled();
  });

  it('인증 사용자 ID로 검증된 알림을 생성한다', async () => {
    vi.mocked(createNotification).mockResolvedValue({
      id: NOTIFICATION_ID,
      clerkUserId: 'user-1',
      notificationType: 'price_drop',
      title: '가격 알림',
      message: '가격이 내려갔어요.',
      productId: PRODUCT_ID,
      read: false,
      createdAt: CREATED_AT,
    });

    const response = await POST(
      new NextRequest('http://localhost/api/smart-matching/notifications', {
        method: 'POST',
        body: JSON.stringify({
          notificationType: 'price_drop',
          title: '가격 알림',
          message: '가격이 내려갔어요.',
          productId: PRODUCT_ID,
        }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { id: NOTIFICATION_ID, clerkUserId: 'user-1' },
    });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ clerkUserId: 'user-1', productId: PRODUCT_ID }),
      mockDb
    );
  });

  it('필수 문구가 비어 있으면 알림을 만들지 않는다', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/smart-matching/notifications', {
        method: 'POST',
        body: JSON.stringify({ notificationType: 'price_drop', title: '', message: '' }),
      })
    );

    expect(response.status).toBe(400);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('전체 읽음 요청도 표준 성공 봉투를 사용한다', async () => {
    vi.mocked(markAllAsRead).mockResolvedValue(true);
    const response = await POST(
      new NextRequest('http://localhost/api/smart-matching/notifications', {
        method: 'POST',
        body: JSON.stringify({ action: 'markAllAsRead' }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { success: true },
    });
  });

  it('UUID 알림만 읽음·삭제하고 두 응답을 표준 봉투로 반환한다', async () => {
    vi.mocked(markAsRead).mockResolvedValue(true);
    vi.mocked(deleteNotification).mockResolvedValue(true);
    const context = { params: Promise.resolve({ id: NOTIFICATION_ID }) };

    const patchResponse = await PATCH(
      new NextRequest(`http://localhost/api/smart-matching/notifications/${NOTIFICATION_ID}`, {
        method: 'PATCH',
      }),
      context
    );
    const deleteResponse = await DELETE(
      new NextRequest(`http://localhost/api/smart-matching/notifications/${NOTIFICATION_ID}`, {
        method: 'DELETE',
      }),
      context
    );

    await expect(patchResponse.json()).resolves.toEqual({
      success: true,
      data: { success: true },
    });
    await expect(deleteResponse.json()).resolves.toEqual({
      success: true,
      data: { success: true },
    });
    // 소유자 필터 심층 방어 — userId가 3번째 인자로 전달돼야 한다
    expect(markAsRead).toHaveBeenCalledWith(NOTIFICATION_ID, mockDb, 'user-1');
    expect(deleteNotification).toHaveBeenCalledWith(NOTIFICATION_ID, mockDb, 'user-1');
  });

  it('잘못된 알림 ID는 저장소 호출 전에 거부한다', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/smart-matching/notifications/not-an-id', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'not-an-id' }) }
    );

    expect(response.status).toBe(400);
    expect(deleteNotification).not.toHaveBeenCalled();
  });
});
