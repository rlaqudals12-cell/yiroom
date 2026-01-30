/**
 * VITA 셰이드 디스플레이 컴포넌트
 *
 * @module components/analysis/oral-health/VitaShadeDisplay
 * @description VITA Classical 16색 셰이드 시각화
 */

'use client';

import { cn } from '@/lib/utils';
import type { VitaShade, ToothColorResult } from '@/types/oral-health';

// VITA 셰이드별 대략적인 색상 (디스플레이용)
const SHADE_COLORS: Record<VitaShade, string> = {
  // Bleached
  '0M1': '#FDFBF7',
  '0M2': '#FBF8F0',
  '0M3': '#F8F4E8',
  // B 계열 (밝은 황색)
  'B1': '#F5EFE0',
  'B2': '#EDE5D0',
  'B3': '#E2D8C0',
  'B4': '#D5C8AD',
  // A 계열 (적갈색)
  'A1': '#F0E8D5',
  'A2': '#E8DCC5',
  'A3': '#DDD0B5',
  'A3.5': '#D5C5A5',
  'A4': '#C8B898',
  // C 계열 (회색)
  'C1': '#E8E4D8',
  'C2': '#DDD8CC',
  'C3': '#D0CABC',
  'C4': '#C2BBAB',
  // D 계열 (적회색)
  'D2': '#E5DFD0',
  'D3': '#D8D0C0',
  'D4': '#CCC3B0',
};

// 셰이드 밝기 순서 (1=가장 밝음)
const BRIGHTNESS_ORDER: VitaShade[] = [
  '0M1', '0M2', '0M3',
  'B1', 'A1', 'B2', 'D2', 'A2', 'C1', 'C2', 'D4',
  'A3', 'D3', 'B3', 'A3.5', 'B4', 'C3', 'A4', 'C4',
];

interface VitaShadeDisplayProps {
  /** 현재 셰이드 */
  currentShade: VitaShade;
  /** 목표 셰이드 (선택) */
  targetShade?: VitaShade;
  /** 전체 분석 결과 (선택) */
  result?: ToothColorResult;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export function VitaShadeDisplay({
  currentShade,
  targetShade,
  result,
  compact = false,
  className,
}: VitaShadeDisplayProps) {
  const currentIndex = BRIGHTNESS_ORDER.indexOf(currentShade);
  const targetIndex = targetShade ? BRIGHTNESS_ORDER.indexOf(targetShade) : -1;
  const stepsNeeded = targetIndex >= 0 ? currentIndex - targetIndex : 0;

  return (
    <div
      className={cn('rounded-lg border bg-card p-4', className)}
      data-testid="vita-shade-display"
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">치아 색상</h3>
        {result && (
          <span className="text-sm text-muted-foreground">
            신뢰도 {result.confidence}%
          </span>
        )}
      </div>

      {/* 현재 셰이드 표시 */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-inner"
          style={{ backgroundColor: SHADE_COLORS[currentShade] }}
        >
          <span className="text-lg font-bold text-gray-700">{currentShade}</span>
        </div>
        <div>
          <p className="font-medium">현재 셰이드</p>
          <p className="text-sm text-muted-foreground">
            {getShadeDescription(currentShade)}
          </p>
        </div>
      </div>

      {/* 목표 셰이드 표시 */}
      {targetShade && (
        <div className="mb-4 flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed shadow-inner"
            style={{ backgroundColor: SHADE_COLORS[targetShade] }}
          >
            <span className="text-lg font-bold text-gray-700">{targetShade}</span>
          </div>
          <div>
            <p className="font-medium">목표 셰이드</p>
            <p className="text-sm text-muted-foreground">
              {stepsNeeded > 0 ? `${stepsNeeded}단계 밝게` : '현재 유지'}
            </p>
          </div>
        </div>
      )}

      {/* 셰이드 스케일 (컴팩트 모드가 아닐 때) */}
      {!compact && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">VITA 셰이드 스케일</p>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {BRIGHTNESS_ORDER.slice(0, 16).map((shade) => (
              <div
                key={shade}
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-xs font-medium transition-all',
                  shade === currentShade && 'ring-2 ring-primary ring-offset-2',
                  shade === targetShade && 'ring-2 ring-green-500 ring-offset-2'
                )}
                style={{ backgroundColor: SHADE_COLORS[shade] }}
                title={`${shade}: ${getShadeDescription(shade)}`}
              >
                <span className="text-gray-600">{shade}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>밝음</span>
            <span>어두움</span>
          </div>
        </div>
      )}

      {/* 해석 정보 */}
      {result && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded bg-muted/50 p-2">
            <span className="text-muted-foreground">밝기:</span>
            <span className="ml-1 font-medium">
              {getBrightnessLabel(result.interpretation.brightness)}
            </span>
          </div>
          <div className="rounded bg-muted/50 p-2">
            <span className="text-muted-foreground">황색도:</span>
            <span className="ml-1 font-medium">
              {getYellownessLabel(result.interpretation.yellowness)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 셰이드 설명 반환
 */
function getShadeDescription(shade: VitaShade): string {
  if (shade.startsWith('0M')) {
    return 'Bleached (미백)';
  }
  const series = shade.charAt(0);
  const seriesDescriptions: Record<string, string> = {
    'A': '적갈색 계열',
    'B': '적황색 계열',
    'C': '회색 계열',
    'D': '적회색 계열',
  };
  return seriesDescriptions[series] || '';
}

/**
 * 밝기 레이블 반환
 */
function getBrightnessLabel(brightness: string): string {
  const labels: Record<string, string> = {
    'very_bright': '매우 밝음',
    'bright': '밝음',
    'medium': '보통',
    'dark': '어두움',
    'very_dark': '매우 어두움',
  };
  return labels[brightness] || brightness;
}

/**
 * 황색도 레이블 반환
 */
function getYellownessLabel(yellowness: string): string {
  const labels: Record<string, string> = {
    'minimal': '최소',
    'mild': '경미',
    'moderate': '보통',
    'significant': '상당',
  };
  return labels[yellowness] || yellowness;
}

export default VitaShadeDisplay;
