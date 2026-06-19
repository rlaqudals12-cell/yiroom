/**
 * 축 조합 인사이트 카드 (ADR-104 체크리스트 #4 — "축 간 연결이 보임")
 *
 * @description
 *   composeCrossInsights()의 결과(0-5개)를 축 조합별로 시각화.
 *   축 조합마다 색상 아이덴티티를 부여하여 "다른 축이 대화하는" 느낌 전달.
 *   items 빈 배열이면 렌더링 안 함.
 *
 * @see lib/analysis/integrated/cross-insights.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import { Link2 } from 'lucide-react';
import type { CrossInsights } from '@/lib/analysis/integrated';
import { recLayerForInsight } from '@/lib/analysis/integrated';

export interface CrossInsightsCardProps {
  insights: CrossInsights;
}

/** 조합 id별 테마 (뱃지 색상 아이덴티티) */
const COMBO_THEME: Record<string, { ring: string; badge: string; bullet: string }> = {
  pc_s: {
    ring: 'border-pink-500/30 bg-pink-500/5',
    badge: 'border-pink-500/40 bg-pink-500/15 text-pink-200',
    bullet: 'text-pink-400',
  },
  pc_m: {
    ring: 'border-rose-500/30 bg-rose-500/5',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
    bullet: 'text-rose-400',
  },
  c_h: {
    ring: 'border-blue-500/30 bg-blue-500/5',
    badge: 'border-blue-500/40 bg-blue-500/15 text-blue-200',
    bullet: 'text-blue-400',
  },
  s_m: {
    ring: 'border-amber-500/30 bg-amber-500/5',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
    bullet: 'text-amber-400',
  },
  pc_c: {
    ring: 'border-violet-500/30 bg-violet-500/5',
    badge: 'border-violet-500/40 bg-violet-500/15 text-violet-200',
    bullet: 'text-violet-400',
  },
};

const DEFAULT_THEME = {
  ring: 'border-zinc-800 bg-neutral-900',
  badge: 'border-zinc-700 bg-zinc-800 text-zinc-300',
  bullet: 'text-zinc-400',
};

export function CrossInsightsCard({ insights }: CrossInsightsCardProps): React.JSX.Element | null {
  if (insights.items.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="cross-insights-card" aria-label="축 조합 인사이트">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        축이 대화해요
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {insights.items.map((item) => {
          const theme = COMBO_THEME[item.id] ?? DEFAULT_THEME;
          // ADR-109 Phase 3: 고정(정체성)/오늘(컨디션) 레이어 — 피부 갱신 시 '오늘'만 변함
          const layer = recLayerForInsight(item.id);
          return (
            <li
              key={item.id}
              className={`rounded-2xl border p-4 ${theme.ring}`}
              data-testid={`cross-insight-${item.id}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${theme.badge}`}
                >
                  <Link2 className="h-3 w-3" aria-hidden="true" />
                  {item.combo}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    layer === 'condition'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-zinc-500/15 text-zinc-300'
                  }`}
                  title={
                    layer === 'condition'
                      ? '오늘의 컨디션(피부)에 따라 바뀌어요'
                      : '정체성 기반 — 거의 변하지 않아요'
                  }
                  data-testid={`cross-insight-layer-${item.id}`}
                >
                  {layer === 'condition' ? '오늘' : '고정'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
