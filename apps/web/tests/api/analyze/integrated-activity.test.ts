/**
 * 통합 분석 API — 등급 활동 기록 배선 테스트
 *
 * activity_logs 호출처가 숨김 모듈(운동·영양)뿐이라 분석만 쓰는 사용자는 영구 Lv.1이었다.
 * 이 스위트는 (a) 성공 저장 시 'analysis' 활동이 기록되고 (b) 실패·전축 폴백은 기록되지 않으며
 * (c) 계측 실패가 본 응답을 깨지 않음을 고정한다.
 *
 * @see app/api/analyze/integrated/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IntegratedAnalysisResult } from '@/lib/analysis/integrated';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test' }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

vi.mock('@/lib/api/age-verification-gate', () => ({
  requireAgeVerified: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/api/biometric-consent', () => ({
  requireBiometricConsent: vi.fn().mockResolvedValue(null),
}));

// 품질 게이트는 이 스위트의 관심사가 아님 — 항상 통과
vi.mock('@/lib/api/image-pipeline', () => ({
  runFullPipeline: vi.fn().mockResolvedValue({
    success: true,
    cie1: {
      overallScore: 80,
      sharpness: { score: 80, verdict: 'good' },
      exposure: { verdict: 'good' },
      colorTemperature: { kelvin: 5500, verdict: 'good' },
      resolution: { isValid: true },
      confidence: 'high',
    },
  }),
}));

vi.mock('@/lib/analysis/integrated', () => ({
  runIntegratedAnalysis: vi.fn(),
  integratedAnalysisInputSchema: {
    safeParse: vi.fn().mockImplementation((data: unknown) => ({ success: true, data })),
  },
}));

vi.mock('@/lib/levels', () => ({
  trackActivity: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({ __client: 'service-role' })),
}));

import { POST } from '@/app/api/analyze/integrated/route';
import { runIntegratedAnalysis } from '@/lib/analysis/integrated';
import { trackActivity } from '@/lib/levels';

/** 통합 분석 결과 픽스처 — 관심 필드(status·axesCompleted·usedFallback)만 의미 있음 */
function makeResult(overrides: Partial<IntegratedAnalysisResult> = {}): IntegratedAnalysisResult {
  return {
    sessionId: 'ffffffff-1111-2222-3333-444444444444',
    status: 'completed',
    axes: {} as IntegratedAnalysisResult['axes'],
    persona: null,
    axesCompleted: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
    axesFailed: [],
    usedFallback: [],
    createdAt: '2026-08-17T00:00:00Z',
    completedAt: '2026-08-17T00:00:20Z',
    ...overrides,
  };
}

function makeRequest(body: unknown = { mode: 'full' }): Parameters<typeof POST>[0] {
  return {
    json: async () => body,
    headers: new Headers(),
  } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/analyze/integrated — 등급 활동 기록', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(trackActivity).mockResolvedValue({ success: true });
  });

  it('분석 성공 시 analysis 활동을 세션 ID와 함께 기록한다', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(makeResult());

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(vi.mocked(trackActivity)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackActivity)).toHaveBeenCalledWith(
      expect.anything(),
      'user_test',
      'analysis',
      'ffffffff-1111-2222-3333-444444444444'
    );
  });

  it('일부 축만 성공(partial)해도 실제 판정이 있으면 기록한다', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(
      makeResult({
        status: 'partial',
        axesCompleted: ['personal_color'],
        axesFailed: ['skin', 'body', 'hair', 'makeup'],
      })
    );

    await POST(makeRequest());

    expect(vi.mocked(trackActivity)).toHaveBeenCalledTimes(1);
  });

  it('전 축 실패(failed)면 기록하지 않는다', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(
      makeResult({
        status: 'failed',
        axesCompleted: [],
        axesFailed: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
      })
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(vi.mocked(trackActivity)).not.toHaveBeenCalled();
  });

  it('성공 축이 전부 Mock 폴백이면 기록하지 않는다 (실제 판정 0)', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(
      makeResult({
        axesCompleted: ['personal_color', 'skin'],
        usedFallback: ['personal_color', 'skin'],
      })
    );

    await POST(makeRequest());

    expect(vi.mocked(trackActivity)).not.toHaveBeenCalled();
  });

  it('폴백이 섞여도 실제 판정 축이 하나라도 있으면 기록한다', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(
      makeResult({ axesCompleted: ['personal_color', 'skin'], usedFallback: ['skin'] })
    );

    await POST(makeRequest());

    expect(vi.mocked(trackActivity)).toHaveBeenCalledTimes(1);
  });

  it('활동 기록이 실패해도 분석 응답은 200을 유지한다 (비차단)', async () => {
    vi.mocked(runIntegratedAnalysis).mockResolvedValue(makeResult());
    vi.mocked(trackActivity).mockRejectedValue(new Error('level tracking down'));

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
