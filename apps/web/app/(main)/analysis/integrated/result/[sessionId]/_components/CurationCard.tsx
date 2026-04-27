/**
 * 통합 큐레이션 카드 (ADR-104 체크리스트 #5 — "통합 프로필 기반 제품 세트")
 *
 * @description
 *   composeCuration()의 결과(0-3개)를 카테고리별 카드로 표시.
 *   "5축을 종합한 당신만의 세트"라는 인상을 주기 위해 히어로 스타일로.
 *   items 빈 배열이면 렌더링 안 함.
 *
 * @see lib/analysis/integrated/curation.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import Link from 'next/link';
import { ChevronRight, Sparkles, Brush, Droplet, Shirt, Scissors } from 'lucide-react';
import type { Curation, CurationCategory } from '@/lib/analysis/integrated';

export interface CurationCardProps {
  curation: Curation;
}

const CATEGORY_ICON: Record<
  CurationCategory,
  { icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  lip: { icon: Brush, accent: 'text-rose-300' },
  base: { icon: Sparkles, accent: 'text-pink-300' },
  skincare: { icon: Droplet, accent: 'text-sky-300' },
  outfit: { icon: Shirt, accent: 'text-violet-300' },
  hair: { icon: Scissors, accent: 'text-amber-300' },
};

export function CurationCard({ curation }: CurationCardProps): React.JSX.Element | null {
  if (curation.items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent p-6"
      data-testid="curation-card"
      aria-label="당신을 위한 세트"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-pink-500/10 blur-3xl"
      />

      <div className="relative space-y-4">
        {/* 헤더 */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-pink-300">
            ✨ 당신을 위한 세트
          </p>
          <h2 className="text-xl font-bold text-white md:text-2xl">5축 프로필에 맞춰 골랐어요</h2>
          <p className="text-xs text-zinc-400">
            축들을 종합해 지금 바로 시도할 수 있는 것부터 순서대로
          </p>
        </div>

        {/* 큐레이션 아이템 */}
        <ul className="space-y-2">
          {curation.items.map((item) => {
            const meta = CATEGORY_ICON[item.category];
            const Icon = meta.icon;
            return (
              <li key={`${item.category}-${item.title}`}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-neutral-950/60 p-4 transition-colors hover:border-pink-500/40 hover:bg-neutral-900/80"
                  data-testid={`curation-item-${item.category}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <Icon className={`h-4 w-4 ${meta.accent}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-pink-300 group-hover:text-pink-200">
                    {item.cta}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
