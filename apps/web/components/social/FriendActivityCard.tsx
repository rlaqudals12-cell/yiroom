'use client';

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type Activity,
  getActivityConfig,
  formatRelativeTime,
} from '@/lib/social/activity';

interface FriendActivityCardProps {
  activity: Activity;
  onLike?: (activityId: string) => void;
  onComment?: (activityId: string) => void;
  onShare?: (activityId: string) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * 친구 활동 카드 컴포넌트
 * - 활동 타입별 아이콘/색상
 * - 상대 시간 표시
 * - 좋아요/댓글/공유 버튼
 */
export function FriendActivityCard({
  activity,
  onLike,
  onComment,
  onShare,
  className,
  'data-testid': testId,
}: FriendActivityCardProps) {
  const config = getActivityConfig(activity.type);
  const relativeTime = formatRelativeTime(activity.createdAt);
  const userInitial = activity.userName.charAt(0).toUpperCase();

  const handleLike = () => {
    onLike?.(activity.id);
  };

  const handleComment = () => {
    onComment?.(activity.id);
  };

  const handleShare = () => {
    onShare?.(activity.id);
  };

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-testid={testId || `activity-card-${activity.id}`}
    >
      <CardContent className="p-4">
        {/* 헤더: 사용자 정보 + 시간 */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            {activity.userAvatar && (
              <AvatarImage src={activity.userAvatar} alt={activity.userName} />
            )}
            <AvatarFallback className={cn(config.bgColor, config.color)}>
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {activity.userName}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  config.bgColor,
                  config.color
                )}
              >
                {config.icon} {config.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="activity-time">
              {relativeTime}
            </p>
          </div>
        </div>

        {/* 활동 내용 */}
        <div className="mb-3">
          <h3 className="font-semibold text-foreground mb-1">{activity.title}</h3>
          <p className="text-sm text-muted-foreground">{activity.description}</p>

          {/* 메타데이터 표시 */}
          {activity.metadata && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activity.metadata.duration && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {activity.metadata.duration}분
                </span>
              )}
              {activity.metadata.caloriesBurned && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {activity.metadata.caloriesBurned}kcal
                </span>
              )}
              {activity.metadata.streakDays && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {activity.metadata.streakDays}일 연속
                </span>
              )}
              {activity.metadata.newLevel && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  Lv.{activity.metadata.newLevel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 gap-1.5',
              activity.isLiked && 'text-red-500'
            )}
            onClick={handleLike}
            data-testid="like-button"
          >
            <Heart
              className={cn('h-4 w-4', activity.isLiked && 'fill-current')}
            />
            <span className="text-xs">
              {activity.likesCount > 0 ? activity.likesCount : '좋아요'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleComment}
            data-testid="comment-button"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">
              {activity.commentsCount > 0 ? activity.commentsCount : '댓글'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleShare}
            data-testid="share-button"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">공유</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
