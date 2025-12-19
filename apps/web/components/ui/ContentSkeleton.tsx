'use client';

import { cn } from '@/lib/utils';

/**
 * 콘텐츠 스켈레톤 컴포넌트 (F-2 Task 2.6)
 *
 * 로딩 상태에서 콘텐츠 영역을 표시하는 스켈레톤 UI
 * - CardSkeleton: 카드형 콘텐츠
 * - ListSkeleton: 리스트형 콘텐츠
 * - ProfileSkeleton: 프로필 영역
 * - TextSkeleton: 텍스트 라인
 */

interface SkeletonBaseProps {
  className?: string;
}

// 기본 스켈레톤 블록
function SkeletonBlock({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      aria-hidden="true"
    />
  );
}

// =====================================================
// CardSkeleton - 카드형 스켈레톤
// =====================================================

interface CardSkeletonProps extends SkeletonBaseProps {
  /** 이미지 포함 여부 */
  hasImage?: boolean;
  /** 이미지 비율 (aspect-square, aspect-video 등) */
  imageAspect?: 'square' | 'video' | 'wide';
  /** 텍스트 라인 수 */
  lines?: number;
}

export function CardSkeleton({
  className,
  hasImage = true,
  imageAspect = 'video',
  lines = 3,
}: CardSkeletonProps) {
  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }[imageAspect];

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-4', className)}
      role="status"
      aria-label="콘텐츠 로딩 중"
    >
      {hasImage && (
        <SkeletonBlock className={cn('w-full mb-4', aspectClass)} />
      )}
      <div className="space-y-3">
        {/* 제목 */}
        <SkeletonBlock className="h-5 w-3/4" />
        {/* 내용 라인들 */}
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={cn('h-4', i === lines - 1 ? 'w-1/2' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// ListSkeleton - 리스트형 스켈레톤
// =====================================================

interface ListSkeletonProps extends SkeletonBaseProps {
  /** 아이템 수 */
  count?: number;
  /** 아이콘 포함 여부 */
  hasIcon?: boolean;
  /** 아바타 포함 여부 */
  hasAvatar?: boolean;
}

export function ListSkeleton({
  className,
  count = 5,
  hasIcon = false,
  hasAvatar = false,
}: ListSkeletonProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-label="리스트 로딩 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
        >
          {hasAvatar && (
            <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
          )}
          {hasIcon && !hasAvatar && (
            <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
          <SkeletonBlock className="w-16 h-8 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// ProfileSkeleton - 프로필 스켈레톤
// =====================================================

interface ProfileSkeletonProps extends SkeletonBaseProps {
  /** 크기 (sm, md, lg) */
  size?: 'sm' | 'md' | 'lg';
  /** 통계 표시 여부 */
  hasStats?: boolean;
}

export function ProfileSkeleton({
  className,
  size = 'md',
  hasStats = false,
}: ProfileSkeletonProps) {
  const avatarSize = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  return (
    <div
      className={cn('flex items-center gap-4', className)}
      role="status"
      aria-label="프로필 로딩 중"
    >
      <SkeletonBlock className={cn('rounded-full shrink-0', avatarSize)} />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-4 w-48" />
        {hasStats && (
          <div className="flex gap-4 mt-3">
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// TextSkeleton - 텍스트 스켈레톤
// =====================================================

interface TextSkeletonProps extends SkeletonBaseProps {
  /** 라인 수 */
  lines?: number;
  /** 마지막 라인 너비 */
  lastLineWidth?: 'full' | 'half' | 'third';
}

export function TextSkeleton({
  className,
  lines = 3,
  lastLineWidth = 'half',
}: TextSkeletonProps) {
  const lastWidth = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
  }[lastLineWidth];

  return (
    <div
      className={cn('space-y-2', className)}
      role="status"
      aria-label="텍스트 로딩 중"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn('h-4', i === lines - 1 ? lastWidth : 'w-full')}
        />
      ))}
    </div>
  );
}

// =====================================================
// GridSkeleton - 그리드 스켈레톤
// =====================================================

interface GridSkeletonProps extends SkeletonBaseProps {
  /** 아이템 수 */
  count?: number;
  /** 컬럼 수 (모바일 / 데스크톱) */
  cols?: { mobile: number; desktop: number };
}

export function GridSkeleton({
  className,
  count = 6,
  cols = { mobile: 2, desktop: 3 },
}: GridSkeletonProps) {
  // Tailwind는 동적 클래스를 인식하지 못하므로 정적 매핑 사용
  const mobileColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
  const desktopColsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        mobileColsMap[cols.mobile] || 'grid-cols-2',
        desktopColsMap[cols.desktop] || 'md:grid-cols-3',
        className
      )}
      role="status"
      aria-label="그리드 로딩 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} hasImage imageAspect="square" lines={2} />
      ))}
    </div>
  );
}

// =====================================================
// 통합 Export
// =====================================================

const ContentSkeleton = {
  Card: CardSkeleton,
  List: ListSkeleton,
  Profile: ProfileSkeleton,
  Text: TextSkeleton,
  Grid: GridSkeleton,
};

export default ContentSkeleton;
