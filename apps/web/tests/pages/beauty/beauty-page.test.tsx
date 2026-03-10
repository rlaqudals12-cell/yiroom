/**
 * 뷰티 페이지 테스트 — 3탭 구조 (추천/케어/트렌드)
 * WS-3: 리팩토링 완료된 3탭 구조 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock useUserMatching
vi.mock('@/hooks/useUserMatching', () => ({
  useUserMatching: () => ({
    skinType: 'combination',
    skinConcerns: ['hydration', 'pore'],
    personalColor: '봄 라이트',
    hasAnalysis: true,
    getMatchedProducts: vi.fn().mockReturnValue([]),
  }),
}));

// Mock 하위 컴포넌트
vi.mock('@/components/beauty/BeautyRecommendTab', () => ({
  BeautyRecommendTab: () => <div data-testid="beauty-recommend-tab">추천 탭</div>,
}));
vi.mock('@/components/beauty/BeautyCareTab', () => ({
  default: () => <div data-testid="beauty-care-tab">케어 탭</div>,
}));
vi.mock('@/components/beauty/BeautyTrendsTab', () => ({
  default: () => <div data-testid="beauty-trends-tab">트렌드 탭</div>,
}));
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import BeautyPage from '@/app/(main)/beauty/page';

describe('BeautyPage 3탭 구조', () => {
  it('data-testid="beauty-page"가 존재한다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-page')).toBeInTheDocument();
  });

  it('3개 탭 트리거가 렌더링된다', () => {
    render(<BeautyPage />);

    expect(screen.getByTestId('beauty-tab-recommend')).toBeInTheDocument();
    expect(screen.getByTestId('beauty-tab-care')).toBeInTheDocument();
    expect(screen.getByTestId('beauty-tab-trends')).toBeInTheDocument();
  });

  it('기본 탭은 추천 탭이다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-recommend-tab')).toBeInTheDocument();
  });

  it('hasAnalysis=true일 때 프로필 섹션이 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-profile')).toBeInTheDocument();
  });

  it('피부 타입 라벨이 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByText('복합성')).toBeInTheDocument();
  });

  it('피부 고민 태그가 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByText('보습')).toBeInTheDocument();
    expect(screen.getByText('모공')).toBeInTheDocument();
  });

  it('케어 탭 전환이 동작한다', async () => {
    const user = userEvent.setup();
    render(<BeautyPage />);

    await user.click(screen.getByTestId('beauty-tab-care'));
    expect(screen.getByTestId('beauty-care-tab')).toBeInTheDocument();
  });

  it('트렌드 탭 전환이 동작한다', async () => {
    const user = userEvent.setup();
    render(<BeautyPage />);

    await user.click(screen.getByTestId('beauty-tab-trends'));
    expect(screen.getByTestId('beauty-trends-tab')).toBeInTheDocument();
  });

  it('sr-only h1이 존재한다', () => {
    render(<BeautyPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveClass('sr-only');
  });
});

describe('BeautyPage 접근성', () => {
  it('탭 리스트에 aria-label이 존재한다', () => {
    render(<BeautyPage />);
    expect(screen.getByRole('tablist', { name: '뷰티 카테고리' })).toBeInTheDocument();
  });
});
