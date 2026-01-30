'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import type { AnalysisTheme } from '@/components/patterns/analysis';

/**
 * AnalysisLoading - AI 분석 로딩 오버레이
 *
 * 분석 진행 중 표시되는 전체 화면 로딩 UI
 * 회전 애니메이션, 진행률, 상태 메시지 포함
 * 테마별 색상 지원 (brand/skin/personalColor/body/hair/face)
 */

const analysisLoadingVariants = cva(
  'fixed inset-0 bg-background z-[300] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500',
  {
    variants: {
      variant: {
        default: '',
        minimal: 'bg-background/95 backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// 테마별 로딩 색상
const LOADING_THEME: Record<AnalysisTheme, {
  borderColor: string;
  dotColor: string;
  glowColor: string;
}> = {
  brand: {
    borderColor: 'border-primary',
    dotColor: 'bg-primary',
    glowColor: 'shadow-[0_0_80px_oklch(0.50_0.12_155_/_0.15)]',
  },
  skin: {
    borderColor: 'border-[#F8C8DC]',
    dotColor: 'bg-[#F8C8DC]',
    glowColor: 'shadow-[0_0_80px_rgba(248,200,220,0.25)]',
  },
  personalColor: {
    borderColor: 'border-module-personal-color',
    dotColor: 'bg-module-personal-color',
    glowColor: 'shadow-[0_0_80px_oklch(0.68_0.14_300_/_0.2)]',
  },
  body: {
    borderColor: 'border-module-body',
    dotColor: 'bg-module-body',
    glowColor: 'shadow-[0_0_80px_oklch(0.72_0.12_250_/_0.2)]',
  },
  hair: {
    borderColor: 'border-module-hair',
    dotColor: 'bg-module-hair',
    glowColor: 'shadow-[0_0_80px_oklch(0.72_0.14_60_/_0.2)]',
  },
  face: {
    borderColor: 'border-module-face',
    dotColor: 'bg-module-face',
    glowColor: 'shadow-[0_0_80px_oklch(0.70_0.16_350_/_0.2)]',
  },
};

export interface AnalysisLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof analysisLoadingVariants> {
  progress: number;
  message?: string;
  subMessage?: string;
  /** 테마 색상 (기본: brand/민트) */
  theme?: AnalysisTheme;
}

/**
 * AnalysisLoading 컴포넌트
 *
 * @example
 * // 기본 (민트)
 * <AnalysisLoading progress={65} />
 *
 * // 핑크 테마 (Gemini 원본)
 * <AnalysisLoading theme="skin" progress={65} />
 */
function AnalysisLoading({
  className,
  variant,
  progress,
  message = '당신의 데이터가',
  subMessage = '하나의 스타일로 직조됩니다.',
  theme = 'brand',
  ...props
}: AnalysisLoadingProps): React.JSX.Element {
  const themeConfig = LOADING_THEME[theme];

  return (
    <div
      data-slot="analysis-loading"
      data-testid="analysis-loading"
      data-theme={theme}
      className={cn(analysisLoadingVariants({ variant, className }))}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="분석 진행 중"
      {...props}
    >
      {/* 원형 프로그레스 */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-16">
        {/* 외곽 원 */}
        <div className="absolute inset-0 border border-border rounded-full" />

        {/* 회전하는 프로그레스 링 */}
        <div
          className={cn(
            'absolute inset-4 border-t-2 rounded-full animate-spin',
            themeConfig.borderColor
          )}
          style={{ animationDuration: '3s' }}
        />

        {/* 중앙 진행률 표시 */}
        <div className={cn(
          'relative w-48 h-48 bg-card/40 backdrop-blur-3xl rounded-full border border-border flex flex-col items-center justify-center',
          themeConfig.glowColor
        )}>
          <span className="text-6xl font-black tracking-tighter text-foreground">
            {Math.round(progress)}%
          </span>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em] mt-3">
            Analyzing
          </p>
        </div>
      </div>

      {/* 메시지 */}
      <h3 className="text-2xl font-black tracking-tight mb-4 text-foreground">
        {message} <br />
        {subMessage}
      </h3>

      {/* 로딩 도트 */}
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn('w-2 h-2 rounded-full animate-bounce', themeConfig.dotColor)}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export { AnalysisLoading, analysisLoadingVariants };
