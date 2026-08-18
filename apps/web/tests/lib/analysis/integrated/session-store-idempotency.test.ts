/** 동일 clientRequestId 재전송이 본인 기존 세션만 재사용하는지 검증한다. */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_REQUEST_ID_KEY } from '@/lib/analysis/integrated';

const scenario = vi.hoisted(() => ({
  data: null as unknown,
  error: null as { message: string } | null,
  eqCalls: [] as Array<{ column: string; value: unknown }>,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: (column: string, value: unknown) => {
          scenario.eqCalls.push({ column, value });
          return chain;
        },
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: scenario.data, error: scenario.error }),
      };
      return chain;
    },
  }),
}));

import { findSessionByClientRequestId } from '@/lib/analysis/integrated/internal/session-store';

beforeEach(() => {
  scenario.data = null;
  scenario.error = null;
  scenario.eqCalls = [];
});

describe('findSessionByClientRequestId', () => {
  it('service-role 조회에 사용자와 JSONB 요청 ID를 모두 강제한다', async () => {
    scenario.data = { id: 'session-existing', status: 'pending' };

    const result = await findSessionByClientRequestId('user_1', 'request_1');

    expect(result).toMatchObject({ id: 'session-existing' });
    expect(scenario.eqCalls).toContainEqual({ column: 'clerk_user_id', value: 'user_1' });
    expect(scenario.eqCalls).toContainEqual({
      column: `questionnaire->>${CLIENT_REQUEST_ID_KEY}`,
      value: 'request_1',
    });
  });

  it('조회 장애는 없음으로 위장하지 않고 중복 실행을 막도록 전파한다', async () => {
    scenario.error = { message: 'db unavailable' };

    await expect(findSessionByClientRequestId('user_1', 'request_1')).rejects.toThrow(
      /db unavailable/
    );
  });
});
