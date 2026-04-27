/**
 * 통합 분석 API CORS 헤더 테스트 (ADR-103)
 *
 * @see docs/adr/ADR-103-cross-origin-mobile-access.md
 * @see app/api/analyze/integrated/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Clerk auth mock (OPTIONS만 테스트하려면 auth 호출 없음)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

vi.mock('@/lib/analysis/integrated', () => ({
  runIntegratedAnalysis: vi.fn(),
  integratedAnalysisInputSchema: {
    safeParse: vi.fn().mockReturnValue({ success: false, error: { issues: [] } }),
  },
}));

import { OPTIONS, POST } from '@/app/api/analyze/integrated/route';

describe('OPTIONS /api/analyze/integrated (preflight)', () => {
  it('204 응답 + CORS 헤더 포함', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});

describe('POST /api/analyze/integrated — CORS 헤더 (에러 경로)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('401 응답에도 CORS 헤더가 포함됨', async () => {
    // 비로그인 상태
    const { auth } = await import('@clerk/nextjs/server');
    (auth as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      userId: null,
    });

    const req = new Request('http://localhost/api/analyze/integrated', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
