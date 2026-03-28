'use client';

/**
 * A-6: 메이크업 페이스 존 컬러 가이드
 *
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.5
 */

import { useState, useMemo, useCallback } from 'react';
import { AnalysisOverlayBase } from './AnalysisOverlayBase';
import type { OverlayDimensions } from './AnalysisOverlayBase';
import type { OverlayMode } from './internal/overlay-tokens';
import { computeMakeupZoneStyle } from './internal/zone-color-mapper';

interface LandmarkPoint {
  x: number;
  y: number;
}
type MakeupCategory = 'eyeshadow' | 'lip' | 'blush' | 'contour';

interface ColorRec {
  category: string;
  colors: Array<{ name: string; hex: string; description?: string }>;
}

export interface MakeupFaceMapOverlayProps {
  imageUrl: string;
  landmarks: LandmarkPoint[] | null;
  colorRecommendations: ColorRec[];
  activeCategory?: MakeupCategory;
  mode?: OverlayMode;
  onCategoryClick?: (category: string) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<MakeupCategory, string> = {
  eyeshadow: '아이섀도',
  lip: '립',
  blush: '블러셔',
  contour: '컨투어',
};
const ALL_CATS: MakeupCategory[] = ['eyeshadow', 'lip', 'blush', 'contour'];

// 랜드마크 인덱스 (face-api.js 68-point)
const ZONE_LANDMARKS: Record<MakeupCategory, number[]> = {
  eyeshadow: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
  lip: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  blush: [1, 2, 3, 4, 13, 14, 15],
  contour: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};

// 정적 폴백 (viewBox 0-100)
const STATIC: Record<MakeupCategory, { cx: number; cy: number; rx: number; ry: number }> = {
  eyeshadow: { cx: 50, cy: 33, rx: 25, ry: 6 },
  lip: { cx: 50, cy: 68, rx: 12, ry: 6 },
  blush: { cx: 50, cy: 50, rx: 30, ry: 10 },
  contour: { cx: 50, cy: 50, rx: 25, ry: 30 },
};

function toPolygonPoints(lms: LandmarkPoint[], indices: number[], scale: number): string {
  return indices
    .filter((i) => i < lms.length)
    .map((i) => `${(lms[i].x * scale).toFixed(1)},${(lms[i].y * scale).toFixed(1)}`)
    .join(' ');
}

export function MakeupFaceMapOverlay({
  imageUrl,
  landmarks,
  colorRecommendations,
  activeCategory: extActive,
  mode = 'strength',
  onCategoryClick,
  className,
}: MakeupFaceMapOverlayProps): React.ReactElement {
  const [intActive, setIntActive] = useState<MakeupCategory>('lip');
  const active = extActive ?? intActive;

  const catColors = useMemo(() => {
    const m: Partial<Record<MakeupCategory, string>> = {};
    for (const r of colorRecommendations) {
      const c = r.category as MakeupCategory;
      if (ALL_CATS.includes(c) && r.colors.length > 0) m[c] = r.colors[0].hex;
    }
    return m;
  }, [colorRecommendations]);

  const handleClick = useCallback(
    (c: MakeupCategory) => {
      setIntActive(c);
      onCategoryClick?.(c);
    },
    [onCategoryClick]
  );

  return (
    <div data-testid="makeup-facemap-overlay" className={className}>
      <div className="flex justify-center gap-2 mb-3 flex-wrap">
        {ALL_CATS.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              active === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            }`}
            data-testid={`makeup-category-${cat}`}
          >
            {catColors[cat] && (
              <span
                className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: catColors[cat] }}
              />
            )}
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <AnalysisOverlayBase
        imageUrl={imageUrl}
        imageAlt="메이크업 분석 사진"
        srOnlyDescription={`메이크업 추천 색상 가이드`}
      >
        {(dim: OverlayDimensions) => {
          const hasLm = landmarks && landmarks.length >= 68;
          return (
            <svg
              width={dim.width}
              height={dim.height}
              className="absolute inset-0"
              aria-hidden="true"
            >
              {ALL_CATS.map((cat) => {
                const hex = catColors[cat] ?? '#9CA3AF';
                const isActive = active === cat;
                const style = computeMakeupZoneStyle(hex, CATEGORY_LABELS[cat], isActive);
                if (mode === 'strength' && !isActive) return null;

                if (hasLm) {
                  return (
                    <polygon
                      key={cat}
                      points={toPolygonPoints(landmarks!, ZONE_LANDMARKS[cat], dim.scale)}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={style.opacity}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => handleClick(cat)}
                      data-testid={`makeup-zone-${cat}`}
                    />
                  );
                }
                const sz = STATIC[cat];
                return (
                  <ellipse
                    key={cat}
                    cx={(sz.cx / 100) * dim.width}
                    cy={(sz.cy / 100) * dim.height}
                    rx={(sz.rx / 100) * dim.width}
                    ry={(sz.ry / 100) * dim.height}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={style.opacity}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => handleClick(cat)}
                    data-testid={`makeup-zone-${cat}`}
                  />
                );
              })}
            </svg>
          );
        }}
      </AnalysisOverlayBase>
    </div>
  );
}
