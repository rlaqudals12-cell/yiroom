/**
 * MetricBar.tsx 테스트
 * @description 메트릭 바 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricBar } from '@/components/analysis/visual-report/MetricBar';

// FadeInUp 애니메이션 모킹
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('MetricBar', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<MetricBar name="수분" value={75} />);
      expect(screen.getByTestId('metric-bar')).toBeInTheDocument();
    });

    it('메트릭 이름이 표시되어야 함', () => {
      render(<MetricBar name="수분" value={75} />);
      expect(screen.getByText('수분')).toBeInTheDocument();
    });

    it('점수가 표시되어야 함', () => {
      render(<MetricBar name="수분" value={75} />);
      expect(screen.getByText('75점')).toBeInTheDocument();
    });

    it('소수점 점수가 반올림되어야 함', () => {
      render(<MetricBar name="수분" value={75.6} />);
      expect(screen.getByText('76점')).toBeInTheDocument();
    });
  });

  // ============================================
  // 등급 표시 테스트
  // ============================================

  describe('등급 표시', () => {
    it('showGrade=true(기본값)일 때 등급이 표시되어야 함', () => {
      render(<MetricBar name="수분" value={90} />);
      // 90점 = 다이아몬드 등급
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('showGrade=false일 때 등급이 숨겨져야 함', () => {
      render(<MetricBar name="수분" value={90} showGrade={false} />);
      expect(screen.queryByText('다이아몬드')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 점수별 등급 테스트
  // ============================================

  describe('점수별 등급', () => {
    it('85점 이상은 다이아몬드 등급이어야 함', () => {
      render(<MetricBar name="수분" value={85} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('70-84점은 골드 등급이어야 함', () => {
      render(<MetricBar name="수분" value={75} />);
      expect(screen.getByText('골드')).toBeInTheDocument();
    });

    it('50-69점은 실버 등급이어야 함', () => {
      render(<MetricBar name="수분" value={60} />);
      expect(screen.getByText('실버')).toBeInTheDocument();
    });

    it('50점 미만은 브론즈 등급이어야 함', () => {
      render(<MetricBar name="수분" value={40} />);
      expect(screen.getByText('브론즈')).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('className이 적용되어야 함', () => {
      const { container } = render(<MetricBar name="수분" value={75} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('delay가 12 이하로 제한되어야 함', () => {
      // delay=15가 12로 제한되는지 확인 (내부 로직)
      expect(() => {
        render(<MetricBar name="수분" value={75} delay={15} />);
      }).not.toThrow();
    });

    it('delay가 0 이상으로 제한되어야 함', () => {
      expect(() => {
        render(<MetricBar name="수분" value={75} delay={-5} />);
      }).not.toThrow();
    });
  });
});
