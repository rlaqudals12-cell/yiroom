/**
 * K-4 레시피 상세 컴포넌트
 * @description 레시피 재료 및 조리법 표시 UI
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  Circle,
  ShoppingCart,
  Share2,
  BookmarkPlus,
  Info,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  type Recipe,
  type RecipeIngredient,
  type NutritionGoal,
  NUTRITION_GOAL_LABELS,
  INGREDIENT_CATEGORY_LABELS,
  findSimilarIngredient,
} from '@/lib/nutrition/recipe-matcher';

export interface RecipeDetailProps {
  /** 레시피 데이터 */
  recipe: Recipe;
  /** 사용자 보유 재료 목록 */
  pantryItems?: string[];
  /** 뒤로가기 핸들러 */
  onBack?: () => void;
  /** 장보기 목록 추가 핸들러 */
  onAddToShoppingList?: (ingredients: RecipeIngredient[]) => void;
  /** 즐겨찾기 추가 핸들러 */
  onBookmark?: (recipe: Recipe) => void;
  /** 공유 핸들러 */
  onShare?: (recipe: Recipe) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 난이도별 정보
const DIFFICULTY_INFO: Record<string, { label: string; color: string; description: string }> = {
  easy: {
    label: '쉬움',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    description: '초보자도 쉽게 만들 수 있어요',
  },
  medium: {
    label: '보통',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    description: '기본적인 요리 경험이 필요해요',
  },
  hard: {
    label: '어려움',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    description: '숙련된 요리 실력이 필요해요',
  },
};

/**
 * RecipeDetail 메인 컴포넌트
 */
export default function RecipeDetail({
  recipe,
  pantryItems = [],
  onBack,
  onAddToShoppingList,
  onBookmark,
  onShare,
  className,
}: RecipeDetailProps) {
  // 완료된 조리 단계 추적
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // 재료별 보유 여부 계산
  const ingredientStatus = useMemo(() => {
    return recipe.ingredients.map((ing) => ({
      ingredient: ing,
      isAvailable: Boolean(findSimilarIngredient(ing.name, pantryItems)),
    }));
  }, [recipe.ingredients, pantryItems]);

  // 보유 재료 비율 계산
  const availabilityRate = useMemo(() => {
    const requiredIngredients = ingredientStatus.filter((s) => !s.ingredient.optional);
    const availableCount = requiredIngredients.filter((s) => s.isAvailable).length;
    return requiredIngredients.length > 0
      ? Math.round((availableCount / requiredIngredients.length) * 100)
      : 0;
  }, [ingredientStatus]);

  // 누락된 재료 목록
  const missingIngredients = useMemo(() => {
    return ingredientStatus
      .filter((s) => !s.isAvailable && !s.ingredient.optional)
      .map((s) => s.ingredient);
  }, [ingredientStatus]);

  // 조리 단계 토글
  const toggleStep = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
  };

  // 조리 진행률
  const cookingProgress = Math.round((completedSteps.size / recipe.steps.length) * 100);

  // 난이도 정보
  const difficultyInfo = DIFFICULTY_INFO[recipe.difficulty];

  return (
    <div data-testid="recipe-detail" className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(recipe)}
              aria-label="공유하기"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBookmark(recipe)}
              aria-label="즐겨찾기"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 레시피 기본 정보 */}
      <Card data-testid="recipe-info-card">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">{recipe.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 메타 정보 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="mt-1 text-lg font-semibold">{recipe.cookTime}분</p>
              <p className="text-xs text-muted-foreground">조리 시간</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <Flame className="h-5 w-5 mx-auto text-orange-500" />
              <p className="mt-1 text-lg font-semibold">{recipe.nutritionInfo.calories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <Users className="h-5 w-5 mx-auto text-muted-foreground" />
              <Badge className={cn('mt-1', difficultyInfo.color)}>
                {difficultyInfo.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">난이도</p>
            </div>
          </div>

          {/* 영양 목표 */}
          {recipe.nutritionGoals.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Target className="h-4 w-4 text-muted-foreground" />
              {recipe.nutritionGoals.map((goal) => (
                <Badge key={goal} variant="outline">
                  {NUTRITION_GOAL_LABELS[goal]}
                </Badge>
              ))}
            </div>
          )}

          {/* 태그 */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 영양 정보 */}
      <Card data-testid="nutrition-info-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            영양 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-lg font-semibold">{recipe.nutritionInfo.calories}</p>
              <p className="text-xs text-muted-foreground">칼로리</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-lg font-semibold text-blue-600">{recipe.nutritionInfo.protein}g</p>
              <p className="text-xs text-muted-foreground">단백질</p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3">
              <p className="text-lg font-semibold text-yellow-600">{recipe.nutritionInfo.carbs}g</p>
              <p className="text-xs text-muted-foreground">탄수화물</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3">
              <p className="text-lg font-semibold text-red-600">{recipe.nutritionInfo.fat}g</p>
              <p className="text-xs text-muted-foreground">지방</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 재료 목록 */}
      <Card data-testid="ingredients-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">재료</CardTitle>
            {pantryItems.length > 0 && (
              <Badge
                variant={availabilityRate >= 80 ? 'default' : 'secondary'}
                className={cn(
                  availabilityRate >= 80 && 'bg-green-500'
                )}
              >
                {availabilityRate}% 보유
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* 재료 보유율 프로그레스 바 */}
          {pantryItems.length > 0 && (
            <Progress value={availabilityRate} className="h-2 mb-4" />
          )}

          {/* 재료 목록 */}
          <ul className="space-y-2">
            {ingredientStatus.map(({ ingredient, isAvailable }, index) => (
              <li
                key={index}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg',
                  isAvailable && pantryItems.length > 0
                    ? 'bg-green-50 dark:bg-green-950/50'
                    : 'bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {pantryItems.length > 0 && (
                    isAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )
                  )}
                  <span className={cn(ingredient.optional && 'text-muted-foreground')}>
                    {ingredient.name}
                    {ingredient.optional && (
                      <span className="text-xs ml-1">(선택)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{ingredient.quantity}{ingredient.unit}</span>
                  <Badge variant="outline" className="text-xs">
                    {INGREDIENT_CATEGORY_LABELS[ingredient.category]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>

          {/* 누락 재료 장보기 목록 추가 */}
          {missingIngredients.length > 0 && onAddToShoppingList && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onAddToShoppingList(missingIngredients)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              필요한 재료 {missingIngredients.length}개 장보기 목록에 추가
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 조리 방법 */}
      <Card data-testid="cooking-steps-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">조리 방법</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedSteps.size}/{recipe.steps.length}단계
            </span>
          </div>
          <Progress value={cookingProgress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {recipe.steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
                completedSteps.has(index)
                  ? 'bg-green-50 dark:bg-green-950/50'
                  : 'bg-muted/50 hover:bg-muted'
              )}
              onClick={() => toggleStep(index)}
              role="button"
              aria-pressed={completedSteps.has(index)}
            >
              <div className="flex-shrink-0 pt-0.5">
                <Checkbox
                  checked={completedSteps.has(index)}
                  onCheckedChange={() => toggleStep(index)}
                  aria-label={`${index + 1}단계 완료`}
                />
              </div>
              <div className="flex-1">
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-medium mr-2',
                    completedSteps.has(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    completedSteps.has(index) && 'line-through text-muted-foreground'
                  )}
                >
                  {step}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 조리 완료 시 메시지 */}
      {cookingProgress === 100 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="font-semibold text-green-700 dark:text-green-300">
              요리가 완성되었어요! 맛있게 드세요!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
