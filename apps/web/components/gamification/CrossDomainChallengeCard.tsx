'use client';

/**
 * 크로스도메인 챌린지 진행 카드 컴포넌트
 *
 * @description 뷰티+운동+영양 멀티도메인 챌린지 진행률 시각화
 * @see lib/gamification/cross-domain-challenges.ts
 */

import { Sparkles, Dumbbell, Apple, Heart, Star, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type {
  CrossDomainProgressView,
  DomainProgress,
  CrossDomainChallengeDefinition,
} from '@/lib/gamification/cross-domain-challenges';
import type { ChallengeDomain } from '@/lib/gamification/challenges';

// ============================================
// 상수
// ============================================

// 도메인별 아이콘/색상 매핑
const DOMAIN_CONFIG: Record<
  Exclude<ChallengeDomain, 'cross'>,
  { icon: typeof Sparkles; color: string; bg: string; label: string }
> = {
  beauty: {
    icon: Sparkles,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    label: '뷰티',
  },
  workout: {
    icon: Dumbbell,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: '운동',
  },
  nutrition: {
    icon: Apple,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: '식단',
  },
  wellness: {
    icon: Heart,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    label: '웰니스',
  },
};

// 난이도 배지 색상
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: {
    label: '입문',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  medium: {
    label: '보통',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  hard: { label: '고급', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

// ============================================
// 원형 프로그레스 (전체 진행률)
// ============================================

function CircularProgress({ percent, size = 64 }: { percent: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // 색상: 완료=초록, 진행중=파랑
  const strokeColor = percent >= 100 ? '#22c55e' : '#3b82f6';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{percent}%</span>
      </div>
    </div>
  );
}

// ============================================
// 도메인별 프로그레스 바
// ============================================

function DomainProgressBar({ progress }: { progress: DomainProgress }) {
  const config = DOMAIN_CONFIG[progress.domain];
  if (!config) return null;

  const Icon = config.icon;
  const percent = progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0;

  return (
    <div className="flex items-center gap-3" data-testid="domain-progress-bar">
      <div
        className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}
      >
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{config.label}</span>
          <span className="text-muted-foreground">
            {progress.current}/{progress.target}
          </span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>
      {progress.completed && <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />}
    </div>
  );
}

// ============================================
// 챌린지 카드 메인
// ============================================

interface CrossDomainChallengeCardProps {
  /** 챌린지 진행 뷰 데이터 */
  view: CrossDomainProgressView;
  /** 챌린지 정의 (난이도, 기간 등) */
  definition?: CrossDomainChallengeDefinition;
  /** "도전하기" 클릭 핸들러 */
  onJoin?: (challengeId: string) => void;
  /** 이미 참여 중 여부 */
  isJoined?: boolean;
  /** 클래스명 */
  className?: string;
}

export function CrossDomainChallengeCard({
  view,
  definition,
  onJoin,
  isJoined = false,
  className,
}: CrossDomainChallengeCardProps) {
  const difficulty = definition?.difficulty ?? 'medium';
  const diffConfig = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.medium;
  const durationDays = definition?.durationDays ?? 7;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="cross-domain-challenge-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{view.name}</CardTitle>
              <span
                className={cn('text-xs px-2 py-0.5 rounded-full font-medium', diffConfig.color)}
              >
                {diffConfig.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{view.description}</p>
          </div>
          <CircularProgress percent={view.overallPercent} />
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Star className="w-3 h-3" />
            {view.xpReward} XP
          </Badge>
          <Badge variant="outline" className="text-xs">
            {durationDays}일
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 도메인별 진행 바 */}
        <div className="space-y-3">
          {view.domainProgress.map((dp) => (
            <DomainProgressBar key={dp.domain} progress={dp} />
          ))}
        </div>

        {/* 완료 상태 */}
        {view.allCompleted && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              챌린지 완료! {view.xpReward} XP 획득
            </span>
          </div>
        )}

        {/* 도전하기 버튼 */}
        {!view.allCompleted && onJoin && !isJoined && (
          <Button onClick={() => onJoin(view.challengeId)} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            도전하기
          </Button>
        )}

        {/* 참여 중 안내 */}
        {!view.allCompleted && isJoined && (
          <div className="text-center text-sm text-muted-foreground py-1">
            진행 중이에요! 계속 활동을 기록해보세요.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CrossDomainChallengeCard;
