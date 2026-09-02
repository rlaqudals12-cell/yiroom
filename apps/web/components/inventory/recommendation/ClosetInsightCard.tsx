'use client';

/** 가격·구매일·착용 기록을 기존 CPW 엔진으로 되짚는 옷장 감사 표면. */

import { useMemo } from 'react';
import { ClipboardList, Coins, RotateCcw, Shirt } from 'lucide-react';
import {
  calculateCostPerWear,
  getWardrobeInsight,
  type DeclutterSuggestion,
  type WardrobeItemUsage,
} from '@/lib/fashion';
import type { ClothingMetadata, InventoryItem } from '@/types/inventory';

interface ClosetInsightCardProps {
  items: InventoryItem[];
  className?: string;
}

const ACTION_LABELS: Record<DeclutterSuggestion['action'], string> = {
  sell: '판매를 고려해보세요',
  donate: '기부를 고려해보세요',
  recycle: '재활용을 고려해보세요',
};

/** 필수 기록이 없는 옷에 값을 보충해 CPW·보유기간을 지어내지 않는다. */
function toAuditableItem(item: InventoryItem): WardrobeItemUsage | null {
  if (item.category !== 'closet') return null;

  const metadata = item.metadata as Partial<ClothingMetadata>;
  const priceKrw = metadata.price;
  const purchasedAt = metadata.purchaseDate ? new Date(metadata.purchaseDate) : null;
  if (
    typeof priceKrw !== 'number' ||
    !Number.isFinite(priceKrw) ||
    priceKrw <= 0 ||
    !purchasedAt ||
    Number.isNaN(purchasedAt.getTime())
  ) {
    return null;
  }

  const parsedLastWornAt = item.lastUsedAt ? new Date(item.lastUsedAt) : null;
  const lastWornAt =
    parsedLastWornAt && !Number.isNaN(parsedLastWornAt.getTime()) ? parsedLastWornAt : null;

  return {
    id: item.id,
    name: item.name,
    priceKrw,
    wearCount: item.useCount,
    purchasedAt,
    lastWornAt,
    category: item.subCategory || '미분류',
  };
}

export function ClosetInsightCard({ items, className = '' }: ClosetInsightCardProps) {
  const closetItems = useMemo(() => items.filter((item) => item.category === 'closet'), [items]);
  const auditableItems = useMemo(
    () => closetItems.flatMap((item) => toAuditableItem(item) ?? []),
    [closetItems]
  );
  const insight = useMemo(() => getWardrobeInsight(auditableItems), [auditableItems]);

  return (
    <section
      data-testid="closet-insight-card"
      className={`rounded-xl border bg-card p-4 ${className}`}
      aria-labelledby="closet-audit-title"
    >
      <div className="flex items-start gap-3">
        <ClipboardList className="mt-0.5 size-5 text-foreground" aria-hidden="true" />
        <div>
          <h2 id="closet-audit-title" className="font-semibold">
            옷장 감사
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            가격·구매일·착용 기록으로 실제 사용 흐름을 되짚어요.
          </p>
        </div>
      </div>

      {closetItems.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="closet-audit-empty">
          등록된 옷이 없어 아직 감사할 기록이 없어요.
        </p>
      ) : auditableItems.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed p-3" data-testid="closet-audit-empty">
          <p className="text-sm font-medium">감사에 필요한 기록이 아직 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">
            옷 상세에서 가격과 구매일을 기록하면 착용당 비용과 다시 볼 옷을 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4" data-testid="closet-audit-results">
          <p className="text-xs text-muted-foreground">
            현재 불러온 옷 중 기록이 갖춰진 {auditableItems.length}벌 기준
          </p>

          <dl className="divide-y border-y text-sm">
            <div className="flex items-center justify-between py-2">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Shirt className="size-4" aria-hidden="true" />
                기록된 구매금액
              </dt>
              <dd className="font-medium text-foreground">
                {insight.totalInvestment.toLocaleString()}원
              </dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Coins className="size-4" aria-hidden="true" />
                평균 착용당 비용
              </dt>
              <dd className="font-medium text-foreground">
                {insight.averageCpw > 0
                  ? `${insight.averageCpw.toLocaleString()}원`
                  : '착용 기록 없음'}
              </dd>
            </div>
            {insight.bestValue && (
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">가장 낮은 착용당 비용</span>
                </dt>
                <dd className="text-right font-medium text-foreground">
                  {insight.bestValue.name} ·{' '}
                  {calculateCostPerWear(insight.bestValue).costPerWear.toLocaleString()}원
                </dd>
              </div>
            )}
          </dl>

          <div>
            <h3 className="text-sm font-semibold">다시 볼 옷</h3>
            {insight.declutterSuggestions.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground" data-testid="declutter-empty">
                현재 기록 기준으로 다시 볼 후보가 없어요.
              </p>
            ) : (
              <ul className="mt-2 divide-y" data-testid="declutter-suggestions">
                {insight.declutterSuggestions.slice(0, 3).map((suggestion) => (
                  <li key={suggestion.item.id} className="py-2">
                    <p className="text-sm font-medium">{suggestion.item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{suggestion.reason}</p>
                    <p className="mt-1 text-xs text-foreground">
                      {ACTION_LABELS[suggestion.action]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="border-t pt-3 text-xs text-muted-foreground">
            정리 후보는 구매일과 착용 기록을 되짚는 참고이며, 처분을 결정하지 않아요.
          </p>
        </div>
      )}
    </section>
  );
}
