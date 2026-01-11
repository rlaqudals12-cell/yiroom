/**
 * 푸시 리마인더 Cron 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase 체이닝을 지원하는 mock builder
// 실제 코드에서 .eq().eq() 같은 체이닝이 사용되므로 모든 메서드가 자기 자신을 반환해야 함
function createChainableQueryBuilder(data: unknown[] = [], error: unknown = null) {
  const builder: Record<string, unknown> = {};

  // 모든 체이닝 메서드는 자기 자신을 반환
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);

  // Promise-like behavior: await 시 데이터 반환
  builder.then = (resolve: (value: { data: unknown[]; error: unknown }) => void) =>
    resolve({ data, error });

  return builder;
}

function createSupabaseMock() {
  return {
    from: vi.fn(() => ({
      ...createChainableQueryBuilder(),
      update: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  };
}

// 모킹
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => createSupabaseMock()),
}));

vi.mock('@/lib/push/server', () => ({
  isVapidConfigured: vi.fn(() => true),
  sendPushToSubscription: vi.fn().mockResolvedValue({ success: true, endpoint: 'test' }),
}));

describe('GET /api/cron/push-reminders', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should return 401 in production without auth', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const request = new NextRequest('http://localhost/api/cron/push-reminders');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should skip if VAPID not configured', async () => {
    const { isVapidConfigured } = await import('@/lib/push/server');
    vi.mocked(isVapidConfigured).mockReturnValue(false);

    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const request = new NextRequest('http://localhost/api/cron/push-reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.message).toBe('VAPID not configured');
  });

  it('should return success with no subscriptions', async () => {
    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const request = new NextRequest('http://localhost/api/cron/push-reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // API 응답은 totalSent 필드를 사용함
    expect(data.totalSent).toBe(0);
  });

  it('should send push to active subscriptions', async () => {
    const mockSubscriptions = [
      {
        id: '1',
        clerk_user_id: 'user1',
        endpoint: 'https://push.example.com/1',
        p256dh: 'key1',
        auth: 'auth1',
        is_active: true,
      },
      {
        id: '2',
        clerk_user_id: 'user2',
        endpoint: 'https://push.example.com/2',
        p256dh: 'key2',
        auth: 'auth2',
        is_active: true,
      },
    ];

    // 체이닝을 지원하는 mock 생성
    const chainableBuilder = createChainableQueryBuilder(mockSubscriptions);

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: vi.fn(() => ({
        ...chainableBuilder,
        update: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    } as never);

    const { sendPushToSubscription } = await import('@/lib/push/server');
    vi.mocked(sendPushToSubscription).mockResolvedValue({ success: true, endpoint: 'test' });

    // Re-import to pick up mocks
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const request = new NextRequest('http://localhost/api/cron/push-reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
