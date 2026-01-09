'use client';

import { Dumbbell, Clock, Calendar } from 'lucide-react';
import { type StretchingRecommendation as StretchingRecommendationType } from '@/lib/mock/posture-analysis';

interface StretchingRecommendationProps {
  recommendations: StretchingRecommendationType[];
  className?: string;
}

// 난이도별 색상
function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
  }
}

// 난이도 라벨
function getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return '쉬움';
    case 'medium':
      return '보통';
    case 'hard':
      return '어려움';
  }
}

// 개별 스트레칭 카드
function StretchingCard({
  stretch,
  index,
}: {
  stretch: StretchingRecommendationType;
  index: number;
}) {
  return (
    <div
      className="p-4 bg-card rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`stretching-card-${index}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{stretch.name}</h4>
            <p className="text-xs text-muted-foreground">{stretch.targetArea}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(stretch.difficulty)}`}
        >
          {getDifficultyLabel(stretch.difficulty)}
        </span>
      </div>

      <p className="text-sm text-foreground/80 mb-3">{stretch.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {stretch.duration}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {stretch.frequency}
        </span>
      </div>
    </div>
  );
}

export default function StretchingRecommendation({
  recommendations,
  className = '',
}: StretchingRecommendationProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className={className} data-testid="stretching-recommendation">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-foreground">추천 스트레칭</h2>
        </div>
        <span className="text-xs text-muted-foreground">{recommendations.length}개 운동</span>
      </div>

      <div className="space-y-3">
        {recommendations.map((stretch, index) => (
          <StretchingCard key={index} stretch={stretch} index={index} />
        ))}
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          꾸준한 스트레칭이 자세 교정의 핵심이에요. 매일 10-15분씩 실천해보세요!
        </p>
      </div>
    </section>
  );
}
