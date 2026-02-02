/**
 * K-4 레시피 검색 컴포넌트
 * @description 냉장고 재료 기반 레시피 검색 UI
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Search,
  ChefHat,
  Clock,
  Flame,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  recommendRecipes,
  type Recipe,
  type RecipeMatchResult,
  type NutritionGoal,
  NUTRITION_GOAL_LABELS,
} from '@/lib/nutrition/recipe-matcher';

export interface RecipeSearchProps {
  /** 사용자 보유 재료 목록 */
  pantryItems: string[];
  /** 기본 영양 목표 */
  defaultGoal?: NutritionGoal;
  /** 레시피 선택 핸들러 */
  onSelectRecipe?: (recipe: Recipe) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 난이도별 라벨
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

// 난이도별 색상
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

/**
 * RecipeSearch 메인 컴포넌트
 */
export default function RecipeSearch({
  pantryItems,
  defaultGoal,
  onSelectRecipe,
  className,
}: RecipeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<NutritionGoal | undefined>(defaultGoal);
  const [maxCookTime, setMaxCookTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 레시피 매칭 결과 계산
  const matchResults = useMemo(() => {
    if (pantryItems.length === 0) return [];

    setIsLoading(true);
    try {
      const results = recommendRecipes(pantryItems, {
        goal: selectedGoal,
        maxCookTime,
        minMatchScore: 20, // 낮은 매칭 점수도 표시
        maxMissingIngredients: 5,
      });

      // 검색어 필터링
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return results.filter(
          (r) =>
            r.recipe.name.toLowerCase().includes(query) ||
            r.recipe.description.toLowerCase().includes(query) ||
            r.recipe.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return results;
    } finally {
      setIsLoading(false);
    }
  }, [pantryItems, selectedGoal, maxCookTime, searchQuery]);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 목표 변경 핸들러
  const handleGoalChange = useCallback((goal: NutritionGoal | undefined) => {
    setSelectedGoal(goal === selectedGoal ? undefined : goal);
  }, [selectedGoal]);

  // 조리시간 필터 변경 핸들러
  const handleCookTimeChange = useCallback((time: number | undefined) => {
    setMaxCookTime(time === maxCookTime ? undefined : time);
  }, [maxCookTime]);

  return (
    <div data-testid="recipe-search" className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">레시피 추천</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          보유 재료 {pantryItems.length}개
        </Badge>
      </div>

      {/* 검색 바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="recipe-search-input"
          type="text"
          placeholder="레시피 이름, 재료, 태그로 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
        >
          <Filter
            className={cn('h-4 w-4', showFilters && 'text-primary')}
          />
        </Button>
      </div>

      {/* 필터 섹션 */}
      {showFilters && (
        <Card data-testid="recipe-filters" className="border-dashed">
          <CardContent className="pt-4 space-y-4">
            {/* 영양 목표 필터 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                영양 목표
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NUTRITION_GOAL_LABELS) as NutritionGoal[]).map((goal) => (
                  <Button
                    key={goal}
                    variant={selectedGoal === goal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGoalChange(goal)}
                    data-testid={`filter-goal-${goal}`}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {NUTRITION_GOAL_LABELS[goal]}
                  </Button>
                ))}
              </div>
            </div>

            {/* 조리 시간 필터 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                조리 시간
              </label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((time) => (
                  <Button
                    key={time}
                    variant={maxCookTime === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCookTimeChange(time)}
                    data-testid={`filter-time-${time}`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time}분 이하
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">레시피를 찾는 중...</span>
        </div>
      )}

      {/* 재료 없음 안내 */}
      {pantryItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              냉장고에 재료를 추가하면 맞춤 레시피를 추천해 드려요!
            </p>
          </CardContent>
        </Card>
      )}

      {/* 검색 결과 */}
      {!isLoading && pantryItems.length > 0 && (
        <div className="space-y-3" data-testid="recipe-results">
          {matchResults.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  조건에 맞는 레시피가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  필터를 조정하거나 재료를 추가해보세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            matchResults.map((result) => (
              <RecipeMatchCard
                key={result.recipe.id}
                result={result}
                onClick={() => onSelectRecipe?.(result.recipe)}
              />
            ))
          )}
        </div>
      )}

      {/* 결과 수 표시 */}
      {!isLoading && matchResults.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {matchResults.length}개의 레시피를 찾았습니다
        </p>
      )}
    </div>
  );
}

/**
 * 레시피 매칭 결과 카드
 */
interface RecipeMatchCardProps {
  result: RecipeMatchResult;
  onClick?: () => void;
}

function RecipeMatchCard({ result, onClick }: RecipeMatchCardProps) {
  const { recipe, matchScore, matchedIngredients, missingIngredients, matchReason } = result;

  return (
    <Card
      data-testid={`recipe-card-${recipe.id}`}
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        matchScore >= 80 && 'border-green-200 dark:border-green-800'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{recipe.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'flex-shrink-0',
              matchScore >= 80 && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              matchScore >= 50 && matchScore < 80 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              matchScore < 50 && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            {matchScore}점
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* 추천 이유 */}
        <p className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
          {matchReason}
        </p>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.cookTime}분
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {recipe.nutritionInfo.calories}kcal
          </span>
          <Badge
            variant="outline"
            className={cn('text-xs', DIFFICULTY_COLORS[recipe.difficulty])}
          >
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </Badge>
        </div>

        {/* 영양 목표 태그 */}
        <div className="flex flex-wrap gap-1">
          {recipe.nutritionGoals.map((goal) => (
            <Badge
              key={goal}
              variant="outline"
              className="text-xs"
            >
              {NUTRITION_GOAL_LABELS[goal]}
            </Badge>
          ))}
        </div>

        {/* 재료 매칭 현황 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 보유 재료 */}
          <div className="space-y-1">
            <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              보유 재료 ({matchedIngredients.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {matchedIngredients.slice(0, 3).map((ing) => (
                <span
                  key={ing}
                  className="px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded"
                >
                  {ing}
                </span>
              ))}
              {matchedIngredients.length > 3 && (
                <span className="px-1.5 py-0.5 text-muted-foreground">
                  +{matchedIngredients.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* 필요 재료 */}
          {missingIngredients.length > 0 && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
                <XCircle className="h-3 w-3" />
                필요 재료 ({missingIngredients.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {missingIngredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing}
                    className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded"
                  >
                    {ing}
                  </span>
                ))}
                {missingIngredients.length > 3 && (
                  <span className="px-1.5 py-0.5 text-muted-foreground">
                    +{missingIngredients.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 태그 */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
