'use client';

/**
 * 운동기구 추천 카드
 * @description 목표/수준 기반 추천 장비 표시
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  WorkoutEquipmentMatch,
  EquipmentRecommendation,
  WorkoutEquipmentCategory,
  Priority,
} from '@/lib/smart-matching/equipment-recommend';
import {
  getCategoryLabel,
  getGoalLabel,
  formatPrice,
} from '@/lib/smart-matching/equipment-recommend';
import { useTranslations } from 'next-intl';

interface EquipmentRecommendationCardProps {
  match: WorkoutEquipmentMatch;
  onSelectEquipment?: (equipment: EquipmentRecommendation) => void;
  onViewDetails?: (equipment: EquipmentRecommendation) => void;
  className?: string;
}

// 우선순위 스타일
const priorityStyles: Record<Priority, { label: string; color: string }> = {
  essential: { label: '필수', color: 'bg-red-100 text-red-700' },
  recommended: { label: '추천', color: 'bg-blue-100 text-blue-700' },
  optional: { label: '선택', color: 'bg-gray-100 text-gray-600' },
};

// 카테고리 아이콘
const categoryIcons: Record<WorkoutEquipmentCategory, string> = {
  cardio: '',
  strength: '',
  resistance: '',
  flexibility: '',
  wearable: '',
  apparel: '',
  accessory: '',
  supplement: '',
};

export function EquipmentRecommendationCard({
  match,
  onSelectEquipment,
  onViewDetails,
  className,
}: EquipmentRecommendationCardProps) {
  const t = useTranslations('smartMatchingUI');
  const [expandedCategory, setExpandedCategory] = useState<WorkoutEquipmentCategory | null>(null);

  const goalLabel = getGoalLabel(match.workoutGoal);

  return (
    <div
      className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}
      data-testid="equipment-recommendation-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{t('equipmentRecommendationCard3')}</h3>
          <p className="text-sm text-muted-foreground">{goalLabel} 목표 기준</p>
        </div>
        <Badge variant="secondary">
          {match.homeGym ? t('equipmentRecommendationCard4') : t('equipmentRecommendationCard5')}
        </Badge>
      </div>

      {/* 카테고리별 추천 */}
      <div className="space-y-3">
        {match.recommendations.map((rec) => (
          <div
            key={rec.category}
            className={cn(
              'rounded-lg border p-3 transition-all',
              expandedCategory === rec.category && 'ring-2 ring-primary/50'
            )}
          >
            {/* 카테고리 헤더 */}
            <button
              className="w-full flex items-center justify-between"
              onClick={() =>
                setExpandedCategory(expandedCategory === rec.category ? null : rec.category)
              }
            >
              <div className="flex items-center gap-2">
                {categoryIcons[rec.category] && (
                  <span className="text-lg">{categoryIcons[rec.category]}</span>
                )}
                <span className="font-medium text-sm">{getCategoryLabel(rec.category)}</span>
                <Badge className={cn('text-xs', priorityStyles[rec.priority].color)}>
                  {priorityStyles[rec.priority].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{rec.items.length}개 추천</span>
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    expandedCategory === rec.category && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* 추천 이유 */}
            <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>

            {/* 확장 시 상세 목록 */}
            {expandedCategory === rec.category && (
              <div className="mt-3 space-y-2">
                {rec.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.priceRange.min)} ~ {formatPrice(item.priceRange.max)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onViewDetails(item)}
                        >
                          상세
                        </Button>
                      )}
                      {onSelectEquipment && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onSelectEquipment(item)}
                        >
                          선택
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
