/**
 * 브레드크럼 네비게이션 컴포넌트
 *
 * 현재 페이지의 계층 구조를 표시하고 상위 페이지로 이동할 수 있는 네비게이션 요소
 * - 접근성: aria-label, aria-current 지원
 * - 다크모드: CSS 변수 기반 스타일링
 */

'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** 표시할 라벨 */
  label: string;
  /** 링크 URL (없으면 현재 페이지로 표시) */
  href?: string;
}

export interface BreadcrumbProps {
  /** 브레드크럼 항목 목록 */
  items: BreadcrumbItem[];
  /** 홈 아이콘 표시 여부 (기본: true) */
  showHome?: boolean;
  /** 홈 링크 URL (기본: /) */
  homeHref?: string;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 브레드크럼 컴포넌트
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: '운동', href: '/workout' },
 *     { label: '온보딩', href: '/workout/onboarding' },
 *     { label: '1단계' }, // 현재 페이지
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  showHome = true,
  homeHref = '/',
  className,
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="브레드크럼"
      className={cn('flex items-center gap-2 text-sm', className)}
      data-testid="breadcrumb"
    >
      {/* 홈 아이콘 */}
      {showHome && (
        <>
          <Link
            href={homeHref}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
            aria-label="홈으로 이동"
            data-testid="breadcrumb-home"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </Link>
          <ChevronRight
            className="w-4 h-4 text-muted-foreground/50 flex-shrink-0"
            aria-hidden="true"
          />
        </>
      )}

      {/* 브레드크럼 항목들 */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCurrentPage = !item.href || isLast;

        return (
          <span key={index} className="flex items-center gap-2">
            {isCurrentPage ? (
              // 현재 페이지 (링크 없음)
              <span
                className="font-medium text-foreground truncate max-w-[150px]"
                aria-current="page"
                data-testid={`breadcrumb-item-${index}`}
              >
                {item.label}
              </span>
            ) : (
              // 링크 있는 항목
              <Link
                href={item.href!}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                data-testid={`breadcrumb-item-${index}`}
              >
                {item.label}
              </Link>
            )}

            {/* 구분자 (마지막 항목 제외) */}
            {!isLast && (
              <ChevronRight
                className="w-4 h-4 text-muted-foreground/50 flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}

/**
 * 브레드크럼 스켈레톤 로딩 컴포넌트
 */
export function BreadcrumbSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <div
      className="flex items-center gap-2"
      data-testid="breadcrumb-skeleton"
      aria-label="브레드크럼 로딩 중"
    >
      <div className="w-4 h-4 bg-muted rounded animate-pulse" />
      {Array.from({ length: itemCount }).map((_, index) => (
        <span key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" aria-hidden="true" />
          <div
            className={cn(
              'h-4 bg-muted rounded animate-pulse',
              index === itemCount - 1 ? 'w-16' : 'w-12'
            )}
          />
        </span>
      ))}
    </div>
  );
}

export default Breadcrumb;
