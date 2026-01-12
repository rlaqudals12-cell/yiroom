/**
 * 약관동의 API 테스트
 * SDD-TERMS-AGREEMENT.md §5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Clerk auth 모킹
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Supabase service-role 클라이언트 모킹
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

// 모킹 후 라우트 동적 import
const { GET, POST, PATCH } = await import('@/app/api/agreement/route');

describe('/api/agreement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 체인 설정
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
    mockUpsert.mockReturnValue({
      select: () => ({
        single: mockSingle,
      }),
    });
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: mockSingle,
        }),
      }),
    });
  });

  describe('GET /api/agreement', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('동의 정보가 없으면 hasAgreed: false를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasAgreed).toBe(false);
      expect(data.agreement).toBeNull();
    });

    it('필수 동의가 false면 hasAgreed: false를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'uuid',
          clerk_user_id: 'user_test',
          terms_agreed: true,
          privacy_agreed: false, // 개인정보 미동의
          marketing_agreed: false,
          terms_version: '1.0',
          privacy_version: '1.0',
        },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasAgreed).toBe(false);
    });

    it('모든 필수 동의가 완료되면 hasAgreed: true를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'uuid',
          clerk_user_id: 'user_test',
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: false,
          terms_version: '1.0',
          privacy_version: '1.0',
          terms_agreed_at: '2026-01-08T00:00:00Z',
          privacy_agreed_at: '2026-01-08T00:00:00Z',
          marketing_agreed_at: null,
          marketing_withdrawn_at: null,
          created_at: '2026-01-08T00:00:00Z',
          updated_at: '2026-01-08T00:00:00Z',
        },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasAgreed).toBe(true);
      expect(data.agreement).toBeDefined();
      expect(data.agreement.termsAgreed).toBe(true);
      expect(data.agreement.privacyAgreed).toBe(true);
    });

    it('약관 버전이 다르면 requiresUpdate: true를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'uuid',
          clerk_user_id: 'user_test',
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: false,
          terms_version: '0.9', // 이전 버전
          privacy_version: '1.0',
          terms_agreed_at: '2025-01-08T00:00:00Z',
          privacy_agreed_at: '2025-01-08T00:00:00Z',
          marketing_agreed_at: null,
          marketing_withdrawn_at: null,
          created_at: '2025-01-08T00:00:00Z',
          updated_at: '2025-01-08T00:00:00Z',
        },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasAgreed).toBe(false);
      expect(data.requiresUpdate).toBe(true);
      expect(data.reason).toBe('version_mismatch');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch agreement');
    });
  });

  describe('POST /api/agreement', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('필수 동의가 누락되면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: false, // 필수 동의 누락
          marketingAgreed: false,
          gender: 'male',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('필수 약관에 동의해주세요');
      expect(data.missingAgreements).toContain('privacy');
    });

    // L-1-1: 성별 선택 필수 검증
    it('성별이 누락되면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: false,
          // gender 누락
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('성별을 선택해주세요');
    });

    it('성별이 유효하지 않으면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: false,
          gender: 'invalid', // 유효하지 않은 성별
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('성별을 선택해주세요');
    });

    it('모든 필수 동의 시 201을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: {
          id: 'uuid-new',
          clerk_user_id: 'user_test',
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: true,
          terms_version: '1.0',
          privacy_version: '1.0',
          terms_agreed_at: '2026-01-08T00:00:00Z',
          privacy_agreed_at: '2026-01-08T00:00:00Z',
          marketing_agreed_at: '2026-01-08T00:00:00Z',
          marketing_withdrawn_at: null,
          created_at: '2026-01-08T00:00:00Z',
          updated_at: '2026-01-08T00:00:00Z',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: true,
          gender: 'male',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.agreement.termsAgreed).toBe(true);
      expect(data.agreement.privacyAgreed).toBe(true);
      expect(data.agreement.marketingAgreed).toBe(true);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: false,
          gender: 'female',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save agreement');
    });
  });

  describe('PATCH /api/agreement', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'PATCH',
        body: JSON.stringify({ marketingAgreed: true }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('marketingAgreed가 boolean이 아니면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'PATCH',
        body: JSON.stringify({ marketingAgreed: 'invalid' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('마케팅 동의를 업데이트한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: {
          id: 'uuid',
          clerk_user_id: 'user_test',
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: true,
          terms_version: '1.0',
          privacy_version: '1.0',
          terms_agreed_at: '2026-01-08T00:00:00Z',
          privacy_agreed_at: '2026-01-08T00:00:00Z',
          marketing_agreed_at: '2026-01-08T00:00:00Z',
          marketing_withdrawn_at: null,
          created_at: '2026-01-08T00:00:00Z',
          updated_at: '2026-01-08T00:00:00Z',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'PATCH',
        body: JSON.stringify({ marketingAgreed: true }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.agreement.marketingAgreed).toBe(true);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const request = new NextRequest('http://localhost/api/agreement', {
        method: 'PATCH',
        body: JSON.stringify({ marketingAgreed: false }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update marketing consent');
    });
  });
});
