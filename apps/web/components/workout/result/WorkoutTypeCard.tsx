'use client';

import { memo } from 'react';
import { WorkoutType } from '@/types/workout';
import { WORKOUT_TYPE_INFO } from '@/lib/workout/classifyWorkoutType';

interface WorkoutTypeCardProps {
  type: WorkoutType;
  reason: string;
}

/**
 * 운동 타입 카드 (메모이제이션 적용)
 * props가 변경되지 않으면 리렌더링 방지
 */
const WorkoutTypeCard = memo(function WorkoutTypeCard({ type, reason }: WorkoutTypeCardProps) {
  const typeInfo = WORKOUT_TYPE_INFO[type];

  return (
    <div
      data-testid="workout-type-card"
      className={`rounded-2xl p-6 ${typeInfo.bgColor}`}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center text-4xl">
          {typeInfo.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            당신의 운동 타입
          </p>
          <h2 className={`text-2xl font-bold ${typeInfo.color}`}>
            {typeInfo.label}
          </h2>
        </div>
      </div>

      {/* 설명 */}
      <p className={`text-base ${typeInfo.color} opacity-80 mb-4`}>
        {typeInfo.description}
      </p>

      {/* 분류 이유 */}
      <div className="bg-white/50 rounded-xl p-4">
        <p className="text-sm text-gray-600">{reason}</p>
      </div>
    </div>
  );
});

export default WorkoutTypeCard;
