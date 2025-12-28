/**
 * 루틴 API 테스트
 * Hybrid 도메인 - Beauty(스킨케어) / Style(코디)
 *
 * - GET /api/routines - 루틴 목록 조회
 * - POST /api/routines - 루틴 생성
 * - PUT /api/routines - 루틴 수정
 * - DELETE /api/routines - 루틴 삭제
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/routines/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock 루틴 데이터
const mockRoutines = [
  {
    id: 'routine-1',
    clerk_user_id: 'user-123',
    domain: 'beauty',
    routine_type: 'morning',
    items: [
      { step: 1, name: '클렌저', productId: 'prod-1' },
      { step: 2, name: '토너', productId: 'prod-2' },
    ],
    is_active: true,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'routine-2',
    clerk_user_id: 'user-123',
    domain: 'style',
    routine_type: 'daily',
    items: [{ occasion: 'daily', items: ['니트', '청바지'] }],
    is_active: true,
    created_at: '2025-12-01T09:00:00Z',
  },
];

// Supabase mock builder 생성
const createMockSupabaseClient = (overrides: {
  selectData?: unknown[];
  selectError?: { message: string } | null;
  insertData?: unknown;
  insertError?: { message: string } | null;
  updateData?: unknown;
  updateError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) => {
  const {
    selectData = mockRoutines,
    selectError = null,
    insertData = mockRoutines[0],
    insertError = null,
    updateData = mockRoutines[0],
    updateError = null,
    deleteError = null,
  } = overrides;

  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
    single: vi.fn().mockImplementation(() => {
      // POST는 insertData, PUT은 updateData
      return Promise.resolve({
        data: insertData || updateData,
        error: insertError || updateError,
      });
    }),
  };

  // DELETE의 경우 마지막 eq에서 resolve
  if (deleteError !== null || deleteError === null) {
    let eqCount = 0;
    builder.eq = vi.fn().mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) {
        return Promise.resolve({ error: deleteError });
      }
      return builder;
    });
  }

  return {
    from: vi.fn().mockReturnValue(builder),
    _builder: builder,
  };
};

let mockSupabase = createMockSupabaseClient();

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// NextRequest 헬퍼
function createNextRequest(
  url: string,
  options?: { method?: string; body?: unknown }
): NextRequest {
  const reqUrl = new URL(url, 'http://localhost');
  const headers = options?.body ? { 'Content-Type': 'application/json' } : undefined;
  const body = options?.body ? JSON.stringify(options.body) : undefined;

  return new NextRequest(reqUrl, {
    method: options?.method || 'GET',
    headers,
    body,
  });
}

describe('루틴 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    mockSupabase = createMockSupabaseClient();
  });

  describe('GET /api/routines', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/routines');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('사용자의 루틴 목록을 반환한다', async () => {
      const request = createNextRequest('/api/routines');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines).toHaveLength(2);
    });

    it('빈 목록을 반환할 수 있다', async () => {
      mockSupabase = createMockSupabaseClient({ selectData: [] });

      const request = createNextRequest('/api/routines');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines).toEqual([]);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: [],
        selectError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/routines');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('POST /api/routines', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: { domain: 'beauty', routineType: 'morning' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('Beauty 루틴을 생성한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: {
          domain: 'beauty',
          routineType: 'morning',
          items: [
            { step: 1, name: '클렌저' },
            { step: 2, name: '토너' },
          ],
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabase._builder.insert).toHaveBeenCalled();
    });

    it('Style 루틴을 생성한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: {
          domain: 'style',
          routineType: 'daily',
          items: [{ occasion: 'office', items: ['셔츠', '슬랙스'] }],
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('유효하지 않은 도메인은 400을 반환한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: { domain: 'invalid', routineType: 'morning' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('도메인');
    });

    it('루틴 타입 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: { domain: 'beauty' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('루틴 타입');
    });

    it('items가 배열이 아니면 400을 반환한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: { domain: 'beauty', routineType: 'morning', items: 'invalid' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('배열');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        insertError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/routines', {
        method: 'POST',
        body: { domain: 'beauty', routineType: 'morning', items: [] },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('PUT /api/routines', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/routines', {
        method: 'PUT',
        body: { id: 'routine-1', items: [] },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('ID 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/routines', {
        method: 'PUT',
        body: { items: [] },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('ID');
    });
  });

  describe('DELETE /api/routines', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/routines?id=routine-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('루틴을 삭제한다', async () => {
      const request = createNextRequest('/api/routines?id=routine-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('ID 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/routines', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('ID');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        deleteError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/routines?id=routine-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });
});
