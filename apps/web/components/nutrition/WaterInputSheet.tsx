/**
 * N-1 수분 섭취 직접 입력 시트 컴포넌트 (Task 2.9)
 *
 * 바텀 시트 형태로 다양한 음료 종류와 양을 입력
 * - 음료 종류 선택 (물, 차, 커피, 주스, 탄산음료, 기타)
 * - 양 입력 (프리셋 + 직접 입력)
 * - 수분 흡수율 안내
 */

'use client';

import { useState } from 'react';
import { X, Droplets, Coffee, Leaf, CupSoda, Wine, HelpCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DrinkType, HYDRATION_FACTORS } from './WaterIntakeCard';

// 음료 타입 정보
const DRINK_TYPES = [
  {
    type: 'water' as DrinkType,
    label: '물',
    icon: Droplets,
    color: 'bg-cyan-100 text-cyan-600 border-cyan-200',
    activeColor: 'bg-cyan-500 text-white border-cyan-500',
  },
  {
    type: 'tea' as DrinkType,
    label: '차',
    icon: Leaf,
    color: 'bg-green-100 text-green-600 border-green-200',
    activeColor: 'bg-green-500 text-white border-green-500',
  },
  {
    type: 'coffee' as DrinkType,
    label: '커피',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-600 text-white border-amber-600',
  },
  {
    type: 'juice' as DrinkType,
    label: '주스',
    icon: Wine,
    color: 'bg-orange-100 text-orange-600 border-orange-200',
    activeColor: 'bg-orange-500 text-white border-orange-500',
  },
  {
    type: 'soda' as DrinkType,
    label: '탄산',
    icon: CupSoda,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    activeColor: 'bg-purple-500 text-white border-purple-500',
  },
  {
    type: 'other' as DrinkType,
    label: '기타',
    icon: HelpCircle,
    color: 'bg-muted text-muted-foreground border-border',
    activeColor: 'bg-muted-foreground text-card border-muted-foreground',
  },
] as const;

// 양 프리셋
const AMOUNT_PRESETS = [
  { label: '1컵', amount: 250 },
  { label: '1병', amount: 500 },
  { label: '큰 컵', amount: 350 },
  { label: '대용량', amount: 1000 },
] as const;

export interface WaterInputSheetProps {
  /** 시트 표시 여부 */
  isOpen: boolean;
  /** 시트 닫기 핸들러 */
  onClose: () => void;
  /** 수분 추가 핸들러 */
  onAdd: (amount: number, drinkType: DrinkType, effectiveMl: number) => void;
  /** 저장 중 상태 */
  isSaving?: boolean;
}

export default function WaterInputSheet({
  isOpen,
  onClose,
  onAdd,
  isSaving = false,
}: WaterInputSheetProps) {
  const [selectedType, setSelectedType] = useState<DrinkType>('water');
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // 현재 선택된 양
  const currentAmount = isCustom ? parseInt(customAmount) || 0 : selectedAmount;

  // 실제 수분 섭취량 계산
  const hydrationFactor = HYDRATION_FACTORS[selectedType];
  const effectiveMl = Math.round(currentAmount * hydrationFactor);

  // 프리셋 선택
  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  // 직접 입력 모드
  const handleCustomInput = (value: string) => {
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setIsCustom(true);
  };

  // 추가 핸들러
  const handleAdd = () => {
    if (currentAmount > 0) {
      onAdd(currentAmount, selectedType, effectiveMl);
      // 초기화
      setSelectedType('water');
      setSelectedAmount(250);
      setCustomAmount('');
      setIsCustom(false);
      onClose();
    }
  };

  // 바텀 시트가 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        data-testid="water-input-overlay"
      />

      {/* 바텀 시트 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl transform transition-transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby="water-input-title"
        data-testid="water-input-sheet"
      >
        <div className="max-w-[480px] mx-auto">
          {/* 핸들 바 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
            <h2 id="water-input-title" className="text-lg font-bold text-foreground">
              수분 섭취 기록
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="닫기"
              data-testid="close-button"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* 음료 종류 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                음료 종류
              </label>
              <div className="grid grid-cols-6 gap-2">
                {DRINK_TYPES.map((drink) => (
                  <button
                    key={drink.type}
                    onClick={() => setSelectedType(drink.type)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                      selectedType === drink.type ? drink.activeColor : drink.color
                    )}
                    aria-pressed={selectedType === drink.type}
                    data-testid={`drink-type-${drink.type}`}
                  >
                    <drink.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{drink.label}</span>
                  </button>
                ))}
              </div>

              {/* 수분 흡수율 안내 */}
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedType !== 'water' && (
                  <>
                    수분 흡수율: {Math.round(hydrationFactor * 100)}%
                    {hydrationFactor < 1 && ' (카페인/당분 포함)'}
                  </>
                )}
              </p>
            </div>

            {/* 양 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                섭취량
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AMOUNT_PRESETS.map((preset) => (
                  <button
                    key={preset.amount}
                    onClick={() => handlePresetSelect(preset.amount)}
                    className={cn(
                      'py-2 px-3 rounded-xl border-2 transition-all text-sm font-medium',
                      !isCustom && selectedAmount === preset.amount
                        ? 'bg-cyan-500 text-white border-cyan-500'
                        : 'bg-card text-foreground border-border hover:border-cyan-300'
                    )}
                    data-testid={`amount-preset-${preset.amount}`}
                  >
                    {preset.label}
                    <span className="block text-xs opacity-75">{preset.amount}ml</span>
                  </button>
                ))}
              </div>

              {/* 직접 입력 */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="직접 입력"
                  value={customAmount}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border-2 transition-all text-center text-lg font-medium bg-background',
                    isCustom && customAmount
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                      : 'border-border hover:border-border/80'
                  )}
                  aria-label="직접 입력 (ml)"
                  data-testid="custom-amount-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ml
                </span>
              </div>
            </div>

            {/* 요약 */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">섭취량</span>
                <span className="font-bold text-foreground">{currentAmount} ml</span>
              </div>
              {hydrationFactor < 1 && currentAmount > 0 && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">실제 수분</span>
                  <span className="font-bold text-cyan-600">{effectiveMl} ml</span>
                </div>
              )}
            </div>

            {/* 추가 버튼 */}
            <button
              onClick={handleAdd}
              disabled={currentAmount <= 0 || isSaving}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2',
                currentAmount > 0 && !isSaving
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600 active:bg-cyan-700'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              data-testid="add-water-button"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {currentAmount > 0 ? `${currentAmount}ml 추가` : '양을 선택해주세요'}
                </>
              )}
            </button>
          </div>

          {/* 하단 안전 영역 */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
