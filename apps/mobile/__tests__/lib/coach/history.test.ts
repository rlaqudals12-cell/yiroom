import type { SupabaseClient } from '@supabase/supabase-js';

import {
  BEAUTY_COACH_SESSION_CATEGORY,
  createCoachSession,
  deleteLegacyCoachSessions,
  getCoachSessions,
  getSessionMessages,
} from '../../../lib/coach/history';

jest.mock('../../../lib/utils/logger', () => ({
  coachLogger: { error: jest.fn() },
}));

describe('coach history provenance', () => {
  it('새 뷰티팀 세션에 출처 카테고리를 저장한다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'beauty-1',
        clerk_user_id: 'user-1',
        title: '립 추천',
        category: BEAUTY_COACH_SESSION_CATEGORY,
        message_count: 0,
        created_at: '2026-08-27T00:00:00.000Z',
        updated_at: '2026-08-27T00:00:00.000Z',
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const supabase = {
      from: jest.fn(() => ({ insert })),
    } as unknown as SupabaseClient;

    await createCoachSession(supabase, 'user-1', '립 추천', BEAUTY_COACH_SESSION_CATEGORY);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: BEAUTY_COACH_SESSION_CATEGORY })
    );
  });

  it('뷰티팀 이력 조회를 beauty-team 카테고리로 제한한다', async () => {
    const limit = jest.fn().mockResolvedValue({ data: [], error: null });
    const categoryEq = jest.fn(() => ({ limit }));
    const order = jest.fn(() => ({ eq: categoryEq, limit }));
    const userEq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq: userEq }));
    const supabase = {
      from: jest.fn(() => ({ select })),
    } as unknown as SupabaseClient;

    await getCoachSessions(supabase, 'user-1', {
      category: BEAUTY_COACH_SESSION_CATEGORY,
    });

    expect(categoryEq).toHaveBeenCalledWith('category', BEAUTY_COACH_SESSION_CATEGORY);
  });

  it('카테고리가 일치하지 않는 세션은 메시지를 조회하지 않는다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const categoryEq = jest.fn(() => ({ maybeSingle }));
    const idEq = jest.fn(() => ({ eq: categoryEq }));
    const select = jest.fn(() => ({ eq: idEq }));
    const from = jest.fn(() => ({ select }));
    const supabase = { from } as unknown as SupabaseClient;

    const result = await getSessionMessages(
      supabase,
      'legacy-session',
      BEAUTY_COACH_SESSION_CATEGORY
    );

    expect(result).toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
    expect(categoryEq).toHaveBeenCalledWith('category', BEAUTY_COACH_SESSION_CATEGORY);
  });

  it('기존 미분류 세션 삭제는 뷰티팀 세션을 제외한다', async () => {
    const or = jest.fn().mockResolvedValue({ error: null });
    const eq = jest.fn(() => ({ or }));
    const deleteQuery = jest.fn(() => ({ eq }));
    const supabase = {
      from: jest.fn(() => ({ delete: deleteQuery })),
    } as unknown as SupabaseClient;

    const result = await deleteLegacyCoachSessions(supabase, 'user-1');

    expect(result).toBe(true);
    expect(eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(or).toHaveBeenCalledWith(
      `category.neq.${BEAUTY_COACH_SESSION_CATEGORY},category.is.null`
    );
  });
});
