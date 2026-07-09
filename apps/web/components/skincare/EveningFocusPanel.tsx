'use client';

/**
 * 오늘 저녁 포커스 + 주간 사이클 미리보기 (ADR-117 루틴 v2)
 *
 * - 배지: "🌙 오늘 저녁: {label}" + reason (엔진 정본, label 있을 때만)
 * - 주간 7칸: 요일 약자 + 포커스 아이콘, 오늘 강조
 * - 활성 제품 미보유로 전부 recovery면 미리보기 대신 1줄 안내
 *
 * 표시할 내용이 없으면(엔진 미배포) 미노출.
 */
import { cn } from '@/lib/utils';
import type { EveningCycle, EveningFocus, WeeklyCycle } from './routine-v2-contract';

interface EveningFocusPanelProps {
  eveningCycle: EveningCycle;
  weeklyCycle: WeeklyCycle;
  /** 화장대에 활성 제품을 보유했는지 — 전부 recovery일 때 폴백 분기용 */
  hasOwnedActives: boolean;
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const FOCUS_ICON: Record<EveningFocus, string> = {
  exfoliation: '✨',
  retinoid: '🌿',
  active: '💧',
  recovery: '🌙',
};

export function EveningFocusPanel({
  eveningCycle,
  weeklyCycle,
  hasOwnedActives,
}: EveningFocusPanelProps) {
  const days = weeklyCycle.days ?? [];
  const allRecovery = days.length > 0 && days.every((d) => d.focus === 'recovery');
  const showFallbackLine = allRecovery && !hasOwnedActives;
  const showPreview = days.length === 7 && !showFallbackLine;
  const hasBadge = Boolean(eveningCycle.label);

  if (!hasBadge && !showPreview && !showFallbackLine) return null;

  const today = new Date().getDay();

  return (
    <section
      className="mb-6 rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20"
      data-testid="evening-focus-panel"
      aria-label="오늘 저녁 포커스"
    >
      {hasBadge && (
        <div data-testid="evening-focus-badge">
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            🌙 오늘 저녁: {eveningCycle.label}
          </p>
          {eveningCycle.reason && (
            <p className="mt-0.5 text-xs text-muted-foreground">{eveningCycle.reason}</p>
          )}
        </div>
      )}

      {showPreview && (
        <div className="mt-3 grid grid-cols-7 gap-1" data-testid="weekly-cycle-preview">
          {days.map((d) => {
            const isToday = d.dow === today;
            return (
              <div
                key={d.dow}
                data-testid="weekly-cycle-day"
                data-today={isToday}
                title={d.label}
                className={cn(
                  'flex flex-col items-center rounded-lg py-2 text-center',
                  isToday ? 'bg-primary/10 ring-1 ring-primary' : 'bg-card'
                )}
              >
                <span className="text-[10px] text-muted-foreground">{DOW_LABELS[d.dow] ?? ''}</span>
                <span className="text-base" aria-hidden="true">
                  {FOCUS_ICON[d.focus]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showFallbackLine && (
        <p className="mt-3 text-sm text-muted-foreground" data-testid="weekly-cycle-fallback">
          활성 제품이 화장대에 없어 기본 루틴이에요
        </p>
      )}
    </section>
  );
}
