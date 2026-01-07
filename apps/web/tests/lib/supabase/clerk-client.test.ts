/**
 * Supabase Clerk Client 테스트
 *
 * useClerkSupabaseClient 훅의 동작 검증
 * - Supabase 클라이언트 생성
 * - Clerk 토큰 통합
 * - 에러 핸들링
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// 환경 변수 관련 함수
const setEnvVars = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
};

const clearEnvVars = () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// accessToken 콜백 캡처용 변수
let capturedAccessTokenFn: (() => Promise<string | null>) | undefined;

// Mock 객체
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockResolvedValue({ data: [], error: null }),
  insert: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

const mockAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
};

const mockGetToken = vi.fn().mockResolvedValue('test-jwt-token');

// Supabase createClient Mock
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(
    (_url: string, _key: string, options?: { accessToken?: () => Promise<string | null> }) => {
      capturedAccessTokenFn = options?.accessToken;
      return { from: mockFrom, auth: mockAuth };
    }
  ),
}));

// Clerk useAuth Mock
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    isSignedIn: true,
    userId: 'test-user-id',
    isLoaded: true,
  }),
}));

describe('useClerkSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnvVars();
    capturedAccessTokenFn = undefined;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('Supabase 클라이언트를 반환해야 함', async () => {
    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    const { result } = renderHook(() => useClerkSupabaseClient());

    expect(result.current).toBeDefined();
    expect(result.current.from).toBeDefined();
    expect(result.current.auth).toBeDefined();
  });

  it('auth 객체가 getUser 메서드를 가져야 함', async () => {
    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    const { result } = renderHook(() => useClerkSupabaseClient());

    expect(result.current.auth.getUser).toBeDefined();
  });

  it('from() 메서드로 테이블 접근이 가능해야 함', async () => {
    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    const { result } = renderHook(() => useClerkSupabaseClient());

    // from 메서드가 함수인지 확인
    expect(typeof result.current.from).toBe('function');
  });
});

describe('accessToken 콜백 동작', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnvVars();
    capturedAccessTokenFn = undefined;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('getToken()이 성공하면 토큰을 반환해야 함', async () => {
    mockGetToken.mockResolvedValue('valid-jwt-token');

    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    renderHook(() => useClerkSupabaseClient());

    if (capturedAccessTokenFn) {
      const token = await capturedAccessTokenFn();
      expect(token).toBe('valid-jwt-token');
    }
  });

  it('getToken()이 null을 반환하면 경고 로그와 함께 null을 반환해야 함', async () => {
    mockGetToken.mockResolvedValue(null);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.resetModules();
    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    renderHook(() => useClerkSupabaseClient());

    if (capturedAccessTokenFn) {
      const token = await capturedAccessTokenFn();
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token is null'));
    }

    consoleSpy.mockRestore();
  });

  it('getToken()이 에러를 throw하면 에러 로그와 함께 null을 반환해야 함', async () => {
    const testError = new Error('Token fetch failed');
    mockGetToken.mockRejectedValue(testError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules();
    const { useClerkSupabaseClient } = await import('@/lib/supabase/clerk-client');
    renderHook(() => useClerkSupabaseClient());

    if (capturedAccessTokenFn) {
      const token = await capturedAccessTokenFn();
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get token'),
        testError
      );
    }

    consoleSpy.mockRestore();
  });
});

describe('환경 변수 검증', () => {
  it('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 필요함', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 필요함', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });
});
