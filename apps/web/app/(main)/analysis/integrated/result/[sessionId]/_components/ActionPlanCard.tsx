/**
 * 액션 플랜 카드 (ADR-104 체크리스트 #2 — "다음 행동이 명확")
 *
 * @description
 *   5축 결과 기반 "지금 / 이번 주 / 이번 달" 3단계 조언.
 *   composeActionPlan()의 결과를 시점별로 시각화.
 *   items가 비어있으면 렌더링 안 함.
 *
 * @see lib/analysis/integrated/action-plan.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import { getTranslations } from 'next-intl/server';
import { Clock, CalendarDays, CalendarRange } from 'lucide-react';
import type { ActionPlan, ActionHorizon } from '@/lib/analysis/integrated';

export interface ActionPlanCardProps {
  plan: ActionPlan;
}

// 아이콘/색상은 정적 — 라벨은 시점별 i18n 키(horizon.*)로 분리
const HORIZON_META: Record<
  ActionHorizon,
  {
    labelKey: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    ring: string;
  }
> = {
  now: {
    labelKey: 'now',
    icon: Clock,
    accent: 'text-pink-300',
    ring: 'border-pink-500/30 bg-pink-500/5',
  },
  this_week: {
    labelKey: 'thisWeek',
    icon: CalendarDays,
    accent: 'text-violet-300',
    ring: 'border-violet-500/30 bg-violet-500/5',
  },
  this_month: {
    labelKey: 'thisMonth',
    icon: CalendarRange,
    accent: 'text-blue-300',
    ring: 'border-blue-500/30 bg-blue-500/5',
  },
};

export async function ActionPlanCard({
  plan,
}: ActionPlanCardProps): Promise<React.JSX.Element | null> {
  if (plan.items.length === 0) return null;

  const t = await getTranslations('analysis.integratedResult');

  return (
    <section
      className="space-y-3"
      data-testid="action-plan-card"
      aria-label={t('actionPlan.ariaLabel')}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {t('actionPlan.heading')}
      </h2>
      <ul className="space-y-2">
        {plan.items.map((item) => {
          const meta = HORIZON_META[item.horizon];
          const Icon = meta.icon;
          return (
            <li
              key={`${item.horizon}-${item.axis}`}
              className={`rounded-2xl border p-4 ${meta.ring}`}
              data-testid={`action-item-${item.horizon}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className={`h-4 w-4 ${meta.accent}`} aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-[11px] font-medium uppercase tracking-wider ${meta.accent}`}>
                    {t(`actionPlan.horizon.${meta.labelKey}`)}
                  </p>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.why}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
