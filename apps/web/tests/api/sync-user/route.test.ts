/**
 * 사용자 동기화 API 테스트
 * Clerk → Supabase 사용자 정보 동기화
 *
 * - POST /api/sync-user - 로그인 후 사용자 동기화
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth & clerkClient
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

// Mock Supabase service role client
const mockUpsertSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockUpsertSingle });
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

import { POST } from '@/app/api/sync-user/route';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Mock Clerk 사용자 데이터
const mockClerkUser = {
  id: 'user_clerk_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: '길동',
  lastName: '홍',
  imageUrl: 'https://example.com/avatar.jpg',
};

// Mock Supabase 사용자 데이터
const mockSupabaseUser = {
  id: 'uuid-123',
  clerk_user_id: 'user_clerk_123',
  email: 'test@example.com',
  first_name: '길동',
  last_name: '홍',
  image_url: 'https://example.com/avatar.jpg',
  created_at: '2025-12-01T10:00:00Z',
  updated_at: '2025-12-01T10:00:00Z',
};

describe('사용자 동기화 API (POST /api/sync-user)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본: 인증된 사용자
    vi.mocked(auth).mockResolvedValue({ userId: 'user_clerk_123' } as never);

    // 기본: Clerk 사용자 조회 성공
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue(mockClerkUser),
      },
    } as never);

    // 기본: Supabase upsert 성공
    mockUpsertSingle.mockResolvedValue({
      data: mockSupabaseUser,
      error: null,
    });
  });

  describe('인증 검증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      // Given: userId가 없는 인증 상태
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 401 Unauthorized
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Clerk 사용자 조회', () => {
    it('Clerk에서 사용자를 찾을 수 없으면 404를 반환한다', async () => {
      // Given: Clerk에서 null 반환
      vi.mocked(clerkClient).mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue(null),
        },
      } as never);

      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 404 Not Found
      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('Clerk API 에러 시 500을 반환한다', async () => {
      // Given: Clerk API 에러
      vi.mocked(clerkClient).mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockRejectedValue(new Error('Clerk API error')),
        },
      } as never);

      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 500 Internal Server Error
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Supabase 동기화', () => {
    it('사용자 정보를 Supabase에 성공적으로 동기화한다', async () => {
      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 성공 응답
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockSupabaseUser);

      // upsert 호출 확인
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          clerk_user_id: 'user_clerk_123',
          email: 'test@example.com',
          first_name: '길동',
          last_name: '홍',
          image_url: 'https://example.com/avatar.jpg',
        },
        { onConflict: 'clerk_user_id' }
      );
    });

    it('이메일이 없는 사용자도 동기화할 수 있다', async () => {
      // Given: 이메일 없는 Clerk 사용자
      const userWithoutEmail = {
        ...mockClerkUser,
        emailAddresses: [],
      };
      vi.mocked(clerkClient).mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue(userWithoutEmail),
        },
      } as never);

      const expectedSupabaseUser = {
        ...mockSupabaseUser,
        email: null,
      };
      mockUpsertSingle.mockResolvedValueOnce({
        data: expectedSupabaseUser,
        error: null,
      });

      // When: API 호출
      const response = await POST();
      await response.json();

      // Then: 성공 (email은 null)
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ email: null }),
        expect.any(Object)
      );
    });

    it('이름이 없는 사용자도 동기화할 수 있다', async () => {
      // Given: 이름 없는 Clerk 사용자
      const userWithoutName = {
        ...mockClerkUser,
        firstName: null,
        lastName: null,
      };
      vi.mocked(clerkClient).mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue(userWithoutName),
        },
      } as never);

      const expectedSupabaseUser = {
        ...mockSupabaseUser,
        first_name: null,
        last_name: null,
      };
      mockUpsertSingle.mockResolvedValueOnce({
        data: expectedSupabaseUser,
        error: null,
      });

      // When: API 호출
      const response = await POST();
      await response.json();

      // Then: 성공 (이름은 null)
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: null,
          last_name: null,
        }),
        expect.any(Object)
      );
    });

    it('프로필 이미지가 없는 사용자도 동기화할 수 있다', async () => {
      // Given: 이미지 없는 Clerk 사용자
      const userWithoutImage = {
        ...mockClerkUser,
        imageUrl: null,
      };
      vi.mocked(clerkClient).mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue(userWithoutImage),
        },
      } as never);

      const expectedSupabaseUser = {
        ...mockSupabaseUser,
        image_url: null,
      };
      mockUpsertSingle.mockResolvedValueOnce({
        data: expectedSupabaseUser,
        error: null,
      });

      // When: API 호출
      const response = await POST();
      await response.json();

      // Then: 성공 (이미지는 null)
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ image_url: null }),
        expect.any(Object)
      );
    });

    it('Supabase upsert 에러 시 500을 반환한다', async () => {
      // Given: Supabase 에러
      mockUpsertSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 500 에러
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to sync user');
      expect(data.details).toBe('Database error');
    });

    it('기존 사용자는 업데이트된다 (onConflict: clerk_user_id)', async () => {
      // Given: 기존 사용자 업데이트
      const updatedSupabaseUser = {
        ...mockSupabaseUser,
        updated_at: '2025-12-15T10:00:00Z',
      };
      mockUpsertSingle.mockResolvedValueOnce({
        data: updatedSupabaseUser,
        error: null,
      });

      // When: API 호출
      const response = await POST();
      await response.json();

      // Then: 성공 및 onConflict 설정 확인
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith(expect.any(Object), { onConflict: 'clerk_user_id' });
    });
  });

  describe('에러 핸들링', () => {
    it('예상치 못한 에러 발생 시 500을 반환한다', async () => {
      // Given: auth()에서 예외 발생
      vi.mocked(auth).mockRejectedValueOnce(new Error('Unexpected error'));

      // When: API 호출
      const response = await POST();
      const data = await response.json();

      // Then: 500 Internal Server Error
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
