/**
 * ConnectionAwareness 배치 통계 집계 Cron API 테스트
 *
 * @route POST/GET /api/cron/connection-stats
 * @description 사용자별 connection_awareness 상태를 집계하여
 *              connection_awareness_stats 테이블에 UPSERT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/cron/connection-stats/route';

// --- Mocks ---

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// --- Helpers ---

function createCronRequest(authToken?: string, method = 'POST'): NextRequest {
  const headers: Record<string, string> = {};
  if (authToken !== undefined) {
    headers['authorization'] = `Bearer ${authToken}`;
  }
  return new NextRequest('http://localhost/api/cron/connection-stats', {
    method,
    headers,
  });
}

function setupMockFrom(tableName: string): void {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'connection_awareness') {
      return { select: mockSelect };
    }
    if (table === 'connection_awareness_stats') {
      return { upsert: mockUpsert };
    }
    return {};
  });
}

// --- Tests ---

describe('POST /api/cron/connection-stats', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-secret' };
    setupMockFrom('connection_awareness');
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // ============================================
  // 인증 (Authorization)
  // ============================================

  describe('인증 검증', () => {
    it('authorization 헤더가 없으면 401을 반환한다', async () => {
      const req = createCronRequest(undefined);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('잘못된 CRON_SECRET으로 요청하면 401을 반환한다', async () => {
      const req = createCronRequest('wrong-secret');

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('올바른 CRON_SECRET으로 요청하면 인증을 통과한다', async () => {
      mockSelect.mockReturnValue({
        data: [],
        error: null,
      });

      const req = createCronRequest('test-secret');

      const response = await POST(req);

      expect(response.status).toBe(200);
    });

    it('CRON_SECRET 환경변수가 없으면 인증을 건너뛴다', async () => {
      delete process.env.CRON_SECRET;

      mockSelect.mockReturnValue({
        data: [],
        error: null,
      });

      const req = createCronRequest(undefined);
      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // 빈 데이터 처리
  // ============================================

  describe('빈 데이터 처리', () => {
    it('connection 데이터가 없으면 processed 0을 반환한다', async () => {
      mockSelect.mockReturnValue({
        data: [],
        error: null,
      });

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
      expect(data.upserted).toBe(0);
      expect(data.errors).toBe(0);
    });

    it('data가 null이면 빈 배열처럼 처리한다', async () => {
      mockSelect.mockReturnValue({
        data: null,
        error: null,
      });

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
    });
  });

  // ============================================
  // 정상 집계
  // ============================================

  describe('정상 집계', () => {
    it('단일 사용자의 상태를 올바르게 집계한다', async () => {
      mockSelect.mockReturnValue({
        data: [
          { clerk_user_id: 'user_1', status: 'exposed' },
          { clerk_user_id: 'user_1', status: 'exposed' },
          { clerk_user_id: 'user_1', status: 'recognized' },
          { clerk_user_id: 'user_1', status: 'internalized' },
        ],
        error: null,
      });

      mockUpsert.mockReturnValue({ error: null });

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.upserted).toBe(1);
      expect(data.errors).toBe(0);

      // upsert 호출 검증: internalization_rate = (1+0)/4 = 0.25
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      const upsertArg = mockUpsert.mock.calls[0][0];
      expect(upsertArg.clerk_user_id).toBe('user_1');
      expect(upsertArg.total_connections).toBe(4);
      expect(upsertArg.exposed_count).toBe(2);
      expect(upsertArg.recognized_count).toBe(1);
      expect(upsertArg.internalized_count).toBe(1);
      expect(upsertArg.independent_count).toBe(0);
      expect(upsertArg.internalization_rate).toBe(0.25);
    });

    it('여러 사용자를 각각 집계한다', async () => {
      mockSelect.mockReturnValue({
        data: [
          { clerk_user_id: 'user_1', status: 'exposed' },
          { clerk_user_id: 'user_2', status: 'internalized' },
          { clerk_user_id: 'user_2', status: 'independent' },
          { clerk_user_id: 'user_3', status: 'recognized' },
        ],
        error: null,
      });

      mockUpsert.mockReturnValue({ error: null });

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(3);
      expect(data.upserted).toBe(3);
      expect(data.errors).toBe(0);

      // 3명의 사용자에 대해 각각 upsert 호출
      expect(mockUpsert).toHaveBeenCalledTimes(3);
    });

    it('internalization_rate를 소수점 4자리로 반올림한다', async () => {
      // 3개 중 1개가 internalized: rate = 1/3 = 0.3333...
      mockSelect.mockReturnValue({
        data: [
          { clerk_user_id: 'user_1', status: 'exposed' },
          { clerk_user_id: 'user_1', status: 'recognized' },
          { clerk_user_id: 'user_1', status: 'internalized' },
        ],
        error: null,
      });

      mockUpsert.mockReturnValue({ error: null });

      const req = createCronRequest('test-secret');
      await POST(req);

      const upsertArg = mockUpsert.mock.calls[0][0];
      // Math.round(0.3333 * 10000) / 10000 = 0.3333
      expect(upsertArg.internalization_rate).toBe(0.3333);
    });

    it('upsert 시 onConflict: clerk_user_id를 전달한다', async () => {
      mockSelect.mockReturnValue({
        data: [{ clerk_user_id: 'user_1', status: 'exposed' }],
        error: null,
      });

      mockUpsert.mockReturnValue({ error: null });

      const req = createCronRequest('test-secret');
      await POST(req);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ clerk_user_id: 'user_1' }),
        { onConflict: 'clerk_user_id' }
      );
    });
  });

  // ============================================
  // 에러 처리
  // ============================================

  describe('에러 처리', () => {
    it('connection_awareness 조회 실패 시 500을 반환한다', async () => {
      mockSelect.mockReturnValue({
        data: null,
        error: { message: 'DB connection failed', code: 'PGRST000' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to query connections');

      consoleSpy.mockRestore();
    });

    it('upsert 실패 시 errorCount를 증가시키고 계속 진행한다', async () => {
      mockSelect.mockReturnValue({
        data: [
          { clerk_user_id: 'user_1', status: 'exposed' },
          { clerk_user_id: 'user_2', status: 'recognized' },
        ],
        error: null,
      });

      // 첫 번째 upsert 실패, 두 번째 성공
      mockUpsert
        .mockReturnValueOnce({ error: { message: 'Upsert failed' } })
        .mockReturnValueOnce({ error: null });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(2);
      expect(data.upserted).toBe(1);
      expect(data.errors).toBe(1);

      consoleSpy.mockRestore();
    });

    it('예기치 않은 예외 발생 시 500을 반환한다', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected crash');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');

      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // 응답 형식 검증
  // ============================================

  describe('응답 형식 검증', () => {
    it('성공 응답에 success, processed, upserted, errors 필드가 포함된다', async () => {
      mockSelect.mockReturnValue({ data: [], error: null });

      const req = createCronRequest('test-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('processed');
      expect(data).toHaveProperty('upserted');
      expect(data).toHaveProperty('errors');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.processed).toBe('number');
      expect(typeof data.upserted).toBe('number');
      expect(typeof data.errors).toBe('number');
    });

    it('에러 응답에 error 필드가 포함된다', async () => {
      const req = createCronRequest('wrong-secret');
      const response = await POST(req);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });

  // ============================================
  // GET 핸들러 (Vercel Cron 호환)
  // ============================================

  describe('GET 핸들러', () => {
    it('GET 요청도 POST와 동일하게 동작한다', async () => {
      mockSelect.mockReturnValue({ data: [], error: null });

      const req = createCronRequest('test-secret', 'GET');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
    });

    it('GET에서도 인증 검증이 적용된다', async () => {
      const req = createCronRequest('wrong-secret', 'GET');
      const response = await GET(req);

      expect(response.status).toBe(401);
    });
  });
});
