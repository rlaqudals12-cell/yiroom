/**
 * N-1 수분 섭취 카드 컴포넌트 (Task 2.9)
 *
 * 오늘의 수분 섭취 현황을 표시하고 빠른 추가 버튼 제공
 * - 물방울 아이콘으로 진행률 시각화
 * - 빠른 추가 버튼: +물 1컵, +물 1병, +커피, +직접 입력
 */

'use client';

import { useState } from 'react';
import { Droplets, Plus, Coffee, GlassWater } from 'lucide-react';
import { cn } from '@/lib/utils';

// 음료 타입 정의
export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other';

// 음료별 수분 흡수율
export const HYDRATION_FACTORS: Record<DrinkType, number> = {
  water: 1.0,
  tea: 0.9,
  coffee: 0.8,
  juice: 0.7,
  soda: 0.6,
  other: 0.8,
};

// 빠른 추가 옵션
const QUICK_ADD_OPTIONS = [
  { id: 'cup', label: '물 1컵', amount: 250, drinkType: 'water' as DrinkType, icon: GlassWater },
  { id: 'bottle', label: '물 1병', amount: 500, drinkType: 'water' as DrinkType, icon: Droplets },
  { id: 'coffee', label: '커피', amount: 300, drinkType: 'coffee' as DrinkType, icon: Coffee },
] as const;

export interface WaterIntakeCardProps {
  /** 오늘 섭취한 수분량 (ml) */
  currentAmount: number;
  /** 목표 수분량 (ml, 기본: 2000) */
  goalAmount?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 빠른 추가 클릭 핸들러 */
  onQuickAdd?: (amount: number, drinkType: DrinkType) => void;
  /** 직접 입력 클릭 핸들러 */
  onCustomAdd?: () => void;
}

export default function WaterIntakeCard({
  currentAmount,
  goalAmount = 2000,
  isLoading = false,
  onQuickAdd,
  onCustomAdd,
}: WaterIntakeCardProps) {
  const [addingItem, setAddingItem] = useState<string | null>(null);

  // 진행률 계산
  const progress = Math.min(100, Math.round((currentAmount / goalAmount) * 100));

  // 물방울 개수 (10개 기준)
  const totalDroplets = 10;
  const filledDroplets = Math.round((progress / 100) * totalDroplets);

  // 빠른 추가 핸들러
  const handleQuickAdd = async (option: (typeof QUICK_ADD_OPTIONS)[number]) => {
    if (addingItem) return;

    setAddingItem(option.id);
    try {
      await onQuickAdd?.(option.amount, option.drinkType);
    } finally {
      setTimeout(() => setAddingItem(null), 300);
    }
  };

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        data-testid="water-intake-card-loading"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-24 h-5 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="flex justify-center gap-1 mb-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-6 h-8 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="w-32 h-4 bg-gray-200 animate-pulse rounded mx-auto mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      data-testid="water-intake-card"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-5 h-5 text-cyan-500" />
        <h3 className="text-sm font-semibold text-gray-900">수분 섭취</h3>
      </div>

      {/* 물방울 진행률 시각화 */}
      <div
        className="flex justify-center gap-1 mb-2"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`수분 섭취 ${progress}%`}
      >
        {Array.from({ length: totalDroplets }).map((_, i) => (
          <Droplets
            key={i}
            className={cn(
              'w-6 h-6 transition-colors duration-300',
              i < filledDroplets ? 'text-cyan-500' : 'text-gray-200'
            )}
            data-testid={`droplet-${i}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* 수치 표시 */}
      <p className="text-center text-sm text-gray-600 mb-4">
        <span className="font-bold text-cyan-600">{currentAmount.toLocaleString()}mL</span>
        <span className="text-gray-400"> / </span>
        <span>{goalAmount.toLocaleString()}mL</span>
        <span className="ml-2 text-cyan-500">({progress}%)</span>
      </p>

      {/* 진행률이 목표 달성 시 축하 메시지 */}
      {progress >= 100 && (
        <p className="text-center text-sm text-cyan-600 mb-3 font-medium">
          오늘 목표 달성! 잘하고 있어요
        </p>
      )}

      {/* 빠른 추가 버튼들 */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ADD_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleQuickAdd(option)}
            disabled={addingItem !== null}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
              'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 active:scale-95',
              addingItem === option.id && 'bg-cyan-200 scale-95'
            )}
            aria-label={`${option.label} 추가 (${option.amount}ml)`}
            data-testid={`quick-add-${option.id}`}
          >
            <option.icon className="w-5 h-5" />
            <span className="text-xs font-medium whitespace-nowrap">{option.label}</span>
          </button>
        ))}

        {/* 직접 입력 버튼 */}
        <button
          onClick={onCustomAdd}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
            'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
          )}
          aria-label="직접 입력"
          data-testid="custom-add-button"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">직접 입력</span>
        </button>
      </div>
    </div>
  );
}
