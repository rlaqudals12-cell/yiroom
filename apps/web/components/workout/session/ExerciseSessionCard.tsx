'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, CheckCircle, SkipForward, Info } from 'lucide-react';
import { SetTracker } from './SetTracker';
import type { ExerciseSessionRecord } from '@/types/workout';

interface ExerciseSessionCardProps {
  record: ExerciseSessionRecord;
  exerciseIndex: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  onStartExercise: () => void;
  onCompleteSet: (reps?: number, weight?: number) => void;
  onSkipSet: () => void;
  onSkipExercise: () => void;
  onViewDetail: () => void;
}

/**
 * 운동 세션 카드 컴포넌트
 * - 운동별 진행 상태 표시
 * - 세트 트래킹 통합
 * - 확장/축소 가능
 */
export function ExerciseSessionCard({
  record,
  exerciseIndex,
  currentExerciseIndex,
  currentSetIndex,
  onStartExercise,
  onCompleteSet,
  onSkipSet,
  onSkipExercise,
  onViewDetail,
}: ExerciseSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(exerciseIndex === currentExerciseIndex);
  const isCurrentExercise = exerciseIndex === currentExerciseIndex;
  const isCompleted = record.isCompleted;
  const isPending = !record.startedAt && !isCurrentExercise;

  // 완료된 세트 수
  const completedSets = record.sets.filter((s) => s.status === 'completed').length;
  const totalSets = record.sets.length;

  // 카테고리 라벨
  const categoryLabels: Record<string, string> = {
    upper: '상체',
    lower: '하체',
    core: '코어',
    cardio: '유산소',
  };

  // 상태에 따른 스타일
  const getCardStyle = () => {
    if (isCompleted) return 'border-status-success/30 bg-status-success/10';
    if (isCurrentExercise) return 'border-primary/50 bg-primary/10';
    if (isPending) return 'border-border bg-muted';
    return 'border-border bg-card';
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${getCardStyle()}`}
      data-testid={`exercise-session-card-${exerciseIndex}`}
    >
      {/* 헤더 (항상 보임) */}
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between cursor-pointer text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`exercise-content-${exerciseIndex}`}
      >
        <div className="flex items-center gap-3">
          {/* 상태 아이콘 */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCompleted
                ? 'bg-status-success'
                : isCurrentExercise
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
          >
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span
                className={`font-bold ${
                  isCurrentExercise ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                {exerciseIndex + 1}
              </span>
            )}
          </div>

          {/* 운동 정보 */}
          <div>
            <h3 className={`font-medium ${isCompleted ? 'text-status-success' : 'text-foreground'}`}>
              {record.exerciseName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                {categoryLabels[record.category] || record.category}
              </span>
              <span>
                {completedSets}/{totalSets} 세트
              </span>
            </div>
          </div>
        </div>

        {/* 확장 아이콘 */}
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-sm text-status-success font-medium">완료</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* 확장된 콘텐츠 */}
      {isExpanded && (
        <div id={`exercise-content-${exerciseIndex}`} className="px-4 pb-4 space-y-4">
          {/* 대기 중인 운동 */}
          {isPending && !isCompleted && (
            <div className="flex flex-col items-center py-6">
              <p className="text-muted-foreground mb-4">이 운동을 시작하세요</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartExercise();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                aria-label={`${record.exerciseName} 운동 시작`}
              >
                <Play className="w-5 h-5" />
                운동 시작
              </button>
            </div>
          )}

          {/* 현재 진행 중인 운동 */}
          {isCurrentExercise && !isCompleted && (
            <>
              <SetTracker
                sets={record.sets}
                currentSetIndex={currentSetIndex}
                onCompleteSet={onCompleteSet}
                onSkipSet={onSkipSet}
              />

              {/* 하단 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail();
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-muted-foreground text-sm hover:bg-muted rounded-lg transition-colors"
                  aria-label={`${record.exerciseName} 자세 가이드 보기`}
                >
                  <Info className="w-4 h-4" />
                  자세 가이드
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkipExercise();
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-muted-foreground text-sm hover:bg-muted rounded-lg transition-colors ml-auto"
                  aria-label={`${record.exerciseName} 건너뛰기`}
                >
                  <SkipForward className="w-4 h-4" />
                  운동 건너뛰기
                </button>
              </div>
            </>
          )}

          {/* 완료된 운동 요약 */}
          {isCompleted && (
            <div className="bg-card rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-status-success">{completedSets}</p>
                  <p className="text-xs text-muted-foreground">완료 세트</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {record.sets
                      .filter((s) => s.status === 'completed')
                      .reduce((sum, s) => sum + (s.actualReps || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">총 횟수</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {record.restSeconds}초
                  </p>
                  <p className="text-xs text-muted-foreground">휴식 시간</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
