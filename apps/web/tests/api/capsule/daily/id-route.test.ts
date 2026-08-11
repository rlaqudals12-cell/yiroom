/**
 * PATCH /api/capsule/daily/[id] — 아이템 체크 계약 테스트
 *
 * - 복수(itemIds): "모두 완료" 배치. 단건 병렬 발사가 items JSONB read-modify-write
 *   경합으로 체크를 유실시키던 결함의 근본 수리 — 서버 쓰기가 1회여야 한다.
 * - 단수(itemId): 하위호환 필수. 배포된 모바일 APK가 단수 계약을 하드코딩하고 있다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/capsule/daily', () => ({
  checkDailyItems: vi.fn(),
}));

import { PATCH } from '@/app/api/capsule/daily/[id]/route';
import { auth } from '@clerk/nextjs/server';
import { checkDailyItems } from '@/lib/capsule/daily';

/** NextRequest 대용 — 라우트는 request.json()만 사용한다 */
function makeRequest(body: unknown): Parameters<typeof PATCH>[0] {
  return { json: async () => body } as Parameters<typeof PATCH>[0];
}

const params = { params: Promise.resolve({ id: 'daily-1' }) };

describe('PATCH /api/capsule/daily/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test' } as never);
    vi.mocked(checkDailyItems).mockResolvedValue({
      id: 'daily-1',
      userId: 'user_test',
      date: '2026-08-01',
      items: [],
      totalCcs: 80,
      estimatedMinutes: 15,
      status: 'completed',
      completedAt: null,
      createdAt: '2026-08-01T00:00:00Z',
    });
  });

  it('복수(itemIds)를 한 번의 배치 호출로 저장한다', async () => {
    const response = await PATCH(
      makeRequest({ itemIds: ['i1', 'i2', 'i3', 'i4'], isChecked: true }),
      params
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(checkDailyItems)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(checkDailyItems)).toHaveBeenCalledWith(
      'daily-1',
      ['i1', 'i2', 'i3', 'i4'],
      true,
      'user_test'
    );
  });

  it('단수(itemId) 계약을 그대로 수용한다 (모바일 APK 하위호환)', async () => {
    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: false }), params);

    expect(response.status).toBe(200);
    expect(vi.mocked(checkDailyItems)).toHaveBeenCalledWith('daily-1', ['i1'], false, 'user_test');
  });

  it('itemId·itemIds가 모두 없으면 400', async () => {
    const response = await PATCH(makeRequest({ isChecked: true }), params);

    expect(response.status).toBe(400);
    expect(vi.mocked(checkDailyItems)).not.toHaveBeenCalled();
  });

  it('빈 itemIds 배열은 400 (무의미한 쓰기 차단)', async () => {
    const response = await PATCH(makeRequest({ itemIds: [], isChecked: true }), params);

    expect(response.status).toBe(400);
    expect(vi.mocked(checkDailyItems)).not.toHaveBeenCalled();
  });

  it('미인증 요청은 401', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const response = await PATCH(makeRequest({ itemId: 'i1', isChecked: true }), params);

    expect(response.status).toBe(401);
    expect(vi.mocked(checkDailyItems)).not.toHaveBeenCalled();
  });

  it('소유자 불일치·부재로 null이면 404', async () => {
    vi.mocked(checkDailyItems).mockResolvedValueOnce(null);

    const response = await PATCH(makeRequest({ itemIds: ['i1'], isChecked: true }), params);

    expect(response.status).toBe(404);
  });
});
