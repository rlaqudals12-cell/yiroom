/**
 * MetricBar 컴포넌트 테스트
 * @description 메트릭 바의 등급별 렌더링 및 점수 표시를 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricBar } from '@/components/analysis/visual-report/MetricBar';

// FadeInUp 애니메이션 모킹 (className 전달 포함)
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('MetricBar', () => {
  // ============================================
  // 기본 렌더링
  // ============================================

  describe('기본 렌더링', () => {
    it('메트릭 이름과 점수를 표시한다', () => {
      render(<MetricBar name="수분" value={75} />);
      expect(screen.getByText('수분')).toBeInTheDocument();
      expect(screen.getByText('75점')).toBeInTheDocument();
    });

    it('data-testid="metric-bar"가 존재한다', () => {
      render(<MetricBar name="탄력" value={60} />);
      expect(screen.getByTestId('metric-bar')).toBeInTheDocument();
    });

    it('소수점 점수를 반올림하여 표시한다', () => {
      render(<MetricBar name="수분" value={82.7} />);
      expect(screen.getByText('83점')).toBeInTheDocument();
    });
  });

  // ============================================
  // 등급별 아이콘 및 라벨 표시
  // ============================================

  describe('등급별 아이콘 및 라벨', () => {
    it('85점 이상이면 다이아몬드 등급을 표시한다', () => {
      render(<MetricBar name="수분" value={90} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
      expect(screen.getByText('90점')).toBeInTheDocument();
    });

    it('85점 경계값에서 다이아몬드 등급을 표시한다', () => {
      render(<MetricBar name="수분" value={85} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('70-84점이면 골드 등급을 표시한다', () => {
      render(<MetricBar name="유분" value={75} />);
      expect(screen.getByText('골드')).toBeInTheDocument();
      expect(screen.getByText('75점')).toBeInTheDocument();
    });

    it('70점 경계값에서 골드 등급을 표시한다', () => {
      render(<MetricBar name="유분" value={70} />);
      expect(screen.getByText('골드')).toBeInTheDocument();
    });

    it('50-69점이면 실버 등급을 표시한다', () => {
      render(<MetricBar name="민감도" value={60} />);
      expect(screen.getByText('실버')).toBeInTheDocument();
      expect(screen.getByText('60점')).toBeInTheDocument();
    });

    it('50점 경계값에서 실버 등급을 표시한다', () => {
      render(<MetricBar name="민감도" value={50} />);
      expect(screen.getByText('실버')).toBeInTheDocument();
    });

    it('50점 미만이면 브론즈 등급을 표시한다', () => {
      render(<MetricBar name="주름" value={30} />);
      expect(screen.getByText('브론즈')).toBeInTheDocument();
      expect(screen.getByText('30점')).toBeInTheDocument();
    });

    it('0점에서 브론즈 등급을 표시한다', () => {
      render(<MetricBar name="주름" value={0} />);
      expect(screen.getByText('브론즈')).toBeInTheDocument();
      expect(screen.getByText('0점')).toBeInTheDocument();
    });
  });

  // ============================================
  // showGrade 토글
  // ============================================

  describe('showGrade 제어', () => {
    it('showGrade 기본값(true)일 때 등급 배지를 표시한다', () => {
      render(<MetricBar name="수분" value={90} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('showGrade=false일 때 등급 배지를 숨긴다', () => {
      render(<MetricBar name="수분" value={90} showGrade={false} />);
      expect(screen.queryByText('다이아몬드')).not.toBeInTheDocument();
    });

    it('showGrade=false여도 점수는 표시한다', () => {
      render(<MetricBar name="수분" value={90} showGrade={false} />);
      expect(screen.getByText('90점')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 엣지케이스
  // ============================================

  describe('Props 엣지케이스', () => {
    it('className이 적용된다', () => {
      const { container } = render(<MetricBar name="수분" value={75} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('delay 범위 초과 시 에러 없이 렌더링된다', () => {
      expect(() => {
        render(<MetricBar name="수분" value={75} delay={20} />);
      }).not.toThrow();
    });

    it('delay 음수 시 에러 없이 렌더링된다', () => {
      expect(() => {
        render(<MetricBar name="수분" value={75} delay={-3} />);
      }).not.toThrow();
    });

    it('100점일 때 다이아몬드 등급을 표시한다', () => {
      render(<MetricBar name="수분" value={100} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
      expect(screen.getByText('100점')).toBeInTheDocument();
    });
  });
});
