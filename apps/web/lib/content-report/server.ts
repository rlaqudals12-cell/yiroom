import 'server-only';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  CONTENT_REPORT_TARGET_LABELS,
  type ContentReportRequest,
} from '@/lib/content-report/contract';

interface StoredContentReport {
  id: string;
}

/**
 * AI 생성물 신고를 기존 운영 피드백 큐에 저장한다.
 *
 * feed_reports는 post_id UUID FK가 필수라 코치·분석·트윈을 안전하게 수용할 수 없다.
 * 반면 feedback은 이미 RLS와 관리자 처리 상태를 갖춘 범용 접수 큐이므로 새 테이블을
 * 늘리지 않고 재사용한다. 구조화된 JSON은 대상 추적성과 향후 전용 큐 마이그레이션을
 * 함께 보존한다.
 */
export async function submitContentReport(
  reporterClerkUserId: string,
  input: ContentReportRequest
): Promise<StoredContentReport> {
  const supabase = createClerkSupabaseClient();
  const content = JSON.stringify({
    schemaVersion: 1,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    description: input.description || null,
    contentExcerpt: input.contentExcerpt || null,
  });

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      clerk_user_id: reporterClerkUserId,
      type: 'other',
      title: `[AI 생성물 신고] ${CONTENT_REPORT_TARGET_LABELS[input.targetType]}`,
      content,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw error ?? new Error('Content report insert returned no id');
  }

  return { id: data.id };
}
