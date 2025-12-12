'use client';

import { Clock, Flame, Dumbbell, TrendingUp, ChevronRight } from 'lucide-react';
import type { WorkoutLog } from '@/lib/api/workout';

interface WorkoutHistoryCardProps {
  log: WorkoutLog;
  onClick?: () => void;
}

/**
 * 운동 기록 카드 컴포넌트
 * - 개별 운동 세션 요약
 * - 시간, 칼로리, 볼륨 표시
 */
export function WorkoutHistoryCard({ log, onClick }: WorkoutHistoryCardProps) {
  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  // 시간 포맷팅
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  // 완료된 운동 수
  const completedExercises = log.exercise_logs?.filter(
    (ex) => ex.sets.some((s) => s.completed)
  ).length ?? 0;

  const totalExercises = log.exercise_logs?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left"
      data-testid="workout-history-card"
    >
      <div className="flex items-center justify-between">
        {/* 날짜 및 운동 수 */}
        <div>
          <p className="text-lg font-bold text-foreground">
            {formatDate(log.workout_date)}
          </p>
          <p className="text-sm text-muted-foreground">
            {completedExercises}/{totalExercises}개 운동 완료
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* 운동 시간 */}
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">
            {formatDuration(log.actual_duration)}
          </p>
          <p className="text-xs text-muted-foreground">시간</p>
        </div>

        {/* 소모 칼로리 */}
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">
            {log.actual_calories ? `${Math.round(log.actual_calories)}` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>

        {/* 볼륨 */}
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-purple-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">
            {log.total_volume ? log.total_volume.toLocaleString() : '-'}
          </p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
      </div>

      {/* 운동 목록 미리보기 */}
      {log.exercise_logs && log.exercise_logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Dumbbell className="w-4 h-4" />
            <span className="truncate">
              {log.exercise_logs.slice(0, 3).map((ex) => ex.exercise_name).join(', ')}
              {log.exercise_logs.length > 3 && ` 외 ${log.exercise_logs.length - 3}개`}
            </span>
          </div>
        </div>
      )}

      {/* 메모 */}
      {log.notes && (
        <div className="mt-2 text-sm text-muted-foreground italic truncate">
          &quot;{log.notes}&quot;
        </div>
      )}
    </button>
  );
}
