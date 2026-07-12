/**
 * 계정 즉시삭제 API 테스트
 * DELETE /api/user/account
 *
 * @see app/api/user/account/route.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Supabase mock
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));

// Clerk mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

// 헬퍼: DELETE 요청 생성
function createDeleteRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/user/account', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

// 헬퍼: 삭제 체인 목 (모든 테이블 delete().eq() 성공)
function setupDeletionMocks(): void {
  mockFrom.mockImplementation(() => ({
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }));
  // 스토리지: 빈 버킷 (purgeUserStorage가 조용히 통과)
  mockStorageFrom.mockReturnValue({
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  });
}

// 헬퍼: Clerk 사용자 목
function mockClerkUser(email: string, deleteUser = vi.fn().mockResolvedValue({})) {
  return {
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: email }],
      }),
      deleteUser,
    },
  };
}

describe('DELETE /api/user/account', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('인증되지 않은 사용자는 401을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({ confirmation: 'test@example.com' }));

    expect(response.status).toBe(401);
  });

  it('확인 이메일이 없으면 400을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({}));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('CONFIRMATION_REQUIRED');
  });

  it('확인 이메일이 일치하지 않으면 400을 반환한다', async () => {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    vi.mocked(clerkClient).mockResolvedValue(mockClerkUser('real@example.com') as never);

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({ confirmation: 'wrong@example.com' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('CONFIRMATION_MISMATCH');
  });

  it('계정 삭제 성공 시 200과 삭제 시각을 반환한다', async () => {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    const deleteUser = vi.fn().mockResolvedValue({});
    vi.mocked(clerkClient).mockResolvedValue(
      mockClerkUser('test@example.com', deleteUser) as never
    );
    setupDeletionMocks();

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({ confirmation: 'test@example.com' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.deletedAt).toBeDefined();
    // Clerk 계정도 삭제됨
    expect(deleteUser).toHaveBeenCalledWith('user-123');
  });

  it('누락되어 있던 5축·트윈 테이블(hair/makeup/integrated/twins)을 파기한다', async () => {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    vi.mocked(clerkClient).mockResolvedValue(mockClerkUser('test@example.com') as never);
    setupDeletionMocks();

    const { DELETE } = await import('@/app/api/user/account/route');
    await DELETE(createDeleteRequest({ confirmation: 'test@example.com' }));

    const deletedTables = mockFrom.mock.calls.map((call) => call[0]);
    expect(deletedTables).toContain('hair_analyses');
    expect(deletedTables).toContain('makeup_analyses');
    expect(deletedTables).toContain('integrated_analysis_sessions');
    expect(deletedTables).toContain('user_twins');
    // 기존 5축·동의 기록도 유지
    expect(deletedTables).toContain('skin_analyses');
    expect(deletedTables).toContain('image_consents');
    expect(deletedTables).toContain('users');
  });
});
