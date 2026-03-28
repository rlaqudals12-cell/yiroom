'use client';

/**
 * A-9: 헤어 얼굴형 윤곽 오버레이
 *
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.4
 */

import { useMemo } from 'react';
import { AnalysisOverlayBase } from './AnalysisOverlayBase';
import type { OverlayDimensions } from './AnalysisOverlayBase';
import { OVERLAY_TOKENS } from './internal/overlay-tokens';
import type { OverlayMode } from './internal/overlay-tokens';
import { generateFaceOutlinePath } from './internal/face-outline-path';

interface LandmarkPoint {
  x: number;
  y: number;
}

export interface HairStyleRecommendation {
  styleName: string;
  description: string;
  matchScore: number;
}

export interface FaceOutlineOverlayProps {
  imageUrl: string;
  landmarks: LandmarkPoint[] | null;
  faceShape: string;
  faceShapeLabel?: string;
  recommendedStyles?: HairStyleRecommendation[];
  mode?: OverlayMode;
  className?: string;
}

// 얼굴형 한국어 라벨 폴백
const SHAPE_LABELS: Record<string, string> = {
  oval: '타원형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴형',
  diamond: '다이아몬드형',
  rectangle: '직사각형',
};

export function FaceOutlineOverlay({
  imageUrl,
  landmarks,
  faceShape,
  faceShapeLabel,
  recommendedStyles,
  mode = 'strength',
  className,
}: FaceOutlineOverlayProps): React.ReactElement {
  const label = faceShapeLabel ?? SHAPE_LABELS[faceShape] ?? faceShape;

  const srDescription = useMemo(() => {
    const styles = recommendedStyles?.map((s) => s.styleName).join(', ');
    return `얼굴형: ${label}${styles ? `. 추천: ${styles}` : ''}`;
  }, [label, recommendedStyles]);

  const strokeColor =
    mode === 'strength' ? OVERLAY_TOKENS.strengthBorder : OVERLAY_TOKENS.neutralBorder;
  const fillColor = mode === 'strength' ? 'rgba(16,185,129,0.08)' : 'rgba(156,163,175,0.05)';

  return (
    <div data-testid="face-outline-overlay" className={className}>
      <AnalysisOverlayBase
        imageUrl={imageUrl}
        imageAlt="얼굴형 분석 사진"
        srOnlyDescription={srDescription}
      >
        {(dim: OverlayDimensions) => {
          const scaled =
            landmarks?.map((p) => ({ x: p.x * dim.scale, y: p.y * dim.scale })) ?? null;
          const outlinePath = scaled ? generateFaceOutlinePath(scaled) : null;
          const labelY = scaled && scaled.length >= 20 ? Math.max(20, scaled[19].y - 40) : 20;

          return (
            <svg
              width={dim.width}
              height={dim.height}
              className="absolute inset-0"
              aria-hidden="true"
            >
              {outlinePath && (
                <path
                  d={outlinePath}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  data-testid="face-outline-path"
                />
              )}
              <g data-testid="face-shape-label">
                <rect
                  x={dim.width / 2 - 40}
                  y={labelY - 12}
                  width={80}
                  height={24}
                  rx={12}
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  opacity={0.95}
                />
                <text
                  x={dim.width / 2}
                  y={labelY + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill="#374151"
                  className="select-none"
                >
                  {label}
                </text>
              </g>
            </svg>
          );
        }}
      </AnalysisOverlayBase>

      {recommendedStyles && recommendedStyles.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3" data-testid="face-outline-styles">
          {recommendedStyles.slice(0, 4).map((style, idx) => (
            <div key={idx} className="border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{style.styleName}</span>
                <span className="text-xs text-emerald-600 font-semibold">{style.matchScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
