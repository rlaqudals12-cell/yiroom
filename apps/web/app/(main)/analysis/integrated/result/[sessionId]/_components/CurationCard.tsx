/**
 * 통합 큐레이션 카드 (ADR-104 체크리스트 #5 — "통합 프로필 기반 제품 세트")
 *
 * @description
 *   composeCuration()의 결과(0-3개)를 카테고리별 카드로 표시.
 *   items 빈 배열이면 렌더링 안 함.
 *
 *   에디토리얼 리스킨(2026-07-15): 네온 히어로 그라데·글로우·✨(AI-slop)를 소거하고
 *   웜 크림 카드로. 카테고리 액센트는 하드코딩 5색 → 축별 `--module-*` 토큰(정본 통일).
 *   중복이던 제품/링크 카드 마크업은 LINK_CARD_CLASS 상수 하나로 수렴.
 *
 * @see lib/analysis/integrated/curation.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 */

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ChevronRight, Palette, Brush, Droplet, Shirt, Scissors, ShoppingBag } from 'lucide-react';
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

// 카테고리 액센트 = 축별 모듈 토큰(globals.css --color-module-*) — 축색 정본 단일화
const CATEGORY_ICON: Record<
  CurationCategory,
  { icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  lip: { icon: Brush, accent: 'text-module-makeup' },
  base: { icon: Palette, accent: 'text-module-makeup' },
  skincare: { icon: Droplet, accent: 'text-module-skin' },
  outfit: { icon: Shirt, accent: 'text-module-body' },
  hair: { icon: Scissors, accent: 'text-module-hair' },
};

// 제품/링크 카드 공통 프리미티브 (기존 2벌 중복 → 1상수 수렴)
const LINK_CARD_CLASS =
  'group flex items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-primary/40';

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
      className="rounded-2xl border bg-card p-6"
      data-testid="curation-card"
      aria-label={t('curation.ariaLabel')}
    >
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="space-y-1">
          <p className="font-serif text-[13px] italic text-primary">{t('curation.eyebrow')}</p>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">{t('curation.heading')}</h2>
          <p className="text-xs text-muted-foreground">{t('curation.subtitle')}</p>
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
                    className={LINK_CARD_CLASS}
                    data-testid="curation-product-item"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
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
                        <ShoppingBag className="h-4 w-4 text-module-makeup" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        {price && (
                          <span className="shrink-0 text-xs font-medium text-primary">{price}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                      <p className="text-xs text-muted-foreground">{p.reason}</p>
                      <p
                        className="text-[11px] font-medium text-primary"
                        data-testid="curation-rank-reason"
                      >
                        {buildRankReasonLine(p.matchScore)}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
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
                  className={LINK_CARD_CLASS}
                  data-testid={`curation-item-${item.category}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Icon className={`h-4 w-4 ${meta.accent}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:text-primary/80">
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
