'use client';

/**
 * 가격 비교 카드
 * @description 여러 플랫폼의 가격을 비교하여 표시
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PriceComparison, PurchaseOption } from '@/types/smart-matching';
import {
  formatPrice,
  getDeliveryLabel,
  getPlatformName,
} from '@/lib/smart-matching/price-compare';

interface PriceComparisonCardProps {
  comparison: PriceComparison;
  onSelectOption?: (option: PurchaseOption) => void;
  showAllOptions?: boolean;
  className?: string;
}

export function PriceComparisonCard({
  comparison,
  onSelectOption,
  showAllOptions = false,
  className,
}: PriceComparisonCardProps) {
  const { options, bestPrice, fastestDelivery, bestValue } = comparison;

  // 옵션이 없는 경우
  if (options.length === 0) {
    return (
      <div
        className={cn('rounded-lg border bg-card p-4', className)}
        data-testid="price-comparison-card"
      >
        <p className="text-sm text-muted-foreground text-center">
          가격 정보를 찾을 수 없어요
        </p>
      </div>
    );
  }

  // 표시할 옵션 결정
  const displayOptions = showAllOptions
    ? options
    : [bestPrice, fastestDelivery, bestValue].filter(
        (opt, idx, arr) =>
          opt && arr.findIndex((o) => o?.platform === opt.platform) === idx
      ) as PurchaseOption[];

  return (
    <div
      className={cn('rounded-lg border bg-card p-4', className)}
      data-testid="price-comparison-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">가격 비교</h3>
        <span className="text-xs text-muted-foreground">
          {options.length}개 판매처
        </span>
      </div>

      {/* 베스트 옵션 하이라이트 */}
      {bestPrice && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-600 mb-1">최저가</Badge>
              <p className="font-bold text-lg text-green-700">
                {formatPrice(bestPrice.salePrice + bestPrice.deliveryFee)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getPlatformName(bestPrice.platform)} · {getDeliveryLabel(bestPrice.deliveryType)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onSelectOption?.(bestPrice)}
            >
              구매하기
            </Button>
          </div>
        </div>
      )}

      {/* 옵션 목록 */}
      <div className="space-y-2">
        {displayOptions.map((option) => (
          <PriceOptionRow
            key={option.platform}
            option={option}
            isBestPrice={option.platform === bestPrice?.platform}
            isFastest={option.platform === fastestDelivery?.platform}
            isBestValue={option.platform === bestValue?.platform}
            onSelect={() => onSelectOption?.(option)}
          />
        ))}
      </div>

      {/* 더보기 */}
      {!showAllOptions && options.length > displayOptions.length && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          +{options.length - displayOptions.length}개 더 있어요
        </p>
      )}
    </div>
  );
}

// ============================================
// 옵션 행 컴포넌트
// ============================================

interface PriceOptionRowProps {
  option: PurchaseOption;
  isBestPrice?: boolean;
  isFastest?: boolean;
  isBestValue?: boolean;
  onSelect?: () => void;
}

function PriceOptionRow({
  option,
  isBestPrice,
  isFastest,
  isBestValue,
  onSelect,
}: PriceOptionRowProps) {
  // 총 가격 (배송비 포함)
  const _totalPrice = option.salePrice + option.deliveryFee;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded-lg border',
        isBestPrice && 'border-green-300 bg-green-50/50'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {getPlatformName(option.platform)}
          </span>
          {isBestPrice && !isFastest && !isBestValue && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
              최저가
            </Badge>
          )}
          {isFastest && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
              빠른배송
            </Badge>
          )}
          {isBestValue && !isBestPrice && (
            <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
              추천
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold">{formatPrice(option.salePrice)}</span>
          {option.discountPercent > 0 && (
            <span className="text-xs text-red-500">-{option.discountPercent}%</span>
          )}
          {option.deliveryFee > 0 && (
            <span className="text-xs text-muted-foreground">
              +배송비 {formatPrice(option.deliveryFee)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getDeliveryLabel(option.deliveryType)}
          {option.deliveryDays && ` · ${option.deliveryDays}일 내 도착`}
          {option.points && option.points > 0 && ` · ${option.points}P 적립`}
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={onSelect}>
        보기
      </Button>
    </div>
  );
}
