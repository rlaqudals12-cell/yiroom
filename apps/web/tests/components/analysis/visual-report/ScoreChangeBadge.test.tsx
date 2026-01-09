/**
 * ScoreChangeBadge.tsx 테스트
 * @description 점수 변화 배지 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ScoreChangeBadge,
  MetricDelta,
} from '@/components/analysis/visual-report/ScoreChangeBadge';

// ============================================
// ScoreChangeBadge 테스트
// ============================================

describe('ScoreChangeBadge', () => {
  describe('기본 렌더링', () => {
    it('컴포넌트가 렌더링되어야 함', () => {
      render(<ScoreChangeBadge delta={5} />);
      expect(screen.getByTestId('score-change-badge')).toBeInTheDocument();
    });

    it('점수 변화량이 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={5} />);
      expect(screen.getByText('+5점')).toBeInTheDocument();
    });
  });

  // ============================================
  // 방향별 스타일 테스트
  // ============================================

  describe('방향별 스타일', () => {
    it('상승 (양수)일 때 +와 상승 아이콘이 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={10} />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge).toHaveTextContent('+10점');
      // 초록색 배경 클래스 확인
      expect(badge.className).toMatch(/emerald/);
    });

    it('하락 (음수)일 때 하락 아이콘이 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={-5} />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge).toHaveTextContent('5점');
      // 빨간색 배경 클래스 확인
      expect(badge.className).toMatch(/red/);
    });

    it('유지 (0)일 때 중립 스타일이 적용되어야 함', () => {
      render(<ScoreChangeBadge delta={0} />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge).toHaveTextContent('0점');
      // 회색 배경 클래스 확인
      expect(badge.className).toMatch(/gray/);
    });
  });

  // ============================================
  // 크기 테스트
  // ============================================

  describe('크기', () => {
    it('sm 크기가 적용되어야 함', () => {
      render(<ScoreChangeBadge delta={5} size="sm" />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge.className).toMatch(/text-xs/);
    });

    it('md 크기가 적용되어야 함', () => {
      render(<ScoreChangeBadge delta={5} size="md" />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge.className).toMatch(/text-sm/);
    });

    it('lg 크기가 적용되어야 함', () => {
      render(<ScoreChangeBadge delta={5} size="lg" />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge.className).toMatch(/text-base/);
    });
  });

  // ============================================
  // 이전 점수 표시 테스트
  // ============================================

  describe('이전 점수 표시', () => {
    it('showPreviousScore=true일 때 이전 점수가 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={5} showPreviousScore previousScore={70} />);
      expect(screen.getByText('(이전: 70점)')).toBeInTheDocument();
    });

    it('showPreviousScore=false일 때 이전 점수가 숨겨져야 함', () => {
      render(<ScoreChangeBadge delta={5} showPreviousScore={false} previousScore={70} />);
      expect(screen.queryByText('(이전: 70점)')).not.toBeInTheDocument();
    });

    it('previousScore가 없으면 이전 점수가 표시되지 않아야 함', () => {
      render(<ScoreChangeBadge delta={5} showPreviousScore />);
      expect(screen.queryByText(/이전:/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 접근성 테스트
  // ============================================

  describe('접근성', () => {
    it('aria-label이 올바르게 설정되어야 함 (상승)', () => {
      render(<ScoreChangeBadge delta={5} />);
      expect(screen.getByLabelText('점수 변화: +5점')).toBeInTheDocument();
    });

    it('aria-label이 올바르게 설정되어야 함 (하락)', () => {
      render(<ScoreChangeBadge delta={-3} />);
      expect(screen.getByLabelText('점수 변화: -3점')).toBeInTheDocument();
    });

    it('aria-label이 올바르게 설정되어야 함 (유지)', () => {
      render(<ScoreChangeBadge delta={0} />);
      expect(screen.getByLabelText('점수 변화: 0점')).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('className이 적용되어야 함', () => {
      render(<ScoreChangeBadge delta={5} className="custom-badge" />);
      expect(screen.getByTestId('score-change-badge')).toHaveClass('custom-badge');
    });

    it('animate=false일 때 애니메이션 클래스가 없어야 함', () => {
      render(<ScoreChangeBadge delta={5} animate={false} />);
      const badge = screen.getByTestId('score-change-badge');
      expect(badge.className).not.toMatch(/animate-in/);
    });
  });

  // ============================================
  // 경계값 테스트
  // ============================================

  describe('경계값', () => {
    it('큰 양수 값이 정상 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={50} />);
      expect(screen.getByText('+50점')).toBeInTheDocument();
    });

    it('큰 음수 값이 정상 표시되어야 함', () => {
      render(<ScoreChangeBadge delta={-50} />);
      expect(screen.getByText('50점')).toBeInTheDocument();
    });
  });
});

// ============================================
// MetricDelta 테스트
// ============================================

describe('MetricDelta', () => {
  describe('기본 렌더링', () => {
    it('양수일 때 상승 화살표가 표시되어야 함', () => {
      render(<MetricDelta delta={3} />);
      expect(screen.getByText('↑3')).toBeInTheDocument();
    });

    it('음수일 때 하락 화살표가 표시되어야 함', () => {
      render(<MetricDelta delta={-2} />);
      expect(screen.getByText('↓2')).toBeInTheDocument();
    });

    it('0일 때 아무것도 렌더링하지 않아야 함', () => {
      const { container } = render(<MetricDelta delta={0} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('색상', () => {
    it('양수일 때 초록색이어야 함', () => {
      render(<MetricDelta delta={5} />);
      const element = screen.getByText('↑5');
      expect(element.className).toMatch(/emerald/);
    });

    it('음수일 때 빨간색이어야 함', () => {
      render(<MetricDelta delta={-5} />);
      const element = screen.getByText('↓5');
      expect(element.className).toMatch(/red/);
    });
  });

  describe('크기', () => {
    it('xs 크기가 적용되어야 함', () => {
      render(<MetricDelta delta={3} size="xs" />);
      const element = screen.getByText('↑3');
      expect(element.className).toMatch(/text-\[10px\]/);
    });

    it('sm 크기가 적용되어야 함', () => {
      render(<MetricDelta delta={3} size="sm" />);
      const element = screen.getByText('↑3');
      expect(element.className).toMatch(/text-xs/);
    });
  });

  describe('접근성', () => {
    it('aria-label이 올바르게 설정되어야 함', () => {
      render(<MetricDelta delta={5} />);
      expect(screen.getByLabelText('변화: +5')).toBeInTheDocument();
    });
  });
});
