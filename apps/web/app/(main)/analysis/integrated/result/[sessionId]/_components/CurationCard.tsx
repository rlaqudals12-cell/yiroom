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

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ChevronRight, Sparkles, Brush, Droplet, Shirt, Scissors, ShoppingBag } from 'lucide-react';
import type { Curation, CurationCategory, CurationProduct } from '@/lib/analysis/integrated';
import { rankByMatchScore, getRankBadge, buildRankReasonLine } from '@/lib/products';

export interface CurationCardProps {
  curation: Curation;
  /**
   * 결과 안에서 지갑이 열리는 실제 제품 3개 (스킨케어/립 카테고리 대체).
   * 비어있으면 링크 카드로 폴백.
   */
  products?: CurationProduct[];
}

// 실제 제품이 커버하는 뷰티 카테고리 — 이 카테고리 링크 카드는 제품 블록으로 대체됨
const BEAUTY_CATEGORIES = new Set<CurationCategory>(['lip', 'base', 'skincare']);

function formatPrice(krw: number | null): string | null {
  if (krw === null || krw <= 0) return null;
  return `${krw.toLocaleString('ko-KR')}원`;
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

export async function CurationCard({
  curation,
  products = [],
}: CurationCardProps): Promise<React.JSX.Element | null> {
  const t = await getTranslations('analysis.integratedResult');
  const hasProducts = products.length > 0;
  // 실제 제품이 있으면 뷰티 링크 카드는 제품 블록으로 대체하고, 나머지(옷장/헤어)만 링크로 유지
  const linkItems = hasProducts
    ? curation.items.filter((i) => !BEAUTY_CATEGORIES.has(i.category))
    : curation.items;

  if (!hasProducts && linkItems.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent p-6"
      data-testid="curation-card"
      aria-label={t('curation.ariaLabel')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-pink-500/10 blur-3xl"
      />

      <div className="relative space-y-4">
        {/* 헤더 */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-pink-300">
            ✨ {t('curation.eyebrow')}
          </p>
          <h2 className="text-xl font-bold text-white md:text-2xl">{t('curation.heading')}</h2>
          <p className="text-xs text-zinc-400">{t('curation.subtitle')}</p>
        </div>

        {/* 실제 제품 3개 (지갑 여는 "너를 위한 이 세트") — BEST 순위 배지 + 적합도 */}
        {hasProducts && (
          <ol className="space-y-2" data-testid="curation-products">
            {rankByMatchScore(products).map((p, idx) => {
              const price = formatPrice(p.priceKrw);
              const badge = getRankBadge(idx);
              return (
                <li key={p.id}>
                  <Link
                    href={`/beauty/${p.id}?source=integrated`}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-neutral-950/60 p-4 transition-colors hover:border-pink-500/40 hover:bg-neutral-900/80"
                    data-testid="curation-product-item"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                      {badge ? (
                        <span
                          className="text-lg"
                          role="img"
                          aria-label={badge.label}
                          data-testid="curation-rank-badge"
                        >
                          {badge.emoji}
                        </span>
                      ) : (
                        <ShoppingBag className="h-4 w-4 text-rose-300" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                        {price && (
                          <span className="shrink-0 text-xs font-medium text-pink-200">
                            {price}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{p.brand}</p>
                      <p className="text-xs text-zinc-400">{p.reason}</p>
                      <p
                        className="text-[11px] font-medium text-pink-200/90"
                        data-testid="curation-rank-reason"
                      >
                        {buildRankReasonLine(p.matchScore)}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-pink-300 group-hover:text-pink-200"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {/* 큐레이션 아이템 (링크) */}
        <ul className="space-y-2">
          {linkItems.map((item) => {
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
