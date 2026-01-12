'use client';

/**
 * Phase J: 운동복 스타일링 컴포넌트
 * PC-1 시즌 타입에 기반한 운동복 색상 추천
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, TreePine, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkoutCombination, ColorInfo } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';
import { getWorkoutCombinations, filterByWorkoutCategory } from '@/lib/mock/styling';

interface WorkoutStylingProps {
  seasonType: SeasonType;
  onProductClick?: (combinationId: string, partner: 'musinsa' | 'coupang') => void;
  className?: string;
}

const CATEGORY_INFO = {
  gym: { label: '헬스장', icon: Dumbbell },
  outdoor: { label: '야외 운동', icon: TreePine },
  yoga: { label: '요가', icon: Sparkles },
  running: { label: '러닝', icon: TreePine },
} as const;

/** 운동복 세트 미리보기 */
function WorkoutOutfitPreview({
  top,
  bottom,
  shoes,
}: {
  top: ColorInfo;
  bottom: ColorInfo;
  shoes?: ColorInfo;
}) {
  return (
    <div className="flex items-end justify-center gap-3 py-4" data-testid="workout-outfit-preview">
      {/* 상의 (운동복 상의 형태) */}
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-14 rounded-lg shadow-md border border-border/30"
          style={{ backgroundColor: top.hex }}
        />
        <span className="text-[10px] text-muted-foreground mt-1">상의</span>
        <span className="text-[10px] font-medium">{top.name}</span>
      </div>

      {/* 하의 (레깅스/팬츠 형태) */}
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-20 rounded-lg shadow-md border border-border/30"
          style={{ backgroundColor: bottom.hex }}
        />
        <span className="text-[10px] text-muted-foreground mt-1">하의</span>
        <span className="text-[10px] font-medium">{bottom.name}</span>
      </div>

      {/* 신발 */}
      {shoes && (
        <div className="flex flex-col items-center">
          <div
            className="w-10 h-6 rounded-md shadow-md border border-border/30"
            style={{ backgroundColor: shoes.hex }}
          />
          <span className="text-[10px] text-muted-foreground mt-1">신발</span>
          <span className="text-[10px] font-medium">{shoes.name}</span>
        </div>
      )}
    </div>
  );
}

/** 운동복 조합 카드 */
function WorkoutCard({
  combination,
  onProductClick,
}: {
  combination: WorkoutCombination;
  onProductClick?: (id: string, partner: 'musinsa' | 'coupang') => void;
}) {
  const { colors, shoes, name, description, tip, category } = combination;
  const CategoryIcon = CATEGORY_INFO[category]?.icon || Dumbbell;

  return (
    <Card className="overflow-hidden" data-testid="workout-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-primary" />
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 운동복 미리보기 */}
        <WorkoutOutfitPreview top={colors.top} bottom={colors.bottom} shoes={shoes} />

        {/* 설명 */}
        <p className="text-sm text-muted-foreground text-center mb-3">{description}</p>

        {/* 스타일링 팁 */}
        {tip && (
          <div className="bg-primary/5 rounded-md p-2 mb-3">
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
              {tip}
            </p>
          </div>
        )}

        {/* 제품 링크 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onProductClick?.(combination.id, 'musinsa')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            무신사
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onProductClick?.(combination.id, 'coupang')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            쿠팡
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 운동복 스타일링 메인 컴포넌트
 */
export default function WorkoutStyling({
  seasonType,
  onProductClick,
  className,
}: WorkoutStylingProps) {
  const allCombinations = getWorkoutCombinations(seasonType);

  // 카테고리별 필터링
  const gymCombos = filterByWorkoutCategory(allCombinations, 'gym');
  const outdoorCombos = filterByWorkoutCategory(allCombinations, 'outdoor');
  const yogaCombos = filterByWorkoutCategory(allCombinations, 'yoga');
  const runningCombos = filterByWorkoutCategory(allCombinations, 'running');

  // 모든 조합 합치기 (탭별로 보여줄 데이터)
  const categoryData = [
    { key: 'gym', combos: gymCombos },
    { key: 'outdoor', combos: [...outdoorCombos, ...runningCombos] },
    { key: 'yoga', combos: yogaCombos },
  ].filter((c) => c.combos.length > 0);

  if (allCombinations.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="workout-styling">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-primary" />
        운동복 추천
      </h3>

      {categoryData.length > 1 ? (
        <Tabs defaultValue={categoryData[0].key} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {categoryData.map(({ key }) => {
              const info = CATEGORY_INFO[key as keyof typeof CATEGORY_INFO];
              return (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {info?.label || key}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categoryData.map(({ key, combos }) => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combos.map((combo) => (
                  <WorkoutCard key={combo.id} combination={combo} onProductClick={onProductClick} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allCombinations.map((combo) => (
            <WorkoutCard key={combo.id} combination={combo} onProductClick={onProductClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export { WorkoutCard, WorkoutOutfitPreview };
