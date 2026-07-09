'use client';

/**
 * 내 피부 목표 칩 (ADR-117 루틴 v2)
 * 다중 선택 토글. 저장/롤백은 상위(useSkinGoals)가 담당 — 여기선 표시·토글만.
 * 목표 카탈로그가 비어 있으면(엔진 미배포) 미노출.
 */
import { cn } from '@/lib/utils';
import type { SkinGoal, SkinGoalId } from './routine-v2-contract';

interface SkinGoalChipsProps {
  goals: SkinGoal[];
  selected: SkinGoalId[];
  onToggle: (id: SkinGoalId) => void;
}

export function SkinGoalChips({ goals, selected, onToggle }: SkinGoalChipsProps) {
  if (goals.length === 0) return null;

  return (
    <section className="mb-6" data-testid="skin-goal-chips" aria-label="내 피부 목표">
      <h2 className="mb-1 text-sm font-semibold text-foreground">내 피부 목표</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        목표를 고르면 오늘의 루틴에 반영돼요 (여러 개 선택할 수 있어요)
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="피부 목표 선택">
        {goals.map((g) => {
          const isOn = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              role="switch"
              aria-checked={isOn}
              onClick={() => onToggle(g.id)}
              data-testid={`skin-goal-chip-${g.id}`}
              className={cn(
                'min-h-[36px] rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                isOn
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
