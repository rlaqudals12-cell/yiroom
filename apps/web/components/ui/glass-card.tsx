/**
 * Glassmorphism 카드 컴포넌트
 * 반투명 유리 효과로 모던한 UI 제공
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 블러 강도 (sm, md, lg) */
  blur?: 'sm' | 'md' | 'lg';
  /** 투명도 (10-90) */
  opacity?: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
  /** 테두리 표시 여부 */
  bordered?: boolean;
  /** 호버 효과 */
  hoverable?: boolean;
}

const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
} as const;

/**
 * GlassCard - 글래스모피즘 스타일 카드
 * @example
 * <GlassCard blur="md" opacity={20}>
 *   <GlassCardHeader>
 *     <GlassCardTitle>제목</GlassCardTitle>
 *   </GlassCardHeader>
 *   <GlassCardContent>내용</GlassCardContent>
 * </GlassCard>
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = 'md', opacity = 20, bordered = true, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl text-card-foreground shadow-lg',
        blurStyles[blur],
        `bg-white/${opacity} dark:bg-black/${opacity}`,
        bordered && 'border border-white/20 dark:border-white/10',
        hoverable &&
          'transition-all duration-200 hover:bg-white/30 dark:hover:bg-black/30 hover:shadow-xl',
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};
