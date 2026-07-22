import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 발급 번호 — 이 세션이 이룸의 몇 번째 통합 분석인지(실측 순번, 정직한 희소성).
 *
 * 왜 service-role: RLS 클라이언트는 본인 행만 세므로 전체 순번을 얻을 수 없다.
 * 카운트만 반환(개인 데이터 노출 없음). 실패 시 null → 카드가 번호를 지어내지 않고 생략.
 *
 * 2026-07-23 결과 페이지 로컬 함수에서 추출 — 모바일 카드용 API(/api/share/issue-no)와 공용.
 *
 * @module lib/share/issue-no
 */
export async function fetchIssueNo(createdAt: string): Promise<number | null> {
  try {
    const svc = createServiceRoleClient();
    const { count, error } = await svc
      .from('integrated_analysis_sessions')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', createdAt);
    if (error || typeof count !== 'number' || count < 1) return null;
    return count;
  } catch {
    return null;
  }
}
