'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FriendActivityCard } from './FriendActivityCard';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { type Activity } from '@/lib/social/activity';

interface ActivityFeedProps {
  /** 초기 활동 목록 */
  initialActivities?: Activity[];
  /** 다음 페이지 로드 함수 */
  onLoadMore?: () => Promise<Activity[]>;
  /** 새로고침 함수 */
  onRefresh?: () => Promise<Activity[]>;
  /** 좋아요 핸들러 */
  onLike?: (activityId: string) => void;
  /** 댓글 핸들러 */
  onComment?: (activityId: string) => void;
  /** 공유 핸들러 */
  onShare?: (activityId: string) => void;
  /** 더 불러올 데이터 있는지 */
  hasMore?: boolean;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 새로고침 중 상태 */
  isRefreshing?: boolean;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * 친구 활동 피드 컴포넌트
 * - 무한 스크롤 지원
 * - Pull-to-refresh 지원
 * - 좋아요/댓글/공유 기능
 */
export function ActivityFeed({
  initialActivities = [],
  onLoadMore,
  onRefresh,
  onLike,
  onComment,
  onShare,
  hasMore = false,
  isLoading = false,
  isRefreshing = false,
  emptyMessage = '아직 친구들의 활동이 없어요',
  className,
  'data-testid': testId,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // 초기 데이터 동기화
  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  // 무한 스크롤 설정
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, isLoading, onLoadMore]);

  // 더 불러오기
  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const newActivities = await onLoadMore();
      setActivities((prev) => [...prev, ...newActivities]);
    } catch (error) {
      console.error('[ActivityFeed] Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    try {
      const refreshedActivities = await onRefresh();
      setActivities(refreshedActivities);
    } catch (error) {
      console.error('[ActivityFeed] Refresh failed:', error);
    }
  }, [onRefresh, isRefreshing]);

  // 좋아요 토글
  const handleLike = useCallback(
    (activityId: string) => {
      // 낙관적 업데이트
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                isLiked: !activity.isLiked,
                likesCount: activity.isLiked
                  ? activity.likesCount - 1
                  : activity.likesCount + 1,
              }
            : activity
        )
      );

      onLike?.(activityId);
    },
    [onLike]
  );

  // 빈 상태
  if (!isLoading && activities.length === 0) {
    return (
      <div
        className={cn('flex flex-col items-center py-8', className)}
        data-testid={testId || 'activity-feed'}
      >
        <EmptyStateCard
          preset="friends"
          title="친구 활동이 없어요"
          description={emptyMessage}
          data-testid="activity-feed-empty"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-testid={testId || 'activity-feed'}
    >
      {/* 새로고침 버튼 */}
      {onRefresh && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-button"
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
            />
            {isRefreshing ? '새로고침 중...' : '새로고침'}
          </Button>
        </div>
      )}

      {/* 초기 로딩 */}
      {isLoading && activities.length === 0 ? (
        <div
          className="flex justify-center py-8"
          data-testid="activity-feed-loading"
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* 활동 목록 */}
          {activities.map((activity) => (
            <FriendActivityCard
              key={activity.id}
              activity={activity}
              onLike={handleLike}
              onComment={onComment}
              onShare={onShare}
            />
          ))}

          {/* 무한 스크롤 트리거 */}
          {hasMore && (
            <div
              ref={loadMoreTriggerRef}
              className="flex justify-center py-4"
              data-testid="load-more-trigger"
            >
              {loadingMore ? (
                <Loader2
                  className="h-6 w-6 animate-spin text-muted-foreground"
                  data-testid="loading-more-spinner"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  data-testid="load-more-button"
                >
                  더 보기
                </Button>
              )}
            </div>
          )}

          {/* 끝 표시 */}
          {!hasMore && activities.length > 0 && (
            <p
              className="text-center text-sm text-muted-foreground py-4"
              data-testid="end-of-feed"
            >
              모든 활동을 확인했어요
            </p>
          )}
        </>
      )}
    </div>
  );
}
