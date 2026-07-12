/**
 * 연령 확인 게이트 (fail-closed) 단위 테스트
 * @description requireAgeVerified — 생체분석 전 서버 연령 강제
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// service-role 클라이언트 mock — 각 테스트에서 users.birth_date 조회 결과를 주입한다.
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { createServiceRoleClient } from '@/lib/supabase/service-role';

// setup.ts가 age-verification-gate를 전역 mock(null 통과) 처리하므로,
// fail-closed 실제 구현을 검증하려면 importActual로 실제 모듈을 로드한다.
let requireAgeVerified: typeof import('@/lib/api/age-verification-gate').requireAgeVerified;

beforeAll(async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/age-verification-gate')>(
    '@/lib/api/age-verification-gate'
  );
  requireAgeVerified = actual.requireAgeVerified;
});

// users.birth_date 조회를 흉내내는 supabase mock 주입 헬퍼
function mockUsersQuery(result: {
  data: { birth_date: string | null } | null;
  error: unknown;
}): void {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  vi.mocked(createServiceRoleClient).mockReturnValue({
    from,
  } as unknown as ReturnType<typeof createServiceRoleClient>);
}

// 특정 만 나이가 되도록 생년월일 문자열 생성 (생일이 이미 지난 상태로 하루 빼서 경계 안전)
function birthdateForAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('requireAgeVerified (fail-closed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('생년월일이 없으면 403으로 차단한다', async () => {
    mockUsersQuery({ data: { birth_date: null }, error: null });

    const response = await requireAgeVerified('user_no_birthdate');

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    const json = await response!.json();
    expect(json.code).toBe('FORBIDDEN');
  });

  it('사용자 레코드가 없으면 403으로 차단한다', async () => {
    mockUsersQuery({ data: null, error: null });

    const response = await requireAgeVerified('user_missing');

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('조회 오류 시 fail-closed로 403을 반환한다', async () => {
    mockUsersQuery({ data: null, error: { message: 'DB error' } });

    const response = await requireAgeVerified('user_db_error');

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('만 13세는 403으로 차단한다', async () => {
    mockUsersQuery({ data: { birth_date: birthdateForAge(13) }, error: null });

    const response = await requireAgeVerified('user_13');

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('만 20세는 통과(null)한다', async () => {
    mockUsersQuery({ data: { birth_date: birthdateForAge(20) }, error: null });

    const response = await requireAgeVerified('user_20');

    expect(response).toBeNull();
  });
});
