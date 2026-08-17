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

  // 회귀: 파기 실패를 console.warn만 남기고 Clerk 계정을 지운 뒤 200을 돌려주던 결함.
  // 계정이 사라지면 사용자는 다시 로그인할 수도, 남은 행·이미지를 지울 수도 없다
  // ("사진·개인정보는 남았는데 재시도 불가" = GDPR Art.17·PIPA 위반 상태).
  it('DB 파기가 실패하면 Clerk 계정을 삭제하지 않고 실패를 반환한다', async () => {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    const deleteUser = vi.fn().mockResolvedValue({});
    vi.mocked(clerkClient).mockResolvedValue(
      mockClerkUser('test@example.com', deleteUser) as never
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // skin_analyses만 권한 오류로 실패 (부재 코드가 아니므로 진짜 실패)
    mockFrom.mockImplementation((table: string) => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error:
            table === 'skin_analyses'
              ? { code: '42501', message: 'permission denied for column clerk_user_id' }
              : null,
        }),
      }),
    }));
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({ confirmation: 'test@example.com' }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('DELETION_FAILED');
    // 핵심: 계정이 남아야 재시도할 수 있다
    expect(deleteUser).not.toHaveBeenCalled();
    // 사용자에게 재시도 가능함을 알린다
    expect(json.message).toContain('다시 시도');
    consoleError.mockRestore();
  });

  it('스토리지 파기가 실패해도 Clerk 계정을 삭제하지 않는다 (이미지 잔존 차단)', async () => {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
    const deleteUser = vi.fn().mockResolvedValue({});
    vi.mocked(clerkClient).mockResolvedValue(
      mockClerkUser('test@example.com', deleteUser) as never
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // DB는 모두 성공, 스토리지에 파일은 있는데 삭제가 실패 → failedBuckets 발생
    mockFrom.mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }));
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [{ name: 'face.jpg', id: 'file-1' }], error: null }),
      remove: vi.fn().mockResolvedValue({ error: { message: 'storage unavailable' } }),
    });

    const { DELETE } = await import('@/app/api/user/account/route');
    const response = await DELETE(createDeleteRequest({ confirmation: 'test@example.com' }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(deleteUser).not.toHaveBeenCalled();
    consoleError.mockRestore();
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
