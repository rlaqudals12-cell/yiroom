'use client';

import { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { type Activity } from '@/lib/social/activity';

// Mock 데이터 - 실제 구현 시 API에서 가져옴
const mockActivities: Activity[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김철수',
    userAvatar: null,
    type: 'workout_complete',
    title: '상체 운동 완료',
    description: '오늘도 열심히 운동했어요!',
    metadata: { duration: 45, caloriesBurned: 320 },
    likesCount: 5,
    isLiked: false,
    commentsCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
  },
  {
    id: '2',
    userId: 'user2',
    userName: '이영희',
    userAvatar: null,
    type: 'streak_achieved',
    title: '7일 연속 달성!',
    description: '일주일 연속으로 운동 기록을 달성했어요!',
    metadata: { streakDays: 7 },
    likesCount: 12,
    isLiked: true,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
  },
  {
    id: '3',
    userId: 'user3',
    userName: '박지민',
    userAvatar: null,
    type: 'challenge_complete',
    title: '30일 플랭크 챌린지 완료',
    description: '드디어 챌린지를 완료했습니다!',
    likesCount: 25,
    isLiked: false,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
  },
  {
    id: '4',
    userId: 'user4',
    userName: '최민준',
    userAvatar: null,
    type: 'level_up',
    title: '레벨 업!',
    description: '새로운 레벨에 도달했어요!',
    metadata: { newLevel: 15 },
    likesCount: 8,
    isLiked: false,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
  },
];

/**
 * 친구 활동 피드 페이지
 */
export default function FeedPage() {
  const [activities] = useState<Activity[]>(mockActivities);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // 더 불러오기 (실제 구현 시 API 호출)
  const handleLoadMore = useCallback(async (): Promise<Activity[]> => {
    // 시뮬레이션: 2초 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock: 3페이지까지만
    if (page >= 3) {
      setHasMore(false);
      return [];
    }

    const newActivities: Activity[] = [
      {
        id: `more-${page}-1`,
        userId: `user${page + 4}`,
        userName: `친구 ${page + 4}`,
        userAvatar: null,
        type: 'badge_earned',
        title: '새 뱃지 획득',
        description: '첫 운동 기록 뱃지를 획득했어요!',
        likesCount: 3,
        isLiked: false,
        commentsCount: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (page + 1)),
      },
    ];

    setPage((p) => p + 1);
    return newActivities;
  }, [page]);

  // 새로고침
  const handleRefresh = useCallback(async (): Promise<Activity[]> => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    setPage(1);
    setHasMore(true);
    return mockActivities;
  }, []);

  // 좋아요
  const handleLike = useCallback((activityId: string) => {
    console.log('[FeedPage] Like:', activityId);
    // 실제 구현 시 API 호출
  }, []);

  // 댓글
  const handleComment = useCallback((activityId: string) => {
    console.log('[FeedPage] Comment:', activityId);
    // 실제 구현 시 댓글 시트 열기
  }, []);

  // 공유
  const handleShare = useCallback((activityId: string) => {
    console.log('[FeedPage] Share:', activityId);
    // 실제 구현 시 공유 시트 열기
  }, []);

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
        onComment={handleComment}
        onShare={handleShare}
        hasMore={hasMore}
        isRefreshing={isRefreshing}
        emptyMessage="친구를 추가하면 활동을 볼 수 있어요"
      />
    </div>
  );
}
