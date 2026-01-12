'use client';

/**
 * Phase J P2: 메이크업 스타일링 컴포넌트
 * PC-1 시즌 타입에 기반한 메이크업 색상 추천
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonType } from '@/lib/mock/personal-color';
import type { MakeupColor, MakeupPalette, MakeupCategory } from '@/types/styling';
import { MAKEUP_CATEGORY_LABELS } from '@/types/styling';
import { getMakeupStyling } from '@/lib/mock/styling';

interface MakeupStylingProps {
  seasonType: SeasonType;
  className?: string;
}

/** 피니시 한글 라벨 */
const FINISH_LABELS: Record<string, string> = {
  matte: '매트',
  glossy: '글로시',
  shimmer: '쉬머',
  satin: '새틴',
};

/** 메이크업 카테고리 아이콘 */
const CATEGORY_ICONS: Record<MakeupCategory, string> = {
  lipstick: '💄',
  eyeshadow: '👁️',
  blusher: '🌸',
  foundation: '🧴',
};

/** 색상 스와치 */
function ColorSwatch({ color, showFinish = true }: { color: MakeupColor; showFinish?: boolean }) {
  return (
    <div className="flex flex-col items-center" data-testid="makeup-color-swatch">
      <div
        className="w-10 h-10 rounded-lg shadow-md border border-border/30 transition-transform hover:scale-110"
        style={{ backgroundColor: color.hex }}
        title={color.name}
      />
      <span className="text-[10px] text-center mt-1 font-medium">{color.name}</span>
      {showFinish && color.finish && (
        <span className="text-[9px] text-muted-foreground">
          {FINISH_LABELS[color.finish] || color.finish}
        </span>
      )}
    </div>
  );
}

/** 메이크업 팔레트 카드 */
function PaletteCard({ palette }: { palette: MakeupPalette }) {
  const { category, colors, tip } = palette;

  return (
    <Card className="overflow-hidden" data-testid="palette-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>{CATEGORY_ICONS[category]}</span>
          {MAKEUP_CATEGORY_LABELS[category]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 색상 팔레트 */}
        <div className="flex flex-wrap gap-3 justify-center mb-3">
          {colors.map((color, idx) => (
            <ColorSwatch
              key={`${color.name}-${idx}`}
              color={color}
              showFinish={category === 'lipstick' || category === 'eyeshadow'}
            />
          ))}
        </div>

        {/* 팁 */}
        <p className="text-xs text-muted-foreground text-center bg-muted/30 rounded-md p-2">
          {tip}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * 메이크업 스타일링 메인 컴포넌트
 */
export default function MakeupStyling({ seasonType, className }: MakeupStylingProps) {
  const styling = getMakeupStyling(seasonType);

  if (!styling) {
    return null;
  }

  const { lipstick, eyeshadow, blusher, generalTip } = styling;

  return (
    <div className={cn('space-y-6', className)} data-testid="makeup-styling">
      {/* 헤더 */}
      <h3 className="text-lg font-semibold flex items-center gap-2">💄 메이크업 추천</h3>

      {/* 립스틱 */}
      <PaletteCard palette={lipstick} />

      {/* 아이섀도 */}
      <PaletteCard palette={eyeshadow} />

      {/* 블러셔 */}
      <PaletteCard palette={blusher} />

      {/* 일반 팁 */}
      <div className="bg-primary/5 rounded-lg p-4">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          {generalTip}
        </p>
      </div>
    </div>
  );
}

export { ColorSwatch, PaletteCard };
