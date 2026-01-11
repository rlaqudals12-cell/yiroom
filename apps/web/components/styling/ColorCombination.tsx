'use client';

/**
 * Phase J: 색상 조합 추천 컴포넌트
 * PC-1 시즌 타입에 기반한 코디 색상 조합 표시
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorCombination as ColorCombinationType, ColorInfo } from '@/types/styling';
import { OCCASION_LABELS, STYLE_LABELS } from '@/types/styling';

interface ColorCombinationProps {
  combinations: ColorCombinationType[];
  title?: string;
  showProducts?: boolean;
  onProductClick?: (combinationId: string) => void;
  onSave?: (combinationId: string) => void;
  className?: string;
}

/** 단일 색상 스와치 */
function ColorSwatch({
  color,
  size = 'md',
  showName = true,
}: {
  color: ColorInfo;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg shadow-md border border-border/50 transition-transform hover:scale-105'
        )}
        style={{ backgroundColor: color.hex }}
        title={color.name}
        data-testid="color-swatch"
      />
      {showName && <span className="text-xs text-muted-foreground text-center">{color.name}</span>}
    </div>
  );
}

/** 코디 조합 미리보기 (상의 + 하의) */
function OutfitPreview({
  top,
  bottom,
  accent,
}: {
  top: ColorInfo;
  bottom: ColorInfo;
  accent?: ColorInfo;
}) {
  return (
    <div className="flex items-center gap-2" data-testid="outfit-preview">
      {/* 상의 */}
      <div className="flex flex-col items-center">
        <div
          className="w-14 h-12 rounded-t-lg shadow-sm border border-border/30"
          style={{ backgroundColor: top.hex }}
          title={`상의: ${top.name}`}
        />
        <span className="text-[10px] text-muted-foreground mt-0.5">상의</span>
      </div>

      {/* 하의 */}
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-14 rounded-b-lg shadow-sm border border-border/30"
          style={{ backgroundColor: bottom.hex }}
          title={`하의: ${bottom.name}`}
        />
        <span className="text-[10px] text-muted-foreground mt-0.5">하의</span>
      </div>

      {/* 악센트 (선택) */}
      {accent && (
        <div className="flex flex-col items-center">
          <div
            className="w-6 h-6 rounded-full shadow-sm border border-border/30"
            style={{ backgroundColor: accent.hex }}
            title={`악센트: ${accent.name}`}
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">악센트</span>
        </div>
      )}
    </div>
  );
}

/** 단일 코디 카드 */
function CombinationCard({
  combination,
  showProducts,
  onProductClick,
  onSave,
}: {
  combination: ColorCombinationType;
  showProducts?: boolean;
  onProductClick?: (id: string) => void;
  onSave?: (id: string) => void;
}) {
  const { colors, name, description, style, occasions, tip } = combination;

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow"
      data-testid="combination-card"
    >
      <CardContent className="p-4">
        {/* 코디 미리보기 */}
        <div className="flex justify-center mb-4">
          <OutfitPreview top={colors.top} bottom={colors.bottom} accent={colors.accent} />
        </div>

        {/* 색상 이름 */}
        <h4 className="font-medium text-center mb-1">{name}</h4>
        <p className="text-sm text-muted-foreground text-center mb-3">{description}</p>

        {/* 스타일 & 상황 배지 */}
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          <Badge variant="secondary" className="text-xs">
            {STYLE_LABELS[style]}
          </Badge>
          {occasions.slice(0, 2).map((occ) => (
            <Badge key={occ} variant="outline" className="text-xs">
              {OCCASION_LABELS[occ as keyof typeof OCCASION_LABELS] || occ}
            </Badge>
          ))}
        </div>

        {/* 스타일링 팁 */}
        {tip && (
          <div className="bg-muted/50 rounded-md p-2 mb-3">
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
              {tip}
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {showProducts && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onProductClick?.(combination.id)}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              제품 보기
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onSave?.(combination.id)}
          >
            <Bookmark className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 색상 조합 추천 메인 컴포넌트
 */
export default function ColorCombination({
  combinations,
  title = '추천 코디 조합',
  showProducts = false,
  onProductClick,
  onSave,
  className,
}: ColorCombinationProps) {
  if (!combinations || combinations.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="color-combination">
      {title && (
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {title}
        </h3>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combinations.map((combo) => (
          <CombinationCard
            key={combo.id}
            combination={combo}
            showProducts={showProducts}
            onProductClick={onProductClick}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

export { ColorSwatch, OutfitPreview, CombinationCard };
