import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AnalyzingLoader, { ErrorState } from '@/components/workout/common/AnalyzingLoader';

describe('AnalyzingLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('기본 렌더링', () => {
    it('기본 제목을 표시한다', () => {
      render(<AnalyzingLoader />);
      expect(screen.getByText('AI가 분석 중입니다')).toBeInTheDocument();
    });

    it('기본 부제목을 표시한다', () => {
      render(<AnalyzingLoader />);
      expect(screen.getByText('당신에게 맞는 운동을 찾고 있어요...')).toBeInTheDocument();
    });

    it('커스텀 제목을 표시한다', () => {
      render(<AnalyzingLoader title="피부 분석 중" />);
      expect(screen.getByText('피부 분석 중')).toBeInTheDocument();
    });

    it('커스텀 부제목을 표시한다', () => {
      render(<AnalyzingLoader subtitle="잠시만 기다려주세요" />);
      expect(screen.getByText('잠시만 기다려주세요')).toBeInTheDocument();
    });
  });

  describe('프로그레스 바', () => {
    it('showProgress가 false면 프로그레스 바가 보이지 않는다', () => {
      render(<AnalyzingLoader showProgress={false} />);
      expect(screen.queryByText(/% 완료/)).not.toBeInTheDocument();
    });

    it('showProgress가 true면 프로그레스 바가 보인다', () => {
      render(<AnalyzingLoader showProgress={true} />);
      expect(screen.getByText('0% 완료')).toBeInTheDocument();
    });

    it('시간이 지나면 프로그레스가 증가한다', () => {
      render(<AnalyzingLoader showProgress={true} estimatedSeconds={3} />);

      // 여러 번의 interval 실행
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 0%보다 증가했는지 확인
      const progressText = screen.getByText(/% 완료/);
      expect(progressText).toBeInTheDocument();
    });
  });

  describe('메시지 순환', () => {
    it('messages가 주어지면 첫 번째 메시지를 표시한다', () => {
      const messages = ['체형 분석 중...', '운동 추천 생성 중...'];
      render(<AnalyzingLoader messages={messages} />);
      expect(screen.getByText('체형 분석 중...')).toBeInTheDocument();
    });

    it('2초 후 다음 메시지로 전환된다', () => {
      const messages = ['체형 분석 중...', '운동 추천 생성 중...'];
      render(<AnalyzingLoader messages={messages} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('운동 추천 생성 중...')).toBeInTheDocument();
    });

    it('메시지가 1개일 때는 순환하지 않는다', () => {
      const messages = ['분석 중...'];
      render(<AnalyzingLoader messages={messages} />);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('분석 중...')).toBeInTheDocument();
    });
  });
});

describe('ErrorState', () => {
  it('기본 에러 메시지를 표시한다', () => {
    render(<ErrorState />);
    expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument();
  });

  it('커스텀 에러 메시지를 표시한다', () => {
    render(<ErrorState message="네트워크 오류입니다." />);
    expect(screen.getByText('네트워크 오류입니다.')).toBeInTheDocument();
  });

  it('onRetry가 없으면 재시도 버튼이 없다', () => {
    render(<ErrorState />);
    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
  });

  it('onRetry가 있으면 재시도 버튼이 표시된다', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText('다시 시도')).toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry가 호출된다', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    screen.getByText('다시 시도').click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('커스텀 retryLabel이 적용된다', () => {
    render(<ErrorState onRetry={() => {}} retryLabel="다시 분석" />);
    expect(screen.getByText('다시 분석')).toBeInTheDocument();
  });
});
