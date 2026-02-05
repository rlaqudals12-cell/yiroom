'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DeviceCapability, MetalType } from '@/types/visual-analysis';

// ============================================
// 색상 팔레트 데이터
// ============================================

/** 시즌별 기본 16색 */
const BASE_COLORS = {
  spring: [
    { hex: '#FF7F50', name: 'Coral' },
    { hex: '#FFCBA4', name: 'Peach' },
    { hex: '#FA8072', name: 'Salmon' },
    { hex: '#FFFFF0', name: 'Ivory' },
  ],
  summer: [
    { hex: '#E6E6FA', name: 'Lavender' },
    { hex: '#FF007F', name: 'Rose' },
    { hex: '#87CEEB', name: 'Sky Blue' },
    { hex: '#98FF98', name: 'Mint' },
  ],
  autumn: [
    { hex: '#E2725B', name: 'Terracotta' },
    { hex: '#808000', name: 'Olive' },
    { hex: '#FFDB58', name: 'Mustard' },
    { hex: '#800020', name: 'Burgundy' },
  ],
  winter: [
    { hex: '#FF00FF', name: 'Fuchsia' },
    { hex: '#4169E1', name: 'Royal Blue' },
    { hex: '#50C878', name: 'Emerald' },
    { hex: '#000000', name: 'Black' },
  ],
} as const;

type Season = keyof typeof BASE_COLORS;

/**
 * 명도/채도 변형으로 확장 색상 생성
 * - 어두운 변형 + 밝은 변형 모두 생성 (음수 factor 방지)
 */
function generateExtendedColors(baseColors: typeof BASE_COLORS, count: 64 | 128) {
  const colorsPerSeason = count / 4;
  const variationsPerColor = colorsPerSeason / 4;

  const result: Array<{ hex: string; name: string; season: Season }> = [];

  (Object.keys(baseColors) as Season[]).forEach((season) => {
    const seasonColors = baseColors[season];

    seasonColors.forEach((color) => {
      // 원본 색상
      result.push({ ...color, season });

      // 명도 변형: 밝은 버전(factor > 1)과 어두운 버전(factor < 1) 번갈아 생성
      for (let i = 1; i < variationsPerColor; i++) {
        // 짝수: 밝게 (1.1, 1.2, 1.3...), 홀수: 어둡게 (0.85, 0.7, 0.55...)
        const isLighter = i % 2 === 0;
        const step = Math.ceil(i / 2);
        const factor = isLighter ? 1 + step * 0.15 : 1 - step * 0.15;
        // factor 범위 제한: 0.2 ~ 1.5
        const clampedFactor = Math.max(0.2, Math.min(1.5, factor));
        const variantHex = adjustBrightness(color.hex, clampedFactor);
        result.push({
          hex: variantHex,
          name: `${color.name} ${isLighter ? 'Light' : 'Dark'} ${step}`,
          season,
        });
      }
    });
  });

  return result;
}

/**
 * HEX 색상 밝기 조정
 * - factor < 1: 어둡게 (검은색 방향)
 * - factor > 1: 밝게 (흰색 방향으로 보간)
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  let newR: number, newG: number, newB: number;

  if (factor <= 1) {
    // 어둡게: 검은색 방향으로
    newR = Math.round(r * factor);
    newG = Math.round(g * factor);
    newB = Math.round(b * factor);
  } else {
    // 밝게: 흰색 방향으로 보간
    const t = factor - 1; // 0~0.5 범위
    newR = Math.round(r + (255 - r) * t);
    newG = Math.round(g + (255 - g) * t);
    newB = Math.round(b + (255 - b) * t);
  }

  // 0-255 범위로 클램프
  newR = Math.max(0, Math.min(255, newR));
  newG = Math.max(0, Math.min(255, newG));
  newB = Math.max(0, Math.min(255, newB));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
}

// ============================================
// 컴포넌트 Props
// ============================================

interface DrapeColorPaletteProps {
  /** 기기 성능 정보 */
  deviceCapability: DeviceCapability;
  /** 선택된 색상 */
  selectedColor: string | null;
  /** 색상 선택 핸들러 */
  onColorSelect: (hex: string) => void;
  /** 금속 타입 */
  metalType: MetalType;
  /** 금속 타입 변경 핸들러 */
  onMetalTypeChange: (type: MetalType) => void;
  /** 사용자 퍼스널컬러 시즌 (기본 필터로 사용) */
  userSeason?: Season;
  /** 분석 중 여부 */
  isAnalyzing?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * PC-1+ 드레이프 색상 팔레트
 * - 기기 성능에 따라 16/64/128색 표시
 * - 금속 테스트 (실버/골드) 버튼
 */
