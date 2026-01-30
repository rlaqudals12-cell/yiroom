'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * LoadingButton 변형 정의
 *
 * 비동기 액션에 사용되는 로딩 상태 버튼
 * 기존 Button 스타일 + 로딩 스피너 통합
 */
const loadingButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        gradient:
          'bg-[linear-gradient(135deg,oklch(0.50_0.12_155),oklch(0.40_0.14_155))] text-white shadow-md hover:shadow-lg hover:brightness-110 rounded-full',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-base',
        xl: 'h-11 px-8 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof loadingButtonVariants> {
  /** 로딩 상태 여부 */
  isLoading?: boolean;
  /** 로딩 중 표시할 텍스트 (기본: children 유지) */
  loadingText?: string;
  /** asChild 패턴 지원 */
  asChild?: boolean;
  /** 스피너 위치 */
  spinnerPosition?: 'left' | 'right';
}

/**
 * LoadingButton - 로딩 상태 버튼
 *
 * 비동기 액션(API 호출, 폼 제출 등) 수행 시 로딩 상태를 표시
 *
 * @example
 * // 기본 사용
 * <LoadingButton isLoading={isSubmitting}>저장</LoadingButton>
 *
 * // 로딩 텍스트 변경
 * <LoadingButton isLoading={isSubmitting} loadingText="저장 중...">
 *   저장
 * </LoadingButton>
 *
 * // 그라디언트 변형
 * <LoadingButton variant="gradient" isLoading={isAnalyzing}>
 *   분석 시작
 * </LoadingButton>
 *
 * // 스피너 오른쪽 배치
 * <LoadingButton isLoading spinnerPosition="right">
 *   다음
 * </LoadingButton>
 */
function LoadingButton({
  className,
  variant,
  size,
  fullWidth,
  isLoading = false,
  loadingText,
  asChild = false,
  spinnerPosition = 'left',
  disabled,
  children,
  ...props
}: LoadingButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = disabled || isLoading;

  // 스피너 사이즈 매핑
  const spinnerSize = {
    sm: 'size-3.5',
    md: 'size-4',
    lg: 'size-4',
    xl: 'size-5',
  }[size ?? 'md'];

  const spinner = isLoading && (
    <Loader2 className={cn(spinnerSize, 'animate-spin')} aria-hidden="true" />
  );

  const displayText = isLoading && loadingText ? loadingText : children;

  return (
    <Comp
      data-slot="loading-button"
      data-testid="loading-button"
      data-loading={isLoading}
      className={cn(loadingButtonVariants({ variant, size, fullWidth, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {spinnerPosition === 'left' && spinner}
      {displayText}
      {spinnerPosition === 'right' && spinner}
    </Comp>
  );
}

export { LoadingButton, loadingButtonVariants };
