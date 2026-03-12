/**
 * VITA 셰이드 디스플레이 컴포넌트
 *
 * @module components/analysis/oral-health/VitaShadeDisplay
 * @description VITA Classical 16색 + 3D-Master 29색 셰이드 시각화
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  VitaShade,
  ToothColorResult,
  Vita3DMasterShade,
  VitaBleachedShade,
} from '@/types/oral-health';

// VITA 셰이드별 대략적인 색상 (디스플레이용)
const SHADE_COLORS: Record<string, string> = {
  // Bleached
  '0M1': '#FDFBF7',
  '0M2': '#FBF8F0',
  '0M3': '#F8F4E8',
  // B 계열 (밝은 황색)
  B1: '#F5EFE0',
  B2: '#EDE5D0',
  B3: '#E2D8C0',
  B4: '#D5C8AD',
  // A 계열 (적갈색)
  A1: '#F0E8D5',
  A2: '#E8DCC5',
  A3: '#DDD0B5',
  'A3.5': '#D5C5A5',
  A4: '#C8B898',
  // C 계열 (회색)
  C1: '#E8E4D8',
  C2: '#DDD8CC',
  C3: '#D0CABC',
  C4: '#C2BBAB',
  // D 계열 (적회색)
  D2: '#E5DFD0',
  D3: '#D8D0C0',
  D4: '#CCC3B0',
  // 3D-Master Value Group 1
  '1M1': '#F5EFE0',
  '1M2': '#F0E8D5',
  // 3D-Master Value Group 2
  '2L1.5': '#EDE8D8',
  '2L2.5': '#E8E2D0',
  '2M1': '#EDE5D0',
  '2M2': '#E8DCC5',
  '2M3': '#E3D5BB',
  '2R1.5': '#E8D8C0',
  '2R2.5': '#E3D0B5',
  // 3D-Master Value Group 3
  '3L1.5': '#DDD8CC',
  '3L2.5': '#D8D0C2',
  '3M1': '#D8D0C0',
  '3M2': '#DDD0B5',
  '3M3': '#D5C8AD',
  '3R1.5': '#D5C5A8',
  '3R2.5': '#D0BEA0',
  // 3D-Master Value Group 4
  '4L1.5': '#D0CABC',
  '4L2.5': '#CAC2B2',
  '4M1': '#CCC3B0',
  '4M2': '#C8BAA5',
  '4M3': '#C2B298',
  '4R1.5': '#C5B59A',
  '4R2.5': '#C0AE90',
  // 3D-Master Value Group 5
  '5M1': '#BAB5A8',
  '5M2': '#B0A89A',
  '5M3': '#A8A090',
};

// 셰이드 밝기 순서 (Classical, 1=가장 밝음)
const BRIGHTNESS_ORDER: VitaShade[] = [
  '0M1',
  '0M2',
  '0M3',
  'B1',
  'A1',
  'B2',
  'D2',
  'A2',
  'C1',
  'C2',
  'D4',
  'A3',
  'D3',
  'B3',
  'A3.5',
  'B4',
  'C3',
  'A4',
  'C4',
];

// 3D-Master 명도 그룹별 셰이드
type Shade3D = Vita3DMasterShade | VitaBleachedShade;
const VALUE_GROUPS: { label: string; shades: Shade3D[] }[] = [
  { label: '0 (미백)', shades: ['0M1', '0M2', '0M3'] },
  { label: '1 (매우 밝음)', shades: ['1M1', '1M2'] },
  { label: '2 (밝음)', shades: ['2L1.5', '2L2.5', '2M1', '2M2', '2M3', '2R1.5', '2R2.5'] },
  { label: '3 (중간)', shades: ['3L1.5', '3L2.5', '3M1', '3M2', '3M3', '3R1.5', '3R2.5'] },
  { label: '4 (어두움)', shades: ['4L1.5', '4L2.5', '4M1', '4M2', '4M3', '4R1.5', '4R2.5'] },
  { label: '5 (매우 어두움)', shades: ['5M1', '5M2', '5M3'] },
];

type ShadeView = 'classical' | '3d-master';

interface VitaShadeDisplayProps {
  /** 현재 셰이드 */
  currentShade: VitaShade;
  /** 목표 셰이드 (선택) */
  targetShade?: VitaShade;
  /** 3D-Master 매칭 셰이드 (선택, result.matched3DShade로 자동 추출 가능) */
  matched3DShade?: Shade3D;
  /** 전체 분석 결과 (선택) */
  result?: ToothColorResult;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// VITA 셰이드 디스플레이 (Classical 16색 + 3D-Master 29색)
