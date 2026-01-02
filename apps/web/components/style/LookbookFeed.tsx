'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, User, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FilterChipGroup } from '@/components/common/FilterChip';
import { cn } from '@/lib/utils';
import type { LookbookPost } from '@/types/hybrid';

// 체형 필터 옵션
const BODY_TYPE_OPTIONS = [
  { value: 'S', label: '스트레이트' },
  { value: 'W', label: '웨이브' },
  { value: 'N', label: '내추럴' },
];

// 퍼스널컬러 필터 옵션
const COLOR_OPTIONS = [
  { value: 'Spring', label: '봄 웜톤' },
  { value: 'Summer', label: '여름 쿨톤' },
  { value: 'Autumn', label: '가을 웜톤' },
  { value: 'Winter', label: '겨울 쿨톤' },
];

export interface LookbookFeedProps {
  /** 포스트 목록 */
  posts: LookbookPost[];
  /** 더 불러오기 */
  hasMore?: boolean;
  /** 로딩 중 */
  isLoading?: boolean;
  /** 좋아요 핸들러 */
  onLike?: (postId: string) => void;
  /** 공유 핸들러 */
  onShare?: (postId: string) => void;
  /** 포스트 클릭 핸들러 */
  onPostClick?: (postId: string) => void;
  /** 더 불러오기 핸들러 */
  onLoadMore?: () => void;
  /** 필터 표시 */
  showFilters?: boolean;
  /** 추가 className */
  className?: string;
}

interface LookbookPostUser {
  name: string;
  avatar?: string;
}

// Mock 사용자 데이터 (실제로는 API에서 가져옴)
const getMockUser = (userId: string): LookbookPostUser => ({
  name: `User ${userId.slice(0, 4)}`,
  avatar: undefined,
});

/**
 * 룩북 피드 (Style 도메인)
 * - 갤러리 형식
 * - 체형/컬러 필터
 * - 좋아요/공유
 */
export function LookbookFeed({
  posts,
  hasMore = false,
  isLoading = false,
  onLike,
  onShare,
  onPostClick,
  onLoadMore,
  showFilters = true,
  className,
}: LookbookFeedProps) {
  const [bodyTypeFilter, setBodyTypeFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 필터링된 포스트
  const filteredPosts = posts.filter((post) => {
    if (bodyTypeFilter.length > 0 && post.bodyType && !bodyTypeFilter.includes(post.bodyType)) {
      return false;
    }
    if (colorFilter.length > 0 && post.personalColor && !colorFilter.includes(post.personalColor)) {
      return false;
    }
    return true;
  });

  const activeFilterCount = bodyTypeFilter.length + colorFilter.length;

  return (
    <div className={cn('space-y-4', className)} data-testid="lookbook-feed">
      {/* 필터 버튼 */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* 필터 패널 */}
      {showFilters && showFilterPanel && (
        <Card className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">체형</p>
            <FilterChipGroup
              options={BODY_TYPE_OPTIONS}
              selected={bodyTypeFilter}
              onChange={setBodyTypeFilter}
              variant="style"
              size="sm"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">퍼스널컬러</p>
            <FilterChipGroup
              options={COLOR_OPTIONS}
              selected={colorFilter}
              onChange={setColorFilter}
              variant="style"
              size="sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBodyTypeFilter([]);
                setColorFilter([]);
              }}
            >
              초기화
            </Button>
            <Button size="sm" onClick={() => setShowFilterPanel(false)}>
              적용
            </Button>
          </div>
        </Card>
      )}

      {/* 피드 그리드 */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredPosts.map((post) => (
            <LookbookPostCard
              key={post.id}
              post={post}
              user={getMockUser(post.clerkUserId)}
              onLike={onLike}
              onShare={onShare}
              onClick={onPostClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>룩북이 없습니다</p>
          <p className="text-sm mt-1">첫 번째 룩북을 공유해보세요!</p>
        </div>
      )}

      {/* 더 불러오기 */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  );
}

// 개별 포스트 카드
interface LookbookPostCardProps {
  post: LookbookPost;
  user: LookbookPostUser;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onClick?: (postId: string) => void;
}

function LookbookPostCard({ post, user, onLike, onShare, onClick }: LookbookPostCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(post.id);
  };

  return (
    <Card className="overflow-hidden cursor-pointer group" onClick={() => onClick?.(post.id)}>
      {/* 이미지 */}
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={post.imageUrl}
          alt={post.caption || '룩북'}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* 오버레이 정보 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* 태그 */}
            <div className="flex gap-1 mb-2">
              {post.bodyType && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                  {post.bodyType}
                </Badge>
              )}
              {post.personalColor && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                  {post.personalColor}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 좋아요/공유 버튼 (항상 표시) */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={handleLike}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <Heart
              className={cn('h-4 w-4', isLiked ? 'fill-red-500 text-red-500' : 'text-white')}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <CardContent className="p-3">
        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback>
                <User className="h-3 w-3" aria-hidden="true" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{user.name}</span>
        </div>

        {/* 캡션 */}
        {post.caption && <p className="text-sm line-clamp-2 mb-2">{post.caption}</p>}

        {/* 상호작용 */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" aria-hidden="true" />
            {post.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {post.commentsCount}
          </span>
          <button
            onClick={handleShare}
            className="ml-auto hover:text-foreground"
            aria-label="공유하기"
          >
            <Share2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LookbookFeed;
