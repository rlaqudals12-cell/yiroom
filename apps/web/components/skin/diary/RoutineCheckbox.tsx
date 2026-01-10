'use client';

import { memo, useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RoutineCheckboxProps } from '@/types/skin-diary';
import { SPECIAL_TREATMENT_OPTIONS } from '@/lib/mock/skin-diary';

/**
 * 루틴 완료 체크박스 컴포넌트
 * - 아침/저녁 루틴 완료 체크
 * - 특별 케어 선택
 */
const RoutineCheckbox = memo(function RoutineCheckbox({
  morningCompleted,
  eveningCompleted,
  specialTreatments,
  onChange,
  className,
}: RoutineCheckboxProps) {
  const [localMorning, setLocalMorning] = useState(morningCompleted);
  const [localEvening, setLocalEvening] = useState(eveningCompleted);
  const [localTreatments, setLocalTreatments] = useState<string[]>(specialTreatments);
  const [customTreatment, setCustomTreatment] = useState('');

  // Props 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setLocalMorning(morningCompleted);
    setLocalEvening(eveningCompleted);
    setLocalTreatments(specialTreatments);
  }, [morningCompleted, eveningCompleted, specialTreatments]);

  // 변경 사항 부모에게 전달
  const notifyChange = (
    updates: Partial<{ morning: boolean; evening: boolean; treatments: string[] }>
  ) => {
    onChange({
      morningCompleted: updates.morning ?? localMorning,
      eveningCompleted: updates.evening ?? localEvening,
      specialTreatments: updates.treatments ?? localTreatments,
    });
  };

  // 특별 케어 토글
  const toggleTreatment = (treatment: string) => {
    const newTreatments = localTreatments.includes(treatment)
      ? localTreatments.filter((t) => t !== treatment)
      : [...localTreatments, treatment];

    setLocalTreatments(newTreatments);
    notifyChange({ treatments: newTreatments });
  };

  // 커스텀 특별 케어 추가
  const addCustomTreatment = () => {
    if (customTreatment.trim() && !localTreatments.includes(customTreatment.trim())) {
      const newTreatments = [...localTreatments, customTreatment.trim()];
      setLocalTreatments(newTreatments);
      setCustomTreatment('');
      notifyChange({ treatments: newTreatments });
    }
  };

  return (
    <div className={cn('space-y-6', className)} data-testid="routine-checkbox">
      {/* 루틴 완료 체크 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">스킨케어 루틴</h3>

        {/* 아침 루틴 */}
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer',
            localMorning
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : 'bg-muted hover:bg-muted/80'
          )}
          onClick={() => {
            const newValue = !localMorning;
            setLocalMorning(newValue);
            notifyChange({ morning: newValue });
          }}
          role="checkbox"
          aria-checked={localMorning}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const newValue = !localMorning;
              setLocalMorning(newValue);
              notifyChange({ morning: newValue });
            }
          }}
          data-testid="morning-routine-checkbox"
        >
          <Checkbox
            checked={localMorning}
            onCheckedChange={(checked) => {
              setLocalMorning(!!checked);
              notifyChange({ morning: !!checked });
            }}
            className="pointer-events-none"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2 flex-1">
            <Sun
              className={cn('h-5 w-5', localMorning ? 'text-amber-500' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            <div>
              <p
                className={cn('font-medium', localMorning && 'text-amber-700 dark:text-amber-300')}
              >
                아침 루틴 완료
              </p>
              <p className="text-xs text-muted-foreground">클렌저, 토너, 크림, 선크림</p>
            </div>
          </div>
          {localMorning && (
            <span className="text-amber-600 dark:text-amber-400" aria-label="완료됨">
              ✓
            </span>
          )}
        </div>

        {/* 저녁 루틴 */}
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer',
            localEvening
              ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800'
              : 'bg-muted hover:bg-muted/80'
          )}
          onClick={() => {
            const newValue = !localEvening;
            setLocalEvening(newValue);
            notifyChange({ evening: newValue });
          }}
          role="checkbox"
          aria-checked={localEvening}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const newValue = !localEvening;
              setLocalEvening(newValue);
              notifyChange({ evening: newValue });
            }
          }}
          data-testid="evening-routine-checkbox"
        >
          <Checkbox
            checked={localEvening}
            onCheckedChange={(checked) => {
              setLocalEvening(!!checked);
              notifyChange({ evening: !!checked });
            }}
            className="pointer-events-none"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2 flex-1">
            <Moon
              className={cn('h-5 w-5', localEvening ? 'text-indigo-500' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            <div>
              <p
                className={cn(
                  'font-medium',
                  localEvening && 'text-indigo-700 dark:text-indigo-300'
                )}
              >
                저녁 루틴 완료
              </p>
              <p className="text-xs text-muted-foreground">클렌징, 토너, 세럼, 크림</p>
            </div>
          </div>
          {localEvening && (
            <span className="text-indigo-600 dark:text-indigo-400" aria-label="완료됨">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* 특별 케어 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
          <h3 className="text-sm font-medium">특별 케어</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {SPECIAL_TREATMENT_OPTIONS.map((option) => {
            const isSelected = localTreatments.includes(option.label);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleTreatment(option.label)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5',
                  isSelected ? 'bg-violet-500 text-white' : 'bg-muted hover:bg-muted/80'
                )}
                aria-label={`${option.label} ${isSelected ? '선택됨' : '선택 안됨'}`}
                aria-pressed={isSelected}
              >
                <span>{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* 커스텀 특별 케어 입력 */}
        <div className="flex gap-2">
          <Input
            value={customTreatment}
            onChange={(e) => setCustomTreatment(e.target.value)}
            placeholder="다른 케어 추가..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTreatment();
              }
            }}
            aria-label="다른 특별 케어 입력"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomTreatment}
            disabled={!customTreatment.trim()}
          >
            추가
          </Button>
        </div>

        {/* 선택된 특별 케어 표시 */}
        {localTreatments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">오늘 한 특별 케어:</p>
            <div className="flex flex-wrap gap-2">
              {localTreatments.map((treatment) => (
                <Badge key={treatment} variant="secondary" className="flex items-center gap-1 pr-1">
                  {treatment}
                  <button
                    type="button"
                    onClick={() => toggleTreatment(treatment)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label={`${treatment} 제거`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default RoutineCheckbox;
