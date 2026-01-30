'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * GradientButton 변형 정의
 *
 * CTA 버튼에 사용되는 그라디언트 스타일 버튼
 * - brand: 로고 민트 그라디언트 (기본 CTA)
 * - workout: 운동 모듈 오렌지
 * - nutrition: 영양 모듈 그린
 * - skin: 피부 분석 핑크
 * - body: 체형 분석 블루
 * - personalColor: 퍼스널컬러 퍼플
 */
const gradientButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        brand:
          'bg-[linear-gradient(135deg,oklch(0.50_0.12_155),oklch(0.40_0.14_155))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        workout:
          'bg-[linear-gradient(135deg,var(--module-workout),var(--module-workout-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        nutrition:
          'bg-[linear-gradient(135deg,var(--module-nutrition),var(--module-nutrition-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        skin:
          'bg-[linear-gradient(135deg,var(--module-skin),var(--module-skin-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        body:
          'bg-[linear-gradient(135deg,var(--module-body),var(--module-body-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        personalColor:
          'bg-[linear-gradient(135deg,var(--module-personal-color),var(--module-personal-color-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        face:
          'bg-[linear-gradient(135deg,var(--module-face),var(--module-face-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        hair:
          'bg-[linear-gradient(135deg,var(--module-hair),var(--module-hair-dark))] text-white shadow-md hover:shadow-lg hover:brightness-110',
        professional:
          'bg-[linear-gradient(135deg,var(--professional-primary),var(--professional-accent))] text-white shadow-md hover:shadow-lg hover:brightness-110',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        xl: 'h-14 px-10 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

/**
 * GradientButton - CTA용 그라디언트 버튼
 *
 * @example
 * // 기본 브랜드 CTA
 * <GradientButton>시작하기</GradientButton>
 *
 * // 모듈별 변형
 * <GradientButton variant="skin">피부 분석</GradientButton>
 * <GradientButton variant="workout">운동 시작</GradientButton>
 *
 * // 사이즈 변형
 * <GradientButton size="lg" fullWidth>전체 너비 버튼</GradientButton>
 */
function GradientButton({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  disabled,
  ...props
}: GradientButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="gradient-button"
      data-testid="gradient-button"
      className={cn(gradientButtonVariants({ variant, size, fullWidth, className }))}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    />
  );
}

export { GradientButton, gradientButtonVariants };