export function VitaShadeDisplay({
  currentShade,
  targetShade,
  matched3DShade: matched3DShadeProp,
  result,
  compact = false,
  className,
}: VitaShadeDisplayProps): React.ReactElement {
  const [view, setView] = useState<ShadeView>('classical');
  const currentIndex = BRIGHTNESS_ORDER.indexOf(currentShade);
  const targetIndex = targetShade ? BRIGHTNESS_ORDER.indexOf(targetShade) : -1;
  const stepsNeeded = targetIndex >= 0 ? currentIndex - targetIndex : 0;

  // result에서 3D-Master 매칭 정보를 자동 추출 (명시적 prop이 우선)
  const matched3DShade =
    matched3DShadeProp ?? (result?.matched3DShade?.shade as Shade3D | undefined);

  return (
    <div
      className={cn('rounded-lg border bg-card p-4', className)}
      data-testid="vita-shade-display"
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">치아 색상</h3>
        {result && (
          <span className="text-sm text-muted-foreground">신뢰도 {result.confidence}%</span>
        )}
      </div>

      {/* 현재 셰이드 표시 */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-inner"
          style={{ backgroundColor: SHADE_COLORS[currentShade] }}
        >
          <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{currentShade}</span>
        </div>
        <div>
          <p className="font-medium">현재 셰이드</p>
          <p className="text-sm text-muted-foreground">{getShadeDescription(currentShade)}</p>
          {matched3DShade && (
            <p className="text-xs text-muted-foreground">3D-Master: {matched3DShade}</p>
          )}
        </div>
      </div>

      {/* 목표 셰이드 표시 */}
      {targetShade && (
        <div className="mb-4 flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed shadow-inner"
            style={{ backgroundColor: SHADE_COLORS[targetShade] }}
          >
            <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {targetShade}
            </span>
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
          {/* 뷰 전환 탭 */}
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md px-3 py-1 text-sm transition-colors',
                view === 'classical'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              onClick={() => setView('classical')}
            >
              Classical (16색)
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md px-3 py-1 text-sm transition-colors',
                view === '3d-master'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              onClick={() => setView('3d-master')}
            >
              3D-Master (29색)
            </button>
          </div>

          {/* Classical 뷰 */}
          {view === 'classical' && (
            <>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {BRIGHTNESS_ORDER.slice(3, 19).map((shade) => (
                  <ShadeCell
                    key={shade}
                    shade={shade}
                    isActive={shade === currentShade}
                    isTarget={shade === targetShade}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>밝음</span>
                <span>어두움</span>
              </div>
            </>
          )}

          {/* 3D-Master 뷰 — 명도 그룹별 그리드 */}
          {view === '3d-master' && (
            <div className="space-y-2">
              {/* 매칭된 3D-Master 셰이드 요약 */}
              {matched3DShade && result?.matched3DShade && (
                <div className="mb-2 rounded bg-primary/5 p-2 text-sm">
                  <span className="font-medium">{matched3DShade}</span>
                  <span className="ml-1 text-muted-foreground">
                    (명도 {result.matched3DShade.valueGroup},{' '}
                    {get3DChromaLabel(result.matched3DShade.chroma)})
                  </span>
                </div>
              )}
              {VALUE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.shades.map((shade) => (
                      <ShadeCell
                        key={shade}
                        shade={shade}
                        isActive={shade === matched3DShade || shade === currentShade}
                        isTarget={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>L (낮은 채도)</span>
                <span>M (중간)</span>
                <span>R (높은 채도)</span>
              </div>
            </div>
          )}
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
            <span className="text-muted-foreground">누런 정도:</span>
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
 * 셰이드 셀 컴포넌트
 */
function ShadeCell({
  shade,
  isActive,
  isTarget,
}: {
  shade: string;
  isActive: boolean;
  isTarget: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex h-8 min-w-[2rem] flex-shrink-0 items-center justify-center rounded text-xs font-medium transition-all',
        isActive && 'ring-2 ring-primary ring-offset-2',
        isTarget && 'ring-2 ring-green-500 ring-offset-2'
      )}
      style={{ backgroundColor: SHADE_COLORS[shade] || '#E0D8CC' }}
      title={`${shade}: ${getShadeDescription(shade as VitaShade)}`}
    >
      <span className="text-gray-600 dark:text-gray-300">{shade}</span>
    </div>
  );
}

/**
 * 3D-Master 채도 레이블 반환
 */
function get3DChromaLabel(chroma: string): string {
  const labels: Record<string, string> = {
    L: '낮은 채도',
    M: '중간 채도',
    R: '높은 채도',
  };
  return labels[chroma] || chroma;
}

/**
 * 셰이드 설명 반환
 */
function getShadeDescription(shade: VitaShade): string {
  if (shade.startsWith('0M')) {
    return '미백 처리';
  }
  // 3D-Master 셰이드 (숫자로 시작: 1M1, 2L1.5, 3R2.5 등)
  if (/^\d/.test(shade)) {
    const valueGroup = shade.charAt(0);
    const chromaChar = shade.charAt(1);
    const chromaLabels: Record<string, string> = {
      L: '낮은 채도',
      M: '중간 채도',
      R: '높은 채도',
    };
    return `명도 ${valueGroup} · ${chromaLabels[chromaChar] || ''}`;
  }
  const series = shade.charAt(0);
  const seriesDescriptions: Record<string, string> = {
    A: '따뜻한 갈색 계열',
    B: '밝은 노란 계열',
    C: '차분한 회색 계열',
    D: '자연스러운 회갈색 계열',
  };
  return seriesDescriptions[series] || '';
}

/**
 * 밝기 레이블 반환
 */
function getBrightnessLabel(brightness: string): string {
  const labels: Record<string, string> = {
    very_bright: '매우 밝음',
    bright: '밝음',
    medium: '보통',
    dark: '어두움',
    very_dark: '매우 어두움',
  };
  return labels[brightness] || '알 수 없음';
}

/**
 * 황색도 레이블 반환
 */
function getYellownessLabel(yellowness: string): string {
  const labels: Record<string, string> = {
    minimal: '최소',
    mild: '경미',
    moderate: '보통',
    significant: '상당',
  };
  return labels[yellowness] || '알 수 없음';
}

export default VitaShadeDisplay;
