import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  ageGate: vi.fn(),
  biometricGate: vi.fn(),
  applyRateLimit: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/api/age-verification-gate', () => ({ requireAgeVerified: mocks.ageGate }));
vi.mock('@/lib/api/biometric-consent', () => ({
  requireBiometricConsent: mocks.biometricGate,
}));
vi.mock('@/lib/security/rate-limit', () => ({ applyRateLimit: mocks.applyRateLimit }));
vi.mock('@/lib/analysis/integrated', () => ({
  integratedAnalysisInputSchema: {
    safeParse: (body: unknown) => ({ success: true, data: body }),
  },
  runIntegratedAnalysis: vi.fn(),
}));

import { POST as personalColorPost } from '@/app/api/analyze/personal-color/route';
import { POST as skinPost } from '@/app/api/analyze/skin/route';
import { POST as bodyPost } from '@/app/api/analyze/body/route';
import { POST as hairPost } from '@/app/api/analyze/hair/route';
import { POST as makeupPost } from '@/app/api/analyze/makeup/route';
import { POST as integratedPost } from '@/app/api/analyze/integrated/route';
import { POST as posturePost } from '@/app/api/analyze/posture/route';

const IMAGE = `data:image/jpeg;base64,${'A'.repeat(120)}`;

function request(path: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/analyze/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const routes = [
  ['personal-color', personalColorPost, { imageBase64: IMAGE }],
  ['skin', skinPost, { imageBase64: IMAGE }],
  ['body', bodyPost, { imageBase64: IMAGE }],
  ['hair', hairPost, { imageBase64: IMAGE }],
  ['makeup', makeupPost, { imageBase64: IMAGE }],
  ['integrated', integratedPost, { faceImageBase64: IMAGE }],
  ['posture', posturePost, { frontImageBase64: IMAGE }],
] as const;

describe('생체 분석 API 게이트 실제 배선', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'user-1' });
    mocks.ageGate.mockResolvedValue(null);
    mocks.applyRateLimit.mockReturnValue({ success: true });
    mocks.biometricGate.mockImplementation(async () =>
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'BIOMETRIC_CONSENT_REQUIRED',
            message: 'Biometric consent required',
            userMessage: '생체정보 수집·이용 동의가 필요합니다.',
          },
        },
        { status: 403 }
      )
    );
  });

  it.each(routes)(
    '%s POST는 전역 통과 mock과 무관하게 requireAgeVerified 거절을 반환한다',
    async (axis, post, body) => {
      mocks.ageGate.mockResolvedValueOnce(
        NextResponse.json(
          {
            error: '만 14세 이상만 이용할 수 있어요.',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        )
      );

      const response = await post(request(axis, body));
      const json = await response.json();

      expect(mocks.ageGate).toHaveBeenCalledTimes(1);
      expect(mocks.ageGate).toHaveBeenCalledWith('user-1');
      expect(mocks.biometricGate).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(json).toMatchObject({ code: 'FORBIDDEN' });
    }
  );

  it.each(routes)(
    '%s POST는 전역 통과 mock과 무관하게 requireBiometricConsent 거절을 반환한다',
    async (axis, post, body) => {
      const response = await post(request(axis, body));
      const json = await response.json();

      expect(mocks.biometricGate).toHaveBeenCalledTimes(1);
      expect(mocks.biometricGate).toHaveBeenCalledWith('user-1');
      expect(response.status).toBe(403);
      expect(json).toMatchObject({
        success: false,
        error: { code: 'BIOMETRIC_CONSENT_REQUIRED' },
      });
    }
  );
});
