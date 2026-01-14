/**
 * Supabase Mock 유틸리티
 * @description 테스트용 Supabase 쿼리 모킹
 */

type MockData = Record<string, unknown>[] | Record<string, unknown> | null;

interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  contains: jest.Mock;
  containedBy: jest.Mock;
  or: jest.Mock;
  and: jest.Mock;
  not: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: jest.Mock;
}

/**
 * Supabase 쿼리 빌더 Mock 생성
 */
export function createMockQueryBuilder(data: MockData = []): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue({
        data: Array.isArray(data) ? data[0] : data,
        error: null,
      }),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({
        data: Array.isArray(data) ? data[0] : data,
        error: null,
      }),
    then: jest.fn((resolve) => resolve({ data, error: null })),
  };

  return builder;
}

/**
 * Supabase 클라이언트 Mock 생성
 */
export function createMockSupabaseClient(
  tableData: Record<string, MockData> = {}
) {
  return {
    from: jest.fn((tableName: string) => {
      const data = tableData[tableName] ?? [];
      return createMockQueryBuilder(data);
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_token',
            user: { id: 'test_user_123' },
          },
        },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test_user_123' } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test_user_123' }, session: {} },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest
          .fn()
          .mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        download: jest
          .fn()
          .mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/test.jpg' },
        })),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  };
}

/**
 * 특정 테이블 쿼리에 에러를 반환하도록 설정
 */
export function createMockSupabaseError(
  message: string,
  code: string = 'PGRST000'
) {
  return {
    data: null,
    error: {
      message,
      code,
      details: null,
      hint: null,
    },
  };
}

/**
 * Supabase 성공 응답 생성
 */
export function createMockSupabaseSuccess<T>(data: T) {
  return {
    data,
    error: null,
  };
}
