import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { WorkoutSessionHeader } from '@/components/workout/session';

describe('WorkoutSessionHeader', () => {
  const defaultProps = {
    dayLabel: '월요일',
    totalExercises: 5,
    completedExercises: 2,
    totalSets: 15,
    completedSets: 6,
    estimatedCalories: 150,
    elapsedTime: 600, // 10분
    isPaused: false,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onExit: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('헤더가 올바르게 렌더링된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} />);

      expect(screen.getByTestId('workout-session-header')).toBeInTheDocument();
      expect(screen.getByText('월요일 운동')).toBeInTheDocument();
    });

    it('경과 시간이 올바르게 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} elapsedTime={600} />);

      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('경과 시간')).toBeInTheDocument();
    });

    it('칼로리가 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} estimatedCalories={150} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('kcal')).toBeInTheDocument();
    });

    it('운동 진행률이 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} totalExercises={5} completedExercises={2} />);

      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.getByText('운동')).toBeInTheDocument();
    });

    it('진행률 바가 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} totalSets={10} completedSets={4} />);

      // 40% 진행률
      const progressBar = screen.getByTestId('workout-session-header').querySelector('[style*="width: 40%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('일시정지 상태', () => {
    it('일시정지 버튼을 클릭하면 onPause가 호출된다', () => {
      const onPause = vi.fn();

      render(<WorkoutSessionHeader {...defaultProps} onPause={onPause} />);

      fireEvent.click(screen.getByLabelText('운동 일시정지'));

      expect(onPause).toHaveBeenCalled();
    });

    it('일시정지 상태에서 재개 버튼이 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} isPaused={true} />);

      expect(screen.getByLabelText('운동 재개')).toBeInTheDocument();
    });

    it('일시정지 상태에서 onResume이 호출된다', () => {
      const onResume = vi.fn();

      render(<WorkoutSessionHeader {...defaultProps} isPaused={true} onResume={onResume} />);

      fireEvent.click(screen.getByLabelText('운동 재개'));

      expect(onResume).toHaveBeenCalled();
    });

    it('일시정지 상태에서 오버레이가 표시된다', () => {
      render(<WorkoutSessionHeader {...defaultProps} isPaused={true} />);

      expect(screen.getByText('일시정지됨')).toBeInTheDocument();
    });
  });

  describe('종료 버튼', () => {
    it('종료 버튼을 클릭하면 onExit이 호출된다', () => {
      const onExit = vi.fn();

      render(<WorkoutSessionHeader {...defaultProps} onExit={onExit} />);

      fireEvent.click(screen.getByLabelText('운동 종료'));

      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('타이머 동작', () => {
    it('일시정지가 아닐 때 타이머가 증가한다', () => {
      render(<WorkoutSessionHeader {...defaultProps} elapsedTime={0} isPaused={false} />);

      expect(screen.getByText('00:00')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('00:05')).toBeInTheDocument();
    });

    it('일시정지 상태에서 타이머가 멈춘다', () => {
      render(<WorkoutSessionHeader {...defaultProps} elapsedTime={60} isPaused={true} />);

      expect(screen.getByText('01:00')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // 여전히 01:00
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });
  });
});
