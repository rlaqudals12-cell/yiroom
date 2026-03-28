'use client';

/**
 * Phase J P3: 전체 코디 컴포넌트
 * PC-1 시즌 타입 기반 의상+악세서리+메이크업 통합 코디
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Bookmark, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonType } from '@/lib/mock/personal-color';
import type { FullOutfit as FullOutfitType, OutfitOccasion } from '@/types/styling';
import { OUTFIT_OCCASION_LABELS, OUTFIT_OCCASION_ICONS, METAL_TONE_LABELS } from '@/types/styling';
import { getOutfitPresets, getOutfitPresetByOccasion } from '@/lib/mock/styling';
import { useTranslations } from 'next-intl';

interface FullOutfitProps {
  seasonType: SeasonType;
  onSave?: (outfit: FullOutfitType, occasion: OutfitOccasion) => void;
  onShare?: (outfit: FullOutfitType) => void;
  savedOutfitIds?: string[]; // 저장된 outfit ID 목록
  className?: string;
}

/** 의상 미리보기 섹션 */
function ClothingSection({ outfit }: { outfit: FullOutfitType }) {
  const { clothing } = outfit;

  return (
    <div className="space-y-2" data-testid="clothing-section">
      <h4 className="text-sm font-medium flex items-center gap-2">👕 의상</h4>
      <div className="flex items-end justify-center gap-4 py-3 bg-muted/30 rounded-lg">
        <div className="flex flex-col items-center">
          <div
            className="w-14 h-12 rounded-t-lg shadow-sm border border-border/30"
            style={{ backgroundColor: clothing.colors.top.hex }}
          />
          <span className="text-[10px] text-muted-foreground mt-1">상의</span>
          <span className="text-[10px] font-medium">{clothing.colors.top.name}</span>
        </div>
        <div className="flex flex-col items-center">
          <div
            className="w-10 h-16 rounded-b-lg shadow-sm border border-border/30"
            style={{ backgroundColor: clothing.colors.bottom.hex }}
          />
          <span className="text-[10px] text-muted-foreground mt-1">하의</span>
          <span className="text-[10px] font-medium">{clothing.colors.bottom.name}</span>
        </div>
        {clothing.colors.accent && (
          <div className="flex flex-col items-center">
            <div
              className="w-6 h-6 rounded-full shadow-sm border border-border/30"
              style={{ backgroundColor: clothing.colors.accent.hex }}
            />
            <span className="text-[10px] text-muted-foreground mt-1">악센트</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** 악세서리 섹션 */
function AccessorySection({ outfit }: { outfit: FullOutfitType }) {
  const { accessory } = outfit;

  return (
    <div className="space-y-2" data-testid="accessory-section">
      <h4 className="text-sm font-medium flex items-center gap-2">
        💎 악세서리
        <Badge variant="outline" className="text-[10px]">
          {METAL_TONE_LABELS[accessory.metalTone]}
        </Badge>
      </h4>
      <div className="flex flex-wrap gap-2">
        {accessory.items.map((item, idx) => (
          <div
            key={`${item.type}-${idx}`}
            className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1"
          >
            {item.gemstone && (
              <div
                className="w-4 h-4 rounded-full border border-border/30"
                style={{ backgroundColor: item.gemstone.hex }}
              />
            )}
            <span className="text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 메이크업 섹션 */
function MakeupSection({ outfit }: { outfit: FullOutfitType }) {
  const { makeup } = outfit;

  return (
    <div className="space-y-2" data-testid="makeup-section">
      <h4 className="text-sm font-medium flex items-center gap-2">💄 메이크업</h4>
      <div className="grid grid-cols-3 gap-2">
        {/* 립스틱 */}
        <div className="flex flex-col items-center bg-muted/30 rounded-md p-2">
          <div
            className="w-8 h-8 rounded-lg shadow-sm border border-border/30"
            style={{ backgroundColor: makeup.lipstick.hex }}
          />
          <span className="text-[9px] text-muted-foreground mt-1">립</span>
          <span className="text-[9px] font-medium text-center">{makeup.lipstick.name}</span>
        </div>

        {/* 아이섀도 */}
        <div className="flex flex-col items-center bg-muted/30 rounded-md p-2">
          <div className="flex gap-0.5">
            {makeup.eyeshadow.slice(0, 2).map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-8 shadow-sm border border-border/30 first:rounded-l last:rounded-r"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground mt-1">아이</span>
        </div>

        {/* 블러셔 */}
        <div className="flex flex-col items-center bg-muted/30 rounded-md p-2">
          <div
            className="w-8 h-8 rounded-full shadow-sm border border-border/30"
            style={{ backgroundColor: makeup.blusher.hex }}
          />
          <span className="text-[9px] text-muted-foreground mt-1">블러셔</span>
          <span className="text-[9px] font-medium text-center">{makeup.blusher.name}</span>
        </div>
      </div>
    </div>
  );
}

/** 전체 코디 프리뷰 카드 */
function OutfitPreviewCard({
  outfit,
  occasion,
  isSaved,
  onSave,
  onShare,
}: {
  outfit: FullOutfitType;
  occasion: OutfitOccasion;
  isSaved?: boolean;
  onSave?: (outfit: FullOutfitType, occasion: OutfitOccasion) => void;
  onShare?: (outfit: FullOutfitType) => void;
}) {
  return (
    <Card className="overflow-hidden" data-testid="outfit-preview-card">
      <CardContent className="p-4 space-y-4">
        {/* 의상 */}
        <ClothingSection outfit={outfit} />

        {/* 악세서리 */}
        <AccessorySection outfit={outfit} />

        {/* 메이크업 */}
        <MakeupSection outfit={outfit} />

        {/* 팁 */}
        <div className="bg-primary/5 rounded-md p-3">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
            {outfit.tip}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onSave?.(outfit, occasion)}
          >
            <Bookmark className={cn('w-3 h-3 mr-1', isSaved && 'fill-current')} />
            {isSaved ? '저장됨' : '저장'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onShare?.(outfit)}
          >
            <Share2 className="w-3 h-3 mr-1" />
            공유
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 전체 코디 메인 컴포넌트
 */
export default function FullOutfit({
  seasonType,
  onSave,
  onShare,
  savedOutfitIds = [],
  className,
}: FullOutfitProps) {
  const t = useTranslations('stylingUI');
  const [currentOccasion, setCurrentOccasion] = useState<OutfitOccasion>('daily');
  const presets = getOutfitPresets(seasonType);
  // currentPreset은 향후 occasion별 세부 추천에 사용 예정: getOutfitPresetByOccasion(seasonType, currentOccasion)

  if (!presets || presets.length === 0) {
    return null;
  }

  const occasions: OutfitOccasion[] = ['daily', 'work', 'date', 'party'];

  return (
    <div className={cn('space-y-6', className)} data-testid="full-outfit">
      {/* 헤더 */}
      <h3 className="text-lg font-semibold flex items-center gap-2">{t('fullOutfit9')}</h3>

      {/* 상황 선택 탭 */}
      <Tabs
        value={currentOccasion}
        onValueChange={(v) => setCurrentOccasion(v as OutfitOccasion)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          {occasions.map((occasion) => (
            <TabsTrigger key={occasion} value={occasion} className="text-xs gap-1">
              <span>{OUTFIT_OCCASION_ICONS[occasion]}</span>
              {OUTFIT_OCCASION_LABELS[occasion]}
            </TabsTrigger>
          ))}
        </TabsList>

        {occasions.map((occasion) => {
          const preset = getOutfitPresetByOccasion(seasonType, occasion);
          return (
            <TabsContent key={occasion} value={occasion}>
              {preset && (
                <div className="space-y-4">
                  {/* 프리셋 헤더 */}
                  <div className="text-center">
                    <h4 className="font-medium">{preset.name}</h4>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </div>

                  {/* 코디 프리뷰 */}
                  {preset.outfits.map((outfit) => (
                    <OutfitPreviewCard
                      key={outfit.id}
                      outfit={outfit}
                      occasion={occasion}
                      isSaved={savedOutfitIds.includes(outfit.id)}
                      onSave={onSave}
                      onShare={onShare}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export { ClothingSection, AccessorySection, MakeupSection, OutfitPreviewCard };
