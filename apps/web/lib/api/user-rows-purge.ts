/**
 * 사용자 소유 DB 행 파기 유틸 (GDPR Art.17 / PIPA 파기의무)
 *
 * 계정 즉시삭제(`/api/user/account`)와 GDPR 하드삭제 크론이 **같은 목록·같은 로직**으로
 * 파기하도록 한 곳에 모은다. 목록 정본은 `types/gdpr.ts`의 DELETION_TABLES.
 *
 * 왜 청크 병렬인가: 파기 대상이 90여 테이블이라 순차 호출이면 왕복 지연만으로
 * 서버리스 실행 한도를 위협한다. FK는 users(부모)만 걸려 있고 users는 루프 밖에서
 * 마지막에 지우므로, 나머지 테이블 간에는 삭제 순서 제약이 없다.
 *
 * @see lib/api/storage-purge.ts — 같은 계정 삭제 흐름의 스토리지 파기 짝
 */
import type { createServiceRoleClient } from '@/lib/supabase/service-role';
import { DELETION_TABLES } from '@/types/gdpr';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

/** 동시에 던지는 DELETE 수 — Supabase 커넥션을 과점하지 않는 선 */
const PURGE_CONCURRENCY = 8;

export interface UserRowsPurgeResult {
  /** 삭제 요청이 성공한 테이블 */
  deletedTables: string[];
  /** 실제 실패한 테이블 (테이블/컬럼 부재는 실패로 치지 않음) */
  failedTables: string[];
}

/**
 * 테이블·컬럼 부재는 실패가 아니다.
 *
 * prod 스키마는 마이그레이션 수동 gap-apply 이력 탓에 편차가 있고, 목록에는
 * 옛 이름도 안전하게 남겨두기 때문에 "없는 테이블" 응답이 정상적으로 발생한다.
 * PostgREST는 스키마 캐시 미스를 PGRST205로 돌려주므로 코드까지 함께 본다
 * (메시지만 보면 실패로 잘못 집계돼 진짜 실패가 묻힌다).
 */
function isMissingRelation(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? '';
  return (
    error.code === 'PGRST205' || // 스키마 캐시에 테이블 없음
    error.code === 'PGRST204' || // 컬럼 없음
    error.code === '42P01' || // undefined_table
    error.code === '42703' || // undefined_column
    message.includes('does not exist') ||
    message.includes('Could not find the table') ||
    message.includes('column')
  );
}

/**
 * 정본 목록의 모든 테이블에서 해당 사용자의 행을 삭제한다.
 * `users` 행은 포함하지 않는다 — 호출자가 마지막에 직접 삭제한다(FK CASCADE 기점).
 */
export async function purgeUserRows(
  supabase: ServiceClient,
  clerkUserId: string,
  logPrefix = '[USER-PURGE]'
): Promise<UserRowsPurgeResult> {
  const deletedTables: string[] = [];
  const failedTables: string[] = [];

  /** 한 테이블 삭제 — 성공/스킵이면 true, 실제 실패면 false */
  const deleteFrom = async (table: string, quiet = false): Promise<boolean> => {
    try {
      const { error } = await supabase.from(table).delete().eq('clerk_user_id', clerkUserId);

      if (!error) {
        deletedTables.push(table);
        return true;
      }
      if (isMissingRelation(error)) return true; // 스키마에 없는 테이블/컬럼 — 정상

      if (!quiet) console.error(`${logPrefix} Failed to delete from ${table}:`, error);
      return false;
    } catch (tableError) {
      if (!quiet) console.error(`${logPrefix} Error deleting from ${table}:`, tableError);
      return false;
    }
  };

  const retryQueue: string[] = [];

  for (let i = 0; i < DELETION_TABLES.length; i += PURGE_CONCURRENCY) {
    const chunk = DELETION_TABLES.slice(i, i + PURGE_CONCURRENCY);
    const results = await Promise.all(chunk.map((table) => deleteFrom(table, true)));
    results.forEach((ok, idx) => {
      if (!ok) retryQueue.push(chunk[idx]);
    });
  }

  // 2차 순차 재시도: 참조 무결성(ON DELETE CASCADE 없는 FK — 예: face_analyses →
  // personal_color_assessments) 때문에 부모가 먼저 시도돼 막혔을 수 있다.
  // 이 시점엔 자식 행이 이미 지워졌으므로 대부분 통과한다. 여기서도 실패하면 진짜 실패.
  for (const table of retryQueue) {
    const ok = await deleteFrom(table);
    if (!ok) failedTables.push(table);
  }

  return { deletedTables, failedTables };
}
