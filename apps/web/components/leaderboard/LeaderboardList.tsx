'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingEntry, LeaderboardCategory } from '@/types/leaderboard';
import { getRankMedal, getRankBgColor, getCategoryIcon } from '@/types/leaderboard';
import { formatScore } from '@/lib/leaderboard/constants';
import { cn } from '@/lib/utils';

interface LeaderboardListProps {
  rankings: RankingEntry[];
  category: LeaderboardCategory;
  currentUserId?: string;
  isLoading?: boolean;
  title?: string;
  showHeader?: boolean;
}

export function LeaderboardList({
  rankings,
  category,
  currentUserId,
  isLoading = false,
  title = '리더보드',
  showHeader = true,
}: LeaderboardListProps) {
  if (isLoading) {
    return (
      <Card data-testid="leaderboard-list-loading">
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{getCategoryIcon(category)}</span>
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card data-testid="leaderboard-list-empty">
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{getCategoryIcon(category)}</span>
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>아직 랭킹 데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="leaderboard-list">
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{getCategoryIcon(category)}</span>
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {rankings.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const medal = getRankMedal(entry.rank);
            const bgColor = getRankBgColor(entry.rank);

            return (
              <div
                key={entry.userId}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  bgColor,
                  isCurrentUser && 'ring-2 ring-primary'
                )}
                data-testid={`leaderboard-entry-${entry.rank}`}
              >
                {/* 순위 */}
                <div className="w-8 text-center font-bold">
                  {medal ?? entry.rank}
                </div>

                {/* 아바타 */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {entry.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* 사용자 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.displayName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-primary">(나)</span>
                    )}
                  </div>
                  {entry.tier && (
                    <div className="text-xs text-muted-foreground">
                      Lv.{entry.level} · {entry.tier}
                    </div>
                  )}
                </div>

                {/* 점수 */}
                <div className="text-right font-semibold">
                  {formatScore(entry.score, category)}
                </div>

                {/* 변화량 */}
                {entry.change !== undefined && entry.change !== 0 && (
                  <div
                    className={cn(
                      'text-xs',
                      entry.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {entry.change > 0 ? '↑' : '↓'}
                    {Math.abs(entry.change)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
