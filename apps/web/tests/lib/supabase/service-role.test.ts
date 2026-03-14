/**
 * Supabase Service Role 클라이언트 테스트
 *
 * - createServiceRoleClient 함수 검증
 * - RLS 우회 설정 (auth 옵션)
 * - 환경 변수 누락 시 에러
 * - 매번 새 클라이언트 생성 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: vi.fn() },
  })),
}));

describe('createServiceRoleClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-secret';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('Supabase 클라이언트 객체를 반환해야 한다', async () => {
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const client = createServiceRoleClient();

    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('올바른 URL과 Service Role Key로 createClient를 호출해야 한다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    createServiceRoleClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-role-key-secret',
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );
  });

  it('autoRefreshToken: false 옵션으로 생성되어야 한다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    createServiceRoleClient();

    const callArgs = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = callArgs[2];

    expect(options.auth.autoRefreshToken).toBe(false);
  });

  it('persistSession: false 옵션으로 생성되어야 한다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    createServiceRoleClient();

    const callArgs = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = callArgs[2];

    expect(options.auth.persistSession).toBe(false);
  });

  it('매번 새 클라이언트를 생성해야 한다 (싱글톤 아님)', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    createServiceRoleClient();
    createServiceRoleClient();
    createServiceRoleClient();

    expect(createClient).toHaveBeenCalledTimes(3);
  });

  it('from() 메서드로 테이블에 접근할 수 있어야 한다', async () => {
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const client = createServiceRoleClient();

    client.from('users');
    expect(mockFrom).toHaveBeenCalledWith('users');
  });
});

describe('환경 변수 누락 시 에러 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('NEXT_PUBLIC_SUPABASE_URL이 없으면 에러를 throw 해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    expect(() => createServiceRoleClient()).toThrow('Supabase URL or Service Role Key is missing');
  });

  it('SUPABASE_SERVICE_ROLE_KEY가 없으면 에러를 throw 해야 한다', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    expect(() => createServiceRoleClient()).toThrow('Supabase URL or Service Role Key is missing');
  });

  it('두 환경 변수 모두 없으면 에러를 throw 해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    expect(() => createServiceRoleClient()).toThrow('Supabase URL or Service Role Key is missing');
  });

  it('빈 문자열 환경 변수도 누락으로 처리해야 한다', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    expect(() => createServiceRoleClient()).toThrow('Supabase URL or Service Role Key is missing');
  });

  it('에러 메시지에 환경 변수 확인 안내가 포함되어야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

    expect(() => createServiceRoleClient()).toThrow('Please check your environment variables');
  });
});
