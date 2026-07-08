/**
 * /api/visual/twin/compose 테스트 (ADR-115) — 착장(결합)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

vi.mock('@/lib/visual-expression/twin', () => ({
  composeOnTwin: vi.fn(),
  TwinNotFoundError: class TwinNotFoundError extends Error {},
  TwinNotApprovedError: class TwinNotApprovedError extends Error {},
  TwinGenerationError: class TwinGenerationError extends Error {},
}));
vi.mock('@/lib/visual-expression', () => ({
  checkAndConsumeBudget: vi.fn(),
}));

import { POST } from '@/app/api/visual/twin/compose/route';
import {
  composeOnTwin,
  TwinNotFoundError,
  TwinNotApprovedError,
  TwinGenerationError,
} from '@/lib/visual-expression/twin';
import { checkAndConsumeBudget } from '@/lib/visual-expression';

const TWIN_ID = '11111111-1111-1111-1111-111111111111';
const VALID_BODY = { twinId: TWIN_ID, garmentImageUrl: 'https://ex.com/g.jpg' };

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/visual/twin/compose', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/visual/twin/compose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: true, remaining: 4, limit: 5 });
    vi.mocked(composeOnTwin).mockResolvedValue({
      imageUrl: 'data:image/png;base64,OUT',
      aiGenerated: true,
    });
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('인증 + 정상 입력이면 착장 이미지를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq(VALID_BODY));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.aiGenerated).toBe(true);
    expect(composeOnTwin).toHaveBeenCalledWith('user-1', TWIN_ID, {
      kind: 'outfit',
      garmentImageUrl: 'https://ex.com/g.jpg',
    });
  });

  it('twinId가 UUID가 아니면 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await POST(makeReq({ twinId: 'nope', garmentImageUrl: 'https://ex.com/g.jpg' }));
    expect(res.status).toBe(400);
    expect(composeOnTwin).not.toHaveBeenCalled();
  });

  it('상한 초과 시 429를 반환한다(예산 공유)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(checkAndConsumeBudget).mockReturnValue({ allowed: false, remaining: 0, limit: 5 });
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(429);
    expect(composeOnTwin).not.toHaveBeenCalled();
  });

  it('트윈이 없으면 404를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(composeOnTwin).mockRejectedValue(new TwinNotFoundError());
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('승인되지 않은 트윈이면 403을 반환한다(approved만 착장)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(composeOnTwin).mockRejectedValue(new TwinNotApprovedError());
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('결합 생성 실패면 500을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(composeOnTwin).mockRejectedValue(new TwinGenerationError());
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
