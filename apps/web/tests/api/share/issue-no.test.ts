import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

const mockMaybeSingle = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => mockMaybeSingle() }),
      }),
    }),
  }),
}));

const mockFetchIssueNo = vi.fn();
vi.mock('@/lib/share/issue-no', () => ({
  fetchIssueNo: (...args: unknown[]) => mockFetchIssueNo(...args),
}));

import { GET } from '@/app/api/share/issue-no/route';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

function makeRequest(sessionId?: string): NextRequest {
  const qs = sessionId !== undefined ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return new NextRequest(`http://localhost/api/share/issue-no${qs}`);
}

describe('GET /api/share/issue-no', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1' });
  });

  it('미인증이면 401', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(makeRequest(UUID));
    expect(res.status).toBe(401);
  });

  it('UUID 형식이 아니면 400 — 비정형 값이 DB(uuid 캐스팅 500)까지 가지 않는다', async () => {
    for (const bad of [undefined, '', 'not-a-uuid', '-'.repeat(36), 'a'.repeat(36)]) {
      const res = await GET(makeRequest(bad));
      expect(res.status, String(bad)).toBe(400);
    }
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it('본인 세션이 아니면(RLS 0행) 404', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET(makeRequest(UUID));
    expect(res.status).toBe(404);
    expect(mockFetchIssueNo).not.toHaveBeenCalled();
  });

  it('정상이면 세션 created_at 기준 발급 번호를 봉투로 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { created_at: '2026-07-23T00:00:00Z' },
      error: null,
    });
    mockFetchIssueNo.mockResolvedValue(1234);

    const res = await GET(makeRequest(UUID));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, data: { issueNo: 1234 } });
    expect(mockFetchIssueNo).toHaveBeenCalledWith('2026-07-23T00:00:00Z');
  });
});
