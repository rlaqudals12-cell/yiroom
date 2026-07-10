'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ExternalLink } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { openAffiliateLink } from '@/lib/products/affiliate';

/**
 * 이너뷰티 실제품 추천 — supplement_products(실DB) 연결
 *
 * 피부 효능(benefits에 'skin')이 태깅된 콜라겐/비타민/오메가 제품을
 * 카테고리별 1개씩(최대 3개) 노출한다. 함량·복용법은 지어내지 않고
 * 제품명에 있는 그대로만 보여준다 (정직 원칙).
 * 데이터가 없으면 아무것도 렌더링하지 않는다 (부모의 안내 문구만 유지).
 * 구매 클릭은 생 <a> 직행이 아니라 어필리에이트 게이트웨이 경유
 * (클릭 트래킹 + 쿠팡 링크 파트너스 태깅).
 */

interface SupplementItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceKrw: number | null;
  purchaseUrl: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  collagen: '콜라겐',
  vitamin: '비타민',
  omega: '오메가3',
};

// 노출 순서 고정 (콜라겐 → 비타민 → 오메가3)
const TARGET_CATEGORIES = ['collagen', 'vitamin', 'omega'] as const;

export function InnerBeautySupplements(): React.ReactElement | null {
  const supabase = useClerkSupabaseClient();
  const { userId } = useAuth();
  const [items, setItems] = useState<SupplementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSupplements = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('supplement_products')
          .select('id, name, brand, category, price_krw, purchase_url, affiliate_url')
          .eq('is_active', true)
          .in('category', [...TARGET_CATEGORIES])
          .contains('benefits', ['skin'])
          .order('price_krw', { ascending: true })
          .limit(30);

        if (cancelled) return;
        if (error) {
          console.error('[Beauty] 이너뷰티 제품 조회 실패:', error);
          return;
        }

        // 카테고리별 1개씩(가격 오름차순 = 접근성 좋은 제품 우선) 선정
        const picked: SupplementItem[] = [];
        for (const category of TARGET_CATEGORIES) {
          const row = (data ?? []).find((r) => r.category === category);
          if (row) {
            picked.push({
              id: row.id,
              name: row.name,
              brand: row.brand,
              category: row.category,
              priceKrw: row.price_krw ?? null,
              // 어필리에이트 링크 우선 — 없으면 일반 구매 링크
              purchaseUrl: row.affiliate_url ?? row.purchase_url ?? null,
            });
          }
        }
        setItems(picked);
      } catch (err) {
        console.error('[Beauty] 이너뷰티 제품 조회 오류:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSupplements();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // 로딩 중이거나 데이터가 없으면 표시하지 않음 — 부모 섹션의 안내 문구가 유일한 콘텐츠
  if (isLoading || items.length === 0) return null;

  return (
    <div className="mt-3 space-y-2" data-testid="beauty-supplement-products">
      {items.map((item) => {
        const buyUrl = item.purchaseUrl;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 bg-background/70 rounded-xl border border-green-200/60 dark:border-green-800/30 px-3 py-2.5"
            data-testid={`beauty-supplement-item-${item.id}`}
          >
            <div className="min-w-0">
              <p className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                {CATEGORY_LABELS[item.category] ?? item.category} · {item.brand}
              </p>
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.priceKrw != null && item.priceKrw > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Intl.NumberFormat('ko-KR').format(item.priceKrw)}원
                </p>
              )}
            </div>
            {buyUrl && (
              <button
                type="button"
                onClick={() =>
                  openAffiliateLink(buyUrl, 'supplement', item.id, userId ?? undefined)
                }
                className="shrink-0 inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium hover:underline min-h-[44px] px-2"
                aria-label={`${item.name} 구매 페이지 열기`}
              >
                구매하기
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">함량·복용법은 제품 정보에서 확인하세요.</p>
    </div>
  );
}

export default InnerBeautySupplements;
