'use client';

import * as React from 'react';
import { Sparkles, Palette, Droplets, Layers } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { GradientButton } from '@/components/primitives';

/**
 * AnalysisHub - AI 분석 모듈 선택 허브
 *
 * Gemini 디자인 기반, 모듈별 테마 지원
 * - brand: 민트 (기본, 대시보드용)
 * - skin: 핑크 (Gemini 원본, S-1 피부 분석용)
 * - personalColor: 퍼플 (PC-1 퍼스널컬러용)
 * - body: 블루 (C-1 체형 분석용)
 * - hair: 앰버 (헤어 분석용)
 * - face: 로즈 (얼굴/메이크업 분석용)
 */

const analysisHubVariants = cva(
  'w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000',
  {
    variants: {
      variant: {
        default: '',
        compact: 'space-y-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type AnalysisModuleType = 'PC-1' | 'S-1' | 'C-1';
export type AnalysisTheme = 'brand' | 'skin' | 'personalColor' | 'body' | 'hair' | 'face';

// 테마별 색상 매핑
const THEME_CONFIG: Record<
  AnalysisTheme,
  {
    gradient: string;
    accentClass: string;
    shadowColor: string;
    buttonVariant: 'brand' | 'skin' | 'personalColor' | 'body' | 'hair' | 'face';
  }
> = {
  brand: {
    gradient: 'bg-gradient-brand',
    accentClass: 'text-primary border-primary/20 bg-primary/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.50_0.12_155_/_0.2)]',
    buttonVariant: 'brand',
  },
  skin: {
    gradient: 'bg-gradient-to-r from-[#F8C8DC] to-[#FFB6C1]',
    accentClass: 'text-module-skin border-module-skin/20 bg-module-skin/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.78_0.10_350_/_0.3)]',
    buttonVariant: 'skin',
  },
  personalColor: {
    gradient: 'bg-gradient-to-r from-[#C084FC] to-[#A855F7]',
    accentClass:
      'text-module-personal-color border-module-personal-color/20 bg-module-personal-color/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.68_0.14_300_/_0.3)]',
    buttonVariant: 'personalColor',
  },
  body: {
    gradient: 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]',
    accentClass: 'text-module-body border-module-body/20 bg-module-body/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.72_0.12_250_/_0.3)]',
    buttonVariant: 'body',
  },
  hair: {
    gradient: 'bg-gradient-hair',
    accentClass: 'text-module-hair border-module-hair/20 bg-module-hair/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.72_0.14_60_/_0.3)]',
    buttonVariant: 'hair',
  },
  face: {
    gradient: 'bg-gradient-to-r from-[#F472B6] to-[#EC4899]',
    accentClass: 'text-module-face border-module-face/20 bg-module-face/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_oklch(0.70_0.16_350_/_0.3)]',
    buttonVariant: 'face',
  },
};

export interface AnalysisHubProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof analysisHubVariants> {
  onSelectModule: (module: AnalysisModuleType) => void;
  /** 테마 색상 (기본: brand/민트) */
  theme?: AnalysisTheme;
}

/**
 * AnalysisHub 컴포넌트
 *
 * @example
 * // 기본 (민트)
 *
 * // 핑크 테마 (Gemini 원본)
 */
function AnalysisHub({
  className,
  variant,
  theme = 'brand',
  onSelectModule,
  ...props
}: AnalysisHubProps): React.JSX.Element {
  const themeConfig = THEME_CONFIG[theme];

  return (
    <div
      data-slot="analysis-hub"
      data-testid="analysis-hub"
      data-theme={theme}
      className={cn(analysisHubVariants({ variant, className }))}
      {...props}
    >
      {/* 헤더 */}
      <header className="space-y-4">
        <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground">
          오늘 당신의 <br />
          <span className={cn('text-transparent bg-clip-text', themeConfig.gradient)}>빛깔</span>은
          어떤가요?
        </h2>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          이룸 AI의 지능형 미학이 <br />
          당신에게 가장 어울리는 스타일을 직조합니다.
        </p>
      </header>

      <div className="space-y-6">
        {/* PC-1 메인 카드 (1.2x 강조) */}
        <button
          type="button"
          onClick={() => onSelectModule('PC-1')}
          className={cn(
            'relative group p-10 rounded-[3.5rem] bg-card/30 cursor-pointer transition-all duration-700 hover:translate-y-[-8px] active:scale-[0.98] w-full text-left',
            themeConfig.shadowColor,
            themeConfig.accentClass.split(' ').find((c) => c.startsWith('border-'))
          )}
        >
          {/* 배경 아이콘 */}
          <div className="absolute top-0 right-0 p-10 opacity-10 scale-125 group-hover:scale-150 transition-transform duration-1000">
            <Palette
              className={cn(
                'w-24 h-24',
                themeConfig.accentClass.split(' ').find((c) => c.startsWith('text-'))
              )}
            />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center',
                  themeConfig.accentClass
                )}
              >
                <Sparkles
                  className={cn(
                    'w-8 h-8',
                    themeConfig.accentClass.split(' ').find((c) => c.startsWith('text-'))
                  )}
                />
              </div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                  AI Module PC-1
                </span>
                <h3 className="text-2xl font-black text-foreground">퍼스널 컬러 진단</h3>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                3분 만에 16가지 타입 중 당신만의 색을 발견하세요.
                <br />
                10만+ 사용자 데이터로 검증된 정확도 92%.
              </p>
              <GradientButton variant={themeConfig.buttonVariant} fullWidth>
                🎨 진단 시작하기
              </GradientButton>
            </div>
          </div>
        </button>

        {/* 서브 모듈 그리드 */}
        <div className="grid grid-cols-2 gap-5">
          {/* S-1 피부 분석 */}
          <button
            type="button"
            onClick={() => onSelectModule('S-1')}
            className="p-8 rounded-[2.5rem] bg-card/20 border border-border/50 flex flex-col items-center gap-5 text-center transition-all hover:bg-module-skin/5 hover:border-module-skin/20 cursor-pointer min-h-[160px] justify-center"
          >
            <Droplets className="w-8 h-8 text-module-skin" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">피부 정밀 분석</h4>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                6존 AI 스캐닝
              </p>
            </div>
          </button>

          {/* C-1 체형 분석 */}
          <button
            type="button"
            onClick={() => onSelectModule('C-1')}
            className="p-8 rounded-[2.5rem] bg-card/20 border border-border/50 flex flex-col items-center gap-5 text-center transition-all hover:bg-module-body/5 hover:border-module-body/20 cursor-pointer min-h-[160px] justify-center"
          >
            <Layers className="w-8 h-8 text-module-body" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">체형 실루엣 매칭</h4>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                5-Type 체형 분석
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export { AnalysisHub, analysisHubVariants, THEME_CONFIG };
