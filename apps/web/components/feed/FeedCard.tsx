'use client';

import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { FeedPostWithAuthor, PostType } from '@/lib/feed/types';

interface FeedCardProps {
  post: FeedPostWithAuthor;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare?: (post: FeedPostWithAuthor) => void;
  onDelete?: (postId: string) => void;
  isOwnPost?: boolean;
  className?: string;
}

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
 * 1분 미만: 방금 전
 * 1시간 미만: N분 전
 * 24시간 미만: N시간 전
 * 7일 미만: N일 전
 * 그 외: 월 일
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

/**
 * 피드 카드 컴포넌트
 * - 작성자 아바타, 이름, 시간
 * - 포스트 타입 배지
 * - 콘텐츠 및 해시태그
 * - 미디어 이미지 그리드
 * - 좋아요, 댓글, 저장, 공유 인터랙션
 */
export function FeedCard({
  post,
  onLike,
  onSave,
  onShare,
  onDelete,
  isOwnPost = false,
  className,
}: FeedCardProps) {
  const router = useRouter();
  const typeColor = postTypeColors[post.post_type];

  // 포스트 상세로 이동
  const handleClickContent = () => {
    router.push(`/feed/post/${post.id}`);
  };

  // 공유 처리
  const handleShare = () => {
    if (onShare) {
      onShare(post);
    } else if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: `${post.author.name}님의 글`,
          text: post.content.slice(0, 100),
          url: `${window.location.origin}/feed/post/${post.id}`,
        })
        .catch(() => {});
    }
  };

  return (
    <article className={cn('bg-card rounded-2xl border p-4', className)} data-testid="feed-card">
      {/* 헤더: 사용자 정보 + 포스트 타입 */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-medium">
            {post.author.name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
        </div>

        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', typeColor)}>
          {postTypeLabels[post.post_type]}
        </span>

        {/* 더보기 메뉴 (본인 게시물인 경우) */}
        {isOwnPost && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">더보기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/feed/edit/${post.id}`)}>
                수정하기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                삭제하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 콘텐츠 */}
      <div
        className="mb-3 cursor-pointer"
        onClick={handleClickContent}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClickContent()}
      >
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* 해시태그 */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
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
        <div
          className={cn(
            'mb-3 grid gap-2',
            post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}
        >
          {post.media_urls.slice(0, 4).map((url, i) => (
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
              {/* 4장 초과 시 오버레이 */}
              {i === 3 && post.media_urls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    +{post.media_urls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 인터랙션 버튼 */}
      <div className="flex items-center gap-4 pt-2 border-t">
        {/* 좋아요 */}
        <button
          onClick={() => onLike(post.id)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={post.is_liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={post.is_liked}
        >
          <Heart className={cn('w-5 h-5', post.is_liked && 'fill-current')} />
          <span>{post.likes_count}</span>
        </button>

        {/* 댓글 */}
        <button
          onClick={handleClickContent}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="댓글 보기"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments_count}</span>
        </button>

        {/* 저장 */}
        <button
          onClick={() => onSave(post.id)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            post.is_saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={post.is_saved ? '저장 취소' : '저장'}
          aria-pressed={post.is_saved}
        >
          <Bookmark className={cn('w-5 h-5', post.is_saved && 'fill-current')} />
        </button>

        {/* 공유 */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="공유하기"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
