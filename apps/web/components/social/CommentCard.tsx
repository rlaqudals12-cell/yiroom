'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/social/activity';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

interface CommentCardProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
}

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const initials = comment.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-2 group" data-testid={`comment-${comment.id}`}>
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={comment.userAvatar || undefined} alt={comment.userName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(comment.createdAt))}
            </span>
          </div>
          <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
      </div>

      {comment.isOwn && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => onDelete(comment.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
