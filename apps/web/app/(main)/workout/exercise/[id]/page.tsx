'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Flame, Dumbbell, RefreshCw } from 'lucide-react';
import { getExerciseById, getAlternativeExercises } from '@/lib/workout/exercises';
import { PostureGuide, YouTubeEmbed } from '@/components/workout/detail';
import { ExerciseCard } from '@/components/workout/common';

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

// 카테고리 아이콘 매핑
const CATEGORY_ICONS: Record<string, string> = {
  upper: '💪',
  lower: '🦵',
  core: '🧘',
  cardio: '🏃',
};

// 세트/횟수 추천 (난이도별)
const SET_REPS_RECOMMENDATIONS = {
  beginner: { sets: 3, reps: '10-12', rest: '60-90초' },
  intermediate: { sets: 4, reps: '12-15', rest: '45-60초' },
  advanced: { sets: 5, reps: '15-20', rest: '30-45초' },
};

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const exercise = getExerciseById(id);

  // 운동을 찾을 수 없는 경우
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">운동을 찾을 수 없어요</h2>
        <p className="text-muted-foreground text-center">요청하신 운동 정보를 찾을 수 없어요.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const difficultyInfo = DIFFICULTY_LABELS[exercise.difficulty];
  const categoryIcon = CATEGORY_ICONS[exercise.category] || '🏋️';
  const setReps = SET_REPS_RECOMMENDATIONS[exercise.difficulty];
  const alternativeExercises = getAlternativeExercises(exercise, 3);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-2">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground/80" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate">{exercise.name}</h1>
      </div>

      {/* 영상 또는 썸네일 영역 */}
      {exercise.videoUrl ? (
        <YouTubeEmbed videoUrl={exercise.videoUrl} title={`${exercise.name} 가이드`} />
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center">
          <span className="text-7xl">{categoryIcon}</span>
          {/* 난이도 뱃지 */}
          <span
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${difficultyInfo.color}`}
          >
            {difficultyInfo.label}
          </span>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
        <h2 className="text-2xl font-bold text-foreground mb-1">{exercise.name}</h2>
        {exercise.nameEn && <p className="text-sm text-muted-foreground mb-4">{exercise.nameEn}</p>}

        {/* 타겟 부위 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {exercise.bodyParts.map((part) => (
            <span
              key={part}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
            >
              {BODY_PART_LABELS[part] || part}
            </span>
          ))}
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="w-5 h-5 text-orange-400" />
            <span>{exercise.caloriesPerMinute} kcal/min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>MET {exercise.met}</span>
          </div>
        </div>
      </div>

      {/* 세트/횟수 추천 */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Dumbbell className="w-5 h-5 text-indigo-500" />
          추천 운동량
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-2xl font-bold text-indigo-600">{setReps.sets}</p>
            <p className="text-sm text-muted-foreground">세트</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <p className="text-2xl font-bold text-indigo-600">{setReps.reps}</p>
            <p className="text-sm text-muted-foreground">횟수</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <p className="text-lg font-bold text-indigo-600">{setReps.rest}</p>
            <p className="text-sm text-muted-foreground">휴식</p>
          </div>
        </div>
      </div>

      {/* 자세 가이드 */}
      <PostureGuide instructions={exercise.instructions} tips={exercise.tips} />

      {/* 필요 장비 */}
      {exercise.equipment.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-bold text-foreground mb-4">필요 장비</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((equip) => (
              <span
                key={equip}
                className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
              >
                {equip}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 대체 운동 추천 */}
      {alternativeExercises.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
            <RefreshCw className="w-5 h-5 text-indigo-500" />
            대체 운동
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            같은 부위를 자극하는 비슷한 운동이에요
          </p>
          <div className="space-y-3">
            {alternativeExercises.map((altExercise) => (
              <ExerciseCard
                key={altExercise.id}
                exercise={altExercise}
                variant="compact"
                onClick={() => router.push(`/workout/exercise/${altExercise.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
