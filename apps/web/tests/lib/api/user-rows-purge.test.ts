/**
 * 사용자 DB 행 파기 유틸 테스트
 *
 * @see lib/api/user-rows-purge.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { purgeUserRows } from '@/lib/api/user-rows-purge';
import { DELETION_TABLES } from '@/types/gdpr';

type DeleteResult = { error: { message?: string; code?: string } | null };

/** 테이블별 응답을 지정할 수 있는 최소 Supabase 스텁 */
function stubClient(responder: (table: string) => DeleteResult) {
  const touched: string[] = [];
  const client = {
    from(table: string) {
      return {
        delete: () => ({
          eq: async () => {
            touched.push(table);
            return responder(table);
          },
        }),
      };
    },
  };
  return { client, touched };
}

describe('purgeUserRows', () => {
  it('정본 목록의 모든 테이블에 삭제를 시도한다', async () => {
    const { client, touched } = stubClient(() => ({ error: null }));

    const result = await purgeUserRows(client as never, 'user_1');

    expect(new Set(touched)).toEqual(new Set(DELETION_TABLES));
    expect(result.failedTables).toEqual([]);
    expect(result.deletedTables.length).toBe(DELETION_TABLES.length);
  });

  it('테이블/컬럼 부재는 실패로 집계하지 않는다 (prod 스키마 편차 흡수)', async () => {
    const missing = ['wishlist', 'meal_items'];
    const { client } = stubClient((table) =>
      missing.includes(table)
        ? { error: { code: 'PGRST205', message: "Could not find the table 'public.wishlist'" } }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual([]);
    expect(result.deletedTables).not.toContain('wishlist');
  });

  it('진짜 실패는 재시도 후에도 남으면 failedTables로 보고한다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = stubClient((table) =>
      table === 'skin_analyses'
        ? { error: { code: '42501', message: 'permission denied' } }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual(['skin_analyses']);
    consoleError.mockRestore();
  });

  it('FK 때문에 한 번 막힌 삭제는 2차 순차 재시도로 회수한다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let firstAttempt = true;
    const { client } = stubClient((table) => {
      if (table === 'personal_color_assessments' && firstAttempt) {
        firstAttempt = false;
        return {
          error: { code: '23503', message: 'violates foreign key constraint' },
        };
      }
      return { error: null };
    });

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual([]);
    expect(result.deletedTables).toContain('personal_color_assessments');
    consoleError.mockRestore();
  });

  it('users 행은 건드리지 않는다 (호출자가 마지막에 별도 삭제)', async () => {
    const { client, touched } = stubClient(() => ({ error: null }));

    await purgeUserRows(client as never, 'user_1');

    expect(touched).not.toContain('users');
  });
});
