'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users } from 'lucide-react';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { type Activity } from '@/lib/social/activity';

/**
 * 친구 활동 피드 페이지
 */
export default function FeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // 초기 데이터 로드
  useEffect(() => {
    fetchActivities(1);
  }, []);

  // API에서 활동 조회
  const fetchActivities = async (pageNum: number, append = false) => {
    try {
      const response = await fetch(`/api/social/activities?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        const newActivities = (data.data || []).map((a: Activity & { createdAt: string }) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        }));

        if (append) {
          setActivities((prev) => [...prev, ...newActivities]);
        } else {
          setActivities(newActivities);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('[FeedPage] Fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 더 불러오기
  const handleLoadMore = useCallback(async (): Promise<Activity[]> => {
    const nextPage = page + 1;
    await fetchActivities(nextPage, true);
    return [];
  }, [page]);

  // 새로고침
  const handleRefresh = useCallback(async (): Promise<Activity[]> => {
    setIsRefreshing(true);
    await fetchActivities(1);
    return activities;
  }, [activities]);

  // 좋아요 토글
  const handleLike = useCallback(async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const method = activity.isLiked ? 'DELETE' : 'POST';

    try {
      await fetch(`/api/social/activities/${activityId}/like`, { method });
    } catch (error) {
      console.error('[FeedPage] Like error:', error);
    }
  }, [activities]);

  // 공유
  const handleShare = useCallback((activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity || typeof navigator.share !== 'function') return;

    navigator.share({
      title: activity.title,
      text: activity.description,
      url: window.location.href,
    }).catch(() => {
      // 공유 취소 또는 실패
    });
  }, [activities]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">친구 활동</h1>
      </div>

      {/* 피드 */}
      <ActivityFeed
        initialActivities={activities}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefresh}
        onLike={handleLike}
        onShare={handleShare}
        hasMore={hasMore}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        emptyMessage="친구를 추가하면 활동을 볼 수 있어요"
      />
    </div>
  );
}
