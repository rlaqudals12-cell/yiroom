/**
 * N-1 CalorieProgressRing 컴포넌트 테스트
 * Task 3.3: 칼로리 프로그레스 링
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CalorieProgressRing, {
  CalorieProgressRingContent,
} from '@/components/nutrition/CalorieProgressRing';

describe('CalorieProgressRing', () => {
  describe('렌더링', () => {
    it('기본 프로그레스 링을 렌더링한다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      expect(screen.getByTestId('calorie-progress-ring')).toBeInTheDocument();
    });

    it('커스텀 testId를 사용할 수 있다', () => {
      render(
        <CalorieProgressRing
          current={1200}
          target={2000}
          testId="custom-ring"
        />
      );

      expect(screen.getByTestId('custom-ring')).toBeInTheDocument();
    });

    it('children을 중앙에 렌더링한다', () => {
      render(
        <CalorieProgressRing current={1200} target={2000}>
          <span data-testid="center-content">중앙 텍스트</span>
        </CalorieProgressRing>
      );

      expect(screen.getByTestId('center-content')).toBeInTheDocument();
      expect(screen.getByText('중앙 텍스트')).toBeInTheDocument();
    });
  });

  describe('접근성(a11y)', () => {
    it('progressbar role이 있다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('올바른 aria-valuenow가 설정된다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      // 1200/2000 = 60%
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
    });

    it('aria-valuemin과 aria-valuemax가 설정된다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('기본 aria-label이 설정된다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute(
        'aria-label',
        '칼로리 섭취 진행률 60%'
      );
    });

    it('커스텀 aria-label을 사용할 수 있다', () => {
      render(
        <CalorieProgressRing
          current={1200}
          target={2000}
          ariaLabel="커스텀 레이블"
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', '커스텀 레이블');
    });
  });

  describe('퍼센트 계산', () => {
    it('정확한 퍼센트를 계산한다', () => {
      render(<CalorieProgressRing current={1500} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      // 1500/2000 = 75%
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('100% 초과 시에도 정확한 퍼센트를 표시한다', () => {
      render(<CalorieProgressRing current={2500} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      // 2500/2000 = 125%
      expect(progressbar).toHaveAttribute('aria-valuenow', '125');
    });

    it('0 칼로리일 때 0%를 표시한다', () => {
      render(<CalorieProgressRing current={0} target={2000} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('목표가 0일 때 0%를 표시한다', () => {
      render(<CalorieProgressRing current={1200} target={0} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('크기 및 스타일', () => {
    it('커스텀 크기를 적용할 수 있다', () => {
      render(<CalorieProgressRing current={1200} target={2000} size={200} />);

      const container = screen.getByTestId('calorie-progress-ring');
      expect(container).toHaveStyle({ width: '200px', height: '200px' });
    });

    it('기본 크기는 160px이다', () => {
      render(<CalorieProgressRing current={1200} target={2000} />);

      const container = screen.getByTestId('calorie-progress-ring');
      expect(container).toHaveStyle({ width: '160px', height: '160px' });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<CalorieProgressRing current={1200} target={2000} isLoading />);

      expect(
        screen.getByTestId('calorie-progress-ring-loading')
      ).toBeInTheDocument();
    });

    it('로딩 중일 때 progressbar를 표시하지 않는다', () => {
      render(<CalorieProgressRing current={1200} target={2000} isLoading />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('색상 변경', () => {
    it('80% 미만일 때 녹색(정상)을 표시한다', () => {
      const { container } = render(
        <CalorieProgressRing current={1000} target={2000} />
      );

      // 50% - 녹색
      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1]; // 두 번째 원이 진행률 원
      expect(progressCircle).toHaveAttribute('stroke', '#22C55E');
    });

    it('80% 이상 100% 미만일 때 노란색(주의)을 표시한다', () => {
      const { container } = render(
        <CalorieProgressRing current={1700} target={2000} />
      );

      // 85% - 노란색
      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1];
      expect(progressCircle).toHaveAttribute('stroke', '#F59E0B');
    });

    it('100% 이상일 때 빨간색(초과)을 표시한다', () => {
      const { container } = render(
        <CalorieProgressRing current={2500} target={2000} />
      );

      // 125% - 빨간색
      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1];
      expect(progressCircle).toHaveAttribute('stroke', '#EF4444');
    });

    it('정확히 80%일 때 노란색(주의)을 표시한다', () => {
      const { container } = render(
        <CalorieProgressRing current={1600} target={2000} />
      );

      // 80% - 노란색
      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1];
      expect(progressCircle).toHaveAttribute('stroke', '#F59E0B');
    });

    it('정확히 100%일 때 빨간색(초과)을 표시한다', () => {
      const { container } = render(
        <CalorieProgressRing current={2000} target={2000} />
      );

      // 100% - 빨간색
      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1];
      expect(progressCircle).toHaveAttribute('stroke', '#EF4444');
    });
  });
});

describe('CalorieProgressRingContent', () => {
  it('현재 칼로리를 표시한다', () => {
    render(<CalorieProgressRingContent current={1200} target={2000} />);

    expect(screen.getByTestId('progress-current')).toHaveTextContent('1,200');
  });

  it('목표 칼로리를 표시한다', () => {
    render(<CalorieProgressRingContent current={1200} target={2000} />);

    expect(screen.getByText(/2,000 kcal/)).toBeInTheDocument();
  });

  it('퍼센트를 표시한다', () => {
    render(<CalorieProgressRingContent current={1200} target={2000} />);

    expect(screen.getByTestId('progress-percentage')).toHaveTextContent('60%');
  });

  it('커스텀 단위를 사용할 수 있다', () => {
    render(
      <CalorieProgressRingContent current={500} target={1000} unit="ml" />
    );

    expect(screen.getByText(/1,000 ml/)).toBeInTheDocument();
  });

  it('100% 초과 시 빨간색 텍스트를 표시한다', () => {
    render(<CalorieProgressRingContent current={2500} target={2000} />);

    const percentage = screen.getByTestId('progress-percentage');
    expect(percentage).toHaveClass('text-red-500');
  });
});
