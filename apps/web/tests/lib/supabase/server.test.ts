/**
 * Supabase Server 클라이언트 테스트 (Clerk 통합)
 *
 * - createClerkSupabaseClient 함수 검증
 * - accessToken 콜백 동작 (Clerk auth 연동)
 * - 토큰 null 시 경고 로그
 * - auth() 에러 시 에러 로그 + null 반환
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// accessToken 콜백 캡처
let capturedAccessTokenFn: (() => Promise<string | null>) | undefined;

const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
}));

const mockGetToken = vi.fn().mockResolvedValue('server-jwt-token');
const mockAuth = vi.fn().mockResolvedValue({
  getToken: mockGetToken,
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(
    (_url: string, _key: string, options?: { accessToken?: () => Promise<string | null> }) => {
      capturedAccessTokenFn = options?.accessToken;
      return { from: mockFrom };
    }
  ),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

describe('createClerkSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAccessTokenFn = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('Supabase 클라이언트 객체를 반환해야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const client = createClerkSupabaseClient();

    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('올바른 URL과 Anon Key로 createClient를 호출해야 한다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');

    createClerkSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        accessToken: expect.any(Function),
      })
    );
  });

  it('accessToken 옵션에 콜백 함수를 전달해야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');

    createClerkSupabaseClient();

    expect(capturedAccessTokenFn).toBeDefined();
    expect(typeof capturedAccessTokenFn).toBe('function');
  });

  it('매번 새로운 클라이언트를 생성해야 한다 (싱글톤 아님)', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');

    createClerkSupabaseClient();
    createClerkSupabaseClient();

    expect(createClient).toHaveBeenCalledTimes(2);
  });
});

describe('accessToken 콜백 동작', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAccessTokenFn = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('Clerk auth().getToken()이 성공하면 토큰을 반환해야 한다', async () => {
    mockGetToken.mockResolvedValue('valid-server-token');

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    createClerkSupabaseClient();

    expect(capturedAccessTokenFn).toBeDefined();
    const token = await capturedAccessTokenFn!();
    expect(token).toBe('valid-server-token');
  });

  it('getToken()이 null을 반환하면 경고 로그를 출력하고 null을 반환해야 한다', async () => {
    mockGetToken.mockResolvedValue(null);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    createClerkSupabaseClient();

    const token = await capturedAccessTokenFn!();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token is null'));

    consoleSpy.mockRestore();
  });

  it('auth()가 에러를 throw하면 에러 로그와 함께 null을 반환해야 한다', async () => {
    const testError = new Error('Clerk auth failed');
    mockAuth.mockRejectedValue(testError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    createClerkSupabaseClient();

    const token = await capturedAccessTokenFn!();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get token'),
      testError
    );

    consoleSpy.mockRestore();
  });

  it('getToken()이 에러를 throw하면 에러 로그와 함께 null을 반환해야 한다', async () => {
    const tokenError = new Error('Token fetch failed');
    mockGetToken.mockRejectedValue(tokenError);
    mockAuth.mockResolvedValue({ getToken: mockGetToken });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    createClerkSupabaseClient();

    const token = await capturedAccessTokenFn!();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get token'),
      tokenError
    );

    consoleSpy.mockRestore();
  });
});
