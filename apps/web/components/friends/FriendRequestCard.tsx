'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { FriendRequest } from '@/types/friends';
import { Check, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  isProcessing?: boolean;
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
  isProcessing = false,
}: FriendRequestCardProps) {
  const timeAgo = formatDistanceToNow(request.createdAt, {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card data-testid="friend-request-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.requesterAvatar ?? undefined} />
            <AvatarFallback>
              {request.requesterName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{request.requesterName}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Lv.{request.requesterLevel}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* 수락/거절 버튼 */}
          <div className="flex gap-2">
            {onAccept && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAccept(request.id)}
                disabled={isProcessing}
                aria-label="친구 요청 수락"
              >
                <Check className="h-4 w-4 mr-1" />
                수락
              </Button>
            )}
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(request.id)}
                disabled={isProcessing}
                aria-label="친구 요청 거절"
              >
                <X className="h-4 w-4 mr-1" />
                거절
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
