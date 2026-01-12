'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  generateBest5,
  ExerciseGoal,
  GOAL_ICONS,
  type ExerciseRecommendation,
} from '@/lib/workout/best5-generator';
import { PostureType } from '@/lib/mock/posture-analysis';
import { BodyType } from '@/types/workout';
import { Clock, Flame, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Best5CardProps {
  goal: ExerciseGoal;
  postureType?: PostureType;
  bodyType?: BodyType;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// 난이도별 색상
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

// 난이도별 라벨
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

export function Best5Card({ goal, postureType, bodyType, fitnessLevel }: Best5CardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Best 5 생성
  const result = useMemo(
    () =>
      generateBest5(goal, {
        postureType,
        bodyType,
        fitnessLevel,
      }),
    [goal, postureType, bodyType, fitnessLevel]
  );

  const { goalLabel, exercises, totalDuration, estimatedCalories, tips } = result;

  // 운동 상세 토글
  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Card data-testid="best5-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{GOAL_ICONS[goal]}</span>
          {goalLabel} Best 5
        </CardTitle>
        <CardDescription className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />총 {totalDuration}분
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4" />약 {estimatedCalories}kcal 소모
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 운동 목록 */}
        <ol className="space-y-3">
          {exercises.map((rec, index) => (
            <ExerciseItem
              key={rec.exercise.id}
              recommendation={rec}
              rank={index + 1}
              isExpanded={expandedIndex === index}
              onToggle={() => toggleExpand(index)}
            />
          ))}
        </ol>

        {/* 운동 팁 */}
        {tips.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-2">운동 팁</p>
                <ul className="space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 개별 운동 항목 컴포넌트
interface ExerciseItemProps {
  recommendation: ExerciseRecommendation;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExerciseItem({ recommendation, rank, isExpanded, onToggle }: ExerciseItemProps) {
  const { exercise, reason } = recommendation;

  return (
    <li className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
        data-testid={`exercise-item-${rank}`}
      >
        {/* 순위 뱃지 */}
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
          {rank}
        </div>

        {/* 운동 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground">{exercise.name}</p>
            <Badge className={DIFFICULTY_COLORS[exercise.difficulty]} variant="secondary">
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{reason}</p>
        </div>

        {/* 확장 버튼 */}
        <Button size="sm" variant="ghost" className="flex-shrink-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* 상세 정보 (확장 시) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
          <div className="space-y-3 mt-3">
            {/* 타겟 부위 */}
            {exercise.bodyParts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">타겟 부위</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.bodyParts.map((part) => (
                    <Badge key={part} variant="outline" className="text-xs">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 장비 */}
            {exercise.equipment.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">필요 장비</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.equipment.map((eq) => (
                    <Badge key={eq} variant="outline" className="text-xs">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 운동 방법 (간략) */}
            {exercise.instructions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">운동 방법</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  {exercise.instructions.slice(0, 3).map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                  {exercise.instructions.length > 3 && (
                    <li className="text-muted-foreground/60">
                      ... 외 {exercise.instructions.length - 3}개 단계
                    </li>
                  )}
                </ol>
              </div>
            )}

            {/* 팁 */}
            {exercise.tips.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">팁</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {exercise.tips.slice(0, 2).map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
