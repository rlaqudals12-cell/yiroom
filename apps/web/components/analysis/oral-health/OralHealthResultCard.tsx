/**
 * 구강건강 분석 결과 카드 컴포넌트
 *
 * @module components/analysis/oral-health/OralHealthResultCard
 * @description OH-1 종합 분석 결과 표시
 */

'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VitaShadeDisplay } from './VitaShadeDisplay';
import { GumHealthIndicator } from './GumHealthIndicator';
import type { OralHealthAssessment, WhiteningGoalResult } from '@/types/oral-health';

interface OralHealthResultCardProps {
  /** 분석 결과 */
  assessment: OralHealthAssessment;
  /** 미백 목표 결과 (선택) */
  whiteningGoal?: WhiteningGoalResult;
  /** 추가 CSS 클래스 */
  className?: string;
}

export function OralHealthResultCard({
  assessment,
  whiteningGoal,
  className,
}: OralHealthResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasToothColor = !!assessment.toothColor;
  const hasGumHealth = !!assessment.gumHealth;

  return (
    <div
      className={cn('rounded-xl border bg-card shadow-sm', className)}
      data-testid="oral-health-result-card"
    >
      {/* 헤더 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">구강건강 분석</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(assessment.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assessment.usedFallback && (
              <Badge variant="secondary" className="text-xs">
                추정값
              </Badge>
            )}
            <ScoreBadge score={assessment.overallScore} />
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue={hasToothColor ? 'tooth' : 'gum'} className="p-4">
        <TabsList className="mb-4 w-full">
          {hasToothColor && (
            <TabsTrigger value="tooth" className="flex-1">
              치아 색상
            </TabsTrigger>
          )}
          {hasGumHealth && (
            <TabsTrigger value="gum" className="flex-1">
              잇몸 건강
            </TabsTrigger>
          )}
          {whiteningGoal && (
            <TabsTrigger value="whitening" className="flex-1">
              미백 목표
            </TabsTrigger>
          )}
        </TabsList>

        {/* 치아 색상 탭 */}
        {hasToothColor && (
          <TabsContent value="tooth">
            <VitaShadeDisplay
              currentShade={assessment.toothColor!.matchedShade}
              targetShade={assessment.whiteningGoal?.targetShade}
              result={assessment.toothColor}
            />
          </TabsContent>
        )}

        {/* 잇몸 건강 탭 */}
        {hasGumHealth && (
          <TabsContent value="gum">
            <GumHealthIndicator result={assessment.gumHealth!} />
          </TabsContent>
        )}

        {/* 미백 목표 탭 */}
        {whiteningGoal && (
          <TabsContent value="whitening">
            <WhiteningGoalSection goal={whiteningGoal} />
          </TabsContent>
        )}
      </Tabs>

      {/* 추천 사항 */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="mb-2 w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-medium">추천 사항</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isExpanded && (
          <ul className="space-y-2 pl-4">
            {assessment.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * 점수 뱃지
 */
function ScoreBadge({ score }: { score: number }) {
  const getScoreColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold',
        getScoreColor()
      )}
    >
      {score}
    </div>
  );
}

/**
 * 미백 목표 섹션
 */
function WhiteningGoalSection({ goal }: { goal: WhiteningGoalResult }) {
  return (
    <div className="space-y-4" data-testid="whitening-goal-section">
      {/* 목표 요약 */}
      <div className="rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
        <h3 className="mb-2 font-semibold">미백 목표</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">목표 셰이드</p>
            <p className="text-xl font-bold">{goal.targetShade}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">필요 단계</p>
            <p className="text-xl font-bold">{goal.shadeStepsNeeded}단계</p>
          </div>
        </div>
      </div>

      {/* 예상 기간 */}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">예상 소요 기간</p>
          <p className="text-muted-foreground">
            {goal.expectedDuration.minWeeks}-{goal.expectedDuration.maxWeeks}주
          </p>
        </div>
      </div>

      {/* 과도한 미백 경고 */}
      {goal.isOverWhitening && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">과도한 미백 주의</p>
            <p className="text-sm text-amber-700">{goal.overWhiteningReason}</p>
          </div>
        </div>
      )}

      {/* 퍼스널컬러 조화 */}
      <div className="rounded-lg border p-3">
        <p className="mb-1 text-sm font-medium">퍼스널컬러 조화</p>
        <p className="text-sm text-muted-foreground">{goal.harmonySuggestion}</p>
      </div>

      {/* 추천 방법 */}
      <div>
        <p className="mb-2 text-sm font-medium">추천 미백 방법</p>
        <div className="space-y-2">
          {goal.recommendedMethods.map((method, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{getMethodLabel(method.method)}</span>
                <EffectivenessBadge level={method.effectiveness} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {method.duration} · {method.notes}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 효과성 뱃지
 */
function EffectivenessBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: '낮음', className: 'bg-gray-100 text-gray-600' },
    medium: { label: '보통', className: 'bg-blue-100 text-blue-600' },
    high: { label: '높음', className: 'bg-green-100 text-green-600' },
  };

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', config[level].className)}>
      {config[level].label}
    </span>
  );
}

/**
 * 방법 레이블 반환
 */
function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    whitening_toothpaste: '미백 치약',
    strips: '미백 스트립',
    professional_bleaching: '전문가 미백',
    in_office: '병원 미백',
  };
  return labels[method] || method;
}

export default OralHealthResultCard;
