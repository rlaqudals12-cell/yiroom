'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Pause, Play, Clock, Flame, Target } from 'lucide-react';

interface WorkoutSessionHeaderProps {
  dayLabel: string;
  totalExercises: number;
  completedExercises: number;
  totalSets: number;
  completedSets: number;
  estimatedCalories: number;
  elapsedTime: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
}

/**
 * 운동 세션 헤더 컴포넌트
 * - 진행률 표시
 * - 경과 시간 표시
 * - 일시정지/종료 버튼
 */
export function WorkoutSessionHeader({
  dayLabel,
  totalExercises,
  completedExercises,
  totalSets,
  completedSets,
  estimatedCalories,
  elapsedTime,
  isPaused,
  onPause,
  onResume,
  onExit,
}: WorkoutSessionHeaderProps) {
  const [localElapsedTime, setLocalElapsedTime] = useState(elapsedTime);

  // 경과 시간 업데이트
  useEffect(() => {
    setLocalElapsedTime(elapsedTime);
  }, [elapsedTime]);

  // 타이머 동작 (일시정지가 아닐 때)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLocalElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // 시간 포맷팅 (mm:ss)
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }, []);

  // 진행률 계산
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100" data-testid="workout-session-header">
      {/* 상단 바 */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onExit}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="운동 종료"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <h1 className="text-lg font-bold text-gray-900">{dayLabel} 운동</h1>

        <button
          onClick={isPaused ? onResume : onPause}
          className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isPaused ? '운동 재개' : '운동 일시정지'}
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-indigo-500" />
          ) : (
            <Pause className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="px-4 pb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 통계 */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-4">
        {/* 경과 시간 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatTime(localElapsedTime)}</p>
            <p className="text-xs text-gray-500">경과 시간</p>
          </div>
        </div>

        {/* 칼로리 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{Math.round(estimatedCalories)}</p>
            <p className="text-xs text-gray-500">kcal</p>
          </div>
        </div>

        {/* 진행률 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
            <Target className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {completedExercises}/{totalExercises}
            </p>
            <p className="text-xs text-gray-500">운동</p>
          </div>
        </div>
      </div>

      {/* 일시정지 오버레이 */}
      {isPaused && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
          <div className="text-center">
            <Pause className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-900 mb-2">일시정지됨</p>
            <p className="text-sm text-gray-500 mb-6">
              {formatTime(localElapsedTime)} 경과
            </p>
            <button
              onClick={onResume}
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              운동 재개
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
