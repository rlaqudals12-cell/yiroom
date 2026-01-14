'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Layers, Grid3X3 } from 'lucide-react';
import type {
  DetailedZoneId,
  DetailedZoneStatus,
  DetailedStatusLevel,
  ZoneId,
  ZoneMap,
} from '@/types/skin-zones';
import {
  aggregateToSixZones,
  ZONE_LABELS,
  DETAILED_ZONE_LABELS,
  DETAILED_ZONE_SVG_AREAS,
  ZONE_SVG_AREAS,
} from '@/types/skin-zones';

// 세부 존 색상 매핑 (5단계)
const DETAILED_ZONE_COLORS: Record<DetailedStatusLevel, { fill: string; stroke: string }> = {
  excellent: {
    fill: 'fill-emerald-100 dark:fill-emerald-900/40',
    stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
  },
  good: {
    fill: 'fill-green-100 dark:fill-green-900/40',
    stroke: 'stroke-green-400 dark:stroke-green-500',
  },
  normal: {
    fill: 'fill-yellow-100 dark:fill-yellow-900/40',
    stroke: 'stroke-yellow-400 dark:stroke-yellow-500',
  },
  warning: {
    fill: 'fill-orange-100 dark:fill-orange-900/40',
    stroke: 'stroke-orange-400 dark:stroke-orange-500',
  },
  critical: {
    fill: 'fill-red-100 dark:fill-red-900/40',
    stroke: 'stroke-red-400 dark:stroke-red-500',
  },
};

// 6존 색상 (호환용)
const ZONE_COLORS: Record<'good' | 'normal' | 'warning', { fill: string; stroke: string }> = {
  good: DETAILED_ZONE_COLORS.good,
  normal: DETAILED_ZONE_COLORS.normal,
  warning: DETAILED_ZONE_COLORS.warning,
};

// 크기별 스타일
const SIZE_STYLES = {
  sm: { width: 140, height: 196 },
  md: { width: 200, height: 280 },
  lg: { width: 280, height: 392 },
};

// 12존 SVG 경로
const DETAILED_ZONE_PATHS: Record<DetailedZoneId, string> = {
  // 이마 (3)
  forehead_center: 'M70,40 Q100,25 130,40 L130,75 Q100,65 70,75 Z',
  forehead_left: 'M35,55 Q50,35 70,40 L70,75 Q50,70 35,80 Z',
  forehead_right: 'M130,40 Q150,35 165,55 L165,80 Q150,70 130,75 Z',
  // 눈가 (2)
  eye_left: 'M38,95 Q55,85 78,95 Q55,105 38,95',
  eye_right: 'M122,95 Q145,85 162,95 Q145,105 122,95',
  // 볼 (2)
  cheek_left: 'M25,130 Q25,180 55,180 Q75,165 75,140 Q75,115 55,115 Q30,115 25,130',
  cheek_right: 'M175,130 Q175,180 145,180 Q125,165 125,140 Q125,115 145,115 Q170,115 175,130',
  // 코 (2)
  nose_bridge: 'M88,100 L112,100 L112,145 L88,145 Z',
  nose_tip: 'M85,145 L115,145 L110,175 Q100,180 90,175 Z',
  // 턱 (3)
  chin_center: 'M80,210 L120,210 Q125,255 100,265 Q75,255 80,210',
  chin_left: 'M45,185 Q45,220 70,230 L80,210 L80,195 Q70,185 45,185',
  chin_right: 'M155,185 Q155,220 130,230 L120,210 L120,195 Q130,185 155,185',
};

// 6존 SVG 경로 (기본 뷰)
const SIX_ZONE_PATHS: Record<ZoneId, string> = {
  forehead: 'M35,55 Q100,25 165,55 L165,80 Q100,65 35,80 Z',
  tZone: 'M85,85 L115,85 L115,175 L105,195 L95,195 L85,175 Z',
  eyes: 'M38,95 Q55,85 78,95 Q55,105 38,95 M122,95 Q145,85 162,95 Q145,105 122,95',
  cheeks: 'M25,120 Q25,175 60,175 Q85,160 85,130 Q85,100 60,100 Q30,100 25,120',
  uZone: 'M40,175 Q40,235 100,250 Q160,235 160,175 L150,175 Q150,220 100,235 Q50,220 50,175 Z',
  chin: 'M80,200 L120,200 Q125,250 100,260 Q75,250 80,200',
};

