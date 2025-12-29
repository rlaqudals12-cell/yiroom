'use client';

import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 도메인 variant 타입
export type RankingVariant = 'beauty' | 'style';

// 순위 변동 타입
export type RankChange = 'up' | 'down' | 'same' | 'new';

// 랭킹 아이템 타입
export interface RankingItem {
  id: string;
  rank: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  change: RankChange;
  changeAmount?: number;
  metadata?: Array<{ label: string; value: string }>;
}

export interface RankingCardProps {
  /** 카드 제목 */
  title: string;
  /** 부제목 (선택) */
  subtitle?: string;
  /** 랭킹 아이템 목록 */
  items: RankingItem[];
  /** 도메인 variant */
  variant: RankingVariant;
  /** 최대 표시 개수 (기본 5) */
  maxItems?: number;
  /** 아이템 클릭 핸들러 */
  onItemClick?: (id: string) => void;
  /** 전체 보기 핸들러 */
  onViewAll?: () => void;
  /** 추가 className */
  className?: string;
}

// variant별 색상 테마
const variantStyles: Record<RankingVariant, {
  gradient: string;
  icon: string;
  rankBg: string;
  hoverBg: string;
}> = {
  beauty: {
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    icon: 'text-pink-500',
    rankBg: 'bg-pink-500',
    hoverBg: 'hover:bg-pink-50/50 dark:hover:bg-pink-900/20',
  },
  style: {
    gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
    icon: 'text-indigo-500',
    rankBg: 'bg-indigo-500',
    hoverBg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20',
  },
};

/**
 * 랭킹 카드 공통 컴포넌트
 * - Beauty/Style 도메인별 색상 테마
 * - 순위 변동 표시 (상승/하락/유지/신규)
 * - 이미지, 평점, 메타데이터 지원
 */
export function RankingCard({
  title,
  subtitle,
  items,
  variant,
  maxItems = 5,
  onItemClick,
  onViewAll,
  className,
}: RankingCardProps) {
  const styles = variantStyles[variant];
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="ranking-card">
      <CardHeader className={cn('bg-gradient-to-r', styles.gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', styles.icon)} aria-hidden="true" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              전체보기
            </button>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-border" role="list" aria-label={`${title} 목록`}>
          {displayItems.map((item) => (
            <RankingItemRow
              key={item.id}
              item={item}
              variant={variant}
              onClick={onItemClick ? () => onItemClick(item.id) : undefined}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// 랭킹 아이템 행 컴포넌트
interface RankingItemRowProps {
  item: RankingItem;
  variant: RankingVariant;
  onClick?: () => void;
}

function RankingItemRow({ item, variant, onClick }: RankingItemRowProps) {
  const styles = variantStyles[variant];
  const isClickable = !!onClick;

  return (
    <li>
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={cn(
          'flex items-center gap-3 p-4 transition-colors',
          isClickable && cn('cursor-pointer', styles.hoverBg)
        )}
      >
        {/* 순위 배지 */}
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white',
            item.rank <= 3 ? styles.rankBg : 'bg-muted-foreground/50'
          )}
        >
          {item.rank}
        </div>

        {/* 이미지 */}
        {item.imageUrl && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
          )}
          {item.rating !== undefined && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">
                {item.rating.toFixed(1)}
                {item.reviewCount !== undefined && ` (${item.reviewCount.toLocaleString()})`}
              </span>
            </div>
          )}
          {item.metadata && item.metadata.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {item.metadata.map((meta, idx) => (
                <span key={idx} className="text-xs text-muted-foreground">
                  {meta.label}: {meta.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 순위 변동 */}
        <RankChangeIndicator change={item.change} amount={item.changeAmount} />
      </div>
    </li>
  );
}

// 순위 변동 표시 컴포넌트
interface RankChangeIndicatorProps {
  change: RankChange;
  amount?: number;
}

function RankChangeIndicator({ change, amount }: RankChangeIndicatorProps) {
  switch (change) {
    case 'up':
      return (
        <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {amount !== undefined && amount > 0 && (
            <span className="text-xs font-medium">{amount}</span>
          )}
          <span className="sr-only">{amount ? `${amount}단계 상승` : '상승'}</span>
        </div>
      );
    case 'down':
      return (
        <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" aria-hidden="true" />
          {amount !== undefined && amount > 0 && (
            <span className="text-xs font-medium">{amount}</span>
          )}
          <span className="sr-only">{amount ? `${amount}단계 하락` : '하락'}</span>
        </div>
      );
    case 'new':
      return (
        <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
          NEW
        </span>
      );
    case 'same':
    default:
      return (
        <Minus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      );
  }
}

export default RankingCard;
