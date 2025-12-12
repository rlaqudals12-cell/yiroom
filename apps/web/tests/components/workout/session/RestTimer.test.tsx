import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { RestTimer } from '@/components/workout/session';

// Audio 모킹 (jsdom에서 지원하지 않음)
const mockPlay = vi.fn(() => Promise.resolve());
const mockAudio = vi.fn(() => ({
  play: mockPlay,
  pause: vi.fn(),
  volume: 0,
}));

// @ts-expect-error - Audio mock
global.Audio = mockAudio;

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockClear();
    mockAudio.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('렌더링', () => {
    it('휴식 타이머가 올바르게 렌더링된다', () => {
      const onComplete = vi.fn();
      const onSkip = vi.fn();

      render(
        <RestTimer
          initialSeconds={60}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      );

      expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
      expect(screen.getByText('휴식 시간')).toBeInTheDocument();
    });

    it('초기 시간이 올바르게 표시된다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('휴식 건너뛰기 버튼이 표시된다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('휴식 건너뛰기')).toBeInTheDocument();
    });
  });

  describe('타이머 동작', () => {
    it('시간이 1초씩 감소한다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('01:00')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('00:59')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('00:54')).toBeInTheDocument();
    });

    it('0초가 되면 onComplete가 호출된다', async () => {
      const onComplete = vi.fn();

      render(
        <RestTimer
          initialSeconds={2}
          onComplete={onComplete}
          onSkip={vi.fn()}
        />
      );

      // 2초 경과
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      // setTimeout 내부의 onComplete 호출 대기
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('시간 조절', () => {
    it('+10초 버튼을 클릭하면 시간이 증가한다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      const increaseButton = screen.getByLabelText('10초 증가');
      fireEvent.click(increaseButton);

      expect(screen.getByText('01:10')).toBeInTheDocument();
    });

    it('-10초 버튼을 클릭하면 시간이 감소한다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      const decreaseButton = screen.getByLabelText('10초 감소');
      fireEvent.click(decreaseButton);

      expect(screen.getByText('00:50')).toBeInTheDocument();
    });

    it('최소 30초 미만으로 감소하지 않는다', () => {
      render(
        <RestTimer
          initialSeconds={35}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      const decreaseButton = screen.getByLabelText('10초 감소');
      fireEvent.click(decreaseButton);

      // 35 - 10 = 25 이지만 최소 30초 (스펙: 30초 ~ 3분)
      expect(screen.getByText('00:30')).toBeInTheDocument();
    });

    it('기본 버튼을 클릭하면 defaultSeconds로 리셋된다', () => {
      render(
        <RestTimer
          initialSeconds={30}
          defaultSeconds={60}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      // 현재 30초
      expect(screen.getByText('00:30')).toBeInTheDocument();

      // 기본 60초 버튼 클릭
      const defaultButton = screen.getByText('기본 60초');
      fireEvent.click(defaultButton);

      // 60초로 리셋
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('기본 버튼에 defaultSeconds 값이 표시된다', () => {
      render(
        <RestTimer
          initialSeconds={60}
          defaultSeconds={45}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('기본 45초')).toBeInTheDocument();
    });
  });

  describe('건너뛰기', () => {
    it('건너뛰기 버튼을 클릭하면 onSkip이 호출된다', () => {
      const onSkip = vi.fn();

      render(
        <RestTimer
          initialSeconds={60}
          onComplete={vi.fn()}
          onSkip={onSkip}
        />
      );

      fireEvent.click(screen.getByText('휴식 건너뛰기'));

      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('10초 전 알림', () => {
    it('10초 남았을 때 경고 메시지가 표시된다', () => {
      render(
        <RestTimer
          initialSeconds={12}
          onComplete={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(3000); // 12 - 3 = 9초
      });

      expect(screen.getByText('곧 다음 세트!')).toBeInTheDocument();
    });
  });
});