// 12존 라벨 위치
const DETAILED_ZONE_LABEL_POS: Record<DetailedZoneId, { x: number; y: number }> = {
  forehead_center: { x: 100, y: 55 },
  forehead_left: { x: 50, y: 60 },
  forehead_right: { x: 150, y: 60 },
  eye_left: { x: 58, y: 95 },
  eye_right: { x: 142, y: 95 },
  cheek_left: { x: 50, y: 145 },
  cheek_right: { x: 150, y: 145 },
  nose_bridge: { x: 100, y: 125 },
  nose_tip: { x: 100, y: 160 },
  chin_center: { x: 100, y: 235 },
  chin_left: { x: 60, y: 205 },
  chin_right: { x: 140, y: 205 },
};

// 6존 라벨 위치
const SIX_ZONE_LABEL_POS: Record<ZoneId, { x: number; y: number }> = {
  forehead: { x: 100, y: 55 },
  tZone: { x: 100, y: 135 },
  eyes: { x: 100, y: 95 },
  cheeks: { x: 50, y: 140 },
  uZone: { x: 100, y: 205 },
  chin: { x: 100, y: 230 },
};

export interface DetailedFaceZoneMapProps {
  /** 12존 데이터 */
  zones: Partial<Record<DetailedZoneId, DetailedZoneStatus>>;
  /** 뷰 모드 (6존/12존) */
  viewMode?: 'simple' | 'detailed';
  /** 뷰 모드 토글 표시 */
  showViewToggle?: boolean;
  /** 라벨 표시 */
  showLabels?: boolean;
  /** 점수 표시 */
  showScores?: boolean;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 최악의 존 강조 */
  highlightWorst?: boolean;
  /** 존 클릭 핸들러 */
  onZoneClick?: (zoneId: DetailedZoneId | ZoneId) => void;
  /** 뷰 모드 변경 핸들러 */
  onViewModeChange?: (mode: 'simple' | 'detailed') => void;
  className?: string;
}

/**
 * 세부 얼굴 존 맵 컴포넌트
 * 12개 세부 존 또는 6개 기본 존 시각화
 */
