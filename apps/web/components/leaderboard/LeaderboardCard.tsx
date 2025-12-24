'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import type { RankingEntry, LeaderboardCategory } from '@/types/leaderboard';
import { getRankMedal, getRankColor, getRankBgColor } from '@/types/leaderboard';
import { formatScore } from '@/lib/leaderboard/constants';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface LeaderboardCardProps {
  entry: RankingEntry;
  category: LeaderboardCategory;
  variant?: 'default' | 'large';
  isCurrentUser?: boolean;
}

export function LeaderboardCard({
  entry,
  category,
  variant = 'default',
  isCurrentUser = false,
}: LeaderboardCardProps) {
  const medal = getRankMedal(entry.rank);
  const rankColor = getRankColor(entry.rank);
  const bgColor = getRankBgColor(entry.rank);

  const isTop = variant === 'large' || entry.rank <= 3;

  return (
    <Card
      className={cn(
        'transition-all',
        bgColor,
        isCurrentUser && 'ring-2 ring-primary',
        isTop && 'border-2'
      )}
      data-testid={`leaderboard-card-${entry.rank}`}
    >
      <CardContent className={cn('p-4', isTop && 'p-6')}>
        <div className="flex flex-col items-center text-center">
          {/* 순위 / 메달 */}
          <div className={cn('text-3xl mb-2', isTop && 'text-4xl', rankColor)}>
            {medal ? (
              <span>{medal}</span>
            ) : (
              <div className="flex items-center gap-1">
                {entry.rank === 1 && <Crown className="h-6 w-6" />}
                <span>{entry.rank}</span>
              </div>
            )}
          </div>

          {/* 아바타 */}
          <Avatar className={cn('mb-2', isTop ? 'h-16 w-16' : 'h-12 w-12')}>
            <AvatarImage src={entry.avatarUrl ?? undefined} />
            <AvatarFallback className={cn(isTop && 'text-xl')}>
              {entry.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 이름 */}
          <div className={cn('font-medium truncate max-w-full', isTop && 'text-lg')}>
            {entry.displayName}
            {isCurrentUser && (
              <span className="ml-1 text-xs text-primary">(나)</span>
            )}
          </div>

          {/* 티어/레벨 */}
          {entry.tier && (
            <div className="text-xs text-muted-foreground mt-1">
              Lv.{entry.level} · {entry.tier}
            </div>
          )}

          {/* 점수 */}
          <div className={cn('font-bold mt-2', isTop ? 'text-2xl' : 'text-lg', rankColor)}>
            {formatScore(entry.score, category)}
          </div>

          {/* 변화량 */}
          {entry.change !== undefined && entry.change !== 0 && (
            <div
              className={cn(
                'text-sm mt-1',
                entry.change > 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}위
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 상위 3명을 위한 포디움 스타일 컴포넌트
interface LeaderboardPodiumProps {
  rankings: RankingEntry[];
  category: LeaderboardCategory;
  currentUserId?: string;
}

export function LeaderboardPodium({
  rankings,
  category,
  currentUserId,
}: LeaderboardPodiumProps) {
  // 상위 3명만 사용
  const top3 = rankings.slice(0, 3);

  if (top3.length === 0) {
    return null;
  }

  // 순서: 2위, 1위, 3위 (포디움 스타일)
  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
      ? [top3[1], top3[0]]
      : [top3[0]];

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: top3.length === 3
          ? '1fr 1.2fr 1fr'
          : top3.length === 2
            ? '1fr 1.2fr'
            : '1fr',
      }}
      data-testid="leaderboard-podium"
    >
      {podiumOrder.map((entry) => (
        <div
          key={entry.userId}
          className={cn(entry.rank === 1 ? '-mt-4' : 'mt-4')}
        >
          <LeaderboardCard
            entry={entry}
            category={category}
            variant="large"
            isCurrentUser={entry.userId === currentUserId}
          />
        </div>
      ))}
    </div>
  );
}
