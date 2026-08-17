/**
 * PATCH /api/capsule/daily/[id] — 등급 활동 기록(checkin) 배선 테스트
 *
 * 루틴 체크는 뷰티 사용자의 유일한 매일 활동인데 activity_logs 호출처가 숨김 모듈
 * (운동·영양)뿐이라 등급이 오르지 않았다. 이 스위트는 (a) 체크 성공 시 1점이 적립되고
 * (b) 하루 1회로 제한되며 (c) 해제·실패·계측 오류에선 본 응답이 멀쩡함을 고정한다.
 *
 * @see app/api/capsule/daily/[id]/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/capsule/daily', () => ({
  checkDailyItems: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({ __client: 'service-role' })),
}));

vi.mock('@/lib/levels', () => ({
  getTodayActivityCount: vi.fn(),
  trackActivity: vi.fn(),
}));

import { PATCH } from '@/app/api/capsule/daily/[id]/route';
import { auth } from '@clerk/nextjs/server';
import { checkDailyItems } from '@/lib/capsule/daily';
import { getTodayActivityCount, trackActivity } from '@/lib/levels';

function makeRequest(body: unknown): Parameters<typeof PATCH>[0] {
  return { json: async () => body } as Parameters<typeof PATCH>[0];
}

const params = { params: Promise.resolve({ id: 'daily-1' }) };

describe('PATCH /api/capsule/daily/[id] — 등급 활동 기록', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test' } as never);
    vi.mocked(getTodayActivityCount).mockResolvedValue(0);
    vi.mocked(trackActivity).mockResolvedValue({ success: true });
    vi.mocked(checkDailyItems).mockResolvedValue({
      id: 'daily-1',
      userId: 'user_test',
      date: '2026-08-17',
      items: [],
      totalCcs: 80,
      estimatedMinutes: 15,
      status: 'in_progress',
      completedAt: null,
      createdAt: '2026-08-17T00:00:00Z',
    });
  });

  it('체크 성공 시 checkin 활동을 기록한다', async () => {
    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: true }), params);

    expect(response.status).toBe(200);
    expect(vi.mocked(trackActivity)).toHaveBeenCalledWith(
      expect.anything(),
      'user_test',
      'checkin',
      'daily-1'
    );
  });

  it('당일 checkin 로그가 이미 있으면 중복 적립하지 않는다', async () => {
    vi.mocked(getTodayActivityCount).mockResolvedValue(1);

    const response = await PATCH(makeRequest({ itemIds: ['i1', 'i2'], isChecked: true }), params);

    expect(response.status).toBe(200);
    expect(vi.mocked(trackActivity)).not.toHaveBeenCalled();
  });

  it('체크 해제(isChecked=false)는 활동으로 기록하지 않는다', async () => {
    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: false }), params);

    expect(response.status).toBe(200);
    expect(vi.mocked(getTodayActivityCount)).not.toHaveBeenCalled();
    expect(vi.mocked(trackActivity)).not.toHaveBeenCalled();
  });

  it('캡슐 저장이 실패(404)하면 활동도 기록하지 않는다', async () => {
    vi.mocked(checkDailyItems).mockResolvedValue(null);

    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: true }), params);

    expect(response.status).toBe(404);
    expect(vi.mocked(trackActivity)).not.toHaveBeenCalled();
  });

  it('활동 기록이 실패해도 체크 응답은 200을 유지한다 (비차단)', async () => {
    vi.mocked(getTodayActivityCount).mockRejectedValue(new Error('levels down'));

    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: true }), params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
