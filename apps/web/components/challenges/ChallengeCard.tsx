'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Challenge, UserChallenge } from '@/types/challenges';
import {
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  STATUS_NAMES,
} from '@/types/challenges';
import {
  getDaysRemaining,
  calculateProgressPercentage,
} from '@/lib/challenges';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onJoin?: () => void;
  onView?: () => void;
  loading?: boolean;
}

/**
 * 챌린지 카드 컴포넌트
 */
export function ChallengeCard({
  challenge,
  userChallenge,
  onJoin,
  onView,
  loading = false,
}: ChallengeCardProps) {
  const domainColor = DOMAIN_COLORS[challenge.domain];
  const difficultyColor = DIFFICULTY_COLORS[challenge.difficulty];
  const isParticipating = !!userChallenge;
  const isCompleted = userChallenge?.status === 'completed';
  const isFailed = userChallenge?.status === 'failed';

  // 진행률 계산
  const progressPercentage = userChallenge
    ? calculateProgressPercentage(userChallenge.progress, challenge.target)
    : 0;

  // 남은 일수
  const daysRemaining = userChallenge
    ? getDaysRemaining(userChallenge.targetEndAt)
    : challenge.durationDays;

  return (
    <div
      data-testid="challenge-card"
      className={cn(
        'rounded-xl border bg-card p-4 transition-all hover:shadow-md',
        isCompleted && 'border-green-300 bg-green-50/50 dark:bg-green-950/20',
        isFailed && 'border-red-300 bg-red-50/50 dark:bg-red-950/20 opacity-60'
      )}
    >
      {/* 상단: 아이콘 + 제목 */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl text-2xl',
            domainColor.bg
          )}
        >
          {challenge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {challenge.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {challenge.description}
          </p>
        </div>
      </div>

      {/* 태그: 난이도 + 기간 + XP */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            difficultyColor.bg,
            difficultyColor.text
          )}
        >
          {DIFFICULTY_NAMES[challenge.difficulty]}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {challenge.durationDays}일
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          +{challenge.rewardXp} XP
        </span>

        {/* 상태 배지 (참여 중인 경우) */}
        {isParticipating && userChallenge && (
          <span
            className={cn(
              'ml-auto px-2 py-0.5 rounded-full text-xs font-medium',
              userChallenge.status === 'in_progress' &&
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              userChallenge.status === 'completed' &&
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              userChallenge.status === 'failed' &&
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {STATUS_NAMES[userChallenge.status]}
          </span>
        )}
      </div>

      {/* 진행률 (참여 중인 경우) */}
      {isParticipating && (userChallenge?.status === 'in_progress' || userChallenge?.status === 'completed') && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">진행률</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progressPercentage >= 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {userChallenge?.status === 'in_progress' && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {userChallenge.progress.currentDays || 0} / {challenge.durationDays}일
              </span>
              <span>남은 기간: {daysRemaining}일</span>
            </div>
          )}
        </div>
      )}

      {/* 버튼 */}
      <div className="mt-4 flex gap-2">
        {!isParticipating ? (
          <Button
            onClick={onJoin}
            disabled={loading}
            className="flex-1"
            size="sm"
          >
            {loading ? '참여 중...' : '참여하기'}
          </Button>
        ) : isCompleted && !userChallenge?.rewardClaimed ? (
          <Button
            onClick={onView}
            className="flex-1 bg-green-500 hover:bg-green-600"
            size="sm"
          >
            보상 받기
          </Button>
        ) : (
          <Button
            onClick={onView}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            상세 보기
          </Button>
        )}
      </div>
    </div>
  );
}

export default ChallengeCard;
