'use client';

/**
 * C-4: 구강건강 치아 도식 오버레이
 *
 * @description 제네릭 치아 SVG에 VITA 셰이드/잇몸 건강 색상을 매핑
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.6
 */

import { useState } from 'react';
import type { ToothColorResult, GumHealthResult, WhiteningGoalResult } from '@/types/oral-health';
import { UPPER_TEETH, LOWER_TEETH, GUM_PATHS, TOOTH_VIEWBOX } from './internal/tooth-svg-data';
import {
  getToothFillColor,
  getGumFillColor,
  getWhiteningProgress,
  VITA_SHADE_HEX,
} from './internal/tooth-color-mapper';
import type { OverlayMode } from './internal/overlay-tokens';

export interface ToothDiagramOverlayProps {
  toothColor?: ToothColorResult;
  gumHealth?: GumHealthResult;
  whiteningGoal?: Partial<WhiteningGoalResult>;
  mode?: OverlayMode;
  activeTab?: 'tooth-color' | 'gum-health' | 'whitening';
}

// 치아 도식 — 사진 오버레이가 아닌 독립 SVG 컴포넌트
export function ToothDiagramOverlay({
  toothColor,
  gumHealth,
  whiteningGoal,
  mode = 'strength',
  activeTab = 'tooth-color',
}: ToothDiagramOverlayProps): React.ReactElement {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);

  // 치아 색상 결정
  const toothFill = toothColor
    ? getToothFillColor(toothColor.matchedShade)
    : { toothFill: '#E4D8C0', shadeName: 'A1', brightness: 'bright' as const };

  // 잇몸 색상 결정
  const gumStyle = gumHealth
    ? getGumFillColor(gumHealth.healthStatus)
    : { gumFill: '#F5A0B3', statusLabel: '건강' };

  // 미백 목표 진행도
  const whiteningProg =
    whiteningGoal?.targetShade && toothColor
      ? getWhiteningProgress(toothColor.matchedShade, whiteningGoal.targetShade)
      : 0;

  // 치아 렌더링 함수
  const renderTeeth = (teeth: Record<string, string>, opacity: number) =>
    Object.entries(teeth).map(([id, path]) => (
      <path
        key={id}
        d={path}
        fill={toothFill.toothFill}
        stroke={hoveredTooth === id ? '#6366f1' : '#D1D5DB'}
        strokeWidth={hoveredTooth === id ? 1.5 : 0.5}
        opacity={opacity}
        onMouseEnter={() => setHoveredTooth(id)}
        onMouseLeave={() => setHoveredTooth(null)}
        className="transition-all duration-150 cursor-pointer"
        role="img"
        aria-label={`치아 ${id}`}
      />
    ));

  return (
    <div data-testid="tooth-diagram-overlay" className="w-full max-w-xs mx-auto">
      {/* 탭별 시각화 */}
      <svg
        viewBox={TOOTH_VIEWBOX}
        className="w-full h-auto"
        role="img"
        aria-label={`구강 건강 도식: 치아 셰이드 ${toothFill.shadeName}, 잇몸 상태 ${gumStyle.statusLabel}`}
      >
        {/* 잇몸 (배경) */}
        <path
          d={GUM_PATHS.upper}
          fill={activeTab === 'gum-health' ? gumStyle.gumFill : '#F5A0B3'}
          opacity={0.6}
          className="transition-colors duration-300"
        />
        <path
          d={GUM_PATHS.lower}
          fill={activeTab === 'gum-health' ? gumStyle.gumFill : '#F5A0B3'}
          opacity={0.6}
          className="transition-colors duration-300"
        />

        {/* 상단 치아 */}
        {renderTeeth(UPPER_TEETH, activeTab === 'tooth-color' ? 1 : 0.7)}

        {/* 하단 치아 */}
        {renderTeeth(LOWER_TEETH, activeTab === 'tooth-color' ? 1 : 0.7)}
      </svg>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {activeTab === 'tooth-color' && toothColor && (
          <>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded border border-border"
                style={{ backgroundColor: toothFill.toothFill }}
              />
              <span>현재: {toothFill.shadeName}</span>
            </div>
            {whiteningGoal && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded border border-border"
                  style={{
                    backgroundColor: whiteningGoal.targetShade
                      ? VITA_SHADE_HEX[whiteningGoal.targetShade]
                      : '#F5F0E8',
                  }}
                />
                <span>목표: {whiteningGoal.targetShade ?? '-'}</span>
              </div>
            )}
          </>
        )}
        {activeTab === 'gum-health' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gumStyle.gumFill }} />
            <span>{gumStyle.statusLabel}</span>
          </div>
        )}
        {activeTab === 'whitening' && whiteningGoal && (
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span>현재</span>
              <span>목표</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${whiteningProg}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
