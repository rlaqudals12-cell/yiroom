'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/lib/mock/skin-analysis';

// 존 상태 타입
export interface ZoneStatus {
  score: number;
  status: MetricStatus;
  label: string;
  concern?: string;
}

// FaceZoneMap Props
export interface FaceZoneMapProps {
  zones: {
    forehead?: ZoneStatus;
    tZone?: ZoneStatus;
    eyes?: ZoneStatus;
    cheeks?: ZoneStatus;
    uZone?: ZoneStatus;
    chin?: ZoneStatus;
  };
  highlightWorst?: boolean;
  showLabels?: boolean;
  showScores?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onZoneClick?: (zoneId: string) => void;
  className?: string;
}

// 존 색상 매핑
const ZONE_COLORS: Record<MetricStatus, { fill: string; stroke: string }> = {
  good: {
    fill: 'fill-emerald-100 dark:fill-emerald-900/40',
    stroke: 'stroke-emerald-400 dark:stroke-emerald-600',
  },
  normal: {
    fill: 'fill-yellow-100 dark:fill-yellow-900/40',
    stroke: 'stroke-yellow-400 dark:stroke-yellow-600',
  },
  warning: {
    fill: 'fill-red-100 dark:fill-red-900/40',
    stroke: 'stroke-red-400 dark:stroke-red-600',
  },
};

// 크기별 스타일
const SIZE_STYLES = {
  sm: { width: 120, height: 168 },
  md: { width: 180, height: 252 },
  lg: { width: 240, height: 336 },
};

// 존 라벨 정보
const ZONE_LABELS: Record<string, { label: string; x: number; y: number }> = {
  forehead: { label: '이마', x: 100, y: 55 },
  tZone: { label: 'T존', x: 100, y: 130 },
  eyes: { label: '눈가', x: 100, y: 105 },
  cheeks: { label: '볼', x: 55, y: 145 },
  uZone: { label: 'U존', x: 100, y: 200 },
  chin: { label: '턱', x: 100, y: 245 },
};

/**
 * 얼굴 존 맵 컴포넌트
 * 일러스트 기반으로 피부 분석 영역별 상태를 시각화
 *
 * @example
 * ```tsx
 * <FaceZoneMap
 *   zones={{
 *     forehead: { score: 75, status: 'good', label: '이마' },
 *     tZone: { score: 55, status: 'normal', label: 'T존' },
 *   }}
 *   showLabels
 *   showScores
 *   onZoneClick={(id) => setSelectedZone(id)}
 * />
 * ```
 */
