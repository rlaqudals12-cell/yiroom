'use client';

import { Check, X, Lock } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MatchReason } from '@/types/product';

interface ProductMatchCardProps {
  matchScore?: number;
  matchReasons?: MatchReason[];
  isLoggedIn?: boolean;
  hasAnalysis?: boolean;
  className?: string;
}

/**
 * 매칭도 색상 결정
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * 매칭도 프로그레스 색상
 */
function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
}

/**
 * 매칭도 등급 라벨
 */
function getScoreLabel(score: number): string {
  if (score >= 90) return '완벽한 매칭';
  if (score >= 80) return '아주 좋은 매칭';
  if (score >= 60) return '좋은 매칭';
  if (score >= 40) return '보통';
  return '낮은 매칭';
}

/**
 * 미로그인 상태 카드
 */
function NotLoggedInCard() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4" />
          매칭도 확인
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          로그인하고 분석을 완료하면 이 제품이 나에게 얼마나 잘 맞는지 확인할 수 있어요.
        </p>
        <Button asChild className="w-full">
          <Link href="/sign-in">로그인하고 매칭도 확인하기</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 분석 미완료 상태 카드
 */
function NoAnalysisCard() {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-primary" />
          매칭도 확인
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          분석을 완료하면 이 제품이 나에게 얼마나 잘 맞는지 확인할 수 있어요.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/analysis/skin">피부 분석하기</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/analysis/personal-color">퍼스널컬러 진단</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 매칭도 카드 컴포넌트
 * - 종합 매칭도 (%) 표시
 * - 매칭 이유 리스트 (체크/X 아이콘)
 * - 미로그인 시 "로그인하고 매칭도 확인하기" CTA
 */
export function ProductMatchCard({
  matchScore,
  matchReasons,
  isLoggedIn = false,
  hasAnalysis = false,
  className,
}: ProductMatchCardProps) {
  // 미로그인 상태
  if (!isLoggedIn) {
    return <NotLoggedInCard />;
  }

  // 분석 미완료 상태
  if (!hasAnalysis) {
    return <NoAnalysisCard />;
  }

  // 매칭 정보가 없는 경우
  if (matchScore === undefined) {
    return null;
  }

  const scoreColor = getScoreColor(matchScore);
  const progressColor = getProgressColor(matchScore);
  const scoreLabel = getScoreLabel(matchScore);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">나와의 매칭도</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 매칭도 점수 */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            {/* 원형 배경 */}
            <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${matchScore * 2.83} 283`}
                strokeLinecap="round"
                className={scoreColor}
              />
            </svg>
            {/* 중앙 점수 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-xl font-bold', scoreColor)}>{matchScore}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className={cn('text-lg font-semibold', scoreColor)}>{scoreLabel}</p>
            <p className="text-sm text-muted-foreground">내 분석 결과 기반</p>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="space-y-1">
          <Progress
            value={matchScore}
            className="h-2"
            indicatorClassName={progressColor}
          />
        </div>

        {/* 매칭 이유 */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">매칭 분석</p>
            <ul className="space-y-1.5">
              {matchReasons.map((reason, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  {reason.matched ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-400" />
                  )}
                  <span className={reason.matched ? '' : 'text-muted-foreground'}>
                    {reason.label}
                    {reason.matched ? '에 적합해요' : '에는 맞지 않아요'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
