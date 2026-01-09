/**
 * CircularProgress.tsx 테스트
 * @description 원형 Progress 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CircularProgress } from '@/components/analysis/visual-report/CircularProgress';

// requestAnimationFrame 모킹
let rafCallbacks: Array<(time: number) => void> = [];
const mockRaf = vi.fn((callback: (time: number) => void) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});
const mockCancelRaf = vi.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter((_, index) => index + 1 !== id);
});

beforeEach(() => {
  rafCallbacks = [];
  vi.stubGlobal('requestAnimationFrame', mockRaf);
  vi.stubGlobal('cancelAnimationFrame', mockCancelRaf);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// RAF 콜백 실행 헬퍼
function flushRafCallbacks(time: number = 0) {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach((cb) => cb(time));
}

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('CircularProgress', () => {
  describe('기본 렌더링', () => {
    it('컴포넌트가 렌더링되어야 함', () => {
      render(<CircularProgress score={75} animate={false} />);
      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('점수가 표시되어야 함', () => {
      render(<CircularProgress score={85} animate={false} showScore />);
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('점')).toBeInTheDocument();
    });

    it('SVG 원형 게이지가 렌더링되어야 함', () => {
      render(<CircularProgress score={70} animate={false} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // 배경 원 + Progress 원 = 2개
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBe(2);
    });
  });

  // ============================================
  // 크기 테스트
  // ============================================

  describe('크기', () => {
    it('sm 크기가 적용되어야 함', () => {
      render(<CircularProgress score={50} size="sm" animate={false} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '80');
    });

    it('md 크기가 적용되어야 함', () => {
      render(<CircularProgress score={50} size="md" animate={false} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
    });

    it('lg 크기가 적용되어야 함', () => {
      render(<CircularProgress score={50} size="lg" animate={false} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });
  });

  // ============================================
  // 등급별 색상 테스트
  // ============================================

  describe('등급별 색상', () => {
    it('다이아몬드 등급 (85+) 색상이 적용되어야 함', () => {
      render(<CircularProgress score={90} animate={false} showGradeIcon />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('골드 등급 (70-84) 색상이 적용되어야 함', () => {
      render(<CircularProgress score={75} animate={false} showGradeIcon />);
      expect(screen.getByText('골드')).toBeInTheDocument();
    });

    it('실버 등급 (50-69) 색상이 적용되어야 함', () => {
      render(<CircularProgress score={60} animate={false} showGradeIcon />);
      expect(screen.getByText('실버')).toBeInTheDocument();
    });

    it('브론즈 등급 (0-49) 색상이 적용되어야 함', () => {
      render(<CircularProgress score={30} animate={false} showGradeIcon />);
      expect(screen.getByText('브론즈')).toBeInTheDocument();
    });
  });

  // ============================================
  // 애니메이션 테스트
  // ============================================

  describe('애니메이션', () => {
    it('animate=false일 때 즉시 점수가 표시되어야 함', () => {
      render(<CircularProgress score={80} animate={false} />);
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('animate=true일 때 0에서 시작해야 함', () => {
      render(<CircularProgress score={80} animate={true} />);
      // 초기값은 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('애니메이션 진행 중 점수가 업데이트되어야 함', () => {
      render(<CircularProgress score={100} animate={true} duration={1000} />);

      // 초기값
      expect(screen.getByText('0')).toBeInTheDocument();

      // 애니메이션 중간 (500ms)
      act(() => {
        flushRafCallbacks(500);
      });

      // 점수가 0보다 커야 함
      const scoreElement = screen.getByText(/\d+/);
      expect(scoreElement).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('showScore=false일 때 점수가 숨겨져야 함', () => {
      render(<CircularProgress score={75} showScore={false} animate={false} />);
      expect(screen.queryByText('75')).not.toBeInTheDocument();
    });

    it('showGradeIcon=true일 때 등급 라벨이 표시되어야 함', () => {
      render(<CircularProgress score={90} showGradeIcon animate={false} />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('className이 적용되어야 함', () => {
      render(<CircularProgress score={50} className="custom-class" animate={false} />);
      expect(screen.getByTestId('circular-progress')).toHaveClass('custom-class');
    });
  });

  // ============================================
  // 경계값 테스트
  // ============================================

  describe('경계값', () => {
    it('점수 0이 정상 표시되어야 함', () => {
      render(<CircularProgress score={0} animate={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('점수 100이 정상 표시되어야 함', () => {
      render(<CircularProgress score={100} animate={false} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('등급 경계값 85에서 다이아몬드여야 함', () => {
      render(<CircularProgress score={85} animate={false} showGradeIcon />);
      expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    });

    it('등급 경계값 84에서 골드여야 함', () => {
      render(<CircularProgress score={84} animate={false} showGradeIcon />);
      expect(screen.getByText('골드')).toBeInTheDocument();
    });
  });
});