export default function DrapeColorPalette({
  deviceCapability,
  selectedColor,
  onColorSelect,
  metalType,
  onMetalTypeChange,
  userSeason,
  isAnalyzing = false,
  className,
}: DrapeColorPaletteProps) {
  // 사용자 시즌이 있으면 해당 시즌만 기본 표시 (32색), 없으면 전체 (128색)
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<Season | 'all'>(userSeason || 'all');

  // 색상 팔레트 생성
  const colors = useMemo(() => {
    const colorCount = deviceCapability.drapeColors;

    if (colorCount === 16) {
      // 기본 16색
      return (Object.keys(BASE_COLORS) as Season[]).flatMap((season) =>
        BASE_COLORS[season].map((c) => ({ ...c, season }))
      );
    }

    // 확장 색상
    return generateExtendedColors(BASE_COLORS, colorCount);
  }, [deviceCapability.drapeColors]);

  // 필터링된 색상
  const filteredColors = useMemo(() => {
    if (activeSeasonFilter === 'all') return colors;
    return colors.filter((c) => c.season === activeSeasonFilter);
  }, [colors, activeSeasonFilter]);

  // 그리드 컬럼 수 결정
  const gridCols = deviceCapability.drapeColors === 16 ? 4 : 8;

  return (
    <div className={cn('space-y-4', className)} data-testid="drape-color-palette">
      {/* 금속 테스트 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={metalType === 'silver' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMetalTypeChange('silver')}
          disabled={isAnalyzing}
          className="flex-1"
        >
          <span className="mr-1">🥈</span> 실버
        </Button>
        <Button
          variant={metalType === 'gold' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMetalTypeChange('gold')}
          disabled={isAnalyzing}
          className="flex-1"
        >
          <span className="mr-1">🥇</span> 골드
        </Button>
      </div>

      {/* 시즌 필터 (64/128색 또는 사용자 시즌이 있을 때) */}
      {(deviceCapability.drapeColors > 16 || userSeason) && (
        <div className="flex gap-1 flex-wrap items-center">
          {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeSeasonFilter === filter ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSeasonFilter(filter)}
              className="text-xs px-2 py-1 h-7"
            >
              {filter === 'all'
                ? '전체 보기'
                : filter === 'spring'
                  ? '봄'
                  : filter === 'summer'
                    ? '여름'
                    : filter === 'autumn'
                      ? '가을'
                      : '겨울'}
              {/* 사용자 시즌 표시 */}
              {userSeason && filter === userSeason && (
                <span className="ml-1 text-[10px] text-primary">★</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* 색상 그리드 - 항상 스크롤 가능, 하단 여백으로 마지막 행 보호 */}
      <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border/50 p-3">
        <div
          className={cn('grid gap-1.5 pb-12', `grid-cols-${gridCols}`)}
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {filteredColors.map((color, index) => (
            <button
              key={`${color.hex}-${index}`}
              onClick={() => onColorSelect(color.hex)}
              disabled={isAnalyzing}
              className={cn(
                'aspect-square rounded-md border-2 transition-all duration-150',
                'hover:scale-105 hover:shadow-md',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                selectedColor === color.hex
                  ? 'border-primary ring-2 ring-primary ring-offset-1'
                  : 'border-transparent',
                isAnalyzing && 'opacity-50 cursor-not-allowed'
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`${color.name} 색상 선택`}
            />
          ))}
        </div>
      </div>

      {/* 선택된 색상 정보 */}
      {selectedColor && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded border" style={{ backgroundColor: selectedColor }} />
          <span className="text-muted-foreground">
            {colors.find((c) => c.hex === selectedColor)?.name || selectedColor}
          </span>
        </div>
      )}

      {/* 성능 모드 표시 */}
      <p className="text-xs text-muted-foreground text-center">
        {deviceCapability.tier === 'high'
          ? '상세 모드 (128색)'
          : deviceCapability.tier === 'medium'
            ? '표준 모드 (64색)'
            : '빠른 모드 (16색)'}
      </p>
    </div>
  );
}
