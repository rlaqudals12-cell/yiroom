/**
 * /api/visual/twin/[id] 테스트 (ADR-115) — 승인/거부/삭제
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

vi.mock('@/lib/visual-expression/twin', () => ({
  approveTwin: vi.fn(),
  rejectTwin: vi.fn(),
  deleteTwin: vi.fn(),
  TwinNotFoundError: class TwinNotFoundError extends Error {},
}));

import { PATCH, DELETE } from '@/app/api/visual/twin/[id]/route';
import {
  approveTwin,
  rejectTwin,
  deleteTwin,
  TwinNotFoundError,
} from '@/lib/visual-expression/twin';

const ctx = { params: Promise.resolve({ id: 't-1' }) };

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/visual/twin/t-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

const APPROVED = { id: 't-1', imageUrl: 'https://s/t-1', status: 'approved', aiGenerated: true };

describe('PATCH /api/visual/twin/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(approveTwin).mockResolvedValue(APPROVED as never);
    vi.mocked(rejectTwin).mockResolvedValue({ ...APPROVED, status: 'rejected' } as never);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await PATCH(makeReq({ action: 'approve' }), ctx);
    expect(res.status).toBe(401);
  });

  it('action=approve면 approveTwin을 호출하고 approved 레코드를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PATCH(makeReq({ action: 'approve' }), ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('approved');
    expect(approveTwin).toHaveBeenCalledWith('user-1', 't-1');
  });

  it('action=reject면 rejectTwin을 호출한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PATCH(makeReq({ action: 'reject' }), ctx);
    expect(res.status).toBe(200);
    expect(rejectTwin).toHaveBeenCalledWith('user-1', 't-1');
  });

  it('잘못된 action이면 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PATCH(makeReq({ action: 'nope' }), ctx);
    expect(res.status).toBe(400);
    expect(approveTwin).not.toHaveBeenCalled();
  });

  it('트윈이 없으면 404를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(approveTwin).mockRejectedValue(new TwinNotFoundError());
    const res = await PATCH(makeReq({ action: 'approve' }), ctx);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/visual/twin/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteTwin).mockResolvedValue(undefined);
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await DELETE(makeReq({}), ctx);
    expect(res.status).toBe(401);
  });

  it('삭제 성공 시 success를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await DELETE(makeReq({}), ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(deleteTwin).toHaveBeenCalledWith('user-1', 't-1');
  });

  it('트윈이 없으면 404를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(deleteTwin).mockRejectedValue(new TwinNotFoundError());
    const res = await DELETE(makeReq({}), ctx);
    expect(res.status).toBe(404);
  });
});
