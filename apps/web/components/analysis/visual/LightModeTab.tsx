'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LightMode, LightModeTabProps } from '@/types/visual-analysis';
import { cn } from '@/lib/utils';

/**
 * 광원 모드별 설정
 */
const LIGHT_MODE_CONFIG: Record<LightMode, { label: string; description: string; icon: string }> = {
  normal: {
    label: '일반광',
    description: '원본 이미지',
    icon: '☀️',
  },
  polarized: {
    label: '편광',
    description: '멜라닌 분포',
    icon: '🔬',
  },
  uv: {
    label: 'UV',
    description: '혈색/홍조',
    icon: '💜',
  },
  sebum: {
    label: '피지',
    description: '유분 분포',
    icon: '💧',
  },
};

/**
 * S-1+ 광원 모드 선택 탭
 * - 일반광: 원본 이미지
 * - 편광: 멜라닌 히트맵 (갈색)
 * - UV: 헤모글로빈 히트맵 (빨강)
 * - 피지: 유분 히트맵 (노랑)
 */
export default function LightModeTab({
  activeMode,
  onModeChange,
  disabled = false,
  className,
}: LightModeTabProps) {
  return (
    <div className={cn('w-full', className)} data-testid="light-mode-tab">
      <Tabs
        value={activeMode}
        onValueChange={(value) => onModeChange(value as LightMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          {(Object.keys(LIGHT_MODE_CONFIG) as LightMode[]).map((mode) => {
            const config = LIGHT_MODE_CONFIG[mode];
            return (
              <TabsTrigger
                key={mode}
                value={mode}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-1',
                  'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                  'transition-all duration-200'
                )}
              >
                <span className="text-lg" aria-hidden="true">
                  {config.icon}
                </span>
                <span className="text-xs font-medium">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* 현재 모드 설명 */}
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {LIGHT_MODE_CONFIG[activeMode].description}
      </p>
    </div>
  );
}

/**
 * 광원 모드 범례
 */
export function LightModeLegend({ mode }: { mode: LightMode }) {
  if (mode === 'normal') return null;

  const legendConfig: Record<
    Exclude<LightMode, 'normal'>,
    { low: string; high: string; color: string }
  > = {
    polarized: { low: '낮음', high: '높음', color: 'from-amber-100 to-amber-800' },
    uv: { low: '적음', high: '많음', color: 'from-red-100 to-red-600' },
    sebum: { low: '적음', high: '많음', color: 'from-yellow-100 to-yellow-600' },
  };

  const config = legendConfig[mode as Exclude<LightMode, 'normal'>];

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      data-testid="light-mode-legend"
    >
      <span>{config.low}</span>
      <div className={cn('h-2 w-24 rounded-full bg-gradient-to-r', config.color)} />
      <span>{config.high}</span>
    </div>
  );
}
