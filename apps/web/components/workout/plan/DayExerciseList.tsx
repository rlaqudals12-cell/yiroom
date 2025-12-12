'use client';

import type { DayPlan, WorkoutType } from '@/types/workout';
import { calculateExerciseDetails } from '@/lib/workout/weeklyPlan';
import { Clock, Flame, Dumbbell, ChevronRight, Coffee } from 'lucide-react';

// 부위 한글 라벨 (BodyPart 타입과 일치)
const BODY_PART_LABELS: Record<string, string> = {
  chest: '가슴',
  back: '등',
  shoulder: '어깨',
  arm: '팔',
  thigh: '허벅지',
  hip: '엉덩이',
  calf: '종아리',
  abs: '복근',
  waist: '허리',
};

// 난이도 라벨
const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: '초급', color: 'text-green-600 bg-green-50' },
  intermediate: { label: '중급', color: 'text-yellow-600 bg-yellow-50' },
  advanced: { label: '고급', color: 'text-red-600 bg-red-50' },
};

interface DayExerciseListProps {
  day: DayPlan;
  workoutType: WorkoutType;
  userWeight: number;
  onExerciseClick?: (exerciseId: string) => void;
}

export function DayExerciseList({
  day,
  workoutType,
  userWeight,
  onExerciseClick,
}: DayExerciseListProps) {
  // 휴식일 표시
  if (day.isRestDay) {
    return (
      <div
        className="bg-gray-50 rounded-2xl p-6 text-center"
        data-testid="day-exercise-list-rest"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">
          {day.dayLabel} - 휴식일
        </h3>
        <p className="text-gray-500 text-sm">
          오늘은 충분한 휴식을 취하세요.<br />
          근육이 회복되는 중요한 시간이에요.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100"
      data-testid="day-exercise-list"
    >
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{day.dayLabel} 운동</h3>
            <p className="text-sm text-gray-500">
              {day.focus?.map((p) => BODY_PART_LABELS[p] || p).join(', ') || '전신'} 집중
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{day.estimatedMinutes}분</span>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span>{day.estimatedCalories}kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 운동 리스트 */}
      <div className="divide-y divide-gray-50">
        {day.exercises.map((exercise, index) => {
          const details = calculateExerciseDetails(exercise, workoutType, userWeight);
          // 난이도가 없는 경우 기본값 처리
          const difficulty = DIFFICULTY_LABELS[exercise.difficulty] || DIFFICULTY_LABELS.beginner;

          return (
            <button
              key={exercise.id}
              onClick={() => onExerciseClick?.(exercise.id)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* 번호 */}
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">{index + 1}</span>
              </div>

              {/* 운동 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {exercise.name}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty.color}`}>
                    {difficulty.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{details.sets}세트</span>
                  <span>×</span>
                  <span>{details.reps}회</span>
                  {details.weight && (
                    <>
                      <span>×</span>
                      <span>{details.weight}kg</span>
                    </>
                  )}
                </div>
              </div>

              {/* 칼로리 및 화살표 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-orange-500 font-medium">
                  {details.estimatedCalories}kcal
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 운동이 없는 경우 */}
      {day.exercises.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">이 날의 운동이 없습니다</p>
        </div>
      )}
    </div>
  );
}
