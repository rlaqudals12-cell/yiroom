import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryStats } from '@/components/workout/history';

describe('HistoryStats', () => {
  const defaultProps = {
    totalWorkouts: 4,
    totalMinutes: 180,
    totalCalories: 1200,
    totalVolume: 15000,
    completionRate: 80,
  };

  describe('렌더링', () => {
    it('통계 카드가 올바르게 렌더링된다', () => {
      render(<HistoryStats {...defaultProps} />);

      expect(screen.getByTestId('history-stats')).toBeInTheDocument();
    });

    it('헤더가 표시된다', () => {
      render(<HistoryStats {...defaultProps} />);

      expect(screen.getByText('이번 주 운동 현황')).toBeInTheDocument();
    });
  });

  describe('통계 표시', () => {
    it('운동 횟수가 표시된다', () => {
      render(<HistoryStats {...defaultProps} />);

      expect(screen.getByText('4회')).toBeInTheDocument();
    });

    it('총 시간이 표시된다', () => {
      render(<HistoryStats {...defaultProps} totalMinutes={180} />);

      expect(screen.getByText('3시간')).toBeInTheDocument();
    });

    it('시간이 60분 미만이면 분으로 표시된다', () => {
      render(<HistoryStats {...defaultProps} totalMinutes={45} />);

      expect(screen.getByText('45분')).toBeInTheDocument();
    });

    it('소모 칼로리가 표시된다', () => {
      render(<HistoryStats {...defaultProps} />);

      expect(screen.getByText('1,200kcal')).toBeInTheDocument();
    });

    it('볼륨이 표시된다', () => {
      render(<HistoryStats {...defaultProps} />);

      expect(screen.getByText('15,000kg')).toBeInTheDocument();
    });
  });

  describe('달성률 표시', () => {
    it('달성률이 표시된다', () => {
      render(<HistoryStats {...defaultProps} completionRate={80} />);

      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('80% 이상이면 목표 달성 메시지가 표시된다', () => {
      render(<HistoryStats {...defaultProps} completionRate={85} />);

      expect(screen.getByText('목표 80% 달성!')).toBeInTheDocument();
    });

    it('80% 미만이면 목표 달성 메시지가 표시되지 않는다', () => {
      render(<HistoryStats {...defaultProps} completionRate={60} />);

      // "목표 80% 달성!" 메시지 체크 (라벨과 구분)
      expect(screen.queryByText('목표 80% 달성!')).not.toBeInTheDocument();
    });
  });

  describe('시간 포맷팅', () => {
    it('1시간 30분이 올바르게 표시된다', () => {
      render(<HistoryStats {...defaultProps} totalMinutes={90} />);

      expect(screen.getByText('1시간 30분')).toBeInTheDocument();
    });

    it('정확히 2시간이 올바르게 표시된다', () => {
      render(<HistoryStats {...defaultProps} totalMinutes={120} />);

      expect(screen.getByText('2시간')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('모든 값이 0이어도 에러가 발생하지 않는다', () => {
      render(
        <HistoryStats
          totalWorkouts={0}
          totalMinutes={0}
          totalCalories={0}
          totalVolume={0}
          completionRate={0}
        />
      );

      expect(screen.getByTestId('history-stats')).toBeInTheDocument();
      expect(screen.getByText('0회')).toBeInTheDocument();
      expect(screen.getByText('0분')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('100% 달성률이 올바르게 표시된다', () => {
      render(<HistoryStats {...defaultProps} completionRate={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('목표 80% 달성!')).toBeInTheDocument();
    });
  });
});
