/**
 * ChallengeProgress 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChallengeProgress } from '@/components/challenges';
import type { ChallengeProgress as ChallengeProgressType } from '@/types/challenges';

describe('ChallengeProgress', () => {
  describe('기본 렌더링', () => {
    it('프로그레스 바를 렌더링한다', () => {
      const progress: ChallengeProgressType = { currentDays: 3, totalDays: 7 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('진행률 텍스트를 표시한다', () => {
      const progress: ChallengeProgressType = { currentDays: 3, totalDays: 7 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      expect(screen.getByText(/43%/)).toBeInTheDocument();
    });

    it('data-testid가 올바르다', () => {
      const progress: ChallengeProgressType = { currentDays: 0 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      expect(screen.getByTestId('challenge-progress')).toBeInTheDocument();
    });
  });

  describe('일별 인디케이터', () => {
    it('기본값으로 인디케이터를 표시한다 (showDayIndicators 기본값 true)', () => {
      const progress: ChallengeProgressType = {
        currentDays: 3,
        totalDays: 7,
        completedDays: [1, 2, 3],
      };

      render(
        <ChallengeProgress
          progress={progress}
          durationDays={7}
        />
      );

      expect(screen.getByTestId('day-indicators')).toBeInTheDocument();
    });

    it('완료된 날은 체크 표시', () => {
      const progress: ChallengeProgressType = {
        currentDays: 3,
        totalDays: 7,
        completedDays: [1, 2, 3],
      };

      render(
        <ChallengeProgress
          progress={progress}
          durationDays={7}
          showDayIndicators
        />
      );

      // 완료된 날 수와 일치하는 체크 아이콘 확인
      const completedIndicators = screen.getAllByTestId(/day-indicator-completed/);
      expect(completedIndicators.length).toBe(3);
    });

    it('실패한 날은 X 표시', () => {
      const progress: ChallengeProgressType = {
        currentDays: 2,
        totalDays: 7,
        completedDays: [1, 2],
        missedDays: [3],
      };

      render(
        <ChallengeProgress
          progress={progress}
          durationDays={7}
          showDayIndicators
        />
      );

      const missedIndicators = screen.getAllByTestId(/day-indicator-missed/);
      expect(missedIndicators.length).toBe(1);
    });

    it('대기 중인 날은 원형 표시', () => {
      const progress: ChallengeProgressType = {
        currentDays: 3,
        totalDays: 7,
        completedDays: [1, 2, 3],
      };

      render(
        <ChallengeProgress
          progress={progress}
          durationDays={7}
          showDayIndicators
        />
      );

      // 7일 중 3일 완료, 4일 남음
      const pendingIndicators = screen.getAllByTestId(/day-indicator-(pending|future)/);
      expect(pendingIndicators.length).toBe(4);
    });
  });

  describe('진행률 계산', () => {
    it('0% 진행률', () => {
      const progress: ChallengeProgressType = { currentDays: 0 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('50% 진행률 (반올림)', () => {
      const progress: ChallengeProgressType = { currentDays: 4, totalDays: 7 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      // 4/7 = 57.14% → 57%
      expect(screen.getByText(/57%/)).toBeInTheDocument();
    });

    it('100% 진행률', () => {
      const progress: ChallengeProgressType = { currentDays: 7, totalDays: 7 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });

  describe('프로그레스 바 스타일', () => {
    it('진행률에 따라 너비 설정', () => {
      const progress: ChallengeProgressType = { currentDays: 5, totalDays: 10 };

      render(<ChallengeProgress progress={progress} durationDays={10} />);

      const progressBar = screen.getByRole('progressbar');
      // aria-valuenow 확인
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('0% 진행률 시 최소 너비', () => {
      const progress: ChallengeProgressType = { currentDays: 0 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('100% 진행률 시 전체 너비', () => {
      const progress: ChallengeProgressType = { currentDays: 7, totalDays: 7 };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('count 타입 진행률', () => {
    it('completedCount 기반 진행률', () => {
      const progress: ChallengeProgressType = { completedCount: 3 };

      // target이 5회인 경우 (외부에서 계산)
      render(<ChallengeProgress progress={progress} durationDays={7} targetCount={5} />);

      // 3/5 = 60%
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });
  });

  describe('daily 타입 진행률', () => {
    it('completedDays 배열 기반 진행률', () => {
      const progress: ChallengeProgressType = {
        completedDays: [1, 2, 3],
        totalDays: 7,
      };

      render(<ChallengeProgress progress={progress} durationDays={7} />);

      // 3/7 = 43%
      expect(screen.getByText(/43%/)).toBeInTheDocument();
    });
  });
});
