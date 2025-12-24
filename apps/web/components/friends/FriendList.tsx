'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FriendCard } from './FriendCard';
import type { Friend } from '@/types/friends';
import { Users } from 'lucide-react';

interface FriendListProps {
  friends: Friend[];
  onRemoveFriend?: (friendshipId: string) => void;
  isLoading?: boolean;
  removingId?: string | null;
}

export function FriendList({
  friends,
  onRemoveFriend,
  isLoading = false,
  removingId = null,
}: FriendListProps) {
  if (isLoading) {
    return (
      <Card data-testid="friend-list-loading">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>친구 목록</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card data-testid="friend-list-empty">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>친구 목록</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>아직 친구가 없습니다.</p>
            <p className="text-sm mt-1">친구를 추가해보세요!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="friend-list">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>친구 목록</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({friends.length}명)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {friends.map((friend) => (
            <FriendCard
              key={friend.friendshipId}
              friend={friend}
              onRemove={onRemoveFriend}
              isRemoving={removingId === friend.friendshipId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
