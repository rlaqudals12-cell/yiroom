'use client';

/**
 * 이탈 복구 배너
 *
 * 분석 진행 중 페이지를 벗어난 사용자가 다시 입력 페이지로 돌아왔을 때,
 * 그 분석이 저장됐는지 확인해 결과로 되돌린다.
 * (마커는 제출 시 sessionStorage에 기록되고, 결과가 확정되면 지워진다.
 *  마커가 남아 있다 = 응답을 받지 못한 채 화면을 떠났다.)
 *
 * 정직성:
 * - 저장된 세션을 못 찾으면 "결과가 있다"고 말하지 않는다.
 * - 판정은 **요청 상관 ID 일치**로만 한다. 예전의 시각(±2분) 매칭은 제출 직전에
 *   만든 다른 세션을 이번 분석으로 오인해 엉뚱한 결과로 보낼 수 있었다.
 * - 아직 마무리되지 않은 세션(pending)을 "완료"로 포장하지 않는다.
 */

import Link from 'next/link';
import { X } from 'lucide-react';
import { usePendingIntegratedSession } from '@/hooks/usePendingIntegratedSession';

export interface PendingAnalysisBannerProps {
  /** 제출 시 생성한 요청 상관 ID */
  requestId: string;
  onDismiss: () => void;
}

export function PendingAnalysisBanner({
  requestId,
  onDismiss,
}: PendingAnalysisBannerProps): React.JSX.Element | null {
  const { session, isLoading } = usePendingIntegratedSession(requestId);

  // 조회 중에는 아무것도 단언하지 않는다 (없는 결과를 있다고 하거나 그 반대가 되지 않도록)
  if (isLoading) return null;

  // 결과를 보여줄 수 있는 상태 — 축 결과가 세션에 확정된 경우만
  const recovered = session && (session.status === 'completed' || session.status === 'partial');
  // 저장은 시작됐으나 마무리되지 않음 (진행 중이거나 세션 기록이 미완) — 완료로 포장하지 않는다
  const unfinished = session?.status === 'pending';

  let message: string;
  if (recovered) {
    message = '분석은 저장됐어요. 결과를 확인해보세요.';
  } else if (unfinished) {
    message = '아직 마무리되지 않았어요. 잠시 후 다시 확인해주세요.';
  } else if (session) {
    message = '분석이 완료되지 못했어요. 다시 시도해주세요.';
  } else {
    message = '결과가 저장되지 않았어요. 다시 분석해주세요.';
  }

  return (
    <div
      role="status"
      data-testid="pending-analysis-banner"
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">진행 중이던 분석이 있어요</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
      </div>
      {recovered && (
        <Link
          href={`/analysis/integrated/result/${session.id}`}
          onClick={onDismiss}
          data-testid="pending-analysis-link"
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          결과 확인
        </Link>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="알림 닫기"
        data-testid="pending-analysis-dismiss"
        className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
