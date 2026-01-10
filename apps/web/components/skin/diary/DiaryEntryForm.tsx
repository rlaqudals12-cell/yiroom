'use client';

import { memo, useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConditionSelector from './ConditionSelector';
import LifestyleFactors from './LifestyleFactors';
import RoutineCheckbox from './RoutineCheckbox';
import type {
  DiaryEntryFormProps,
  SkinDiaryEntryInput,
  SkinConditionScore,
  LifestyleFactorsInput,
  RoutineCheckboxInput,
} from '@/types/skin-diary';

/**
 * 피부 일기 입력 폼 컴포넌트
 * - 컨디션, 생활 요인, 루틴 입력
 * - 기존 엔트리 수정 지원
 */
const DiaryEntryForm = memo(function DiaryEntryForm({
  date,
  existingEntry,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: DiaryEntryFormProps) {
  // 폼 상태
  const [skinCondition, setSkinCondition] = useState<SkinConditionScore | undefined>(
    existingEntry?.skinCondition
  );
  const [conditionNotes, setConditionNotes] = useState(existingEntry?.conditionNotes ?? '');
  const [lifestyleFactors, setLifestyleFactors] = useState<LifestyleFactorsInput>({
    sleepHours: existingEntry?.sleepHours,
    sleepQuality: existingEntry?.sleepQuality,
    waterIntakeMl: existingEntry?.waterIntakeMl,
    stressLevel: existingEntry?.stressLevel,
    weather: existingEntry?.weather,
    outdoorHours: existingEntry?.outdoorHours,
  });
  const [routineData, setRoutineData] = useState<RoutineCheckboxInput>({
    morningCompleted: existingEntry?.morningRoutineCompleted ?? false,
    eveningCompleted: existingEntry?.eveningRoutineCompleted ?? false,
    specialTreatments: existingEntry?.specialTreatments ?? [],
  });

  // existingEntry 변경 시 폼 초기화
  useEffect(() => {
    if (existingEntry) {
      setSkinCondition(existingEntry.skinCondition);
      setConditionNotes(existingEntry.conditionNotes ?? '');
      setLifestyleFactors({
        sleepHours: existingEntry.sleepHours,
        sleepQuality: existingEntry.sleepQuality,
        waterIntakeMl: existingEntry.waterIntakeMl,
        stressLevel: existingEntry.stressLevel,
        weather: existingEntry.weather,
        outdoorHours: existingEntry.outdoorHours,
      });
      setRoutineData({
        morningCompleted: existingEntry.morningRoutineCompleted,
        eveningCompleted: existingEntry.eveningRoutineCompleted,
        specialTreatments: existingEntry.specialTreatments,
      });
    } else {
      // 새 엔트리일 때 초기화
      setSkinCondition(undefined);
      setConditionNotes('');
      setLifestyleFactors({});
      setRoutineData({
        morningCompleted: false,
        eveningCompleted: false,
        specialTreatments: [],
      });
    }
  }, [existingEntry]);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!skinCondition) {
      return; // 컨디션은 필수
    }

    const entry: SkinDiaryEntryInput = {
      entryDate: date,
      skinCondition,
      conditionNotes: conditionNotes.trim() || undefined,
      sleepHours: lifestyleFactors.sleepHours,
      sleepQuality: lifestyleFactors.sleepQuality,
      waterIntakeMl: lifestyleFactors.waterIntakeMl,
      stressLevel: lifestyleFactors.stressLevel,
      weather: lifestyleFactors.weather,
      outdoorHours: lifestyleFactors.outdoorHours,
      morningRoutineCompleted: routineData.morningCompleted,
      eveningRoutineCompleted: routineData.eveningCompleted,
      specialTreatments: routineData.specialTreatments,
    };

    await onSubmit(entry);
  };

  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <Card className={cn('', className)} data-testid="diary-entry-form">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">{existingEntry ? '기록 수정' : '오늘의 기록'}</CardTitle>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="닫기">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 피부 컨디션 선택 (필수) */}
          <div className="space-y-2">
            <ConditionSelector value={skinCondition} onChange={setSkinCondition} />
            {!skinCondition && (
              <p className="text-xs text-destructive">피부 컨디션을 선택해주세요</p>
            )}
          </div>

          {/* 컨디션 메모 (선택) */}
          <div className="space-y-2">
            <label htmlFor="condition-notes" className="text-sm font-medium">
              메모 (선택)
            </label>
            <Textarea
              id="condition-notes"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="오늘 피부 상태에 대해 메모해보세요..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{conditionNotes.length}/500</p>
          </div>

          {/* 생활 요인 */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">생활 요인</h3>
            <LifestyleFactors
              sleepHours={lifestyleFactors.sleepHours}
              sleepQuality={lifestyleFactors.sleepQuality}
              waterIntakeMl={lifestyleFactors.waterIntakeMl}
              stressLevel={lifestyleFactors.stressLevel}
              weather={lifestyleFactors.weather}
              outdoorHours={lifestyleFactors.outdoorHours}
              onChange={setLifestyleFactors}
            />
          </div>

          {/* 스킨케어 루틴 */}
          <div className="border-t pt-6">
            <RoutineCheckbox
              morningCompleted={routineData.morningCompleted}
              eveningCompleted={routineData.eveningCompleted}
              specialTreatments={routineData.specialTreatments}
              onChange={setRoutineData}
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={!skinCondition || isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {existingEntry ? '수정하기' : '저장하기'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

export default DiaryEntryForm;