export function FaceZoneMap({
  zones,
  highlightWorst = false,
  showLabels = false,
  showScores = false,
  size = 'md',
  onZoneClick,
  className,
}: FaceZoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // 최악의 존 찾기
  const worstZone = highlightWorst
    ? Object.entries(zones).reduce(
        (worst, [id, zone]) => {
          if (!zone) return worst;
          if (!worst || zone.score < worst.score) {
            return { id, score: zone.score };
          }
          return worst;
        },
        null as { id: string; score: number } | null
      )
    : null;

  // 존 렌더링 헬퍼
  const renderZone = (id: string, pathD: string, defaultStatus: MetricStatus = 'normal') => {
    const zone = zones[id as keyof typeof zones];
    const status = zone?.status ?? defaultStatus;
    const colors = ZONE_COLORS[status];
    const isWorst = worstZone?.id === id;
    const isHovered = hoveredZone === id;
    const isInteractive = !!onZoneClick;

    return (
      <g key={id} data-zone={id}>
        <path
          d={pathD}
          className={cn(
            colors.fill,
            colors.stroke,
            'stroke-[1.5] transition-all duration-200',
            isWorst && 'stroke-2 animate-pulse',
            isHovered && 'brightness-110',
            isInteractive && 'cursor-pointer hover:brightness-110'
          )}
          onClick={() => onZoneClick?.(id)}
          onMouseEnter={() => setHoveredZone(id)}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* 라벨 및 점수 */}
        {(showLabels || showScores) && zone && (
          <text
            x={ZONE_LABELS[id]?.x ?? 100}
            y={ZONE_LABELS[id]?.y ?? 140}
            textAnchor="middle"
            className={cn(
              'text-[10px] font-medium fill-current',
              status === 'good' && 'text-emerald-700 dark:text-emerald-300',
              status === 'normal' && 'text-yellow-700 dark:text-yellow-300',
              status === 'warning' && 'text-red-700 dark:text-red-300',
              isInteractive && 'pointer-events-none'
            )}
          >
            {showLabels && <tspan>{zone.label}</tspan>}
            {showScores && showLabels && <tspan> </tspan>}
            {showScores && <tspan>{zone.score}</tspan>}
          </text>
        )}
      </g>
    );
  };

  const { width, height } = SIZE_STYLES[size];

  return (
    <div className={cn('relative inline-block', className)} data-testid="face-zone-map">
      <svg
        viewBox="0 0 200 280"
        width={width}
        height={height}
        className="face-zone-map"
        role="img"
        aria-label="피부 존별 상태"
      >
        {/* 얼굴 윤곽 */}
        <ellipse
          cx="100"
          cy="140"
          rx="75"
          ry="105"
          className="fill-gray-50 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
          strokeWidth="2"
        />

        {/* 이마 영역 (상단 1/3) */}
        {renderZone('forehead', 'M35,75 Q100,25 165,75 L165,95 Q100,80 35,95 Z')}

        {/* T존 영역 (중앙 세로) */}
        {renderZone('tZone', 'M80,95 L120,95 L120,175 L110,195 L90,195 L80,175 Z')}

        {/* 눈 영역 (좌우) */}
        {renderZone(
          'eyes',
          'M45,100 Q65,90 85,100 Q65,110 45,100 M115,100 Q135,90 155,100 Q135,110 115,100'
        )}

        {/* 볼 영역 (좌우) */}
        {zones.cheeks && (
          <g data-zone="cheeks">
            <ellipse
              cx="50"
              cy="145"
              rx="28"
              ry="35"
              className={cn(
                ZONE_COLORS[zones.cheeks.status].fill,
                ZONE_COLORS[zones.cheeks.status].stroke,
                'stroke-[1.5] transition-all duration-200',
                onZoneClick && 'cursor-pointer hover:brightness-110'
              )}
              onClick={() => onZoneClick?.('cheeks')}
              onMouseEnter={() => setHoveredZone('cheeks')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            <ellipse
              cx="150"
              cy="145"
              rx="28"
              ry="35"
              className={cn(
                ZONE_COLORS[zones.cheeks.status].fill,
                ZONE_COLORS[zones.cheeks.status].stroke,
                'stroke-[1.5] transition-all duration-200',
                onZoneClick && 'cursor-pointer hover:brightness-110'
              )}
              onClick={() => onZoneClick?.('cheeks')}
              onMouseEnter={() => setHoveredZone('cheeks')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {(showLabels || showScores) && (
              <>
                <text
                  x={55}
                  y={145}
                  textAnchor="middle"
                  className={cn(
                    'text-[10px] font-medium fill-current pointer-events-none',
                    zones.cheeks.status === 'good' && 'text-emerald-700 dark:text-emerald-300',
                    zones.cheeks.status === 'normal' && 'text-yellow-700 dark:text-yellow-300',
                    zones.cheeks.status === 'warning' && 'text-red-700 dark:text-red-300'
                  )}
                >
                  {showLabels && '볼'}
                  {showScores && showLabels && ' '}
                  {showScores && zones.cheeks.score}
                </text>
              </>
            )}
          </g>
        )}

        {/* U존 영역 (하단 U자) */}
        {renderZone(
          'uZone',
          'M35,165 Q35,240 100,250 Q165,240 165,165 L155,165 Q155,225 100,235 Q45,225 45,165 Z'
        )}

        {/* 턱 영역 */}
        {renderZone('chin', 'M75,200 L125,200 Q125,250 100,260 Q75,250 75,200')}
      </svg>

      {/* 호버 툴팁 */}
      {hoveredZone && zones[hoveredZone as keyof typeof zones] && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded-md px-2 py-1 text-xs shadow-md pointer-events-none z-10"
          role="tooltip"
        >
          {zones[hoveredZone as keyof typeof zones]?.concern ||
            zones[hoveredZone as keyof typeof zones]?.label}
        </div>
      )}
    </div>
  );
}

export default FaceZoneMap;
