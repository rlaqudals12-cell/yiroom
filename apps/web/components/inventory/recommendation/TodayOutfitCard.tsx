'use client';

/**
 * 오늘의 코디 추천 카드
 *
 * 퍼스널컬러, 체형, 날씨를 고려한 코디 추천
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Thermometer, Sun, CloudRain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollageView } from '@/components/inventory';
import {
  suggestOutfitFromCloset,
  type OutfitSuggestion,
} from '@/lib/inventory/client';
import type { InventoryItem } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

interface TodayOutfitCardProps {
  items: InventoryItem[];
  personalColor?: PersonalColorSeason | null;
  bodyType?: 'S' | 'W' | 'N' | null;
  weather?: {
    temp: number;
    precipitation?: number;
    condition?: string;
  } | null;
  className?: string;
}

export function TodayOutfitCard({
  items,
  personalColor,
  bodyType,
  weather,
  className = '',
}: TodayOutfitCardProps) {
  const router = useRouter();

  // 코디 추천 계산
  const suggestion = useMemo((): OutfitSuggestion | null => {
    if (items.length === 0) return null;

    return suggestOutfitFromCloset(items, {
      personalColor,
      bodyType,
      temp: weather?.temp ?? null,
      occasion: null,
    });
  }, [items, personalColor, bodyType, weather?.temp]);

  // 콜라주 아이템 추출
  const collageItems = useMemo(() => {
    if (!suggestion) return [];

    const result: InventoryItem[] = [];
    if (suggestion.outer) result.push(suggestion.outer.item);
    if (suggestion.top) result.push(suggestion.top.item);
    if (suggestion.bottom) result.push(suggestion.bottom.item);
    if (suggestion.shoes) result.push(suggestion.shoes.item);

    return result;
  }, [suggestion]);

  if (!suggestion || collageItems.length < 2) {
    return (
      <div
        data-testid="today-outfit-card-empty"
        className={`bg-muted/50 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">오늘의 코디</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          옷장에 아이템을 추가하면 맞춤 코디를 추천해드려요
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/closet/add')}
        >
          옷 추가하기
        </Button>
      </div>
    );
  }

  // 날씨 아이콘
  const WeatherIcon =
    weather?.precipitation && weather.precipitation > 50 ? CloudRain : Sun;

  return (
    <div
      data-testid="today-outfit-card"
      className={`bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">오늘의 코디</h3>
        </div>

        {weather && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Thermometer className="w-4 h-4" />
            <span>{weather.temp}°C</span>
            <WeatherIcon className="w-4 h-4 ml-1" />
          </div>
        )}
      </div>

      {/* 콜라주 미리보기 */}
      <div className="flex justify-center mb-4">
        <CollageView items={collageItems} layout="grid" size="md" />
      </div>

      {/* 매칭 점수 */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Badge variant="secondary" className="text-xs">
          매칭 점수 {suggestion.totalScore}점
        </Badge>
        {personalColor && (
          <Badge variant="outline" className="text-xs">
            {personalColor} 컬러
          </Badge>
        )}
      </div>

      {/* 팁 */}
      {suggestion.tips.length > 0 && (
        <p className="text-sm text-muted-foreground text-center mb-4">
          {suggestion.tips[0]}
        </p>
      )}

      {/* 액션 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push('/closet/outfits/new')}
        >
          코디 저장
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => router.push('/closet')}
        >
          옷장 보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
