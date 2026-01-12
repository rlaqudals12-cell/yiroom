/**
 * 레시피 변형 카드 컴포넌트
 * @description M-2-2+ - 레시피 변형 정보 표시
 */

'use client';

import { RecipeVariation } from '@/lib/nutrition/ingredient-substitutes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';

interface RecipeVariationCardProps {
  variation: RecipeVariation;
  originalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
  };
}

export function RecipeVariationCard({ variation, originalNutrition }: RecipeVariationCardProps) {
  // 변형된 영양 정보 계산
  const variedNutrition = {
    calories: Math.round(
      originalNutrition.calories * (1 - variation.nutritionChange.caloriesReduction / 100)
    ),
    protein: Math.round(
      originalNutrition.protein * (1 + variation.nutritionChange.proteinChange / 100)
    ),
    carbs: Math.round(originalNutrition.carbs * (1 - variation.nutritionChange.carbsChange / 100)),
  };

  const getGoalBadgeColor = (type: RecipeVariation['type']) => {
    const colors = {
      diet: 'bg-green-500',
      lean: 'bg-blue-500',
      bulk: 'bg-orange-500',
      allergen_free: 'bg-purple-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <Card data-testid="recipe-variation-card" className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{variation.name}</CardTitle>
          <Badge className={`${getGoalBadgeColor(variation.type)} text-white`}>
            {variation.type.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{variation.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 영양 비교 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">영양 성분 변화</h4>
          <div className="grid grid-cols-3 gap-3">
            <NutritionCompare
              label="칼로리"
              original={originalNutrition.calories}
              varied={variedNutrition.calories}
              unit="kcal"
              isReduction={true}
            />
            <NutritionCompare
              label="단백질"
              original={originalNutrition.protein}
              varied={variedNutrition.protein}
              unit="g"
              isReduction={false}
            />
            <NutritionCompare
              label="탄수화물"
              original={originalNutrition.carbs}
              varied={variedNutrition.carbs}
              unit="g"
              isReduction={true}
            />
          </div>
        </div>

        {/* 대체 재료 목록 */}
        {variation.substitutions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">대체 재료</h4>
            <div className="space-y-2">
              {variation.substitutions.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm bg-background border rounded-md p-2"
                >
                  <span className="text-muted-foreground">{sub.original}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{sub.substitute}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {sub.benefit}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 조리 팁 */}
        {variation.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">조리 팁</h4>
            </div>
            <ul className="space-y-1">
              {variation.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-muted-foreground pl-4">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 영양 성분 비교 컴포넌트
 */
function NutritionCompare({
  label,
  original,
  varied,
  unit,
  isReduction,
}: {
  label: string;
  original: number;
  varied: number;
  unit: string;
  isReduction: boolean;
}) {
  const diff = varied - original;
  const percentChange = Math.round((diff / original) * 100);
  const isPositive = isReduction ? diff < 0 : diff > 0;

  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">
        <span className="line-through text-muted-foreground">
          {original}
          {unit}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {varied}
          {unit}
        </span>
        {diff !== 0 && (
          <div className="flex items-center">
            {isPositive ? (
              <TrendingDown className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingUp className="w-3 h-3 text-red-600" />
            )}
            <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(percentChange)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
