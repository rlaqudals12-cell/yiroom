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
  LATEST_CONSENT_VERSION: 'v1.0',
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
  const mockMutationMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  let eqAwaitResult: { error: unknown; count?: number } = { error: null, count: 1 };

  // eq()는 체이닝과 최종 Promise 반환을 모두 지원해야 함
  const mockEq = vi.fn();
  const createEqChain = () => {
    const chainable = {
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      select: vi.fn().mockReturnValue({ maybeSingle: mockMutationMaybeSingle }),
      // Supabase는 thenable이므로 await 가능
      then: (resolve: (value: { error: unknown; count?: number }) => void) =>
        resolve(eqAwaitResult),
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
    insert: mockInsert,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
  });

  return {
    from: mockFrom,
    storage: mockStorage,
    _mocks: {
      mockFrom,
      mockSelect,
      mockEq,
      mockMaybeSingle,
      mockMutationMaybeSingle,
      mockSingle,
      mockUpdate,
      mockInsert,
      mockDelete,
      mockList,
      mockRemove,
      setEqAwaitResult: (value: { error: unknown; count?: number }) => {
        eqAwaitResult = value;
      },
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

    it.each(['hair', 'makeup', 'twin'] as const)(
      '%s 이미지 저장 동의 타입을 허용한다',
      async (type) => {
        mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
          data: null,
          error: null,
        });

        const request = createMockRequest('GET', { analysisType: type });
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(mockServiceClient._mocks.mockEq).toHaveBeenCalledWith('analysis_type', type);
      }
    );
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

    it('파기 대기 중인 축은 재동의로 덮지 않고 409를 반환한다', async () => {
      mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'consent_pending',
          consent_given: false,
          withdrawal_at: '2026-08-23T00:00:00.000Z',
          retention_until: '2027-08-23T00:00:00.000Z',
          updated_at: '2026-08-23T00:00:00.000Z',
        },
        error: null,
      });

      const response = await POST(
        createMockRequest('POST', {}, { analysisType: 'personal-color' })
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toEqual(
        expect.objectContaining({
          code: 'PURGE_PENDING',
          details: { retryable: true },
        })
      );
      expect(mockServiceClient._mocks.mockInsert).not.toHaveBeenCalled();
      expect(checkConsentEligibility).not.toHaveBeenCalled();
    });

    it('DELETE 완료 뒤 cron 재조정 전에는 retention이 null이어도 POST를 409로 잠근다', async () => {
      mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'consent_unreconciled',
          consent_given: false,
          withdrawal_at: '2026-08-22T00:00:00.000Z',
          retention_until: null,
          cleanup_reconciled_at: null,
          updated_at: '2026-08-22T00:00:00.000Z',
        },
        error: null,
      });

      const response = await POST(createMockRequest('POST', {}, { analysisType: 'skin' }));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('PURGE_PENDING');
      expect(data.error).toEqual(
        expect.objectContaining({
          userMessage: expect.stringContaining('사진 삭제 확인을 마무리'),
          details: { retryable: false },
        })
      );
      expect(checkConsentEligibility).not.toHaveBeenCalled();
      expect(mockServiceClient._mocks.mockUpdate).not.toHaveBeenCalled();
    });

    it('cron 재조정 timestamp가 기록된 철회 완료 행은 POST 재동의를 허용한다', async () => {
      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({
          data: {
            id: 'consent_reconciled',
            consent_given: false,
            withdrawal_at: '2026-08-20T00:00:00.000Z',
            retention_until: null,
            cleanup_reconciled_at: '2026-08-22T00:00:00.000Z',
            updated_at: '2026-08-22T00:00:00.000Z',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { birth_date: '1990-01-01' }, error: null });
      mockServiceClient._mocks.mockMutationMaybeSingle.mockResolvedValueOnce({
        data: { id: 'consent_reconciled', consent_given: true },
        error: null,
      });

      const response = await POST(createMockRequest('POST', {}, { analysisType: 'skin' }));

      expect(response.status).toBe(200);
      expect(mockServiceClient._mocks.mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          consent_given: true,
          withdrawal_at: null,
          cleanup_reconciled_at: null,
        })
      );
    });

    it('현재 동의 상태 조회 실패 시 fail-closed로 500을 반환한다', async () => {
      mockServiceClient._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'consent query unavailable' },
      });

      const response = await POST(createMockRequest('POST', {}, { analysisType: 'skin' }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('CONSENT_STATUS_CHECK_FAILED');
      expect(mockServiceClient._mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('14세 미만 사용자는 403 반환', async () => {
      vi.mocked(checkConsentEligibility).mockReturnValueOnce({
        canConsent: false,
        reason: 'under_age',
        requiredAction: '14세 미만은 이미지 저장 기능을 이용할 수 없어요',
      });

      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { birth_date: '2015-01-01' }, error: null });

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

      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { birth_date: null }, error: null });

      const request = createMockRequest('POST', {}, { analysisType: 'skin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.reason).toBe('no_birthdate');
    });

    it('사용자 프로필 조회 오류는 동의 가능으로 추정하지 않고 500으로 닫는다', async () => {
      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'profile unavailable' } });

      const request = createMockRequest('POST', {}, { analysisType: 'hair' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'AGE_VERIFICATION_FAILED' }),
        })
      );
      expect(mockServiceClient._mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('사용자 프로필 행이 없으면 생년월일 미확인으로 동의를 거부한다', async () => {
      vi.mocked(checkConsentEligibility).mockReturnValueOnce({
        canConsent: false,
        reason: 'no_birthdate',
        requiredAction: '생년월일을 프로필에 입력해주세요',
      });
      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const request = createMockRequest('POST', {}, { analysisType: 'makeup' });
      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(checkConsentEligibility).toHaveBeenCalledWith(undefined);
      expect(mockServiceClient._mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('유효한 동의 요청 시 동의 저장', async () => {
      const mockConsent = {
        id: 'consent_1',
        clerk_user_id: mockUserId,
        analysis_type: 'skin',
        consent_given: true,
        consent_version: 'v1.0',
      };

      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { birth_date: '1990-01-01' }, error: null });

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

    it('기존 행이 철회와 경합해 CAS 갱신되지 않으면 409를 반환한다', async () => {
      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({
          data: {
            id: 'consent_existing',
            consent_given: false,
            withdrawal_at: null,
            retention_until: null,
            updated_at: '2026-08-23T00:00:00.000Z',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { birth_date: '1990-01-01' }, error: null });
      mockServiceClient._mocks.mockMutationMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const response = await POST(createMockRequest('POST', {}, { analysisType: 'hair' }));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONSENT_STATE_CHANGED');
      expect(mockServiceClient._mocks.mockEq).toHaveBeenCalledWith(
        'updated_at',
        '2026-08-23T00:00:00.000Z'
      );
    });

    it.each(['hair', 'makeup', 'twin'] as const)('%s 이미지 저장 동의를 기록한다', async (type) => {
      mockServiceClient._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { birth_date: '1990-01-01' }, error: null });
      mockServiceClient._mocks.mockSingle.mockResolvedValueOnce({
        data: {
          id: `consent_${type}`,
          clerk_user_id: mockUserId,
          analysis_type: type,
          consent_given: true,
        },
        error: null,
      });

      const request = createMockRequest('POST', {}, { analysisType: type });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockServiceClient._mocks.mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ analysis_type: type, consent_given: true })
      );
    });
  });

  describe('DELETE /api/consent', () => {
    it('인증되지 않은 사용자는 401 반환', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest('DELETE', { analysisType: 'skin' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('잘못된 분석 타입은 400 반환', async () => {
      const request = createMockRequest('DELETE', { analysisType: 'invalid' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ANALYSIS_TYPE');
    });

    it('commit-after-reject로 늦게 생긴 객체도 DELETE prefix purge 뒤에만 완료 처리한다', async () => {
      // Storage에 파일이 있는 경우
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({
        data: [
          { id: 'file-1', name: 'image1.jpg' },
          { id: 'file-2', name: 'image2.jpg' },
        ],
        error: null,
      });

      mockServiceClient._mocks.mockRemove.mockResolvedValueOnce({
        error: null,
      });

      const request = createMockRequest('DELETE', { analysisType: 'skin' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deletedImages).toBe(2);
      expect(data.data.imagePointersCleared).toBe(true);
      expect(mockServiceClient._mocks.mockUpdate).toHaveBeenNthCalledWith(1, {
        consent_given: false,
        withdrawal_at: expect.any(String),
        cleanup_reconciled_at: null,
      });
      expect(mockServiceClient._mocks.mockUpdate).toHaveBeenCalledWith(
        { retention_until: null },
        { count: 'exact' }
      );
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
      expect(data.success).toBe(true);
      expect(data.data.deletedImages).toBe(0);
    });

    it.each([
      ['hair', 'hair-images'],
      ['makeup', 'makeup-images'],
      ['twin', 'twins'],
    ] as const)('%s 동의 철회 시 해당 비공개 버킷을 정리한다', async (type, bucket) => {
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({ data: [], error: null });

      const request = createMockRequest('DELETE', { analysisType: type });
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      expect(mockServiceClient.storage.from).toHaveBeenCalledWith(bucket);
    });

    it('twin 동의 철회는 생성 이미지를 지운 뒤 user_twins 레코드도 파기한다', async () => {
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({ data: [], error: null });

      const response = await DELETE(createMockRequest('DELETE', { analysisType: 'twin' }));

      expect(response.status).toBe(200);
      expect(mockServiceClient._mocks.mockFrom).toHaveBeenCalledWith('user_twins');
      expect(mockServiceClient._mocks.mockDelete).toHaveBeenCalledTimes(1);
      expect(mockServiceClient._mocks.mockEq).toHaveBeenCalledWith('clerk_user_id', mockUserId);
    });

    it('저장소 조회 실패 시 철회 상태를 먼저 유지하고 파기 대기를 500으로 드러낸다', async () => {
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({
        data: null,
        error: { message: 'storage unavailable' },
      });

      const request = createMockRequest('DELETE', { analysisType: 'hair' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toEqual(
        expect.objectContaining({
          code: 'CONSENT_REVOKED_PURGE_INCOMPLETE',
          details: expect.objectContaining({ consentRevoked: true, retryable: true }),
        })
      );

      const revokeCall = mockServiceClient._mocks.mockUpdate.mock.calls.find(
        ([values]) => values.consent_given === false
      );
      expect(revokeCall?.[0]).not.toHaveProperty('retention_until');
      expect(mockServiceClient._mocks.mockUpdate).not.toHaveBeenCalledWith({
        retention_until: null,
      });
      expect(mockServiceClient._mocks.mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        mockServiceClient._mocks.mockList.mock.invocationCallOrder[0]!
      );
    });

    it('파기 중 재동의되면 과거 DELETE가 새 보관 기한을 null로 확정하지 않는다', async () => {
      // count=0은 withdrawal_at CAS 조건이 더 이상 맞지 않는 재동의 경합을 뜻한다.
      mockServiceClient._mocks.setEqAwaitResult({ error: null, count: 0 });
      mockServiceClient._mocks.mockList.mockResolvedValueOnce({ data: [], error: null });

      const request = createMockRequest('DELETE', { analysisType: 'makeup' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toEqual(
        expect.objectContaining({
          code: 'CONSENT_STATE_CHANGED',
          details: expect.objectContaining({ consentRevoked: false, retryable: false }),
        })
      );
      expect(mockServiceClient._mocks.mockUpdate).toHaveBeenCalledWith(
        { retention_until: null },
        { count: 'exact' }
      );
      expect(mockServiceClient._mocks.mockEq).toHaveBeenCalledWith('consent_given', false);
      expect(mockServiceClient._mocks.mockEq).toHaveBeenCalledWith(
        'withdrawal_at',
        expect.any(String)
      );
    });
  });
});
