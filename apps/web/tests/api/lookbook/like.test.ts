/**
 * 룩북 좋아요 API 테스트
 * /api/lookbook/[id]/like
 *
 * - GET: 좋아요 상태 확인
 * - POST: 좋아요 추가
 * - DELETE: 좋아요 취소
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/lookbook/[id]/like/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Supabase mock builder 생성
const createMockSupabaseClient = (overrides: {
  selectData?: unknown;
  selectError?: { message: string; code?: string } | null;
  insertError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) => {
  const {
    selectData = null,
    selectError = null,
    insertError = null,
    deleteError = null,
  } = overrides;

  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
  };

  // DELETE의 경우 마지막 eq에서 resolve
  let eqCount = 0;
  builder.eq = vi.fn().mockImplementation(() => {
    eqCount++;
    // DELETE는 eq를 2번 호출 (post_id, clerk_user_id)
    if (eqCount >= 2 && deleteError !== undefined) {
      // 이후 chain이 없으면 직접 resolve
      const deleteBuilder = {
        ...builder,
        then: (resolve: (value: { error: typeof deleteError }) => void) => {
          resolve({ error: deleteError });
        },
      };
      return deleteBuilder;
    }
    return builder;
  });

  // insert 체이닝
  builder.insert = vi.fn().mockResolvedValue({ error: insertError });

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

// 테스트용 params 생성
function createRouteParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// NextRequest 헬퍼
function createNextRequest(url: string, method: string = 'GET'): NextRequest {
  const reqUrl = new URL(url, 'http://localhost');
  return new NextRequest(reqUrl, { method });
}

describe('룩북 좋아요 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    mockSupabase = createMockSupabaseClient();
  });

  describe('GET /api/lookbook/[id]/like', () => {
    it('비인증 사용자는 isLiked: false를 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/lookbook/post-1/like');
      const response = await GET(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLiked).toBe(false);
    });

    it('좋아요하지 않은 포스트는 isLiked: false를 반환한다', async () => {
      // PGRST116: no rows returned (정상적인 "없음" 상태)
      mockSupabase = createMockSupabaseClient({
        selectData: null,
        selectError: { message: 'No rows', code: 'PGRST116' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like');
      const response = await GET(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLiked).toBe(false);
    });

    it('좋아요한 포스트는 isLiked: true를 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: { id: 'like-1' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like');
      const response = await GET(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLiked).toBe(true);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectError: { message: 'Database error', code: 'OTHER' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like');
      const response = await GET(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('POST /api/lookbook/[id]/like', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/lookbook/post-1/like', 'POST');
      const response = await POST(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('이미 좋아요한 포스트는 200을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: { id: 'existing-like' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like', 'POST');
      const response = await POST(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('이미');
    });

    it('새 좋아요를 추가하면 201을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: null,
        selectError: { message: 'No rows', code: 'PGRST116' },
        insertError: null,
      });

      const request = createNextRequest('/api/lookbook/post-1/like', 'POST');
      const response = await POST(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.isLiked).toBe(true);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: null,
        selectError: { message: 'No rows', code: 'PGRST116' },
        insertError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like', 'POST');
      const response = await POST(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('DELETE /api/lookbook/[id]/like', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/lookbook/post-1/like', 'DELETE');
      const response = await DELETE(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('좋아요를 취소하면 isLiked: false를 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({ deleteError: null });

      const request = createNextRequest('/api/lookbook/post-1/like', 'DELETE');
      const response = await DELETE(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isLiked).toBe(false);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        deleteError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/lookbook/post-1/like', 'DELETE');
      const response = await DELETE(request, createRouteParams('post-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });
});
