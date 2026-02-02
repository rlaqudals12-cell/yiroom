/**
 * K-2 Best 10 카드 컴포넌트
 *
 * @description 스타일별 Best 10 코디 추천 카드
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */
'use client';

import { useState } from 'react';
import { TrendingUp, Sparkles, ChevronRight, Shirt, Briefcase, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { OutfitRecommendation, StyleCategory } from '@/lib/fashion';
import { STYLE_CATEGORY_LABELS, isTrendItem2026 } from '@/lib/fashion';

interface Best10CardProps {
  recommendation: OutfitRecommendation;
  rank: number;
  styleCategory?: StyleCategory;
  onItemClick?: (item: OutfitRecommendation) => void;
  className?: string;
}

export function Best10Card({
  recommendation,
  rank,
  styleCategory,
  onItemClick,
  className,
}: Best10CardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const hasTrendingItem = recommendation.items.some((item) => isTrendItem2026(item.name));

  const handleClick = () => {
    onItemClick?.(recommendation);
    setIsDialogOpen(true);
  };

  // 랭크별 배지 스타일
  const getRankBadgeStyle = (r: number) => {
    if (r === 1) return 'bg-yellow-500 text-yellow-50';
    if (r === 2) return 'bg-gray-400 text-gray-50';
    if (r === 3) return 'bg-amber-600 text-amber-50';
    return 'bg-muted text-muted-foreground';
  };

  // 아이템 색상 미리보기
  const colorPreviews = recommendation.items.slice(0, 4).map((item) => item.color);

  return (
    <>
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
          className
        )}
        onClick={handleClick}
        data-testid={`best10-card-${rank}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 랭크 배지 */}
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                getRankBadgeStyle(rank)
              )}
              data-testid="rank-badge"
            >
              {rank}
            </div>

            {/* 컬러 미리보기 */}
            <div className="flex -space-x-2">
              {colorPreviews.map((color, idx) => (
                <div
                  key={idx}
                  className="h-10 w-10 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* 코디 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{recommendation.name}</h3>
                {hasTrendingItem && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    트렌드
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{recommendation.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {recommendation.items.length}개 아이템
                </span>
                {recommendation.occasions.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    | {recommendation.occasions[0]}
                  </span>
                )}
              </div>
            </div>

            {/* 화살표 */}
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>

      {/* 상세 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="best10-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  getRankBadgeStyle(rank)
                )}
              >
                {rank}
              </span>
              {recommendation.name}
            </DialogTitle>
            {styleCategory && (
              <DialogDescription>
                {STYLE_CATEGORY_LABELS[styleCategory]} 스타일 코디
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* 설명 */}
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>

            {/* 아이템 목록 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Shirt className="h-4 w-4" />
                구성 아이템
              </h4>
              <div className="space-y-2">
                {recommendation.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border p-2">
                    <div
                      className="h-8 w-8 rounded-lg border shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {item.tags[0]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 상황 */}
            {recommendation.occasions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  추천 상황
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recommendation.occasions.map((occasion) => (
                    <Badge key={occasion} variant="secondary">
                      {occasion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 추천 시즌 */}
            {recommendation.seasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Sun className="h-4 w-4" />
                  추천 시즌
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recommendation.seasons.map((season) => (
                    <Badge key={season} variant="outline">
                      {season}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 어울리는 퍼스널 컬러 */}
            {recommendation.personalColors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  어울리는 퍼스널 컬러
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recommendation.personalColors.map((color) => (
                    <Badge key={color} variant="secondary">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <Button variant="outline" className="w-full" onClick={() => setIsDialogOpen(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Best 10 리스트 컴포넌트
interface Best10ListProps {
  recommendations: OutfitRecommendation[];
  styleCategory?: StyleCategory;
  title?: string;
  onItemClick?: (item: OutfitRecommendation) => void;
  className?: string;
}

export function Best10List({
  recommendations,
  styleCategory,
  title,
  onItemClick,
  className,
}: Best10ListProps) {
  return (
    <Card className={className} data-testid="best10-list">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title ||
            (styleCategory ? `${STYLE_CATEGORY_LABELS[styleCategory]} Best 10` : 'Best 10 코디')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.slice(0, 10).map((item, index) => (
          <Best10Card
            key={item.id}
            recommendation={item}
            rank={index + 1}
            styleCategory={styleCategory}
            onItemClick={onItemClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}
