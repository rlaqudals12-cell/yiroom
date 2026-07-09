'use client';

/**
 * 단계 계획 카드 (ADR-117 루틴 v2)
 * barrier(장벽 회복 우선) = 주황 톤, goal(목표 집중) = 프라이머리 톤.
 * 문구는 엔진 정본(deriveCarePhase) 그대로 렌더 — 여기서 지어내지 않는다.
 * message가 비어 있으면(엔진 미배포) 미노출.
 */
import { ShieldCheck, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CarePhase } from './routine-v2-contract';

interface CarePhaseCardProps {
  phase: CarePhase;
}

export function CarePhaseCard({ phase }: CarePhaseCardProps) {
  if (!phase.message) return null;

  const isBarrier = phase.phase === 'barrier';
  const Icon = isBarrier ? ShieldCheck : Target;

  return (
    <section
      className={cn(
        'mb-6 rounded-xl border p-4',
        isBarrier
          ? 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20'
          : 'border-primary/15 bg-primary/5'
      )}
      data-testid="care-phase-card"
      data-phase={phase.phase}
      aria-label="루틴 단계 계획"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', isBarrier ? 'text-orange-500' : 'text-primary')}
          aria-hidden="true"
        />
        <div>
          {phase.label && (
            <p
              className={cn(
                'text-sm font-semibold',
                isBarrier ? 'text-orange-800 dark:text-orange-200' : 'text-foreground'
              )}
            >
              {phase.label}
            </p>
          )}
          <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{phase.message}</p>
        </div>
      </div>
    </section>
  );
}