export function DetailedFaceZoneMap({
  zones,
  viewMode: externalViewMode,
  showViewToggle = true,
  showLabels: _showLabels = false,
  showScores = true,
  size = 'md',
  highlightWorst = false,
  onZoneClick,
  onViewModeChange,
  className,
}: DetailedFaceZoneMapProps) {
  const [internalViewMode, setInternalViewMode] = useState<'simple' | 'detailed'>('detailed');
  const viewMode = externalViewMode ?? internalViewMode;

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // 6존 데이터 계산 (집계)
  const sixZoneData: Partial<ZoneMap> =
    viewMode === 'simple'
      ? aggregateToSixZones(zones as Record<DetailedZoneId, DetailedZoneStatus>)
      : {};

  // 최악의 존 찾기
  const worstZone = highlightWorst
    ? Object.entries(zones).reduce(
        (worst, [id, zone]) => {
          if (!zone) return worst;
          if (!worst || zone.score < worst.score) {
            return { id: id as DetailedZoneId, score: zone.score };
          }
          return worst;
        },
        null as { id: DetailedZoneId; score: number } | null
      )
    : null;

  // 뷰 모드 변경
  const handleViewModeChange = (mode: 'simple' | 'detailed') => {
    if (!externalViewMode) {
      setInternalViewMode(mode);
    }
    onViewModeChange?.(mode);
  };

  // 12존 렌더링 (터치 타겟 최소 44px 보장)
  const renderDetailedZone = (zoneId: DetailedZoneId) => {
    const zone = zones[zoneId];
    if (!zone) return null;

    const colors = DETAILED_ZONE_COLORS[zone.status];
    const isWorst = worstZone?.id === zoneId;
    const isHovered = hoveredZone === zoneId;
    const isInteractive = !!onZoneClick;
    const pos = DETAILED_ZONE_LABEL_POS[zoneId];
    const touchArea = DETAILED_ZONE_SVG_AREAS[zoneId];

    return (
      <g key={zoneId} data-zone={zoneId} data-testid={`zone-${zoneId}`}>
        {/* 시각적 영역 */}
        <path
          d={DETAILED_ZONE_PATHS[zoneId]}
          className={cn(
            colors.fill,
            colors.stroke,
            'stroke-[1.5] transition-all duration-200',
            isWorst && 'stroke-2 animate-pulse',
            isHovered && 'brightness-110'
          )}
        />

        {/* 투명 터치 영역 (44px 최소 터치 타겟 보장) */}
        {isInteractive && touchArea && (
          <rect
            x={touchArea.x}
            y={touchArea.y}
            width={touchArea.width}
            height={touchArea.height}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onZoneClick?.(zoneId)}
            onMouseEnter={() => setHoveredZone(zoneId)}
            onMouseLeave={() => setHoveredZone(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onZoneClick?.(zoneId);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={DETAILED_ZONE_LABELS[zoneId]}
          />
        )}

        {/* 점수 표시 */}
        {showScores && pos && (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn(
              'text-[8px] font-bold fill-current pointer-events-none',
              zone.status === 'excellent' && 'text-emerald-700 dark:text-emerald-300',
              zone.status === 'good' && 'text-green-700 dark:text-green-300',
              zone.status === 'normal' && 'text-yellow-700 dark:text-yellow-300',
              zone.status === 'warning' && 'text-orange-700 dark:text-orange-300',
              zone.status === 'critical' && 'text-red-700 dark:text-red-300'
            )}
          >
            {zone.score}
          </text>
        )}
      </g>
    );
  };

  // 6존 렌더링 (터치 타겟 최소 44px 보장)
  const renderSixZone = (zoneId: ZoneId) => {
    const zone = sixZoneData[zoneId];
    if (!zone) return null;

    const colors = ZONE_COLORS[zone.status];
    const isHovered = hoveredZone === zoneId;
    const isInteractive = !!onZoneClick;
    const pos = SIX_ZONE_LABEL_POS[zoneId];
    const touchArea = ZONE_SVG_AREAS[zoneId];

    // 볼은 양쪽 렌더링
    if (zoneId === 'cheeks') {
      return (
        <g key={zoneId} data-zone={zoneId} data-testid={`zone-${zoneId}`}>
          {/* 왼쪽 볼 시각적 영역 */}
          <ellipse
            cx="50"
            cy="145"
            rx="28"
            ry="35"
            className={cn(
              colors.fill,
              colors.stroke,
              'stroke-[1.5] transition-all duration-200',
              isHovered && 'brightness-110'
            )}
          />
          {/* 오른쪽 볼 시각적 영역 */}
          <ellipse
            cx="150"
            cy="145"
            rx="28"
            ry="35"
            className={cn(
              colors.fill,
              colors.stroke,
              'stroke-[1.5] transition-all duration-200',
              isHovered && 'brightness-110'
            )}
          />
          {/* 터치 영역 (양쪽 볼 포함) */}
          {isInteractive && touchArea && (
            <rect
              x={touchArea.x}
              y={touchArea.y}
              width={touchArea.width}
              height={touchArea.height}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onZoneClick?.(zoneId)}
              onMouseEnter={() => setHoveredZone(zoneId)}
              onMouseLeave={() => setHoveredZone(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onZoneClick?.(zoneId);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={ZONE_LABELS[zoneId]}
            />
          )}
          {showScores && (
            <text
              x={50}
              y={145}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-bold fill-current pointer-events-none text-yellow-700 dark:text-yellow-300"
            >
              {zone.score}
            </text>
          )}
        </g>
      );
    }

    return (
      <g key={zoneId} data-zone={zoneId} data-testid={`zone-${zoneId}`}>
        {/* 시각적 영역 */}
        <path
          d={SIX_ZONE_PATHS[zoneId]}
          className={cn(
            colors.fill,
            colors.stroke,
            'stroke-[1.5] transition-all duration-200',
            isHovered && 'brightness-110'
          )}
        />
        {/* 투명 터치 영역 (44px 최소 터치 타겟 보장) */}
        {isInteractive && touchArea && (
          <rect
            x={touchArea.x}
            y={touchArea.y}
            width={touchArea.width}
            height={touchArea.height}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onZoneClick?.(zoneId)}
            onMouseEnter={() => setHoveredZone(zoneId)}
            onMouseLeave={() => setHoveredZone(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onZoneClick?.(zoneId);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={ZONE_LABELS[zoneId]}
          />
        )}
        {showScores && pos && (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn(
              'text-[10px] font-bold fill-current pointer-events-none',
              zone.status === 'good' && 'text-green-700 dark:text-green-300',
              zone.status === 'normal' && 'text-yellow-700 dark:text-yellow-300',
              zone.status === 'warning' && 'text-red-700 dark:text-red-300'
            )}
          >
            {zone.score}
          </text>
        )}
      </g>
    );
  };

  const { width, height } = SIZE_STYLES[size];
  const allDetailedZoneIds: DetailedZoneId[] = [
    'forehead_center',
    'forehead_left',
    'forehead_right',
    'eye_left',
    'eye_right',
    'cheek_left',
    'cheek_right',
    'nose_bridge',
    'nose_tip',
    'chin_center',
    'chin_left',
    'chin_right',
  ];
  const allSixZoneIds: ZoneId[] = ['forehead', 'tZone', 'eyes', 'cheeks', 'uZone', 'chin'];

  return (
    <div className={cn('relative', className)} data-testid="detailed-face-zone-map">
      {/* 뷰 모드 토글 */}
      {showViewToggle && (
        <div className="flex justify-center gap-1 mb-3">
          <Button
            variant={viewMode === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('simple')}
            className="h-7 px-2 text-xs"
          >
            <Layers className="w-3 h-3 mr-1" />
            6존
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('detailed')}
            className="h-7 px-2 text-xs"
          >
            <Grid3X3 className="w-3 h-3 mr-1" />
            12존
          </Button>
        </div>
      )}

      {/* SVG 맵 */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 280"
          width={width}
          height={height}
          className="detailed-face-zone-map"
          role="img"
          aria-label={`피부 ${viewMode === 'detailed' ? '12' : '6'}존 상태`}
        >
          {/* 얼굴 윤곽 */}
          <ellipse
            cx="100"
            cy="140"
            rx="75"
            ry="110"
            className="fill-gray-50 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
            strokeWidth="2"
          />

          {/* 존 렌더링 */}
          {viewMode === 'detailed'
            ? allDetailedZoneIds.map(renderDetailedZone)
            : allSixZoneIds.map(renderSixZone)}
        </svg>
      </div>

      {/* 호버 툴팁 */}
      {hoveredZone && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-popover border rounded-md px-2 py-1 text-xs shadow-md pointer-events-none z-10"
          role="tooltip"
        >
          {viewMode === 'detailed'
            ? zones[hoveredZone as DetailedZoneId]?.concerns?.[0] ||
              DETAILED_ZONE_LABELS[hoveredZone as DetailedZoneId]
            : sixZoneData[hoveredZone as ZoneId]?.concerns?.[0] ||
              ZONE_LABELS[hoveredZone as ZoneId]}
        </div>
      )}

      {/* 범례 */}
      <div className="flex justify-center gap-2 mt-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> 우수
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" /> 양호
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400" /> 보통
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400" /> 주의
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> 관리 필요
        </span>
      </div>
    </div>
  );
}

export default DetailedFaceZoneMap;
