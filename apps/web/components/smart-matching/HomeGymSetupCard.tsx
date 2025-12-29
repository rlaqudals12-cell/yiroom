'use client';

/**
 * 홈짐 구성 추천 카드
 * @description 예산/공간 기반 홈짐 세트 추천
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  HomeGymSetup,
  EquipmentRecommendation,
} from '@/lib/smart-matching/equipment-recommend';
import { getBudgetLabel, formatPrice } from '@/lib/smart-matching/equipment-recommend';

interface HomeGymSetupCardProps {
  setup: HomeGymSetup;
  onSelectEquipment?: (equipment: EquipmentRecommendation) => void;
  onViewPhase?: (phase: number) => void;
  className?: string;
}

// 공간 라벨
const spaceSizeLabels = {
  small: '소형 (5평 이하)',
  medium: '중형 (5~10평)',
  large: '대형 (10평 이상)',
};

export function HomeGymSetupCard({
  setup,
  onSelectEquipment,
  onViewPhase,
  className,
}: HomeGymSetupCardProps) {
  const [activePhase, setActivePhase] = useState(1);

  return (
    <div
      className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}
      data-testid="home-gym-setup-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">홈짐 구성 추천</h3>
          <p className="text-sm text-muted-foreground">
            {getBudgetLabel(setup.budget)} · {spaceSizeLabels[setup.spaceSize]}
          </p>
        </div>
      </div>

      {/* 필수 세트 */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">필수 장비 세트</h4>
          <Badge variant="secondary">{formatPrice(setup.essentialSet.totalCost)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {setup.essentialSet.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {setup.essentialSet.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectEquipment?.(item)}
              className="text-xs px-2 py-1 bg-background rounded border hover:bg-muted transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* 확장 세트 */}
      {setup.expandedSet && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">추가 장비 세트</h4>
            <Badge variant="outline">{formatPrice(setup.expandedSet.totalCost)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {setup.expandedSet.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {setup.expandedSet.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectEquipment?.(item)}
                className="text-xs px-2 py-1 bg-background rounded border hover:bg-muted transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 단계별 구매 계획 */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3">단계별 구매 계획</h4>

        {/* 탭 */}
        <div className="flex gap-1 mb-3">
          {setup.purchasePlan.map((plan) => (
            <Button
              key={plan.phase}
              variant={activePhase === plan.phase ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setActivePhase(plan.phase);
                onViewPhase?.(plan.phase);
              }}
            >
              {plan.phase}단계
            </Button>
          ))}
        </div>

        {/* 선택된 단계 상세 */}
        {setup.purchasePlan.map((plan) =>
          activePhase === plan.phase ? (
            <div key={plan.phase} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <span className="text-sm font-medium">{formatPrice(plan.cost)}</span>
              </div>
              <div className="space-y-1">
                {plan.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(item.priceRange.min)}~
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      {/* 총 비용 */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <span className="text-sm text-muted-foreground">예상 총 비용</span>
        <span className="font-semibold">
          {formatPrice(
            setup.essentialSet.totalCost + (setup.expandedSet?.totalCost ?? 0)
          )}
        </span>
      </div>
    </div>
  );
}
