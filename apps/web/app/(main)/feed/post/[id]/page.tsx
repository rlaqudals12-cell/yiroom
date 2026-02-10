'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommentSection } from '@/components/feed';
import { cn } from '@/lib/utils';
import type { FeedPostWithAuthor, FeedCommentWithAuthor, PostType } from '@/lib/feed/types';

/**
 * 피드 포스트 상세 페이지
 * - 포스트 상세 정보
 * - 좋아요, 저장, 공유 인터랙션
 * - 댓글 섹션
 */

// 포스트 타입별 색상
const postTypeColors: Record<PostType, string> = {
  general: 'bg-gray-100 text-gray-600',
  review: 'bg-pink-100 text-pink-600',
  question: 'bg-blue-100 text-blue-600',
  tip: 'bg-green-100 text-green-600',
};

// 포스트 타입 라벨
const postTypeLabels: Record<PostType, string> = {
  general: '일반',
  review: '리뷰',
  question: '질문',
  tip: '팁',
};

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

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  useAuth();

  const [post, setPost] = useState<FeedPostWithAuthor | null>(null);
  const [comments, setComments] = useState<FeedCommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 포스트 및 댓글 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 포스트 조회
        const postRes = await fetch(`/api/feed/${postId}`);
        const postData = await postRes.json();

        if (!postData.success) {
          setError('포스트를 찾을 수 없습니다');
          return;
        }

        setPost(postData.post);

        // 댓글 조회
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError('데이터를 불러오는데 실패했습니다');
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
    } catch (err) {
      console.error('Failed to toggle like:', err);
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
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  }, [post, postId]);

  // 공유
  const handleShare = useCallback(() => {
    if (!post) return;

    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: `${post.author.name}님의 글`,
          text: post.content.slice(0, 100),
          url: window.location.href,
        })
        .catch(() => {});
    }
  }, [post]);

  // 댓글 추가
  const handleAddComment = useCallback(
    async (content: string, parentId?: string) => {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      const data = await res.json();

      if (data.success) {
        // 댓글 목록 다시 불러오기
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }

        // 댓글 수 업데이트
        setPost((prev) =>
          prev
            ? {
                ...prev,
                comments_count: prev.comments_count + 1,
              }
            : null
        );
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    },
    [postId]
  );

  // 댓글 삭제
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

      const res = await fetch(`/api/feed/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        // 댓글 목록 다시 불러오기
        const commentsRes = await fetch(`/api/feed/${postId}/comments`);
        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }

        // 댓글 수 업데이트
        setPost((prev) =>
          prev
            ? {
                ...prev,
                comments_count: Math.max(0, prev.comments_count - 1),
              }
            : null
        );
      } else {
        throw new Error(data.error || 'Failed to delete comment');
      }
    },
    [postId]
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="post-detail-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background" data-testid="post-detail-error">
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">포스트</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-foreground">
            {error || '포스트를 찾을 수 없습니다'}
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-4 text-primary hover:underline"
          >
            피드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const typeColor = postTypeColors[post.post_type];

  return (
    <div className="min-h-screen bg-background" data-testid="post-detail-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">포스트</h1>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4 pb-24">
        {/* 포스트 내용 */}
        <article className="bg-card rounded-2xl border p-4 mb-4">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-medium">
                {post.author.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
            </div>

            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeColor)}>
              {postTypeLabels[post.post_type]}
            </span>
          </div>

          {/* 콘텐츠 */}
          <div className="mb-4">
            <p className="text-foreground whitespace-pre-wrap text-base leading-relaxed">
              {post.content}
            </p>

            {/* 해시태그 */}
            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-sm text-primary font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 미디어 이미지 */}
          {post.media_urls.length > 0 && (
            <div
              className={cn(
                'mb-4 grid gap-2',
                post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              )}
            >
              {post.media_urls.map((url, i) => (
                <div
                  key={i}
                  className={cn(
                    'relative rounded-lg overflow-hidden bg-muted',
                    post.media_urls.length === 1 ? 'aspect-video' : 'aspect-square'
                  )}
                >
                  <img
                    src={url}
                    alt={`이미지 ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 인터랙션 */}
          <div className="flex items-center gap-6 pt-4 border-t">
            {/* 좋아요 */}
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={post.is_liked ? '좋아요 취소' : '좋아요'}
              aria-pressed={post.is_liked}
            >
              <Heart className={cn('w-5 h-5', post.is_liked && 'fill-current')} />
              <span>{post.likes_count}</span>
            </button>

            {/* 댓글 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count}</span>
            </div>

            {/* 저장 */}
            <button
              onClick={handleSave}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                post.is_saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={post.is_saved ? '저장 취소' : '저장'}
              aria-pressed={post.is_saved}
            >
              <Bookmark className={cn('w-5 h-5', post.is_saved && 'fill-current')} />
              <span>{post.saves_count}</span>
            </button>

            {/* 공유 */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
              aria-label="공유하기"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="bg-card rounded-2xl border p-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            댓글 {comments.length > 0 && <span className="text-primary">{comments.length}</span>}
          </h2>
          <CommentSection
            postId={postId}
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        </section>
      </div>
    </div>
  );
}
