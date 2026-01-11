'use client';

/**
 * Phase J P2: 악세서리 스타일링 컴포넌트
 * PC-1 시즌 타입에 기반한 악세서리(금속/보석) 추천
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gem, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonType } from '@/lib/mock/personal-color';
import type { AccessoryItem, AccessoryRecommendation, MetalTone } from '@/types/styling';
import { METAL_TONE_LABELS, ACCESSORY_TYPE_LABELS } from '@/types/styling';
import { getAccessoryStyling } from '@/lib/mock/styling';

interface AccessoryStylingProps {
  seasonType: SeasonType;
  className?: string;
}

/** 금속 톤 색상 */
const METAL_COLORS: Record<MetalTone, string> = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  rose_gold: '#B76E79',
  bronze: '#CD7F32',
};

/** 금속 톤 카드 */
function MetalToneCard({ recommendation }: { recommendation: AccessoryRecommendation }) {
  const { metalTone, isRecommended, description } = recommendation;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-3 rounded-lg border transition-all',
        isRecommended ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-muted/30 opacity-70'
      )}
      data-testid="metal-tone-card"
    >
      {/* 추천 배지 */}
      {isRecommended && <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5">추천</Badge>}

      {/* 금속 색상 원 */}
      <div
        className="w-12 h-12 rounded-full shadow-md border border-border/30 mb-2"
        style={{ backgroundColor: METAL_COLORS[metalTone] }}
      />

      {/* 금속 이름 */}
      <span className="font-medium text-sm">{METAL_TONE_LABELS[metalTone]}</span>

      {/* 추천/비추천 아이콘 */}
      <div className="flex items-center gap-1 mt-1">
        {isRecommended ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <X className="w-3 h-3 text-red-400" />
        )}
        <span className="text-[10px] text-muted-foreground">
          {isRecommended ? '추천' : '비추천'}
        </span>
      </div>

      {/* 설명 (호버 시 툴팁으로 대체 가능) */}
      <p className="text-[10px] text-muted-foreground text-center mt-1 line-clamp-2">
        {description}
      </p>
    </div>
  );
}

/** 악세서리 아이템 카드 */
function AccessoryCard({ item }: { item: AccessoryItem }) {
  const { type, name, metalTone, gemstone, tip } = item;

  return (
    <Card className="overflow-hidden" data-testid="accessory-card">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* 보석/금속 색상 표시 */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-lg shadow-sm border border-border/30"
              style={{ backgroundColor: gemstone?.hex || METAL_COLORS[metalTone] }}
            />
            {/* 금속 톤 표시 */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: METAL_COLORS[metalTone] }}
            />
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {ACCESSORY_TYPE_LABELS[type]}
              </Badge>
              <span className="text-xs text-muted-foreground">{METAL_TONE_LABELS[metalTone]}</span>
            </div>
            <p className="font-medium text-sm mt-1">{name}</p>
            {gemstone && <p className="text-xs text-muted-foreground">{gemstone.name}</p>}
            {tip && <p className="text-[10px] text-primary mt-1">{tip}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 악세서리 스타일링 메인 컴포넌트
 */
export default function AccessoryStyling({ seasonType, className }: AccessoryStylingProps) {
  const styling = getAccessoryStyling(seasonType);

  if (!styling) {
    return null;
  }

  const { metalTones, items, generalTip } = styling;

  return (
    <div className={cn('space-y-6', className)} data-testid="accessory-styling">
      {/* 헤더 */}
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Gem className="w-5 h-5 text-primary" />
        악세서리 추천
      </h3>

      {/* 금속 톤 가이드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">금속 톤 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metalTones.map((rec) => (
              <MetalToneCard key={rec.metalTone} recommendation={rec} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 추천 악세서리 */}
      <div>
        <h4 className="text-sm font-medium mb-3">추천 악세서리</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <AccessoryCard key={`${item.type}-${idx}`} item={item} />
          ))}
        </div>
      </div>

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

export { MetalToneCard, AccessoryCard };
