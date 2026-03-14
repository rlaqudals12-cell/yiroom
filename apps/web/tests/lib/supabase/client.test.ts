/**
 * Supabase Client (공개 클라이언트) 테스트
 *
 * - Lazy initialization (Proxy 패턴)
 * - 싱글톤 패턴 검증
 * - 환경 변수 누락 시 에러
 * - 함수 바인딩 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
}));

const mockRpc = vi.fn();

const mockClientInstance = {
  from: mockFrom,
  rpc: mockRpc,
  auth: { getUser: vi.fn() },
  storage: { from: vi.fn() },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClientInstance),
}));

describe('supabase 공개 클라이언트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-12345';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('supabase 객체가 export 되어야 한다', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    expect(supabase).toBeDefined();
  });

  it('from() 메서드에 접근하면 Supabase 클라이언트가 lazy 생성된다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { supabase } = await import('@/lib/supabase/client');

    // Proxy를 통해 from에 접근
    supabase.from('users');

    expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-anon-key-12345');
  });

  it('from() 메서드가 올바르게 바인딩되어 호출 가능해야 한다', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    supabase.from('users');
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('rpc() 등 함수 프로퍼티도 바인딩되어야 한다', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    supabase.rpc('my_function');
    expect(mockRpc).toHaveBeenCalledWith('my_function');
  });

  it('비함수 프로퍼티에도 접근 가능해야 한다', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    // auth는 객체이므로 직접 반환
    const authObj = supabase.auth;
    expect(authObj).toBeDefined();
  });

  it('싱글톤 패턴: 여러 번 접근해도 createClient는 한 번만 호출된다', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { supabase } = await import('@/lib/supabase/client');

    supabase.from('table1');
    supabase.from('table2');
    supabase.from('table3');

    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('NEXT_PUBLIC_SUPABASE_URL이 없으면 에러를 throw 해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { supabase } = await import('@/lib/supabase/client');

    expect(() => supabase.from('users')).toThrow('Supabase URL or Anon Key is missing');
  });

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY가 없으면 에러를 throw 해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { supabase } = await import('@/lib/supabase/client');

    expect(() => supabase.from('users')).toThrow('Supabase URL or Anon Key is missing');
  });

  it('두 환경 변수 모두 없으면 에러를 throw 해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { supabase } = await import('@/lib/supabase/client');

    expect(() => supabase.from('users')).toThrow('Supabase URL or Anon Key is missing');
  });

  it('빈 문자열 환경 변수도 누락으로 처리해야 한다', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

    const { supabase } = await import('@/lib/supabase/client');

    expect(() => supabase.from('users')).toThrow('Supabase URL or Anon Key is missing');
  });
});
