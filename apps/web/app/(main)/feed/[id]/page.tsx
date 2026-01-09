'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedPostWithAuthor, FeedCommentWithAuthor, PostType } from '@/lib/feed/types';

/**
 * 피드 포스트 상세 페이지
 * - 포스트 내용 표시
 * - 댓글 목록 및 작성
 * - 좋아요, 저장, 공유
 */

// 포스트 타입별 색상
const postTypeColors: Record<PostType, string> = {
  general: 'bg-gray-100 text-gray-600',
  review: 'bg-pink-100 text-pink-600',
  question: 'bg-blue-100 text-blue-600',
  tip: 'bg-green-100 text-green-600',
};

const postTypeLabels: Record<PostType, string> = {
  general: '일반',
  review: '리뷰',
  question: '질문',
  tip: '팁',
};

// 상대 시간 포맷
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

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { userId, isSignedIn } = useAuth();

  const [post, setPost] = useState<FeedPostWithAuthor | null>(null);
  const [comments, setComments] = useState<FeedCommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // 포스트 및 댓글 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 포스트 조회
        const postRes = await fetch(`/api/feed/${postId}`);
        const postData = await postRes.json();

        if (postData.success) {
          setPost(postData.post);
        }

        // 댓글 조회
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchData();
    }
  }, [postId]);

  // 좋아요 토글
  const handleLike = useCallback(async () => {
    if (!post) return;

    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                is_liked: data.liked,
                likes_count: data.liked ? prev.likes_count + 1 : prev.likes_count - 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [post, postId]);

  // 저장 토글
  const handleSave = useCallback(async () => {
    if (!post) return;

    try {
      const res = await fetch(`/api/feed/${postId}/save`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                is_saved: data.saved,
                saves_count: data.saved ? prev.saves_count + 1 : prev.saves_count - 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  }, [post, postId]);

  // 공유
  const handleShare = useCallback(() => {
    if (!post) return;

    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: `${post.author.name}님의 글`,
          text: post.content,
          url: window.location.href,
        })
        .catch(() => {});
    }
  }, [post]);

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !isSignedIn) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          parent_id: replyTo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 댓글 목록 새로고침
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }

        // 포스트의 댓글 수 업데이트
        setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));

        setCommentText('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        // 댓글 목록 새로고침
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }

        // 포스트의 댓글 수 업데이트
        setPost((prev) =>
          prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null
        );
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // 포스트 삭제
  const handleDeletePost = async () => {
    if (!confirm('정말 삭제하시겠어요?')) return;

    try {
      const res = await fetch(`/api/feed/${postId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        router.push('/feed');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-lg font-medium text-foreground mb-2">글을 찾을 수 없어요</p>
        <button onClick={() => router.push('/feed')} className="text-primary hover:underline">
          피드로 돌아가기
        </button>
      </div>
    );
  }

  const isOwner = post.clerk_user_id === userId;

  return (
    <div className="min-h-screen bg-background" data-testid="feed-detail-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">게시글</h1>
          </div>
          {isOwner && (
            <button
              onClick={handleDeletePost}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="px-4 py-4 pb-32">
        {/* 포스트 */}
        <article className="bg-card rounded-2xl border p-4 mb-6">
          {/* 사용자 정보 */}
          <div className="flex items-center gap-3 mb-3">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                {post.author.name[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                postTypeColors[post.post_type]
              )}
            >
              {postTypeLabels[post.post_type]}
            </span>
          </div>

          {/* 콘텐츠 */}
          <div className="mb-4">
            <p className="text-foreground whitespace-pre-wrap text-base">{post.content}</p>

            {/* 해시태그 */}
            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-sm text-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 미디어 이미지 */}
          {post.media_urls.length > 0 && (
            <div className="mb-4 grid gap-2 grid-cols-2">
              {post.media_urls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* 인터랙션 */}
          <div className="flex items-center gap-4 pt-3 border-t">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Heart className={cn('w-5 h-5', post.is_liked && 'fill-current')} />
              {post.likes_count}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              {post.comments_count}
            </span>
            <button
              onClick={handleSave}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                post.is_saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Bookmark className={cn('w-5 h-5', post.is_saved && 'fill-current')} />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-auto"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </article>

        {/* 댓글 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">댓글 {post.comments_count}개</h2>

          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  {/* 댓글 */}
                  <div className="flex gap-3">
                    {comment.author.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {comment.author.name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-foreground">{comment.author.name}</p>
                        <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(comment.created_at)}</span>
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="hover:text-foreground"
                        >
                          답글
                        </button>
                        {comment.clerk_user_id === userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="hover:text-destructive"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 대댓글 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          {reply.author.avatar_url ? (
                            <img
                              src={reply.author.avatar_url}
                              alt={reply.author.name}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {reply.author.name[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg px-3 py-2">
                              <p className="text-sm font-medium text-foreground">
                                {reply.author.name}
                              </p>
                              <p className="text-sm text-foreground mt-0.5">{reply.content}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{formatRelativeTime(reply.created_at)}</span>
                              {reply.clerk_user_id === userId && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="hover:text-destructive"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 댓글 입력 */}
      {isSignedIn && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>답글 작성 중...</span>
              <button onClick={() => setReplyTo(null)} className="hover:text-foreground">
                취소
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
              className="flex-1 px-4 py-2 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                commentText.trim() && !isSubmitting
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
