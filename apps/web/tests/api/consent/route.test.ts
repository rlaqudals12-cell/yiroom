/**
 * 이미지 저장 동의 API 테스트
 * @description GET/POST/DELETE /api/consent 테스트
 * SDD-VISUAL-SKIN-REPORT.md §4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Mock 모듈 설정
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/consent/version-check', () => ({
  checkConsentEligibility: vi.fn(),
}));

vi.mock('@/components/analysis/consent', () => ({
  LATEST_CONSENT_VERSION: 'v1.0',
}));

import { GET, POST, DELETE } from '@/app/api/consent/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { checkConsentEligibility } from '@/lib/consent/version-check';

// NextRequest 헬퍼
function createMockRequest(
  method: string,
  searchParams?: Record<string, string>,
  body?: unknown
): NextRequest {
  const url = new URL('http://localhost/api/consent');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method,
    nextUrl: url,
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

// Mock 사용자 ID
const mockUserId = 'user_test123';

// Mock Supabase Service Role 클라이언트
const createMockServiceClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockUpsert = vi.fn();

  // eq()는 체이닝과 최종 Promise 반환을 모두 지원해야 함
  const mockEq = vi.fn();
  const createEqChain = () => {
    const chainable = {
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      // Supabase는 thenable이므로 await 가능
      then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
    };
    mockEq.mockReturnValue(chainable);
    return chainable;
  };
  createEqChain();

  // Storage mock
  const mockList = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockRemove = vi.fn().mockResolvedValue({ error: null });
  const mockStorage = {
    from: vi.fn().mockReturnValue({
      list: mockList,
      remove: mockRemove,
    }),
  };

  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    upsert: mockUpsert,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockUpsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  return {
    from: mockFrom,
    storage: mockStorage,
    _mocks: {
      mockFrom,
      mockSelect,
      mockEq,
      mockMaybeSingle,
      mockSingle,
      mockUpdate,
      mockUpsert,
      mockList,
      mockRemove,
    },
  };
};

describe('Consent API', () => {
  let mockServiceClient: ReturnType<typeof createMockServiceClient>;

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본값: 인증된 사용자
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as Awaited<ReturnType<typeof auth>>);

    mockServiceClient = createMockServiceClient();
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockServiceClient as unknown as ReturnType<typeof createServiceRoleClient>
    );
  });

  describe('GET /api/consent', () => {
    it('인증되지 않은 사용자는 401 반환', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest('GET', { analysisType: 'skin' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('잘못된 분석 타입은 400 반환', async () => {
      const request = createMockRequest('GET', { analysisType: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid analysis type');
    });

    it('분석 타입 없이 요청 시 400 반환', async () => {
      const request = createMockRequest('GET', {});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid analysis type');
    });

    it('유효한 요청 시 동의 상태 반환', async () => {
      const mockConsent = {
        id: 'consent_1',
        clerk_user_id: mockUserId,
        analysis_type: 'skin',
        consent_given: true,
        consent_version: 'v1.0',
        consent_at: '2026-01-08T00:00:00Z',
        retention_until: '2027-01-08T00:00:00Z',
      };

      mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: mockConsent,
        error: null,
      });

      const request = createMockRequest('GET', { analysisType: 'skin' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consent).toEqual(mockConsent);
    });

    it('동의 없는 경우 null 반환', async () => {
      mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = createMockRequest('GET', { analysisType: 'skin' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consent).toBeNull();
    });
  });

  describe('POST /api/consent', () => {
    beforeEach(() => {
      vi.mocked(checkConsentEligibility).mockReturnValue({ canConsent: true });
    });

    it('인증되지 않은 사용자는 401 반환', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest('POST', {}, { analysisType: 'skin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('잘못된 분석 타입은 400 반환', async () => {
      const request = createMockRequest('POST', {}, { analysisType: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid analysis type');
    });

    it('14세 미만 사용자는 403 반환', async () => {
      vi.mocked(checkConsentEligibility).mockReturnValueOnce({
        canConsent: false,
        reason: 'under_age',
        requiredAction: '14세 미만은 이미지 저장 기능을 이용할 수 없어요',
      });

      mockServiceClient._mocks.mockSingle.mockResolvedValueOnce({
        data: { birth_date: '2015-01-01' },
        error: null,
      });

      const request = createMockRequest('POST', {}, { analysisType: 'skin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.reason).toBe('under_age');
    });

    it('생년월일 없는 사용자는 403 반환', async () => {
      vi.mocked(checkConsentEligibility).mockReturnValueOnce({
        canConsent: false,
        reason: 'no_birthdate',
        requiredAction: '생년월일을 프로필에 입력해주세요',
      });

      mockServiceClient._mocks.mockSingle.mockResolvedValueOnce({
        data: { birth_date: null },
        error: null,
      });

      const request = createMockRequest('POST', {}, { analysisType: 'skin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.reason).toBe('no_birthdate');
    });

    it('유효한 동의 요청 시 동의 저장', async () => {
      const mockConsent = {
        id: 'consent_1',
        clerk_user_id: mockUserId,
        analysis_type: 'skin',
        consent_given: true,
        consent_version: 'v1.0',
      };

      mockServiceClient._mocks.mockSingle.mockResolvedValueOnce({
        data: { birth_date: '1990-01-01' },
        error: null,
      });

      mockServiceClient._mocks.mockSingle.mockResolvedValueOnce({
        data: mockConsent,
        error: null,
      });

      const request = createMockRequest('POST', {}, { analysisType: 'skin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consent).toBeDefined();
      expect(data.message).toBe('동의가 저장되었습니다');
    });
  });

  describe('DELETE /api/consent', () => {
    it('인증되지 않은 사용자는 401 반환', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest('DELETE', { analysisType: 'skin' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('잘못된 분석 타입은 400 반환', async () => {
      const request = createMockRequest('DELETE', { analysisType: 'invalid' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid analysis type');
    });

    it('동의 철회 시 이미지 삭제 후 soft delete', async () => {
      // Storage에 파일이 있는 경우
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({
        data: [{ name: 'image1.jpg' }, { name: 'image2.jpg' }],
        error: null,
      });

      mockServiceClient._mocks.mockRemove.mockResolvedValueOnce({
        error: null,
      });

      const request = createMockRequest('DELETE', { analysisType: 'skin' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('동의가 철회되었습니다');
      expect(data.deletedImages).toBe(2);
    });

    it('이미지가 없어도 동의 철회 성공', async () => {
      // Storage에 파일이 없는 경우
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = createMockRequest('DELETE', { analysisType: 'skin' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('동의가 철회되었습니다');
      expect(data.deletedImages).toBe(0);
    });
  });
});
