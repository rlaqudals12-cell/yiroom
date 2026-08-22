import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }));

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({
  select: vi.fn(() => ({ single: mockSingle })),
}));
const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: mockUpsert }));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

const mockLogConsentGrant = vi.fn().mockResolvedValue(true);
const mockLogConsentRevoke = vi.fn().mockResolvedValue(true);
vi.mock('@/lib/audit', () => ({
  getClientIp: () => '203.0.113.1',
  logConsentGrant: (...args: unknown[]) => mockLogConsentGrant(...args),
  logConsentRevoke: (...args: unknown[]) => mockLogConsentRevoke(...args),
}));

const { GET, PATCH } = await import('@/app/api/agreement/preferences/route');

function patchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/agreement/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/agreement/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T03:00:00.000Z'));
    mockAuth.mockResolvedValue({ userId: 'user_test' });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({
      data: { analytics_agreed: false, marketing_agreed: false },
      error: null,
    });
  });

  it('인증되지 않은 요청을 표준 봉투 401로 거절한다', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toMatchObject({
      success: false,
      error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' },
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('인증되지 않은 변경 요청은 저장 전에 401로 거절한다', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PATCH(patchRequest({ analyticsConsent: true }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toMatchObject({
      success: false,
      error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('저장 행이 없는 사용자는 두 선택 동의를 false로 조회한다', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: { analyticsConsent: false, marketingConsent: false },
    });
    expect(mockSelect).toHaveBeenCalledWith('analytics_agreed, marketing_agreed');
    expect(mockEq).toHaveBeenCalledWith('clerk_user_id', 'user_test');
  });

  it('빈 객체·잘못된 타입·알 수 없는 필드를 Zod로 거절한다', async () => {
    for (const body of [
      {},
      { analyticsConsent: 'yes' },
      { analyticsConsent: true, unknown: true },
    ]) {
      const response = await PATCH(patchRequest(body));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    }
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('분석 동의 철회와 마케팅 동의를 타임스탬프와 함께 영속화한다', async () => {
    mockSingle.mockResolvedValue({
      data: { analytics_agreed: false, marketing_agreed: true },
      error: null,
    });

    const response = await PATCH(patchRequest({ analyticsConsent: false, marketingConsent: true }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: { analyticsConsent: false, marketingConsent: true },
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        clerk_user_id: 'user_test',
        analytics_agreed: false,
        analytics_agreed_at: null,
        analytics_withdrawn_at: '2026-08-21T03:00:00.000Z',
        marketing_agreed: true,
        marketing_agreed_at: '2026-08-21T03:00:00.000Z',
        marketing_withdrawn_at: null,
      },
      { onConflict: 'clerk_user_id' }
    );
    expect(mockLogConsentRevoke).toHaveBeenCalledWith(
      'user_test',
      'analytics',
      undefined,
      '203.0.113.1'
    );
    expect(mockLogConsentGrant).toHaveBeenCalledWith(
      'user_test',
      'marketing',
      undefined,
      '203.0.113.1'
    );
  });

  it('DB 실패를 기술 세부정보 없이 표준 봉투로 반환한다', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });

    const response = await PATCH(patchRequest({ analyticsConsent: true }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to persist consent preferences',
        userMessage: '동의 설정을 저장할 수 없습니다.',
      },
    });
    expect(mockLogConsentGrant).not.toHaveBeenCalled();
  });
});
