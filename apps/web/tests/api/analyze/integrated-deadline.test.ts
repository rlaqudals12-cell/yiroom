/**
 * 통합 분석 라우트의 절대 deadline 회귀 테스트.
 * 사전 단계가 쓴 시간까지 포함해 Vercel 60초보다 먼저 오류 봉투를 반환해야 한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  runIntegratedAnalysis: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn(() => ({ success: true })),
}));
vi.mock('@/lib/api/age-verification-gate', () => ({
  requireAgeVerified: vi.fn(async () => null),
}));
vi.mock('@/lib/api/biometric-consent', () => ({
  requireBiometricConsent: vi.fn(async () => null),
}));
vi.mock('@/lib/api/image-pipeline', () => ({
  runFullPipeline: vi.fn(),
}));
vi.mock('@/lib/analysis/integrated/internal/session-store', () => ({
  findSessionByClientRequestId: vi.fn(async () => null),
}));
vi.mock('@/lib/analysis/integrated', () => ({
  runIntegratedAnalysis: mocks.runIntegratedAnalysis,
  integratedAnalysisInputSchema: {
    safeParse: vi.fn(() => ({
      success: true,
      data: {
        faceImageBase64: 'data:image/jpeg;base64,AAAA',
        questionnaire: { skin: { concerns: [] }, hair: {}, body: {} },
        mode: 'full',
        options: { locale: 'ko', skipMakeup: false },
      },
    })),
  },
}));
vi.mock('@/lib/levels', () => ({ trackActivity: vi.fn() }));
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({})),
}));

import { POST } from '@/app/api/analyze/integrated/route';

describe('POST /api/analyze/integrated — route-wide deadline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('FORCE_MOCK_AI', 'true');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('인증 7초 뒤 분석이 멈춰도 진입 후 52초에 CORS 오류 봉투를 반환한다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    mocks.auth.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ userId: 'user-1' }), 7_000))
    );
    mocks.runIntegratedAnalysis.mockImplementation(() => new Promise(() => {}));
    const request = new Request('http://localhost/api/analyze/integrated', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as Parameters<typeof POST>[0];

    const responsePromise = POST(request);
    await vi.advanceTimersByTimeAsync(51_999);
    expect(mocks.runIntegratedAnalysis).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    const response = await responsePromise;
    const json = await response.json();

    expect(performance.now()).toBe(52_000);
    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(json.code).toBe('INTERNAL_ERROR');
  });
});
