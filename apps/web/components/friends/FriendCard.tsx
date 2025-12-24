'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Friend } from '@/types/friends';
import { UserMinus } from 'lucide-react';

interface FriendCardProps {
  friend: Friend;
  onRemove?: (friendshipId: string) => void;
  isRemoving?: boolean;
}

export function FriendCard({ friend, onRemove, isRemoving = false }: FriendCardProps) {
  const tierColors: Record<string, string> = {
    beginner: 'text-gray-500',
    bronze: 'text-amber-600',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    master: 'text-purple-500',
  };

  const tierColor = tierColors[friend.tier] ?? 'text-gray-500';

  return (
    <Card data-testid="friend-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={friend.avatarUrl ?? undefined} />
            <AvatarFallback>
              {friend.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{friend.displayName}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Lv.{friend.level}</span>
              <span>·</span>
              <span className={tierColor}>{friend.tier}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {friend.totalXp.toLocaleString()} XP
            </div>
          </div>

          {/* 삭제 버튼 */}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(friend.friendshipId)}
              disabled={isRemoving}
              aria-label="친구 삭제"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
