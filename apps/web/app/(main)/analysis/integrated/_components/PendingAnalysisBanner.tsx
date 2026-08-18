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
import { RefreshCw, X } from 'lucide-react';
import { usePendingIntegratedSession } from '@/hooks/usePendingIntegratedSession';

export interface PendingAnalysisBannerProps {
  /** 제출 시 생성한 요청 상관 ID */
  requestId: string;
  /** 사용자가 기존 요청 복구를 명시적으로 포기하고 새 ID를 허용할 때만 호출. */
  onAbandon: () => void;
}

export function PendingAnalysisBanner({
  requestId,
  onAbandon,
}: PendingAnalysisBannerProps): React.JSX.Element | null {
  const { session, isLoading, recoveryState, refetch } = usePendingIntegratedSession(requestId);

  // 결과를 보여줄 수 있는 상태 — 축 결과가 세션에 확정된 경우만
  const recovered = recoveryState === 'completed' && session;

  let message: string;
  switch (recoveryState) {
    case 'checking':
      message = '기존 요청 상태를 확인하고 있어요.';
      break;
    case 'not_found':
      message = '아직 요청 세션을 찾지 못했어요. 서버에서 시작 중일 수 있어 계속 확인할게요.';
      break;
    case 'error':
      message = '요청 상태를 불러오지 못했어요. 자동으로 다시 확인할게요.';
      break;
    case 'pending':
      message = '아직 마무리되지 않았어요. 완료될 때까지 계속 확인할게요.';
      break;
    case 'completed':
      message = '분석은 저장됐어요. 결과를 확인해보세요.';
      break;
    case 'failed':
      message = '분석이 완료되지 못했어요. 기존 요청을 포기한 뒤 다시 시도해주세요.';
      break;
    case 'stalled':
      message = '자동 확인을 마쳤지만 결과를 확정하지 못했어요. 직접 다시 확인할 수 있어요.';
      break;
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
          onClick={onAbandon}
          data-testid="pending-analysis-link"
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          결과 확인
        </Link>
      )}
      {!recovered && (
        <button
          type="button"
          onClick={refetch}
          disabled={isLoading}
          data-testid="pending-analysis-refetch"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs text-foreground disabled:opacity-50"
        >
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          다시 확인
        </button>
      )}
      <button
        type="button"
        onClick={onAbandon}
        aria-label="기존 분석 요청 포기"
        data-testid="pending-analysis-dismiss"
        className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
        <span>기존 요청 포기</span>
      </button>
    </div>
  );
}
