import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    Sparkles: createMockIcon('Sparkles'),
    TrendingUp: createMockIcon('TrendingUp'),
    TrendingDown: createMockIcon('TrendingDown'),
  };
});

// FadeInUp 애니메이션 mock
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { SkinVitalityScore } from '@/components/analysis/visual-report/SkinVitalityScore';

describe('SkinVitalityScore', () => {
  const defaultFactors = {
    positive: ['탄력 우수', '수분 충분'],
    negative: ['유분 과다'],
  };

  describe('정상 케이스', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} />);

      expect(screen.getByTestId('skin-vitality-score')).toBeInTheDocument();
    });

    it('피부 활력도 타이틀을 표시한다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} />);

      expect(screen.getByText('피부 활력도')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Sparkles')).toBeInTheDocument();
    });

    it('점수를 올바르게 표시한다', () => {
      render(<SkinVitalityScore score={78} factors={defaultFactors} />);

      expect(screen.getByText('78')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });
  });

  describe('활력도 레벨', () => {
    it('80점 이상일 때 "매우 활력 있음"을 표시한다', () => {
      render(<SkinVitalityScore score={85} factors={defaultFactors} />);

      expect(screen.getByText('매우 활력 있음')).toBeInTheDocument();
    });

    it('60-79점일 때 "양호함"을 표시한다', () => {
      render(<SkinVitalityScore score={70} factors={defaultFactors} />);

      expect(screen.getByText('양호함')).toBeInTheDocument();
    });

    it('40-59점일 때 "관리 필요"를 표시한다', () => {
      render(<SkinVitalityScore score={50} factors={defaultFactors} />);

      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('40점 미만일 때 "집중 케어 권장"을 표시한다', () => {
      render(<SkinVitalityScore score={30} factors={defaultFactors} />);

      expect(screen.getByText('집중 케어 권장')).toBeInTheDocument();
    });
  });

  describe('강점 및 개선점 표시', () => {
    it('showDetails=true일 때 강점을 표시한다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} showDetails={true} />);

      expect(screen.getByText(/강점:/)).toBeInTheDocument();
      expect(screen.getByText(/탄력 우수, 수분 충분/)).toBeInTheDocument();
      expect(screen.getByTestId('icon-TrendingUp')).toBeInTheDocument();
    });

    it('showDetails=true일 때 개선점을 표시한다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} showDetails={true} />);

      expect(screen.getByText(/개선점:/)).toBeInTheDocument();
      expect(screen.getByText(/유분 과다/)).toBeInTheDocument();
      expect(screen.getByTestId('icon-TrendingDown')).toBeInTheDocument();
    });

    it('showDetails=false일 때 강점과 개선점을 숨긴다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} showDetails={false} />);

      expect(screen.queryByText(/강점:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/개선점:/)).not.toBeInTheDocument();
    });

    it('강점이 없을 때 강점 섹션을 표시하지 않는다', () => {
      render(
        <SkinVitalityScore
          score={75}
          factors={{ positive: [], negative: ['유분 과다'] }}
          showDetails={true}
        />
      );

      expect(screen.queryByText(/강점:/)).not.toBeInTheDocument();
    });

    it('개선점이 없을 때 개선점 섹션을 표시하지 않는다', () => {
      render(
        <SkinVitalityScore
          score={75}
          factors={{ positive: ['탄력 우수'], negative: [] }}
          showDetails={true}
        />
      );

      expect(screen.queryByText(/개선점:/)).not.toBeInTheDocument();
    });
  });

  describe('프로그레스 바', () => {
    it('점수에 따라 프로그레스 바 너비가 설정된다', () => {
      const { container } = render(<SkinVitalityScore score={75} factors={defaultFactors} />);

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('100점일 때 프로그레스 바가 100%로 표시된다', () => {
      const { container } = render(<SkinVitalityScore score={100} factors={defaultFactors} />);

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('0점일 때 프로그레스 바가 0%로 표시된다', () => {
      const { container } = render(<SkinVitalityScore score={0} factors={defaultFactors} />);

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('엣지 케이스', () => {
    it('점수가 100을 초과할 때 100으로 제한된다', () => {
      render(<SkinVitalityScore score={150} factors={defaultFactors} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('점수가 0 미만일 때 0으로 제한된다', () => {
      render(<SkinVitalityScore score={-10} factors={defaultFactors} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('강점과 개선점이 모두 비어있어도 렌더링된다', () => {
      render(
        <SkinVitalityScore score={75} factors={{ positive: [], negative: [] }} showDetails={true} />
      );

      expect(screen.getByTestId('skin-vitality-score')).toBeInTheDocument();
    });

    it('커스텀 className을 적용한다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} className="custom-class" />);

      expect(screen.getByTestId('skin-vitality-score')).toHaveClass('custom-class');
    });
  });

  describe('애니메이션', () => {
    it('animate=true일 때 FadeInUp으로 래핑된다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} animate={true} />);

      expect(screen.getByTestId('skin-vitality-score')).toBeInTheDocument();
    });

    it('animate=false일 때 FadeInUp 없이 렌더링된다', () => {
      render(<SkinVitalityScore score={75} factors={defaultFactors} animate={false} />);

      expect(screen.getByTestId('skin-vitality-score')).toBeInTheDocument();
    });
  });

  describe('색상 스타일', () => {
    it('점수 80 이상일 때 emerald 색상을 사용한다', () => {
      render(<SkinVitalityScore score={85} factors={defaultFactors} />);

      const score = screen.getByText('85');
      expect(score).toHaveClass('text-emerald-600');
    });

    it('점수 60-79일 때 blue 색상을 사용한다', () => {
      render(<SkinVitalityScore score={70} factors={defaultFactors} />);

      const score = screen.getByText('70');
      expect(score).toHaveClass('text-blue-600');
    });

    it('점수 40-59일 때 yellow 색상을 사용한다', () => {
      render(<SkinVitalityScore score={50} factors={defaultFactors} />);

      const score = screen.getByText('50');
      expect(score).toHaveClass('text-yellow-600');
    });

    it('점수 40 미만일 때 orange 색상을 사용한다', () => {
      render(<SkinVitalityScore score={30} factors={defaultFactors} />);

      const score = screen.getByText('30');
      expect(score).toHaveClass('text-orange-600');
    });
  });
});
