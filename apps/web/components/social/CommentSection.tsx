'use client';

import { useState, useCallback } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommentCard, type Comment } from './CommentCard';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  activityId: string;
  initialComments?: Comment[];
  commentsCount: number;
  className?: string;
}

export function CommentSection({
  activityId,
  initialComments = [],
  commentsCount,
  className,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetched, setIsFetched] = useState(initialComments.length > 0);

  // 댓글 목록 조회
  const fetchComments = useCallback(async () => {
    if (isFetched) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/activities/${activityId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
        setIsFetched(true);
      }
    } catch (error) {
      console.error('[CommentSection] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activityId, isFetched]);

  // 댓글 추가
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/social/activities/${activityId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          setComments((prev) => [...prev, data.data]);
          setInput('');
        }
      } catch (error) {
        console.error('[CommentSection] Submit error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activityId, input, isLoading]
  );

  // 댓글 삭제
  const handleDelete = useCallback(
    async (commentId: string) => {
      try {
        const response = await fetch(
          `/api/social/activities/${activityId}/comments?commentId=${commentId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        }
      } catch (error) {
        console.error('[CommentSection] Delete error:', error);
      }
    },
    [activityId]
  );

  // 확장 토글
  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      fetchComments();
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded, fetchComments]);

  const displayCount = commentsCount + (comments.length - initialComments.length);

  return (
    <div className={cn('border-t', className)} data-testid="comment-section">
      {/* 댓글 버튼 */}
      <button
        onClick={handleExpand}
        className="flex items-center gap-2 w-full p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        {displayCount > 0 ? (
          <span>
            댓글 {displayCount}개 {isExpanded ? '숨기기' : '보기'}
          </span>
        ) : (
          <span>댓글 남기기</span>
        )}
      </button>

      {/* 댓글 목록 */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {isLoading && comments.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {comments.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  첫 댓글을 남겨보세요!
                </p>
              )}
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

          {/* 댓글 입력 */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="댓글을 입력하세요..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
