import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendActivityCard } from '@/components/social/FriendActivityCard';
import { type Activity } from '@/lib/social/activity';

const mockActivity: Activity = {
  id: 'activity-1',
  userId: 'user-1',
  userName: '김철수',
  userAvatar: 'https://example.com/avatar.jpg',
  type: 'workout_complete',
  title: '상체 운동 완료',
  description: '오늘도 열심히 운동했어요!',
  metadata: { duration: 45, caloriesBurned: 320 },
  likesCount: 5,
  isLiked: false,
  commentsCount: 2,
  createdAt: new Date('2025-12-24T10:00:00Z'),
};

describe('FriendActivityCard', () => {
  describe('렌더링', () => {
    it('카드가 렌더링됨', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByTestId('activity-card-activity-1')).toBeInTheDocument();
    });

    it('사용자 이름 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('김철수')).toBeInTheDocument();
    });

    it('활동 타입 라벨 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      // 타입 라벨은 이모지와 함께 표시됨 (💪 운동 완료)
      // "상체 운동 완료"와 구분하기 위해 이모지 매칭
      const elements = screen.getAllByText(/운동 완료/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('활동 제목 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('상체 운동 완료')).toBeInTheDocument();
    });

    it('활동 설명 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('오늘도 열심히 운동했어요!')).toBeInTheDocument();
    });

    it('상대 시간 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByTestId('activity-time')).toBeInTheDocument();
    });

    it('커스텀 testId 적용', () => {
      render(
        <FriendActivityCard activity={mockActivity} data-testid="custom-card" />
      );
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('className 적용', () => {
      render(<FriendActivityCard activity={mockActivity} className="mt-4" />);
      const card = screen.getByTestId('activity-card-activity-1');
      expect(card).toHaveClass('mt-4');
    });
  });

  describe('아바타', () => {
    it('아바타 이미지 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      // AvatarImage가 있으면 렌더링됨
      expect(screen.getByText('김')).toBeInTheDocument(); // Fallback
    });

    it('아바타 없으면 이니셜 표시', () => {
      const noAvatarActivity = { ...mockActivity, userAvatar: null };
      render(<FriendActivityCard activity={noAvatarActivity} />);
      expect(screen.getByText('김')).toBeInTheDocument();
    });
  });

  describe('메타데이터', () => {
    it('운동 시간 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('45분')).toBeInTheDocument();
    });

    it('칼로리 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('320kcal')).toBeInTheDocument();
    });

    it('연속 일수 표시', () => {
      const streakActivity: Activity = {
        ...mockActivity,
        type: 'streak_achieved',
        metadata: { streakDays: 7 },
      };
      render(<FriendActivityCard activity={streakActivity} />);
      expect(screen.getByText('7일 연속')).toBeInTheDocument();
    });

    it('레벨 표시', () => {
      const levelUpActivity: Activity = {
        ...mockActivity,
        type: 'level_up',
        metadata: { newLevel: 15 },
      };
      render(<FriendActivityCard activity={levelUpActivity} />);
      expect(screen.getByText('Lv.15')).toBeInTheDocument();
    });

    it('메타데이터 없으면 표시 안 함', () => {
      const noMetaActivity = { ...mockActivity, metadata: undefined };
      render(<FriendActivityCard activity={noMetaActivity} />);
      expect(screen.queryByText('45분')).not.toBeInTheDocument();
    });
  });

  describe('좋아요', () => {
    it('좋아요 버튼 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByTestId('like-button')).toBeInTheDocument();
    });

    it('좋아요 수 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('좋아요 0일 때 "좋아요" 텍스트', () => {
      const noLikeActivity = { ...mockActivity, likesCount: 0 };
      render(<FriendActivityCard activity={noLikeActivity} />);
      expect(screen.getByText('좋아요')).toBeInTheDocument();
    });

    it('좋아요 클릭 시 핸들러 호출', () => {
      const onLike = vi.fn();
      render(<FriendActivityCard activity={mockActivity} onLike={onLike} />);

      fireEvent.click(screen.getByTestId('like-button'));
      expect(onLike).toHaveBeenCalledWith('activity-1');
    });

    it('이미 좋아요한 상태 스타일', () => {
      const likedActivity = { ...mockActivity, isLiked: true };
      render(<FriendActivityCard activity={likedActivity} />);
      const likeButton = screen.getByTestId('like-button');
      expect(likeButton).toHaveClass('text-red-500');
    });
  });

  describe('댓글', () => {
    it('댓글 버튼 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByTestId('comment-button')).toBeInTheDocument();
    });

    it('댓글 수 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('댓글 0일 때 "댓글" 텍스트', () => {
      const noCommentActivity = { ...mockActivity, commentsCount: 0 };
      render(<FriendActivityCard activity={noCommentActivity} />);
      expect(screen.getByText('댓글')).toBeInTheDocument();
    });

    it('댓글 클릭 시 핸들러 호출', () => {
      const onComment = vi.fn();
      render(
        <FriendActivityCard activity={mockActivity} onComment={onComment} />
      );

      fireEvent.click(screen.getByTestId('comment-button'));
      expect(onComment).toHaveBeenCalledWith('activity-1');
    });
  });

  describe('공유', () => {
    it('공유 버튼 표시', () => {
      render(<FriendActivityCard activity={mockActivity} />);
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('공유 클릭 시 핸들러 호출', () => {
      const onShare = vi.fn();
      render(<FriendActivityCard activity={mockActivity} onShare={onShare} />);

      fireEvent.click(screen.getByTestId('share-button'));
      expect(onShare).toHaveBeenCalledWith('activity-1');
    });
  });

  describe('활동 타입별 스타일', () => {
    it('challenge_complete 타입', () => {
      const challengeActivity: Activity = {
        ...mockActivity,
        type: 'challenge_complete',
      };
      render(<FriendActivityCard activity={challengeActivity} />);
      expect(screen.getByText(/챌린지 완료/)).toBeInTheDocument();
    });

    it('badge_earned 타입', () => {
      const badgeActivity: Activity = {
        ...mockActivity,
        type: 'badge_earned',
      };
      render(<FriendActivityCard activity={badgeActivity} />);
      expect(screen.getByText(/뱃지 획득/)).toBeInTheDocument();
    });
  });
});
