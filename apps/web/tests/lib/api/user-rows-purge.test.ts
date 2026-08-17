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

  // 회귀: 메시지 부분일치(`message.includes('column')`)로 부재를 판별하던 시절,
  // 권한 거부("permission denied for column ...")가 "없는 컬럼"으로 삼켜져
  // 행이 남았는데도 파기 성공으로 집계됐다. 계정 삭제가 이 집계를 근거로
  // 되돌릴 수 없는 처분을 하므로, 오분류 하나가 곧 개인정보 잔존이 된다.
  it('권한 오류는 부재가 아니라 실패다 ("permission denied for column")', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = stubClient((table) =>
      table === 'skin_analyses'
        ? {
            error: {
              code: '42501',
              message: 'permission denied for column clerk_user_id of relation skin_analyses',
            },
          }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual(['skin_analyses']);
    consoleError.mockRestore();
  });

  it('RLS 거부 메시지도 실패로 집계한다 (코드가 부재 코드가 아니면 실패)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = stubClient((table) =>
      table === 'user_twins'
        ? {
            error: {
              code: '42501',
              message: 'new row violates row-level security policy for table "user_twins"',
            },
          }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual(['user_twins']);
    consoleError.mockRestore();
  });

  it('확정 부재 코드(42P01·42703·PGRST204)는 계속 흡수한다', async () => {
    const codes: Record<string, string> = {
      wishlist: '42P01',
      meal_items: '42703',
      user_twins: 'PGRST204',
    };
    const { client } = stubClient((table) =>
      codes[table]
        ? { error: { code: codes[table], message: 'relation or column does not exist' } }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual([]);
    expect(result.deletedTables).not.toContain('wishlist');
  });

  // prod RLS 정책이 없는 함수를 참조하면(`auth.get_user_id()` 미존재 — 이 저장소의 실제 이력)
  // DELETE는 42883으로 실패하고 행은 그대로 남는다. 메시지에 "does not exist"가 들어 있어
  // 옛 구현은 이를 "없는 테이블"로 삼켰다 — 파기 실패가 성공으로 둔갑하던 최악의 경로.
  it('"does not exist" 메시지라도 부재 코드가 아니면 실패로 본다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = stubClient((table) =>
      table === 'skin_analyses'
        ? { error: { code: '42883', message: 'function auth.get_user_id() does not exist' } }
        : { error: null }
    );

    const result = await purgeUserRows(client as never, 'user_1');

    expect(result.failedTables).toEqual(['skin_analyses']);
    consoleError.mockRestore();
  });

  it('users 행은 건드리지 않는다 (호출자가 마지막에 별도 삭제)', async () => {
    const { client, touched } = stubClient(() => ({ error: null }));

    await purgeUserRows(client as never, 'user_1');

    expect(touched).not.toContain('users');
  });
});
