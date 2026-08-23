import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const state = vi.hoisted(() => ({
  order: [] as string[],
  from: vi.fn(),
}));

vi.mock('@/app/api/cron/cleanup-consents/route', () => ({
  GET: vi.fn(async () => {
    state.order.push('consents');
    return NextResponse.json({ success: true });
  }),
}));
vi.mock('@/app/api/cron/cleanup-audit-logs/route', () => ({
  GET: vi.fn(async () => {
    state.order.push('audit');
    return NextResponse.json({ success: true });
  }),
}));
vi.mock('@/app/api/cron/cleanup-images/route', () => ({
  GET: vi.fn(async () => {
    state.order.push('images');
    return NextResponse.json({ success: true });
  }),
}));
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ from: state.from }),
}));
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(),
}));

import { GET } from '@/app/api/cron/hard-delete-users/route';

describe('hard-delete 병합 cleanup 실행 순서', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.order = [];
    vi.stubEnv('NODE_ENV', 'development');
    state.from.mockImplementation((table: string) => {
      if (table !== 'users') throw new Error(`unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          lt: vi.fn(() => ({
            not: vi.fn(() => ({
              limit: vi.fn(async () => {
                state.order.push('hard-delete-query');
                return { data: [], error: null };
              }),
            })),
          })),
        })),
      };
    });
  });

  it('보유기간 consent 파기를 인증 직후, hard-delete 조회보다 먼저 시작한다', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/cron/hard-delete-users'));
    expect(response.status).toBe(200);
    expect(state.order).toEqual(['consents', 'hard-delete-query', 'audit', 'images']);
  });
});
