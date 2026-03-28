'use client';

/**
 * 피부 상태 입력 컴포넌트
 * - 오늘 피부 수분 상태 입력
 * - 특별 고민 선택 (다중 선택)
 * @version 1.0
 * @date 2026-01-11
 */

import { memo, useState, useCallback } from 'react';
import { Droplets, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type {
  TodaySkinCondition,
  HydrationLevel,
  TodayConcern,
} from '@/lib/skincare/conditional-routine';

// ================================================
// 타입 정의
// ================================================

interface SkinConditionInputProps {
  /** 상태 변경 콜백 */
  onConditionChange: (condition: TodaySkinCondition) => void;
  /** 초기값 */
  initialCondition?: Partial<TodaySkinCondition>;
  /** 컴팩트 모드 (한 줄 표시) */
  compact?: boolean;
  className?: string;
}

// ================================================
// 상수 정의
// ================================================

const HYDRATION_OPTIONS: { value: HydrationLevel; label: string; emoji: string }[] = [
  { value: 'very_dry', label: '매우 건조', emoji: '' },
  { value: 'dry', label: '건조', emoji: '' },
  { value: 'normal', label: '적당함', emoji: '' },
  { value: 'oily', label: '촉촉', emoji: '' },
  { value: 'very_oily', label: '번들번들', emoji: '' },
];

const CONCERN_OPTIONS: { value: TodayConcern; label: string; emoji: string }[] = [
  { value: 'acne', label: '여드름', emoji: '' },
  { value: 'redness', label: '홍조', emoji: '' },
  { value: 'dullness', label: '칙칙함', emoji: '' },
  { value: 'tightness', label: '당김', emoji: '' },
  { value: 'oiliness', label: '번들거림', emoji: '' },
];

// ================================================
// 서브 컴포넌트
// ================================================

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
  compact?: boolean;
}

const OptionButton = memo(function OptionButton({
  selected,
  onClick,
  label,
  emoji,
  compact,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border transition-all',
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'
      )}
      aria-pressed={selected}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
});

interface ConcernChipProps {
  value: TodayConcern;
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: (value: TodayConcern) => void;
  compact?: boolean;
}

const ConcernChip = memo(function ConcernChip({
  value,
  label,
  emoji,
  selected,
  onToggle,
  compact,
}: ConcernChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={cn(
        'flex items-center gap-1 rounded-full border transition-all',
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        selected
          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
          : 'bg-card border-border hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
      )}
      aria-pressed={selected}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
});

// ================================================
// 메인 컴포넌트
// ================================================

const SkinConditionInput = memo(function SkinConditionInput({
  onConditionChange,
  initialCondition,
  compact = false,
  className,
}: SkinConditionInputProps) {
  // 상태 관리
  const [hydration, setHydration] = useState<HydrationLevel>(
    initialCondition?.hydration || 'normal'
  );
  const [concerns, setConcerns] = useState<TodayConcern[]>(initialCondition?.concerns || []);

  // 상태 변경 핸들러
  const handleHydrationChange = useCallback(
    (value: HydrationLevel) => {
      setHydration(value);
      onConditionChange({ hydration: value, concerns });
    },
    [concerns, onConditionChange]
  );

  const handleConcernToggle = useCallback(
    (value: TodayConcern) => {
      const newConcerns = concerns.includes(value)
        ? concerns.filter((c) => c !== value)
        : [...concerns, value];
      setConcerns(newConcerns);
      onConditionChange({ hydration, concerns: newConcerns });
    },
    [hydration, concerns, onConditionChange]
  );

  // 초기화
  const handleReset = useCallback(() => {
    setHydration('normal');
    setConcerns([]);
    onConditionChange({ hydration: 'normal', concerns: [] });
  }, [onConditionChange]);

  // 수분 상태 텍스트
  const getHydrationText = (level: HydrationLevel): string => {
    const map: Record<HydrationLevel, string> = {
      very_dry: '매우 건조한',
      dry: '건조한',
      normal: '적당한',
      oily: '촉촉한',
      very_oily: '번들거리는',
    };
    return map[level];
  };

  // 컴팩트 모드
  if (compact) {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-2', className)}
        data-testid="skin-condition-input"
      >
        {/* 수분 */}
        <div className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
          {HYDRATION_OPTIONS.slice(0, 3).map((opt) => (
            <OptionButton
              key={opt.value}
              selected={hydration === opt.value}
              onClick={() => handleHydrationChange(opt.value)}
              label={opt.label}
              emoji={opt.emoji}
              compact
            />
          ))}
        </div>

        {/* 고민 */}
        {concerns.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1">
              {concerns.map((c) => {
                const opt = CONCERN_OPTIONS.find((o) => o.value === c);
                return opt ? (
                  <span
                    key={c}
                    className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                  >
                    {opt.emoji} {opt.label}
                  </span>
                ) : null;
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // 전체 모드
  return (
    <div
      className={cn('space-y-4 p-4 bg-card rounded-xl border', className)}
      data-testid="skin-condition-input"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">오늘 피부 상태</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={handleReset}
        >
          초기화
        </Button>
      </div>

      {/* 수분감 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span>수분 상태</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {HYDRATION_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={hydration === opt.value}
              onClick={() => handleHydrationChange(opt.value)}
              label={opt.label}
              emoji={opt.emoji}
            />
          ))}
        </div>
      </div>

      {/* 특별 고민 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
          <span>오늘의 고민 (선택)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONCERN_OPTIONS.map((opt) => (
            <ConcernChip
              key={opt.value}
              value={opt.value}
              label={opt.label}
              emoji={opt.emoji}
              selected={concerns.includes(opt.value)}
              onToggle={handleConcernToggle}
            />
          ))}
        </div>
      </div>

      {/* 현재 상태 요약 */}
      {(hydration !== 'normal' || concerns.length > 0) && (
        <div className="pt-3 border-t text-sm text-muted-foreground">
          오늘은{' '}
          {hydration !== 'normal' && (
            <span className="text-foreground">{getHydrationText(hydration)} 피부</span>
          )}
          {hydration !== 'normal' && concerns.length > 0 && ', '}
          {concerns.length > 0 && (
            <span className="text-foreground">
              {concerns.map((c) => CONCERN_OPTIONS.find((o) => o.value === c)?.label).join(', ')}{' '}
              고민
            </span>
          )}
          에 맞춰 루틴을 조정해드릴게요.
        </div>
      )}
    </div>
  );
});

export default SkinConditionInput;

// Named export
export { SkinConditionInput };
