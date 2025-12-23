/**
 * ChallengeCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChallengeCard } from '@/components/challenges';
import type { Challenge, UserChallenge } from '@/types/challenges';

// Mock 챌린지 데이터
const mockChallenge: Challenge = {
  id: 'challenge-1',
  code: 'workout_streak_7',
  name: '7일 연속 운동',
  description: '7일 연속으로 운동하세요',
  icon: '🔥',
  domain: 'workout',
  durationDays: 7,
  target: { type: 'streak', days: 7 },
  rewardXp: 50,
  rewardBadgeId: null,
  difficulty: 'easy',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
};

// Mock 사용자 챌린지 (진행 중)
const mockUserChallengeInProgress: UserChallenge = {
  id: 'user-challenge-1',
  clerkUserId: 'user_123',
  challengeId: 'challenge-1',
  status: 'in_progress',
  startedAt: new Date(),
  targetEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  completedAt: null,
  progress: { currentDays: 3, totalDays: 7 },
  rewardClaimed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock 사용자 챌린지 (완료)
const mockUserChallengeCompleted: UserChallenge = {
  ...mockUserChallengeInProgress,
  status: 'completed',
  completedAt: new Date(),
  progress: { currentDays: 7, totalDays: 7 },
  rewardClaimed: false,
};

describe('ChallengeCard', () => {
  describe('기본 렌더링', () => {
    it('챌린지 정보를 올바르게 표시한다', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
      expect(screen.getByText('7일 연속으로 운동하세요')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('난이도를 표시한다', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText('쉬움')).toBeInTheDocument();
    });

    it('기간을 표시한다', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      // 기간 배지 확인 (정확히 "7일" 텍스트를 가진 span)
      const durationBadges = screen.getAllByText(/7일/);
      expect(durationBadges.length).toBeGreaterThan(0);
    });

    it('보상 XP를 표시한다', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText(/50\s*XP/)).toBeInTheDocument();
    });

    it('data-testid가 올바르다', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
    });
  });

  describe('참여하지 않은 상태', () => {
    it('참여 버튼을 표시한다', () => {
      render(<ChallengeCard challenge={mockChallenge} onJoin={() => {}} />);

      expect(screen.getByRole('button', { name: /참여/i })).toBeInTheDocument();
    });

    it('참여 버튼 클릭 시 onJoin 호출', () => {
      const onJoin = vi.fn();
      render(<ChallengeCard challenge={mockChallenge} onJoin={onJoin} />);

      fireEvent.click(screen.getByRole('button', { name: /참여/i }));

      expect(onJoin).toHaveBeenCalledTimes(1);
    });

    it('로딩 중일 때 버튼 비활성화', () => {
      render(<ChallengeCard challenge={mockChallenge} onJoin={() => {}} loading />);

      const button = screen.getByRole('button', { name: /참여/i });
      expect(button).toBeDisabled();
    });
  });

  describe('진행 중인 상태', () => {
    it('진행 상태를 표시한다', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeInProgress}
        />
      );

      expect(screen.getByText('진행 중')).toBeInTheDocument();
    });

    it('진행률을 표시한다', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeInProgress}
        />
      );

      // 3/7 = 43%
      expect(screen.getByText(/43%/)).toBeInTheDocument();
    });

    it('프로그레스 바가 존재한다', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeInProgress}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('상세보기 버튼 클릭 시 onView 호출', () => {
      const onView = vi.fn();
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeInProgress}
          onView={onView}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /상세/i }));

      expect(onView).toHaveBeenCalledTimes(1);
    });
  });

  describe('완료 상태', () => {
    it('완료 상태를 표시한다', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeCompleted}
        />
      );

      expect(screen.getByText('완료')).toBeInTheDocument();
    });

    it('100% 진행률을 표시한다', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeCompleted}
        />
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('보상 받기 버튼이 표시된다 (미수령 시)', () => {
      render(
        <ChallengeCard
          challenge={mockChallenge}
          userChallenge={mockUserChallengeCompleted}
        />
      );

      expect(screen.getByRole('button', { name: /보상/i })).toBeInTheDocument();
    });
  });

  describe('난이도별 스타일', () => {
    it('easy 난이도 스타일', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, difficulty: 'easy' }} />);

      expect(screen.getByText('쉬움')).toBeInTheDocument();
    });

    it('medium 난이도 스타일', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, difficulty: 'medium' }} />);

      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('hard 난이도 스타일', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, difficulty: 'hard' }} />);

      expect(screen.getByText('어려움')).toBeInTheDocument();
    });
  });

  describe('도메인별 스타일', () => {
    it('workout 도메인', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, domain: 'workout' }} />);

      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
    });

    it('nutrition 도메인', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, domain: 'nutrition' }} />);

      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
    });

    it('combined 도메인', () => {
      render(<ChallengeCard challenge={{ ...mockChallenge, domain: 'combined' }} />);

      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
    });
  });
});
