/**
 * 액션 플랜 카드 (ADR-104 체크리스트 #2 — "다음 행동이 명확")
 *
 * @description
 *   5축 결과 기반 "지금 / 이번 주 / 이번 달" 3단계 조언.
 *   composeActionPlan()의 결과를 시점별로 시각화.
 *   items가 비어있으면 렌더링 안 함.
 *
 *   에디토리얼 리스킨(2026-07-15): 시점별 3색 테마(핑크/바이올렛/블루 = 색 산발)를
 *   소거하고 단일 카드 프리미티브 + 로즈 1색 시점 라벨로 수렴.
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

// 아이콘은 정적 — 라벨은 시점별 i18n 키(horizon.*)로 분리. 색은 프리미티브가 담당.
const HORIZON_META: Record<
  ActionHorizon,
  { labelKey: string; icon: React.ComponentType<{ className?: string }> }
> = {
  now: { labelKey: 'now', icon: Clock },
  this_week: { labelKey: 'thisWeek', icon: CalendarDays },
  this_month: { labelKey: 'thisMonth', icon: CalendarRange },
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
      <h2 className="text-sm font-semibold text-foreground">{t('actionPlan.heading')}</h2>
      <ul className="space-y-2">
        {plan.items.map((item) => {
          const meta = HORIZON_META[item.horizon];
          const Icon = meta.icon;
          return (
            <li
              key={`${item.horizon}-${item.axis}`}
              className="rounded-2xl border bg-card p-4"
              data-testid={`action-item-${item.horizon}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] font-semibold text-primary">
                    {t(`actionPlan.horizon.${meta.labelKey}`)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.why}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
