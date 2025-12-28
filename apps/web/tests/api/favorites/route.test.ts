/**
 * 즐겨찾기 API 테스트 (성분/소재)
 * Hybrid 도메인 - Beauty(성분) / Style(소재)
 *
 * - GET /api/favorites - 즐겨찾기 목록 조회
 * - POST /api/favorites - 즐겨찾기 추가
 * - DELETE /api/favorites - 즐겨찾기 삭제
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/favorites/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock 즐겨찾기 데이터
const mockFavorites = [
  {
    id: 'fav-1',
    clerk_user_id: 'user-123',
    domain: 'beauty',
    item_type: 'ingredient',
    item_name: '히알루론산',
    item_name_en: 'Hyaluronic Acid',
    isFavorite: true,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'fav-2',
    clerk_user_id: 'user-123',
    domain: 'beauty',
    item_type: 'ingredient',
    item_name: '레티놀',
    item_name_en: 'Retinol',
    isFavorite: false, // 기피 성분
    created_at: '2025-12-01T09:00:00Z',
  },
  {
    id: 'fav-3',
    clerk_user_id: 'user-123',
    domain: 'style',
    item_type: 'material',
    item_name: '실크',
    item_name_en: 'Silk',
    isFavorite: true,
    created_at: '2025-12-01T08:00:00Z',
  },
];

// Supabase mock builder 생성
const createMockSupabaseClient = (overrides: {
  selectData?: unknown[];
  selectError?: { message: string } | null;
  upsertData?: unknown;
  upsertError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) => {
  const {
    selectData = mockFavorites,
    selectError = null,
    upsertData = mockFavorites[0],
    upsertError = null,
    deleteError = null,
  } = overrides;

  const builder = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
    single: vi.fn().mockResolvedValue({ data: upsertData, error: upsertError }),
  };

  // DELETE의 경우 마지막 eq에서 resolve
  if (deleteError !== null || deleteError === null) {
    let eqCount = 0;
    builder.eq = vi.fn().mockImplementation(() => {
      eqCount++;
      // DELETE by ID: 2번, DELETE by name: 4번
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

describe('즐겨찾기(성분/소재) API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    mockSupabase = createMockSupabaseClient();
  });

  describe('GET /api/favorites', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/favorites');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('사용자의 전체 즐겨찾기 목록을 반환한다', async () => {
      const request = createNextRequest('/api/favorites');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.favorites).toBeDefined();
      expect(data.avoids).toBeDefined();
    });

    it('빈 목록을 반환할 수 있다', async () => {
      mockSupabase = createMockSupabaseClient({ selectData: [] });

      const request = createNextRequest('/api/favorites');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.favorites).toEqual([]);
      expect(data.avoids).toEqual([]);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: [],
        selectError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/favorites');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('POST /api/favorites', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: { domain: 'beauty', itemType: 'ingredient', itemName: '비타민C' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('Beauty 성분을 즐겨찾기에 추가한다', async () => {
      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: {
          domain: 'beauty',
          itemType: 'ingredient',
          itemName: '비타민C',
          itemNameEn: 'Vitamin C',
          isFavorite: true,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabase._builder.upsert).toHaveBeenCalled();
    });

    it('Style 소재를 즐겨찾기에 추가한다', async () => {
      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: {
          domain: 'style',
          itemType: 'material',
          itemName: '캐시미어',
          isFavorite: true,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('유효하지 않은 도메인은 400을 반환한다', async () => {
      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: { domain: 'invalid', itemType: 'ingredient', itemName: '테스트' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('도메인');
    });

    it('유효하지 않은 아이템 타입은 400을 반환한다', async () => {
      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: { domain: 'beauty', itemType: 'invalid', itemName: '테스트' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('아이템 타입');
    });

    it('아이템 이름 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: { domain: 'beauty', itemType: 'ingredient' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('아이템 이름');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        upsertError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/favorites', {
        method: 'POST',
        body: { domain: 'beauty', itemType: 'ingredient', itemName: '테스트' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('DELETE /api/favorites', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/favorites?id=fav-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('ID로 즐겨찾기를 삭제한다', async () => {
      const request = createNextRequest('/api/favorites?id=fav-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('파라미터 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/favorites', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        deleteError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/favorites?id=fav-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });
});
