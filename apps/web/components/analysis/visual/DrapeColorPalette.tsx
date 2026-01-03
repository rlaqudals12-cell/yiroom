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
 */
function generateExtendedColors(baseColors: typeof BASE_COLORS, count: 64 | 128) {
  const colorsPerSeason = count / 4;
  const variations = colorsPerSeason / 4;

  const result: Array<{ hex: string; name: string; season: Season }> = [];

  (Object.keys(baseColors) as Season[]).forEach((season) => {
    const seasonColors = baseColors[season];

    seasonColors.forEach((color) => {
      // 원본 색상
      result.push({ ...color, season });

      // 명도/채도 변형
      for (let i = 1; i < variations; i++) {
        const factor = 1 - i * 0.15;
        const variantHex = adjustBrightness(color.hex, factor);
        result.push({
          hex: variantHex,
          name: `${color.name} ${i + 1}`,
          season,
        });
      }
    });
  });

  return result;
}

/**
 * HEX 색상 밝기 조정
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(Math.min(255, r * factor));
  const newG = Math.round(Math.min(255, g * factor));
  const newB = Math.round(Math.min(255, b * factor));

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
  isAnalyzing = false,
  className,
}: DrapeColorPaletteProps) {
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<Season | 'all'>('all');

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

      {/* 시즌 필터 (64/128색일 때만) */}
      {deviceCapability.drapeColors > 16 && (
        <div className="flex gap-1 flex-wrap">
          {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeSeasonFilter === filter ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSeasonFilter(filter)}
              className="text-xs px-2 py-1 h-7"
            >
              {filter === 'all'
                ? '전체'
                : filter === 'spring'
                  ? '봄'
                  : filter === 'summer'
                    ? '여름'
                    : filter === 'autumn'
                      ? '가을'
                      : '겨울'}
            </Button>
          ))}
        </div>
      )}

      {/* 색상 그리드 */}
      <div
        className={cn('grid gap-1', `grid-cols-${gridCols}`)}
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
