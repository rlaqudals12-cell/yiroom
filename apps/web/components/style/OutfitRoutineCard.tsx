'use client';

import Image from 'next/image';
import { Briefcase, Coffee, Heart, Plane, Plus, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { RoutineItem } from '@/types/hybrid';

// 상황 타입
type Occasion = 'daily' | 'work' | 'date' | 'travel';

// 상황별 정보
const OCCASION_INFO: Record<Occasion, { label: string; icon: React.ReactNode; color: string }> = {
  daily: { label: '데일리', icon: <Coffee className="h-4 w-4" aria-hidden="true" />, color: 'bg-green-500' },
  work: { label: '출근', icon: <Briefcase className="h-4 w-4" aria-hidden="true" />, color: 'bg-blue-500' },
  date: { label: '데이트', icon: <Heart className="h-4 w-4" aria-hidden="true" />, color: 'bg-pink-500' },
  travel: { label: '여행', icon: <Plane className="h-4 w-4" aria-hidden="true" />, color: 'bg-amber-500' },
};

// 의류 카테고리
const CLOTHING_CATEGORIES = [
  { value: 'top', label: '상의', emoji: '👕' },
  { value: 'bottom', label: '하의', emoji: '👖' },
  { value: 'outer', label: '아우터', emoji: '🧥' },
  { value: 'shoes', label: '신발', emoji: '👟' },
  { value: 'accessory', label: '액세서리', emoji: '👜' },
];

export interface OutfitItem extends RoutineItem {
  color?: string;
  colorHex?: string;
  imageUrl?: string;
}

export interface OutfitRoutineCardProps {
  /** 상황 */
  occasion: Occasion;
  /** 코디 아이템 목록 */
  items: OutfitItem[];
  /** 매칭률 (0-100) */
  matchRate?: number;
  /** 스타일 팁 */
  styleTips?: string[];
  /** 아이템 수정 콜백 */
  onEditItem?: (item: OutfitItem) => void;
  /** 아이템 추가 콜백 */
  onAddItem?: () => void;
  /** 수정 모드 */
  editable?: boolean;
  /** 추가 className */
  className?: string;
}

/**
 * 코디 루틴 카드 (Style 도메인)
 * - 상황별 코디 시각화 (데일리/출근/데이트/여행)
 * - 아이템 조합 표시
 * - 컬러 조합 시각화
 */
export function OutfitRoutineCard({
  occasion,
  items,
  matchRate,
  styleTips,
  onEditItem,
  onAddItem,
  editable = false,
  className,
}: OutfitRoutineCardProps) {
  const occasionInfo = OCCASION_INFO[occasion];

  // 카테고리 라벨 가져오기
  const getCategoryInfo = (category: string) => {
    return CLOTHING_CATEGORIES.find((c) => c.value === category) || { label: category, emoji: '📦' };
  };

  // 컬러 팔레트 추출
  const colorPalette = items
    .filter((item) => item.colorHex)
    .map((item) => ({ name: item.color || '', hex: item.colorHex || '' }));

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="outfit-routine-card">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg text-white', occasionInfo.color)}>
              {occasionInfo.icon}
            </div>
            {occasionInfo.label} 코디
          </CardTitle>

          {matchRate !== undefined && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              매칭 {matchRate}%
            </Badge>
          )}
        </div>

        {/* 매칭률 프로그레스 */}
        {matchRate !== undefined && (
          <Progress value={matchRate} className="h-1.5 mt-2" />
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* 컬러 팔레트 */}
        {colorPalette.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">컬러 조합</p>
            <div className="flex gap-2">
              {colorPalette.map((color, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1"
                  title={color.name}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 아이템 목록 */}
        {items.length > 0 ? (
          <div className="space-y-3">
            {items
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const categoryInfo = getCategoryInfo(item.category);
                return (
                  <div
                    key={`${item.category}-${index}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl group"
                  >
                    {/* 이미지 또는 이모지 */}
                    {item.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-background">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName || categoryInfo.label}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-2xl">
                        {categoryInfo.emoji}
                      </div>
                    )}

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{categoryInfo.label}</p>
                        {item.colorHex && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.colorHex }}
                            title={item.color}
                          />
                        )}
                      </div>
                      {item.productName ? (
                        <p className="text-xs text-muted-foreground truncate">{item.productName}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">아이템 미설정</p>
                      )}
                    </div>

                    {/* 메모 */}
                    {item.note && (
                      <Badge variant="outline" className="text-xs max-w-24 truncate">
                        {item.note}
                      </Badge>
                    )}

                    {/* 수정 버튼 */}
                    {editable && onEditItem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{occasionInfo.label} 코디가 없습니다</p>
            <p className="text-xs mt-1">아이템을 추가해보세요</p>
          </div>
        )}

        {/* 추가 버튼 */}
        {editable && onAddItem && (
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={onAddItem}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            아이템 추가
          </Button>
        )}

        {/* 스타일 팁 */}
        {styleTips && styleTips.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">스타일 팁</p>
            <ul className="space-y-1">
              {styleTips.map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OutfitRoutineCard;
