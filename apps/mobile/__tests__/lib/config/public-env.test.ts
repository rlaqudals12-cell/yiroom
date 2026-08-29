const PUBLIC_ENV_NAMES = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON',
] as const;

const savedEnv = new Map<string, string | undefined>();

describe('공개 런타임 구성 정본', () => {
  beforeAll(() => {
    for (const name of PUBLIC_ENV_NAMES) savedEnv.set(name, process.env[name]);
  });

  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE = ' clerk-public-value ';
    process.env.EXPO_PUBLIC_SUPABASE_URL = ' https://project.example.test ';
    process.env.EXPO_PUBLIC_SUPABASE_ANON = ' supabase-public-anon ';
  });

  afterAll(() => {
    for (const [name, value] of savedEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('Expo가 정적으로 인라인할 수 있는 공개 이름에서 값을 읽고 공백을 제거한다', () => {
    const { PUBLIC_RUNTIME_CONFIG } =
      require('../../../lib/config/public-env') as typeof import('../../../lib/config/public-env');

    expect(PUBLIC_RUNTIME_CONFIG).toEqual({
      clerkPublishable: 'clerk-public-value',
      supabaseUrl: 'https://project.example.test',
      supabaseAnon: 'supabase-public-anon',
    });
  });
});
