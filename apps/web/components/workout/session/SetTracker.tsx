'use client';

import { Check, X, Circle } from 'lucide-react';
import type { SetRecord } from '@/types/workout';

interface SetTrackerProps {
  sets: SetRecord[];
  currentSetIndex: number;
  onCompleteSet: (reps?: number, weight?: number) => void;
  onSkipSet: () => void;
}

/**
 * 세트 추적 컴포넌트
 * - 세트별 완료 상태 표시
 * - 현재 세트 하이라이트
 * - 완료/건너뛰기 버튼
 */
export function SetTracker({
  sets,
  currentSetIndex,
  onCompleteSet,
  onSkipSet,
}: SetTrackerProps) {
  const currentSet = sets[currentSetIndex];

  // 세트 상태 아이콘
  const getSetIcon = (set: SetRecord, index: number) => {
    if (set.status === 'completed') {
      return <Check className="w-4 h-4 text-status-success" />;
    }
    if (set.status === 'skipped') {
      return <X className="w-4 h-4 text-muted-foreground" />;
    }
    if (index === currentSetIndex) {
      return <Circle className="w-4 h-4 text-primary fill-primary" />;
    }
    return <Circle className="w-4 h-4 text-muted" />;
  };

  // 세트 배경색
  const getSetBgColor = (set: SetRecord, index: number) => {
    if (set.status === 'completed') return 'bg-status-success/10 border-status-success/30';
    if (set.status === 'skipped') return 'bg-muted/50 border-border';
    if (index === currentSetIndex) return 'bg-primary/10 border-primary/50';
    return 'bg-card border-border';
  };

  return (
    <div className="space-y-4" data-testid="set-tracker">
      {/* 세트 진행 표시 */}
      <div className="flex items-center gap-2">
        {sets.map((set, index) => (
          <div
            key={set.setNumber}
            className={`flex-1 h-2 rounded-full transition-colors ${
              set.status === 'completed'
                ? 'bg-status-success'
                : set.status === 'skipped'
                  ? 'bg-muted-foreground'
                  : index === currentSetIndex
                    ? 'bg-primary'
                    : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* 세트 목록 */}
      <div className="space-y-2">
        {sets.map((set, index) => (
          <div
            key={set.setNumber}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${getSetBgColor(set, index)}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-card border flex items-center justify-center">
                {getSetIcon(set, index)}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  세트 {set.setNumber}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {set.targetReps}회
                  {set.targetWeight && ` × ${set.targetWeight}kg`}
                </span>
              </div>
            </div>

            {/* 완료된 세트 결과 */}
            {set.status === 'completed' && set.actualReps !== undefined && (
              <div className="text-sm text-status-success font-medium">
                {set.actualReps}회 완료
                {set.actualWeight && ` × ${set.actualWeight}kg`}
              </div>
            )}

            {/* 건너뛴 세트 */}
            {set.status === 'skipped' && (
              <span className="text-sm text-muted-foreground">건너뜀</span>
            )}
          </div>
        ))}
      </div>

      {/* 현재 세트 액션 버튼 */}
      {currentSet && currentSet.status !== 'completed' && currentSet.status !== 'skipped' && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkipSet}
            className="flex-1 py-3 px-4 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors"
            aria-label={`세트 ${currentSet.setNumber} 건너뛰기`}
          >
            건너뛰기
          </button>
          <button
            onClick={() => onCompleteSet()}
            className="flex-[2] py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            aria-label={`세트 ${currentSet.setNumber} ${currentSet.targetReps}회 완료`}
          >
            <Check className="w-5 h-5" />
            {currentSet.targetReps}회 완료
          </button>
        </div>
      )}
    </div>
  );
}
