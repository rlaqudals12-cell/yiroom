/**
 * 룩북 API 테스트
 * Style 도메인 - 룩북 피드
 *
 * - GET /api/lookbook - 룩북 피드 조회
 * - POST /api/lookbook - 포스트 생성
 * - DELETE /api/lookbook - 포스트 삭제
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/lookbook/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock 룩북 데이터
const mockPosts = [
  {
    id: 'post-1',
    clerk_user_id: 'user-123',
    image_url: '/images/lookbook/look-1.jpg',
    body_type: 'W',
    personal_color: 'Spring',
    caption: '봄 웜톤 데일리룩',
    outfit_items: [{ category: 'top', description: '니트' }],
    likes_count: 234,
    comments_count: 12,
    is_public: true,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'post-2',
    clerk_user_id: 'user-456',
    image_url: '/images/lookbook/look-2.jpg',
    body_type: 'S',
    personal_color: 'Summer',
    caption: '미니멀 오피스룩',
    outfit_items: [],
    likes_count: 156,
    comments_count: 8,
    is_public: true,
    created_at: '2025-12-01T09:00:00Z',
  },
];

// Supabase mock builder 생성 (체이닝 지원)
const createMockSupabaseClient = (overrides: {
  selectData?: unknown[];
  selectError?: { message: string } | null;
  insertData?: unknown;
  insertError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) => {
  const {
    selectData = mockPosts,
    selectError = null,
    insertData = mockPosts[0],
    insertError = null,
    deleteError = null,
  } = overrides;

  // 체이닝을 위한 builder
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
    single: vi.fn().mockResolvedValue({ data: insertData, error: insertError }),
  };

  // DELETE의 경우 마지막 eq에서 resolve
  if (deleteError !== null || deleteError === null) {
    let eqCount = 0;
    builder.eq = vi.fn().mockImplementation(() => {
      eqCount++;
      // DELETE는 eq를 2번 호출 (id, clerk_user_id)
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

describe('룩북 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 인증 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    // 기본 Supabase mock 재생성
    mockSupabase = createMockSupabaseClient();
  });

  describe('GET /api/lookbook', () => {
    it('공개 룩북 피드를 반환한다', async () => {
      const request = createNextRequest('/api/lookbook');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].caption).toBe('봄 웜톤 데일리룩');
    });

    it('hasMore 정보를 반환한다', async () => {
      // limit+1개가 반환되면 hasMore = true
      const postsWithMore = [...mockPosts, { id: 'post-3' }];
      mockSupabase = createMockSupabaseClient({ selectData: postsWithMore });

      const request = createNextRequest('/api/lookbook?limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(data.hasMore).toBe(true);
      expect(data.posts).toHaveLength(2);
    });

    it('빈 피드를 반환할 수 있다', async () => {
      mockSupabase = createMockSupabaseClient({ selectData: [] });

      const request = createNextRequest('/api/lookbook');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toEqual([]);
      expect(data.hasMore).toBe(false);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        selectData: [],
        selectError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/lookbook');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('POST /api/lookbook', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: { imageUrl: '/test.jpg' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('룩북 포스트를 생성한다', async () => {
      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: {
          imageUrl: '/images/new-look.jpg',
          caption: '새로운 룩',
          bodyType: 'W',
          personalColor: 'Spring',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabase._builder.insert).toHaveBeenCalled();
    });

    it('이미지 URL 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: { caption: '테스트' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('이미지');
    });

    it('유효하지 않은 체형은 400을 반환한다', async () => {
      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: { imageUrl: '/test.jpg', bodyType: 'X' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('체형');
    });

    it('유효하지 않은 퍼스널컬러는 400을 반환한다', async () => {
      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: { imageUrl: '/test.jpg', personalColor: 'Invalid' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('퍼스널컬러');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        insertError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/lookbook', {
        method: 'POST',
        body: { imageUrl: '/test.jpg' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });

  describe('DELETE /api/lookbook', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createNextRequest('/api/lookbook?id=post-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });

    it('포스트를 삭제한다', async () => {
      const request = createNextRequest('/api/lookbook?id=post-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('ID 없이 요청하면 400을 반환한다', async () => {
      const request = createNextRequest('/api/lookbook', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('ID');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase = createMockSupabaseClient({
        deleteError: { message: 'Database error' },
      });

      const request = createNextRequest('/api/lookbook?id=post-1', { method: 'DELETE' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('오류');
    });
  });
});
