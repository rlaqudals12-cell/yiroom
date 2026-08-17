'use client';

/**
 * 이탈 복구 배너
 *
 * 분석 진행 중 페이지를 벗어난 사용자가 다시 입력 페이지로 돌아왔을 때,
 * 그 분석이 저장됐는지 확인해 결과로 되돌린다.
 * (마커는 제출 시 sessionStorage에 기록되고, 성공/실패로 종결되면 지워진다.
 *  마커가 남아 있다 = 응답을 받지 못한 채 화면을 떠났다.)
 *
 * 정직성: 저장된 세션을 못 찾으면 "결과가 있다"고 말하지 않는다.
 */

import Link from 'next/link';
import { X } from 'lucide-react';
import { useLatestIntegratedSession } from '@/hooks/useLatestIntegratedSession';

// 클라이언트 시계와 서버 created_at 사이 오차 허용치 — 이보다 오래된 세션은 이번 분석이 아니다
const CLOCK_SKEW_MS = 2 * 60 * 1000;

export interface PendingAnalysisBannerProps {
  /** 제출 시각 (epoch ms) */
  startedAt: number;
  onDismiss: () => void;
}

export function PendingAnalysisBanner({
  startedAt,
  onDismiss,
}: PendingAnalysisBannerProps): React.JSX.Element | null {
  const { session, isLoading } = useLatestIntegratedSession();

  // 조회 중에는 아무것도 단언하지 않는다 (없는 결과를 있다고 하거나 그 반대가 되지 않도록)
  if (isLoading) return null;

  const sessionStartedMs = session ? new Date(session.created_at).getTime() : NaN;
  const recovered =
    session && Number.isFinite(sessionStartedMs) && sessionStartedMs >= startedAt - CLOCK_SKEW_MS
      ? session
      : null;

  return (
    <div
      role="status"
      data-testid="pending-analysis-banner"
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">진행 중이던 분석이 있어요</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {recovered
            ? '분석은 저장됐어요. 결과를 확인해보세요.'
            : '결과가 저장되지 않았어요. 다시 분석해주세요.'}
        </p>
      </div>
      {recovered && (
        <Link
          href={`/analysis/integrated/result/${recovered.id}`}
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
