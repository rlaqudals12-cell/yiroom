'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, Reply, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FeedCommentWithAuthor } from '@/lib/feed/types';

interface CommentSectionProps {
  postId: string;
  comments: FeedCommentWithAuthor[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  className?: string;
}

/**
 * 상대 시간 포맷
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

interface CommentItemProps {
  comment: FeedCommentWithAuthor;
  currentUserId?: string | null;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isReply?: boolean;
}

/**
 * 개별 댓글 아이템
 */
function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isOwnComment = comment.clerk_user_id === currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div
      className={cn('group', isReply && 'ml-10')}
      data-testid={isReply ? 'comment-reply' : 'comment-item'}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={comment.author.avatar_url || undefined} alt={comment.author.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-xs">
            {comment.author.name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* 댓글 헤더 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          {/* 댓글 내용 */}
          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* 댓글 액션 */}
          <div className="flex items-center gap-3 mt-2">
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                aria-label="답글 달기"
              >
                <Reply className="w-3.5 h-3.5" />
                답글
              </button>
            )}

            {isOwnComment && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="댓글 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            )}
          </div>

          {/* 대댓글 토글 */}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-2 transition-colors"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  답글 숨기기
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  답글 {comment.replies?.length}개 보기
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 대댓글 목록 */}
      {hasReplies && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 댓글 섹션 컴포넌트
 * - 댓글 목록 표시
 * - 댓글 작성 폼
 * - 대댓글 지원
 */
export function CommentSection({
  postId: _postId,
  comments,
  onAddComment,
  onDeleteComment,
  className,
}: CommentSectionProps) {
  const { userId, isSignedIn } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 답글 대상 댓글 찾기
  const replyToComment = replyTo
    ? comments.find((c) => c.id === replyTo) ||
      comments.flatMap((c) => c.replies || []).find((r) => r.id === replyTo)
    : null;

  // 댓글 제출
  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim(), replyTo || undefined);
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, replyTo, onAddComment, isSubmitting]);

  // 키보드 제출 (Ctrl+Enter 또는 Cmd+Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // 답글 취소
  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  return (
    <div className={cn('space-y-4', className)} data-testid="comment-section">
      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={userId}
              onReply={setReplyTo}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>

      {/* 댓글 작성 폼 */}
      {isSignedIn ? (
        <div className="border-t pt-4">
          {/* 답글 대상 표시 */}
          {replyToComment && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Reply className="w-4 h-4" />
              <span>
                <strong>{replyToComment.author.name}</strong>님에게 답글 작성 중
              </span>
              <button
                onClick={cancelReply}
                className="text-xs text-primary hover:underline ml-auto"
              >
                취소
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
              aria-label={replyTo ? '답글 입력' : '댓글 입력'}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              size="icon"
              className="shrink-0 self-end"
              aria-label="댓글 작성"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ctrl + Enter로 빠르게 작성할 수 있습니다
          </p>
        </div>
      ) : (
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground">댓글을 작성하려면 로그인해 주세요</p>
        </div>
      )}
    </div>
  );
}
