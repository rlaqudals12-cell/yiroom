/**
 * N-1 즐겨찾기 API 테스트
 * Task 2.15: 즐겨찾기 API
 *
 * 자주 먹는 음식 관리:
 * - GET /api/nutrition/favorites - 목록 조회
 * - POST /api/nutrition/favorites - 추가
 * - DELETE /api/nutrition/favorites/[id] - 삭제
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/nutrition/favorites/route';
import { DELETE } from '@/app/api/nutrition/favorites/[id]/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase service role client
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// Mock 요청 헬퍼
function createMockRequest(
  body?: Record<string, unknown>,
  method: string = 'GET'
): Request {
  const url = 'http://localhost/api/nutrition/favorites';
  return {
    url,
    method,
    json: () => Promise.resolve(body || {}),
  } as Request;
}

// Mock 즐겨찾기 데이터
const mockFavorites = [
  {
    id: 'fav-1',
    clerk_user_id: 'user-123',
    food_id: 'food-1',
    food_name: '비빔밥',
    custom_name: null,
    category: 'lunch',
    default_serving: 1.0,
    use_count: 5,
    last_used_at: '2025-12-01T12:00:00Z',
    added_at: '2025-11-01T10:00:00Z',
  },
  {
    id: 'fav-2',
    clerk_user_id: 'user-123',
    food_id: 'food-2',
    food_name: '김치찌개',
    custom_name: '엄마표 김치찌개',
    category: 'dinner',
    default_serving: 1.5,
    use_count: 10,
    last_used_at: '2025-12-01T19:00:00Z',
    added_at: '2025-10-15T10:00:00Z',
  },
];

describe('즐겨찾기 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 인증 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

    // Supabase 체이닝 설정
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockResolvedValue({ data: mockFavorites, error: null });
    mockSupabase.insert.mockReturnThis();
    mockSupabase.single.mockResolvedValue({ data: mockFavorites[0], error: null });
    mockSupabase.delete.mockReturnThis();
  });

  describe('GET /api/nutrition/favorites', () => {
    describe('인증', () => {
      it('인증되지 않은 요청은 401을 반환한다', async () => {
        vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('목록 조회', () => {
      it('사용자의 즐겨찾기 목록을 반환한다', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.favorites).toHaveLength(2);
        expect(data.favorites[0].food_name).toBe('비빔밥');
      });

      it('사용 횟수 내림차순으로 정렬한다', async () => {
        await GET();

        expect(mockSupabase.order).toHaveBeenCalledWith('use_count', { ascending: false });
      });

      it('빈 목록을 반환할 수 있다', async () => {
        mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.favorites).toEqual([]);
      });

      it('DB 에러 시 500을 반환한다', async () => {
        mockSupabase.limit.mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch favorites');
      });
    });
  });

  describe('POST /api/nutrition/favorites', () => {
    describe('인증', () => {
      it('인증되지 않은 요청은 401을 반환한다', async () => {
        vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

        const request = createMockRequest({ food_name: '비빔밥' }, 'POST');
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('즐겨찾기 추가', () => {
      it('음식을 즐겨찾기에 추가한다', async () => {
        const request = createMockRequest({
          food_id: 'food-1',
          food_name: '비빔밥',
          category: 'lunch',
        }, 'POST');

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.favorite).toBeDefined();
        expect(mockSupabase.insert).toHaveBeenCalled();
      });

      it('food_name 없이 요청하면 400을 반환한다', async () => {
        const request = createMockRequest({
          food_id: 'food-1',
        }, 'POST');

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('food_name');
      });

      it('선택적 필드를 함께 저장할 수 있다', async () => {
        const request = createMockRequest({
          food_id: 'food-1',
          food_name: '비빔밥',
          category: 'lunch',
          custom_name: '내가 좋아하는 비빔밥',
          default_serving: 1.5,
        }, 'POST');

        await POST(request);

        expect(mockSupabase.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            food_name: '비빔밥',
            custom_name: '내가 좋아하는 비빔밥',
            default_serving: 1.5,
          })
        );
      });

      it('중복 추가 시 409를 반환한다', async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { code: '23505', message: 'duplicate key' },
        });

        const request = createMockRequest({
          food_id: 'food-1',
          food_name: '비빔밥',
        }, 'POST');

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain('already');
      });

      it('DB 에러 시 500을 반환한다', async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

        const request = createMockRequest({
          food_id: 'food-1',
          food_name: '비빔밥',
        }, 'POST');

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to add favorite');
      });
    });
  });

  describe('DELETE /api/nutrition/favorites/[id]', () => {
    const mockParams = { id: 'fav-1' };

    describe('인증', () => {
      it('인증되지 않은 요청은 401을 반환한다', async () => {
        vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

        const request = createMockRequest(undefined, 'DELETE');
        const response = await DELETE(request, { params: Promise.resolve(mockParams) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('즐겨찾기 삭제', () => {
      it('즐겨찾기를 삭제한다', async () => {
        // DELETE 체이닝: delete().eq().eq().select().single()
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'fav-1' }, error: null });

        const request = createMockRequest(undefined, 'DELETE');
        const response = await DELETE(request, { params: Promise.resolve(mockParams) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('삭제');
      });

      it('존재하지 않는 ID는 404를 반환한다', async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: null,
        });

        const request = createMockRequest(undefined, 'DELETE');
        const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain('not found');
      });

      it('DB 에러 시 500을 반환한다', async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

        const request = createMockRequest(undefined, 'DELETE');
        const response = await DELETE(request, { params: Promise.resolve(mockParams) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to delete favorite');
      });
    });
  });
});
