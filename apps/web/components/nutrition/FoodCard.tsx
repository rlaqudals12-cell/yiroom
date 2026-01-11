/**
 * 바코드 스캔 식품 정보 카드
 *
 * 바코드 스캔 결과를 표시하는 재사용 가능한 카드 컴포넌트
 * - 식품 기본 정보 (이름, 브랜드, 이미지)
 * - 영양 정보 (칼로리, 탄단지)
 * - 데이터 소스 표시
 */

'use client';

import { ScanBarcode, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BarcodeFood } from '@/types/nutrition';
import { getSourceLabel, calculateNutrition } from '@/lib/nutrition/barcodeService';

export interface FoodCardProps {
  /** 바코드 식품 데이터 */
  food: BarcodeFood;
  /** 섭취량 (배수, 기본 1) */
  servings?: number;
  /** 데이터 소스 */
  source?: string;
  /** 콤팩트 모드 (이력 목록용) */
  compact?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 소스별 배경색 클래스 반환
 */
function getSourceBadgeClass(source: string): string {
  switch (source) {
    case 'local':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'openfoodfacts':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'foodsafetykorea':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'crowdsourced':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
}

export default function FoodCard({
  food,
  servings = 1,
  source,
  compact = false,
  onClick,
  className,
}: FoodCardProps) {
  const nutrition = calculateNutrition(food, servings);

  // 컴팩트 모드 (이력 목록용)
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3 bg-card rounded-lg border border-border',
          onClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
          className
        )}
        data-testid="food-card-compact"
      >
        {/* 이미지 */}
        {food.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <ScanBarcode className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{food.name}</p>
          <p className="text-sm text-muted-foreground">
            {nutrition.calories} kcal
            {food.brand && ` • ${food.brand}`}
          </p>
        </div>

        {/* 검증 표시 */}
        {food.verified ? (
          <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        )}
      </div>
    );
  }

  // 전체 모드 (상세 뷰)
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl p-4 border border-border',
        onClick && 'cursor-pointer hover:bg-muted/30 transition-colors',
        className
      )}
      data-testid="food-card"
    >
      {/* 헤더: 이미지 + 기본 정보 */}
      <div className="flex items-start gap-4">
        {/* 이미지 */}
        {food.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <ScanBarcode className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* 기본 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{food.name}</h3>
          {food.brand && <p className="text-sm text-muted-foreground">{food.brand}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            {food.servingSize}
            {food.servingUnit} 기준
          </p>

          {/* 메타 배지 */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* 소스 배지 */}
            {source && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs rounded-full',
                  getSourceBadgeClass(source)
                )}
              >
                {getSourceLabel(source)}
              </span>
            )}

            {/* 검증 배지 */}
            {food.verified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <ShieldCheck className="w-3 h-3" />
                검증됨
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                <ShieldAlert className="w-3 h-3" />
                미검증
              </span>
            )}

            {/* 카테고리 */}
            {food.category && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                {food.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 영양 정보 그리드 */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-lg font-semibold">{nutrition.calories}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
          <p className="text-lg font-semibold text-blue-600">{nutrition.protein}g</p>
          <p className="text-xs text-muted-foreground">단백질</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3">
          <p className="text-lg font-semibold text-yellow-600">{nutrition.carbs}g</p>
          <p className="text-xs text-muted-foreground">탄수화물</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
          <p className="text-lg font-semibold text-red-600">{nutrition.fat}g</p>
          <p className="text-xs text-muted-foreground">지방</p>
        </div>
      </div>

      {/* 추가 영양 정보 (섬유질, 나트륨, 당류) */}
      {(food.fiber || food.sodium || food.sugar) && (
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <Info className="w-4 h-4 flex-shrink-0" />
          {nutrition.fiber && <span>식이섬유 {nutrition.fiber}g</span>}
          {nutrition.sodium && <span>나트륨 {nutrition.sodium}mg</span>}
          {nutrition.sugar && <span>당류 {nutrition.sugar}g</span>}
        </div>
      )}

      {/* 알레르기 정보 */}
      {food.allergens && food.allergens.length > 0 && (
        <div className="mt-3 flex items-start gap-2">
          <span className="text-xs font-medium text-destructive flex-shrink-0">알레르기:</span>
          <div className="flex flex-wrap gap-1">
            {food.allergens.map((allergen, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs rounded bg-destructive/10 text-destructive"
              >
                {allergen}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
