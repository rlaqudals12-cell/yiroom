'use client';

import { memo } from 'react';
import { Exercise } from '@/types/workout';
import { Clock, Flame } from 'lucide-react';
import { ExerciseThumbnail } from '@/components/ui/optimized-image';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

// 난이도 라벨 매핑
const DIFFICULTY_LABELS = {
  beginner: { label: '초급', color: 'bg-green-100 text-green-700' },
  intermediate: { label: '중급', color: 'bg-yellow-100 text-yellow-700' },
  advanced: { label: '고급', color: 'bg-red-100 text-red-700' },
};

// 부위 라벨 매핑
const BODY_PART_LABELS: Record<string, string> = {
  chest: '가슴',
  back: '등',
  shoulder: '어깨',
  arm: '팔',
  thigh: '허벅지',
  calf: '종아리',
  hip: '엉덩이',
  abs: '복부',
  waist: '허리',
};

/**
 * 운동 카드 컴포넌트 (메모이제이션 적용)
 * Task 6.4: 이미지 최적화 - ExerciseThumbnail 적용
 */
const ExerciseCard = memo(function ExerciseCard({
  exercise,
  onClick,
  variant = 'default',
}: ExerciseCardProps) {
  const difficultyInfo = DIFFICULTY_LABELS[exercise.difficulty];

  if (variant === 'compact') {
    return (
      <article
        role="article"
        onClick={onClick}
        className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 ${
          onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all' : ''
        }`}
      >
        {/* 아이콘/썸네일 */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <ExerciseThumbnail
            videoUrl={exercise.videoUrl}
            thumbnailUrl={exercise.thumbnailUrl}
            category={exercise.category}
            alt={exercise.name}
            width={40}
            height={40}
            className="w-full h-full"
          />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{exercise.name}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{exercise.bodyParts.map((p) => BODY_PART_LABELS[p] || p).join(', ')}</span>
          </div>
        </div>

        {/* 난이도 */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyInfo.color}`}>
          {difficultyInfo.label}
        </span>
      </article>
    );
  }

  return (
    <article
      role="article"
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all' : ''
      }`}
    >
      {/* 썸네일 영역 */}
      <div className="relative h-36">
        <ExerciseThumbnail
          videoUrl={exercise.videoUrl}
          thumbnailUrl={exercise.thumbnailUrl}
          category={exercise.category}
          alt={exercise.name}
          width={320}
          height={144}
          className="w-full h-full"
          containerClassName="h-full"
        />
        {/* 난이도 뱃지 */}
        <span
          className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}
        >
          {difficultyInfo.label}
        </span>
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        {/* 운동 이름 */}
        <h3 className="text-lg font-bold text-gray-900 mb-1">{exercise.name}</h3>
        {exercise.nameEn && (
          <p className="text-sm text-gray-400 mb-3">{exercise.nameEn}</p>
        )}

        {/* 타겟 부위 태그 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {exercise.bodyParts.slice(0, 3).map((part) => (
            <span
              key={part}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {BODY_PART_LABELS[part] || part}
            </span>
          ))}
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>{exercise.caloriesPerMinute} kcal/min</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>MET {exercise.met}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

export default ExerciseCard;
