'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { SkinHeatmapCanvasProps, LightMode } from '@/types/visual-analysis';
import { renderHeatmapOverlay } from '@/lib/analysis/skin-heatmap';
import { releaseCanvas } from '@/lib/analysis/memory-manager';
import { cn } from '@/lib/utils';

/**
 * S-1+ 피부 히트맵 캔버스
 * - 광원 모드별 히트맵 오버레이
 * - 멜라닌(편광), 헤모글로빈(UV), 피지(sebum) 시각화
 */
export default function SkinHeatmapCanvas({
  image,
  faceMask,
  pigmentMaps,
  lightMode,
  opacity = 0.6,
  className,
}: SkinHeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  /**
   * 히트맵 렌더링
   */
  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    setIsRendering(true);

    try {
      renderHeatmapOverlay(canvas, image, pigmentMaps, faceMask, lightMode, opacity);
    } catch (error) {
      console.error('[SkinHeatmapCanvas] 렌더링 오류:', error);
    } finally {
      setIsRendering(false);
    }
  }, [image, faceMask, pigmentMaps, lightMode, opacity]);

  // 광원 모드 변경 시 렌더링
  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  // 컴포넌트 언마운트 시 캔버스 정리
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        releaseCanvas(canvas);
      }
    };
  }, []);

  return (
    <div
      className={cn('relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden', className)}
      data-testid="skin-heatmap-canvas"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        aria-label={`피부 분석 히트맵 - ${getLightModeLabel(lightMode)} 모드`}
      />

      {/* 로딩 오버레이 */}
      {isRendering && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-pulse text-sm text-muted-foreground">렌더링 중...</div>
        </div>
      )}

      {/* 모드 배지 */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 rounded text-xs font-medium">
        {getLightModeLabel(lightMode)}
      </div>
    </div>
  );
}

/**
 * 광원 모드 라벨
 */
function getLightModeLabel(mode: LightMode): string {
  const labels: Record<LightMode, string> = {
    normal: '일반광',
    polarized: '편광 (멜라닌)',
    uv: 'UV (혈색)',
    sebum: '피지',
  };
  return labels[mode];
}

/**
 * 히트맵 수치 표시 컴포넌트
 */
export function HeatmapMetrics({
  melaninAvg,
  hemoglobinAvg,
  className,
}: {
  melaninAvg: number;
  hemoglobinAvg: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)} data-testid="heatmap-metrics">
      <MetricCard label="멜라닌" value={melaninAvg} color="amber" description="색소 침착도" />
      <MetricCard label="헤모글로빈" value={hemoglobinAvg} color="red" description="혈색/홍조" />
    </div>
  );
}

/**
 * 개별 수치 카드
 */
function MetricCard({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: number;
  color: 'amber' | 'red';
  description: string;
}) {
  const percentage = Math.round(value * 100);
  const colorClasses = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className={cn('p-3 rounded-lg', colorClasses[color])}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-bold">{percentage}%</div>
      <div className="text-xs opacity-70">{description}</div>
    </div>
  );
}
