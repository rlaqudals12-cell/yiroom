/**
 * W-2 스트레칭 루틴 카드 컴포넌트
 *
 * @description 스트레칭 처방 요약 및 시작 버튼
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, AlertCircle, Play } from 'lucide-react';

import type { StretchingPrescription } from '@/types/stretching';
import { MUSCLE_NAME_KO } from '@/lib/workout/stretching';

interface StretchingRoutineCardProps {
  prescription: StretchingPrescription;
  onStart: () => void;
  className?: string;
}

export function StretchingRoutineCard({
  prescription,
  onStart,
  className,
}: StretchingRoutineCardProps) {
  // 주요 타겟 근육 추출
  const targetMuscles = new Set<string>();
  for (const stretch of prescription.stretches) {
    for (const muscle of stretch.exercise.targetMuscles) {
      targetMuscles.add(MUSCLE_NAME_KO[muscle]);
    }
  }
  const muscleList = Array.from(targetMuscles).slice(0, 5);

  // 목적에 따른 제목
  const purposeTitle = {
    posture_correction: '자세교정 스트레칭',
    warmup: '워밍업 스트레칭',
    cooldown: '쿨다운 스트레칭',
    general: '전신 유연성 스트레칭',
  }[prescription.basedOn.purpose];

  const purposeIcon = {
    posture_correction: '🧘',
    warmup: '🔥',
    cooldown: '❄️',
    general: '✨',
  }[prescription.basedOn.purpose];

  return (
    <Card className={className} data-testid="stretching-routine-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{purposeIcon}</span>
              {purposeTitle}
            </CardTitle>
            <CardDescription>
              {prescription.frequency}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {prescription.stretches.length}개 운동
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 요약 정보 */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>약 {prescription.totalDuration}분</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span>{prescription.stretches.length}개</span>
          </div>
        </div>

        {/* 타겟 근육 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">주요 타겟 근육</p>
          <div className="flex flex-wrap gap-1">
            {muscleList.map((muscle) => (
              <Badge key={muscle} variant="outline" className="text-xs">
                {muscle}
              </Badge>
            ))}
            {targetMuscles.size > 5 && (
              <Badge variant="outline" className="text-xs">
                +{targetMuscles.size - 5}
              </Badge>
            )}
          </div>
        </div>

        {/* 경고 */}
        {prescription.warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
              <div className="text-sm">
                {prescription.warnings.map((warning, idx) => (
                  <p key={idx} className="text-muted-foreground">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 운동 목록 미리보기 */}
        <div className="border rounded-lg divide-y">
          {prescription.stretches.slice(0, 3).map((stretch, idx) => (
            <div key={stretch.exercise.id} className="p-3 flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-6">
                {idx + 1}.
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{stretch.exercise.nameKo}</p>
                <p className="text-xs text-muted-foreground">
                  {stretch.adjustedSets}세트 x{' '}
                  {stretch.adjustedDuration}
                  {stretch.exercise.durationUnit === 'seconds' ? '초' : '회'}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {stretch.exercise.type === 'static' ? '정적' :
                 stretch.exercise.type === 'dynamic' ? '동적' : 'PNF'}
              </Badge>
            </div>
          ))}
          {prescription.stretches.length > 3 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              +{prescription.stretches.length - 3}개 더
            </div>
          )}
        </div>

        {/* 시작 버튼 */}
        <Button onClick={onStart} className="w-full" size="lg">
          <Play className="w-4 h-4 mr-2" />
          스트레칭 시작
        </Button>

        {/* 면책 조항 */}
        <p className="text-xs text-muted-foreground text-center">
          통증이 발생하면 즉시 중단하세요
        </p>
      </CardContent>
    </Card>
  );
}

export default StretchingRoutineCard;
