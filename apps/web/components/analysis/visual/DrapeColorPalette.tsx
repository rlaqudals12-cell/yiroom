'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import type { DeviceCapability, MetalType } from '@/types/visual-analysis';
import { useTranslations } from 'next-intl';

// ============================================
// 색상 팔레트 데이터
// ============================================

/** 시즌별 기본 16색 (한국어 이름 필수 — UX A1 규칙) */
const BASE_COLORS = {
  spring: [
    { hex: '#FF7F50', name: 'Coral', nameKo: '코랄' },
    { hex: '#FFCBA4', name: 'Peach', nameKo: '피치' },
    { hex: '#FA8072', name: 'Salmon', nameKo: '살몬' },
    { hex: '#FFFFF0', name: 'Ivory', nameKo: '아이보리' },
  ],
  summer: [
    { hex: '#E6E6FA', name: 'Lavender', nameKo: '라벤더' },
    { hex: '#FF007F', name: 'Rose', nameKo: '로즈' },
    { hex: '#87CEEB', name: 'Sky Blue', nameKo: '스카이블루' },
    { hex: '#98FF98', name: 'Mint', nameKo: '민트' },
  ],
  autumn: [
    { hex: '#E2725B', name: 'Terracotta', nameKo: '테라코타' },
    { hex: '#808000', name: 'Olive', nameKo: '올리브' },
    { hex: '#FFDB58', name: 'Mustard', nameKo: '머스타드' },
    { hex: '#800020', name: 'Burgundy', nameKo: '버건디' },
  ],
  winter: [
    { hex: '#FF00FF', name: 'Fuchsia', nameKo: '퓨시아' },
    { hex: '#4169E1', name: 'Royal Blue', nameKo: '로열블루' },
    { hex: '#50C878', name: 'Emerald', nameKo: '에메랄드' },
    { hex: '#000000', name: 'Black', nameKo: '블랙' },
  ],
} as const;

type Season = keyof typeof BASE_COLORS;

/**
 * 시즌 웜/쿨에 따른 추천 금속(액세서리 톤).
 * 색채학 통설: 웜 언더톤(봄·가을) → 골드, 쿨 언더톤(여름·겨울) → 실버.
 * userSeason이 없으면 추천 없음(null).
 */
export function getRecommendedMetal(season?: Season): MetalType | null {
  if (!season) return null;
  return season === 'spring' || season === 'autumn' ? 'gold' : 'silver';
}

/**
 * 명도/채도 변형으로 확장 색상 생성
 * - 어두운 변형 + 밝은 변형 모두 생성 (음수 factor 방지)
 */
function generateExtendedColors(baseColors: typeof BASE_COLORS, count: 64 | 128) {
  const colorsPerSeason = count / 4;
  const variationsPerColor = colorsPerSeason / 4;

  const result: Array<{ hex: string; name: string; nameKo: string; season: Season }> = [];

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
        const suffix = isLighter ? `밝은 ${step}` : `어두운 ${step}`;
        result.push({
          hex: variantHex,
          name: `${color.name} ${isLighter ? 'Light' : 'Dark'} ${step}`,
          nameKo: `${color.nameKo} ${suffix}`,
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
  /** 사용자 진단 서브톤 라벨 (예: "여름 쿨 뮤트") — 강조 표시용 */
  userSubtypeLabel?: string;
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
  userSubtypeLabel,
  isAnalyzing = false,
  className,
}: DrapeColorPaletteProps) {
  const t = useTranslations('visualAnalysisUI');
  // 사용자 시즌이 있으면 해당 시즌만 기본 표시 (32색), 없으면 전체 (128색)
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<Season | 'all'>(userSeason || 'all');
  // 웜/쿨에 따른 추천 금속 — 즉각적인 의미 있는 피드백 제공
  const recommendedMetal = getRecommendedMetal(userSeason);
  const recommendedMetalLabel = recommendedMetal === 'gold' ? '골드' : '실버';
  const metalCaption = recommendedMetal
    ? `내 톤에는 ${recommendedMetalLabel} 액세서리가 잘 어울려요. 선택한 금속은 미리보기 탭에서 얼굴 반사광으로 비교돼요.`
    : '선택한 금속은 미리보기 탭에서 얼굴 반사광으로 비교돼요.';

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
      {/* 금속(액세서리 톤) 테스트 버튼 */}
      <div className="space-y-1.5" data-testid="metal-test">
        <div className="flex gap-2">
          <Button
            variant={metalType === 'silver' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMetalTypeChange('silver')}
            disabled={isAnalyzing}
            className="flex-1 min-h-[44px]"
          >
            실버
            {recommendedMetal === 'silver' && (
              <span
                className="ml-1.5 text-[10px] font-semibold text-primary"
                data-testid="metal-recommended"
              >
                ★ 추천
              </span>
            )}
          </Button>
          <Button
            variant={metalType === 'gold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMetalTypeChange('gold')}
            disabled={isAnalyzing}
            className="flex-1 min-h-[44px]"
          >
            골드
            {recommendedMetal === 'gold' && (
              <span
                className="ml-1.5 text-[10px] font-semibold text-primary"
                data-testid="metal-recommended"
              >
                ★ 추천
              </span>
            )}
          </Button>
        </div>
        {/* 컨트롤 목적 명확화 — 미리보기 탭에서 얼굴 반사광으로 반영됨 (죽은 컨트롤 아님) */}
        <p className="text-[11px] text-muted-foreground leading-snug">{metalCaption}</p>
      </div>

      {/* 내 진단 서브톤 강조 — 팔레트는 4계절 기준(12톤 세분 데이터 없음), 진단 서브톤은 명시 */}
      {userSubtypeLabel && (
        <p className="text-xs text-muted-foreground" data-testid="user-subtype-label">
          내 진단: <span className="font-semibold text-foreground">{userSubtypeLabel}</span>
        </p>
      )}

      {/* 시즌 필터 (64/128색 또는 사용자 시즌이 있을 때) */}
      {(deviceCapability.drapeColors > 16 || userSeason) && (
        <div className="flex gap-1 flex-wrap items-center">
          {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeSeasonFilter === filter ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSeasonFilter(filter)}
              className="text-xs px-3 py-2 min-h-[44px]"
            >
              {selectByKey(
                filter,
                {
                  all: t('drapeColorPalette18'),
                  spring: '봄',
                  summer: t('drapeColorPalette19'),
                  autumn: t('drapeColorPalette20'),
                },
                t('drapeColorPalette21')
              )}
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
              title={color.nameKo}
              aria-label={`${color.nameKo} 색상 선택`}
            />
          ))}
        </div>
      </div>

      {/* 선택된 색상 정보 */}
      {selectedColor && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded border" style={{ backgroundColor: selectedColor }} />
          <span className="text-muted-foreground">
            {colors.find((c) => c.hex === selectedColor)?.nameKo || selectedColor}
          </span>
        </div>
      )}

      {/* 성능 모드 표시 */}
      <p className="text-xs text-muted-foreground text-center">
        {selectByKey(
          deviceCapability.tier,
          { high: t('drapeColorPalette23'), medium: t('drapeColorPalette24') },
          t('drapeColorPalette25')
        )}
      </p>
    </div>
  );
}
