'use client';

/**
 * 재분석 주기 안내 — 분석 경과일이 오래되면 다시 분석 권유 (G4)
 *
 * "피부 상태는 ○일 전 분석 기준이에요 — 달라졌다면 다시 분석해보세요"
 * 마지막 분석 시각(skin_analyses.created_at) 기준 실경과일. 7일 이하면 미노출.
 */

import { AlertCircle } from 'lucide-react';

/** 분석 경과일이 이 값을 넘으면 재분석 안내 */
export const REANALYSIS_STALE_DAYS = 7;

interface ReanalysisNoticeProps {
  /** 마지막 피부 분석 시각 */
  analyzedAt: Date;
  /** "다시 분석" 클릭 */
  onReanalyze: () => void;
  /** 기준 시각(테스트 고정용). 미지정 시 현재 */
  now?: Date;
}

export function ReanalysisNotice({ analyzedAt, onReanalyze, now }: ReanalysisNoticeProps) {
  const current = now ?? new Date();
  const days = Math.floor((current.getTime() - analyzedAt.getTime()) / 86_400_000);

  // 실경과일이 유효하고 임계 초과일 때만 — 지어내지 않는다
  if (!Number.isFinite(days) || days <= REANALYSIS_STALE_DAYS) return null;

  return (
    <div
      className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/50 p-3"
      data-testid="reanalysis-notice"
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          피부 상태는 {days}일 전 분석 기준이에요 — 달라졌다면 다시 분석해보세요
        </p>
      </div>
      <button
        onClick={onReanalyze}
        className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
        data-testid="reanalysis-cta"
      >
        다시 분석
      </button>
    </div>
  );
}
