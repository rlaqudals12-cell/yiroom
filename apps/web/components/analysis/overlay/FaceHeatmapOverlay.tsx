'use client';

/**
 * A-3 + A-4: 피부 12존 히트맵 오버레이 + 존 상세 팝오버
 *
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.1
 */

import { useState, useMemo, useCallback } from 'react';
import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import { AnalysisOverlayBase } from './AnalysisOverlayBase';
import type { OverlayDimensions } from './AnalysisOverlayBase';
import { StrengthHighlightToggle } from './StrengthHighlightToggle';
import type { OverlayMode } from './internal/overlay-tokens';
import { mapLandmarksToZoneCoordinates, scaleCoordinates } from './internal/zone-coordinate-mapper';
import type { ZoneEllipseCoord } from './internal/zone-coordinate-mapper';
import {
  computeHighlightedZoneStyle,
  METRIC_LABELS,
  type HighlightableMetric,
} from './internal/zone-color-mapper';

interface LandmarkPoint {
  x: number;
  y: number;
}

// 존별 메트릭 (ZoneMetricsV2 호환 간소화 타입)
type ZoneMetrics = Record<HighlightableMetric, number>;

export interface FaceHeatmapOverlayProps {
  imageUrl: string;
  landmarks: LandmarkPoint[] | null;
  zoneScores: Partial<Record<DetailedZoneId, number>>;
  zoneMetrics: Partial<Record<DetailedZoneId, ZoneMetrics>>;
  highlightMetric?: HighlightableMetric;
  initialMode?: OverlayMode;
  onZoneClick?: (zoneId: DetailedZoneId, metrics: ZoneMetrics) => void;
  className?: string;
}

// 존 상세 팝오버 (A-4)
function ZonePopover({
  zoneId,
  metrics,
  coord,
  onClose,
}: {
  zoneId: DetailedZoneId;
  metrics: ZoneMetrics;
  coord: ZoneEllipseCoord;
  onClose: () => void;
}): React.ReactElement {
  return (
    <foreignObject
      x={coord.cx + coord.rx + 10}
      y={Math.max(0, coord.cy - 60)}
      width={170}
      height={190}
      data-testid={`zone-popover-${zoneId}`}
    >
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2.5 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{DETAILED_ZONE_LABELS[zoneId]}</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="space-y-1.5">
          {(Object.entries(metrics) as [HighlightableMetric, number][]).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-12 text-muted-foreground truncate">{METRIC_LABELS[key]}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${val}%`,
                    backgroundColor: val >= 70 ? '#10B981' : val >= 40 ? '#EAB308' : '#EF4444',
                  }}
                />
              </div>
              <span className="w-6 text-right tabular-nums">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

/** 피부 12존 히트맵 오버레이 */
export function FaceHeatmapOverlay({
  imageUrl,
  landmarks,
  zoneScores,
  zoneMetrics,
  highlightMetric,
  initialMode = 'strength',
  onZoneClick,
  className,
}: FaceHeatmapOverlayProps): React.ReactElement {
  const [mode, setMode] = useState<OverlayMode>(initialMode);
  const [selectedZone, setSelectedZone] = useState<DetailedZoneId | null>(null);

  const zoneIds = Object.keys(zoneScores) as DetailedZoneId[];

  const handleZoneClick = useCallback(
    (zoneId: DetailedZoneId) => {
      setSelectedZone((prev) => (prev === zoneId ? null : zoneId));
      const metrics = zoneMetrics[zoneId];
      if (metrics) onZoneClick?.(zoneId, metrics);
    },
    [onZoneClick, zoneMetrics]
  );

  const srDescription = useMemo(
    () =>
      `피부 12존 히트맵. ${zoneIds.map((id) => `${DETAILED_ZONE_LABELS[id]}: ${zoneScores[id]}점`).join(', ')}`,
    [zoneIds, zoneScores]
  );

  return (
    <div data-testid="face-heatmap-overlay" className={className}>
      <div className="flex justify-center mb-3">
        <StrengthHighlightToggle mode={mode} onModeChange={setMode} />
      </div>
      <AnalysisOverlayBase
        imageUrl={imageUrl}
        imageAlt="피부 분석 사진"
        srOnlyDescription={srDescription}
      >
        {(dim: OverlayDimensions) => {
          const rawCoords = mapLandmarksToZoneCoordinates(landmarks, {
            width: dim.naturalWidth,
            height: dim.naturalHeight,
          });
          const coords = scaleCoordinates(rawCoords, dim.scale);

          return (
            <svg
              width={dim.width}
              height={dim.height}
              className="absolute inset-0"
              aria-hidden="true"
            >
              {zoneIds.map((zoneId) => {
                const coord = coords[zoneId];
                const score = zoneScores[zoneId] ?? 50;
                const metrics = zoneMetrics[zoneId];
                const style = metrics
                  ? computeHighlightedZoneStyle(metrics, highlightMetric, score, mode)
                  : {
                      fill: 'rgba(156,163,175,0.2)',
                      stroke: '#9CA3AF',
                      opacity: 0.3,
                      badgeText: `${score}`,
                      icon: '',
                      strokeDasharray: undefined,
                    };
                const isSelected = selectedZone === zoneId;

                return (
                  <g
                    key={zoneId}
                    className="cursor-pointer"
                    onClick={() => handleZoneClick(zoneId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${DETAILED_ZONE_LABELS[zoneId]}: ${score}점`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleZoneClick(zoneId);
                    }}
                  >
                    <ellipse
                      cx={coord.cx}
                      cy={coord.cy}
                      rx={coord.rx}
                      ry={coord.ry}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={style.strokeDasharray}
                      opacity={style.opacity}
                      className="transition-all duration-200"
                    />
                    <circle
                      cx={coord.cx}
                      cy={coord.cy}
                      r={11}
                      fill="white"
                      stroke={style.stroke}
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                    <text
                      x={coord.cx}
                      y={coord.cy + 4}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={600}
                      fill={style.stroke}
                      className="pointer-events-none select-none"
                    >
                      {style.badgeText}
                    </text>
                  </g>
                );
              })}
              {selectedZone && zoneMetrics[selectedZone] && (
                <ZonePopover
                  zoneId={selectedZone}
                  metrics={zoneMetrics[selectedZone]!}
                  coord={coords[selectedZone]}
                  onClose={() => setSelectedZone(null)}
                />
              )}
            </svg>
          );
        }}
      </AnalysisOverlayBase>
    </div>
  );
}
