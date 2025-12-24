'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { WellnessScore } from '@/types/wellness';
import { getWellnessGrade, getWellnessGradeColor, getWellnessGradeBgColor } from '@/types/wellness';

interface WellnessScoreCardProps {
  score: WellnessScore | null;
  isLoading?: boolean;
  showBreakdown?: boolean;
}

export function WellnessScoreCard({
  score,
  isLoading = false,
  showBreakdown = true,
}: WellnessScoreCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="wellness-score-card-loading">
        <CardHeader>
          <CardTitle className="text-lg">웰니스 스코어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card data-testid="wellness-score-card-empty">
        <CardHeader>
          <CardTitle className="text-lg">웰니스 스코어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>오늘의 웰니스 스코어가 아직 없습니다.</p>
            <p className="text-sm mt-1">활동을 기록해서 점수를 확인해보세요!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grade = getWellnessGrade(score.totalScore);
  const gradeColor = getWellnessGradeColor(grade);
  const gradeBg = getWellnessGradeBgColor(grade);

  const areas = [
    { label: '운동', score: score.workoutScore, max: 25, color: 'bg-orange-500' },
    { label: '영양', score: score.nutritionScore, max: 25, color: 'bg-green-500' },
    { label: '피부', score: score.skinScore, max: 25, color: 'bg-purple-500' },
    { label: '체형', score: score.bodyScore, max: 25, color: 'bg-blue-500' },
  ];

  return (
    <Card data-testid="wellness-score-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>웰니스 스코어</span>
          <span className="text-sm text-muted-foreground">{score.date}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 메인 점수 */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className={`rounded-full p-6 ${gradeBg}`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${gradeColor}`}>{score.totalScore}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold ${gradeColor}`}>{grade}</div>
            <div className="text-sm text-muted-foreground mt-1">등급</div>
          </div>
        </div>

        {/* 영역별 점수 */}
        {showBreakdown && (
          <div className="space-y-3">
            {areas.map((area) => (
              <div key={area.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{area.label}</span>
                  <span className="text-muted-foreground">
                    {area.score} / {area.max}
                  </span>
                </div>
                <Progress
                  value={(area.score / area.max) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
