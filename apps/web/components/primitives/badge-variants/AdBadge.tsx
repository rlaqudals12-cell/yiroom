'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * AdBadge 변형 정의
 *
 * 광고/후원 컨텐츠를 표시하는 뱃지
 * 공정거래위원회 광고 표시 가이드라인 준수
 */
const adBadgeVariants = cva(
  'inline-flex items-center justify-center rounded font-medium uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        subtle: 'bg-transparent text-muted-foreground border border-muted',
        dark: 'bg-gray-700 text-gray-300 dark:bg-gray-600 dark:text-gray-200',
      },
      size: {
        xs: 'px-1 py-0.5 text-[10px]',
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
      },
      position: {
        default: '',
        topRight: 'absolute top-2 right-2',
        topLeft: 'absolute top-2 left-2',
        bottomRight: 'absolute bottom-2 right-2',
        bottomLeft: 'absolute bottom-2 left-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      position: 'default',
    },
  }
);

export interface AdBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof adBadgeVariants> {
  /** 표시할 라벨 텍스트 (기본: "AD") */
  label?: string;
}

/**
 * AdBadge - 광고/후원 표시 뱃지
 *
 * 공정거래위원회 가이드라인에 따라 광고 컨텐츠를 명확하게 표시
 *
 * @example
 * // 기본 사용
 * <AdBadge />
 *
 * // 후원 컨텐츠
 * <AdBadge label="후원" />
 *
 * // 제품 카드 내 위치 지정
 * <div className="relative">
 *   <ProductCard />
 *   <AdBadge position="topRight" />
 * </div>
 *
 * // 어필리에이트 링크
 * <AdBadge label="제휴" variant="subtle" />
 */
function AdBadge({
  className,
  variant,
  size,
  position,
  label = 'AD',
  ...props
}: AdBadgeProps): React.JSX.Element {
  return (
    <span
      data-slot="ad-badge"
      data-testid="ad-badge"
      role="note"
      aria-label={`광고: ${label}`}
      className={cn(adBadgeVariants({ variant, size, position, className }))}
      {...props}
    >
      {label}
    </span>
  );
}

export { AdBadge, adBadgeVariants };
