import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { type Activity } from '@/lib/social/activity';

// IntersectionObserver Mock
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  // IntersectionObserver Mock 설정
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    userId: 'user-1',
    userName: '김철수',
    userAvatar: null,
    type: 'workout_complete',
    title: '상체 운동 완료',
    description: '오늘도 열심히 운동했어요!',
    metadata: { duration: 45 },
    likesCount: 5,
    isLiked: false,
    commentsCount: 2,
    createdAt: new Date('2025-12-24T10:00:00Z'),
  },
  {
    id: 'activity-2',
    userId: 'user-2',
    userName: '이영희',
    userAvatar: null,
    type: 'streak_achieved',
    title: '7일 연속 달성',
    description: '일주일 연속 운동!',
    metadata: { streakDays: 7 },
    likesCount: 12,
    isLiked: true,
    commentsCount: 3,
    createdAt: new Date('2025-12-24T08:00:00Z'),
  },
];

describe('ActivityFeed', () => {
  describe('렌더링', () => {
    it('피드가 렌더링됨', () => {
      render(<ActivityFeed initialActivities={mockActivities} />);
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });

    it('모든 활동 카드 표시', () => {
      render(<ActivityFeed initialActivities={mockActivities} />);
      expect(screen.getByText('상체 운동 완료')).toBeInTheDocument();
      expect(screen.getByText('7일 연속 달성')).toBeInTheDocument();
    });

    it('커스텀 testId 적용', () => {
      render(
        <ActivityFeed
          initialActivities={mockActivities}
          data-testid="custom-feed"
        />
      );
      expect(screen.getByTestId('custom-feed')).toBeInTheDocument();
    });

    it('className 적용', () => {
      render(
        <ActivityFeed initialActivities={mockActivities} className="mt-4" />
      );
      const feed = screen.getByTestId('activity-feed');
      expect(feed).toHaveClass('mt-4');
    });
  });

  describe('빈 상태', () => {
    it('활동 없으면 빈 상태 표시', () => {
      render(<ActivityFeed initialActivities={[]} />);
      expect(screen.getByTestId('activity-feed-empty')).toBeInTheDocument();
    });

    it('커스텀 빈 상태 메시지', () => {
      render(
        <ActivityFeed
          initialActivities={[]}
          emptyMessage="친구를 추가하세요"
        />
      );
      expect(screen.getByText('친구를 추가하세요')).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('초기 로딩 시 스피너 표시', () => {
      render(<ActivityFeed initialActivities={[]} isLoading={true} />);
      expect(screen.getByTestId('activity-feed-loading')).toBeInTheDocument();
    });

    it('로딩 완료 후 활동 표시', () => {
      const { rerender } = render(
        <ActivityFeed initialActivities={[]} isLoading={true} />
      );

      rerender(
        <ActivityFeed initialActivities={mockActivities} isLoading={false} />
      );

      expect(screen.getByText('상체 운동 완료')).toBeInTheDocument();
    });
  });

  describe('새로고침', () => {
    it('새로고침 버튼 표시', () => {
      const onRefresh = vi.fn();
      render(
        <ActivityFeed
          initialActivities={mockActivities}
          onRefresh={onRefresh}
        />
      );
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    it('새로고침 중 상태 표시', () => {
      const onRefresh = vi.fn();
      render(
        <ActivityFeed
          initialActivities={mockActivities}
          onRefresh={onRefresh}
          isRefreshing={true}
        />
      );
      expect(screen.getByText('새로고침 중...')).toBeInTheDocument();
    });

    it('새로고침 버튼 클릭 시 핸들러 호출', async () => {
      const onRefresh = vi.fn().mockResolvedValue(mockActivities);
      render(
        <ActivityFeed
          initialActivities={mockActivities}
          onRefresh={onRefresh}
        />
      );

      fireEvent.click(screen.getByTestId('refresh-button'));

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('무한 스크롤', () => {
    it('hasMore일 때 더 보기 트리거 표시', () => {
      const onLoadMore = vi.fn();
      render(
        <ActivityFeed
          initialActivities={mockActivities}
          onLoadMore={onLoadMore}
          hasMore={true}
        />
      );
      expect(screen.getByTestId('load-more-trigger')).toBeInTheDocument();
    });

    it('더 보기 버튼 클릭', async () => {
      const newActivity: Activity = {
        id: 'activity-3',
        userId: 'user-3',
        userName: '박지민',
        userAvatar: null,
        type: 'badge_earned',
        title: '새 뱃지 획득',
        description: '뱃지 획득!',
        likesCount: 3,
        isLiked: false,
        commentsCount: 0,
        createdAt: new Date(),
      };

      const onLoadMore = vi.fn().mockResolvedValue([newActivity]);

      render(
        <ActivityFeed
          initialActivities={mockActivities}
          onLoadMore={onLoadMore}
          hasMore={true}
        />
      );

      fireEvent.click(screen.getByTestId('load-more-button'));

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('새 뱃지 획득')).toBeInTheDocument();
      });
    });

    it('hasMore false일 때 끝 표시', () => {
      render(
        <ActivityFeed initialActivities={mockActivities} hasMore={false} />
      );
      expect(screen.getByTestId('end-of-feed')).toBeInTheDocument();
      expect(screen.getByText('모든 활동을 확인했어요')).toBeInTheDocument();
    });
  });

  describe('좋아요 상호작용', () => {
    it('좋아요 클릭 시 낙관적 업데이트', async () => {
      const onLike = vi.fn();
      render(
        <ActivityFeed initialActivities={mockActivities} onLike={onLike} />
      );

      // activity-1의 좋아요 버튼 클릭
      const likeButtons = screen.getAllByTestId('like-button');
      fireEvent.click(likeButtons[0]);

      // 핸들러 호출 확인
      expect(onLike).toHaveBeenCalledWith('activity-1');

      // 좋아요 수 증가 확인 (5 -> 6)
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('이미 좋아요한 활동 클릭 시 취소', async () => {
      const onLike = vi.fn();
      render(
        <ActivityFeed initialActivities={mockActivities} onLike={onLike} />
      );

      // activity-2는 이미 좋아요함 (likesCount: 12, isLiked: true)
      const likeButtons = screen.getAllByTestId('like-button');
      fireEvent.click(likeButtons[1]);

      expect(onLike).toHaveBeenCalledWith('activity-2');

      // 좋아요 수 감소 확인 (12 -> 11)
      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });
  });

  describe('댓글/공유 상호작용', () => {
    it('댓글 클릭 시 핸들러 호출', () => {
      const onComment = vi.fn();
      render(
        <ActivityFeed initialActivities={mockActivities} onComment={onComment} />
      );

      const commentButtons = screen.getAllByTestId('comment-button');
      fireEvent.click(commentButtons[0]);

      expect(onComment).toHaveBeenCalledWith('activity-1');
    });

    it('공유 클릭 시 핸들러 호출', () => {
      const onShare = vi.fn();
      render(
        <ActivityFeed initialActivities={mockActivities} onShare={onShare} />
      );

      const shareButtons = screen.getAllByTestId('share-button');
      fireEvent.click(shareButtons[0]);

      expect(onShare).toHaveBeenCalledWith('activity-1');
    });
  });

  describe('onRefresh 없을 때', () => {
    it('새로고침 버튼 숨김', () => {
      render(<ActivityFeed initialActivities={mockActivities} />);
      expect(screen.queryByTestId('refresh-button')).not.toBeInTheDocument();
    });
  });
});
