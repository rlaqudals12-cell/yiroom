'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/lib/mock/skin-analysis';

// 존 상태 타입 (FaceZoneMap과 동일)
export interface ZoneStatus {
  score: number;
  status: MetricStatus;
  label: string;
  concern?: string;
}

export type ZoneId = 'forehead' | 'tZone' | 'eyes' | 'cheeks' | 'uZone' | 'chin';

export interface PhotoOverlayMapProps {
  imageUrl: string;
  zones: Partial<Record<ZoneId, ZoneStatus>>;
  onZoneClick?: (zoneId: ZoneId) => void;
  showLabels?: boolean;
  opacity?: number; // 오버레이 투명도 (0-1)
  className?: string;
}

// 존 색상 매핑
const ZONE_COLORS: Record<MetricStatus, { fill: string; stroke: string }> = {
  good: {
    fill: 'rgba(16, 185, 129, 0.3)', // emerald
    stroke: 'rgba(16, 185, 129, 0.8)',
  },
  normal: {
    fill: 'rgba(234, 179, 8, 0.3)', // yellow
    stroke: 'rgba(234, 179, 8, 0.8)',
  },
  warning: {
    fill: 'rgba(239, 68, 68, 0.3)', // red
    stroke: 'rgba(239, 68, 68, 0.8)',
  },
};

// 존 라벨 위치
const ZONE_LABEL_POSITIONS: Record<ZoneId, { x: number; y: number }> = {
  forehead: { x: 100, y: 55 },
  tZone: { x: 100, y: 130 },
  eyes: { x: 100, y: 95 },
  cheeks: { x: 55, y: 145 },
  uZone: { x: 100, y: 200 },
  chin: { x: 100, y: 245 },
};

// 존 SVG 경로
const ZONE_PATHS: Record<ZoneId, string> = {
  forehead: 'M35,75 Q100,25 165,75 L165,95 Q100,80 35,95 Z',
  tZone: 'M80,95 L120,95 L120,175 L110,195 L90,195 L80,175 Z',
  eyes: 'M45,100 Q65,90 85,100 Q65,110 45,100 M115,100 Q135,90 155,100 Q135,110 115,100',
  cheeks: '', // 볼은 ellipse로 별도 처리
  uZone: 'M35,165 Q35,240 100,250 Q165,240 165,165 L155,165 Q155,225 100,235 Q45,225 45,165 Z',
  chin: 'M75,200 L125,200 Q125,250 100,260 Q75,250 75,200',
};

/**
 * 사진 오버레이 맵 컴포넌트
 * 실제 분석 사진 위에 존 상태를 오버레이로 표시
 */
export function PhotoOverlayMap({
  imageUrl,
  zones,
  onZoneClick,
  showLabels = true,
  opacity = 0.6,
  className,
}: PhotoOverlayMapProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const renderZone = (zoneId: ZoneId) => {
    const zone = zones[zoneId];
    if (!zone) return null;

    const colors = ZONE_COLORS[zone.status];
    const isHovered = hoveredZone === zoneId;

    // 볼은 ellipse로 처리
    if (zoneId === 'cheeks') {
      return (
        <g key={zoneId} data-zone={zoneId}>
          <ellipse
            cx="50"
            cy="145"
            rx="28"
            ry="35"
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="2"
            className={cn(
              'transition-opacity duration-200',
              isHovered && 'opacity-80',
              onZoneClick && 'cursor-pointer'
            )}
            onClick={() => onZoneClick?.(zoneId)}
            onMouseEnter={() => setHoveredZone(zoneId)}
            onMouseLeave={() => setHoveredZone(null)}
          />
          <ellipse
            cx="150"
            cy="145"
            rx="28"
            ry="35"
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="2"
            className={cn(
              'transition-opacity duration-200',
              isHovered && 'opacity-80',
              onZoneClick && 'cursor-pointer'
            )}
            onClick={() => onZoneClick?.(zoneId)}
            onMouseEnter={() => setHoveredZone(zoneId)}
            onMouseLeave={() => setHoveredZone(null)}
          />
        </g>
      );
    }

    const pathD = ZONE_PATHS[zoneId];
    if (!pathD) return null;

    return (
      <g key={zoneId} data-zone={zoneId}>
        <path
          d={pathD}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2"
          className={cn(
            'transition-opacity duration-200',
            isHovered && 'opacity-80',
            onZoneClick && 'cursor-pointer'
          )}
          onClick={() => onZoneClick?.(zoneId)}
          onMouseEnter={() => setHoveredZone(zoneId)}
          onMouseLeave={() => setHoveredZone(null)}
        />
      </g>
    );
  };

  const renderLabel = (zoneId: ZoneId) => {
    if (!showLabels) return null;
    const zone = zones[zoneId];
    if (!zone) return null;

    const pos = ZONE_LABEL_POSITIONS[zoneId];
    const colors = ZONE_COLORS[zone.status];

    return (
      <text
        key={`label-${zoneId}`}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="600"
        className="pointer-events-none"
        style={{ textShadow: `0 0 4px ${colors.stroke}` }}
      >
        {zone.label} {zone.score}
      </text>
    );
  };

  const zoneIds: ZoneId[] = ['forehead', 'tZone', 'eyes', 'cheeks', 'uZone', 'chin'];

  return (
    <div className={cn('relative', className)} data-testid="photo-overlay-map">
      {/* 배경 이미지 */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt="분석 사진"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          onLoad={() => setImageLoaded(true)}
          priority
        />

        {/* 존 오버레이 */}
        {imageLoaded && (
          <svg
            viewBox="0 0 200 280"
            className="absolute inset-0 w-full h-full"
            style={{ opacity }}
            role="img"
            aria-label="피부 존별 분석 오버레이"
          >
            {zoneIds.map(renderZone)}
            {zoneIds.map(renderLabel)}
          </svg>
        )}
      </div>

      {/* 호버 툴팁 */}
      {hoveredZone && zones[hoveredZone] && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg z-10"
          role="tooltip"
        >
          <div className="text-sm font-medium">{zones[hoveredZone]?.label}</div>
          <div className="text-xs text-muted-foreground">
            점수: {zones[hoveredZone]?.score}점
            {zones[hoveredZone]?.concern && ` · ${zones[hoveredZone]?.concern}`}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoOverlayMap;
