/**
 * 축 조합 인사이트 카드 (ADR-104 체크리스트 #4 — "축 간 연결이 보임")
 *
 * @description
 *   composeCrossInsights()의 결과(0-5개)를 축 조합별로 시각화.
 *   items 빈 배열이면 렌더링 안 함.
 *
 *   에디토리얼 리스킨(2026-07-15): 조합별 5색 테마맵(COMBO_THEME)은 "축마다 다른 색 =
 *   포인트색 부재"라는 AI-slop 신호라 제거 — 단일 카드 프리미티브 + 로즈 1색 액센트로 수렴.
 *   고정(정체성)/오늘(컨디션) 레이어 구분은 색이 아닌 배경 강도로 유지.
 *
 * @see lib/analysis/integrated/cross-insights.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import { getTranslations } from 'next-intl/server';
import { Link2 } from 'lucide-react';
import type { CrossInsights } from '@/lib/analysis/integrated';
import { recLayerForInsight } from '@/lib/analysis/integrated';

export interface CrossInsightsCardProps {
  insights: CrossInsights;
}

export async function CrossInsightsCard({
  insights,
}: CrossInsightsCardProps): Promise<React.JSX.Element | null> {
  if (insights.items.length === 0) return null;

  const t = await getTranslations('analysis.integratedResult');

  return (
    <section
      className="space-y-3"
      data-testid="cross-insights-card"
      aria-label={t('crossInsights.ariaLabel')}
    >
      <h2 className="text-sm font-semibold text-foreground">{t('crossInsights.heading')}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {insights.items.map((item) => {
          // ADR-109 Phase 3: 고정(정체성)/오늘(컨디션) 레이어 — 피부 갱신 시 '오늘'만 변함
          const layer = recLayerForInsight(item.id);
          return (
            <li
              key={item.id}
              className="rounded-2xl border bg-card p-4"
              data-testid={`cross-insight-${item.id}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  <Link2 className="h-3 w-3" aria-hidden="true" />
                  {item.combo}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    layer === 'condition'
                      ? 'bg-accent text-primary'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                  title={
                    layer === 'condition'
                      ? t('crossInsights.layerConditionTitle')
                      : t('crossInsights.layerIdentityTitle')
                  }
                  data-testid={`cross-insight-layer-${item.id}`}
                >
                  {layer === 'condition'
                    ? t('crossInsights.layerCondition')
                    : t('crossInsights.layerIdentity')}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
