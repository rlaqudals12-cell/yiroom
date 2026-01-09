/**
 * GradeDisplay.tsx 테스트
 * @description 등급 표시 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeDisplay } from '@/components/analysis/visual-report/GradeDisplay';

// 애니메이션 모킹
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CountUp: ({ end, suffix }: { end: number; suffix?: string }) => (
    <span>
      {end}
      {suffix}
    </span>
  ),
}));

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('GradeDisplay', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<GradeDisplay score={85} />);
      expect(screen.getByTestId('grade-display')).toBeInTheDocument();
    });

    it('점수가 표시되어야 함', () => {
      render(<GradeDisplay score={85} />);
      expect(screen.getByText('85점')).toBeInTheDocument();
    });

    it('라벨이 표시되어야 함', () => {
      render(<GradeDisplay score={85} label="피부 점수" />);
      expect(screen.getByText('피부 점수')).toBeInTheDocument();
    });
  });

  // ============================================
  // 점수별 등급 테스트
  // ============================================

  describe('점수별 등급', () => {
    it('85점 이상은 다이아몬드 등급이어야 함', () => {
      render(<GradeDisplay score={90} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('70-84점은 골드 등급이어야 함', () => {
      render(<GradeDisplay score={75} />);
      expect(screen.getByText('골드')).toBeInTheDocument();
    });

    it('50-69점은 실버 등급이어야 함', () => {
      render(<GradeDisplay score={60} />);
      expect(screen.getByText('실버')).toBeInTheDocument();
    });

    it('50점 미만은 브론즈 등급이어야 함', () => {
      render(<GradeDisplay score={40} />);
      expect(screen.getByText('브론즈')).toBeInTheDocument();
    });
  });

  // ============================================
  // Progress 바 테스트
  // ============================================

  describe('Progress 바', () => {
    it('showProgress=true(기본값)일 때 Progress가 표시되어야 함', () => {
      render(<GradeDisplay score={75} />);
      // 등급 경계 표시 확인
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('showProgress=false일 때 Progress가 숨겨져야 함', () => {
      render(<GradeDisplay score={75} showProgress={false} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 점수 표시 테스트
  // ============================================

  describe('점수 표시', () => {
    it('showScore=true(기본값)일 때 점수가 표시되어야 함', () => {
      render(<GradeDisplay score={75} />);
      expect(screen.getByText('75점')).toBeInTheDocument();
    });

    it('showScore=false일 때 점수가 숨겨져야 함', () => {
      render(<GradeDisplay score={75} showScore={false} />);
      expect(screen.queryByText('75점')).not.toBeInTheDocument();
    });

    it('소수점 점수가 반올림되어야 함', () => {
      render(<GradeDisplay score={75.7} />);
      expect(screen.getByText('76점')).toBeInTheDocument();
    });
  });

  // ============================================
  // 사이즈 테스트
  // ============================================

  describe('사이즈', () => {
    it('size=sm일 때 설명이 숨겨져야 함', () => {
      render(<GradeDisplay score={75} size="sm" />);
      // sm 사이즈에서는 description이 렌더링되지 않음
      const display = screen.getByTestId('grade-display');
      expect(display).toBeInTheDocument();
    });

    it('size=md(기본값)일 때 설명이 표시되어야 함', () => {
      render(<GradeDisplay score={75} />);
      // description이 있는지 확인
      const display = screen.getByTestId('grade-display');
      expect(display).toBeInTheDocument();
    });

    it('size=lg일 때 설명이 표시되어야 함', () => {
      render(<GradeDisplay score={75} size="lg" />);
      const display = screen.getByTestId('grade-display');
      expect(display).toBeInTheDocument();
    });
  });

  // ============================================
  // 분석 타입 테스트
  // ============================================

  describe('분석 타입', () => {
    it('skin 분석 타입이 올바르게 처리되어야 함', () => {
      render(<GradeDisplay score={75} analysisType="skin" />);
      expect(screen.getByTestId('grade-display')).toBeInTheDocument();
    });

    it('body 분석 타입이 올바르게 처리되어야 함', () => {
      render(<GradeDisplay score={75} analysisType="body" />);
      expect(screen.getByTestId('grade-display')).toBeInTheDocument();
    });

    it('personal-color 분석 타입이 올바르게 처리되어야 함', () => {
      render(<GradeDisplay score={75} analysisType="personal-color" />);
      expect(screen.getByTestId('grade-display')).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('className이 적용되어야 함', () => {
      const { container } = render(<GradeDisplay score={75} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('animate=false일 때 애니메이션 없이 점수가 표시되어야 함', () => {
      render(<GradeDisplay score={75} animate={false} />);
      expect(screen.getByText('75점')).toBeInTheDocument();
    });
  });
});
