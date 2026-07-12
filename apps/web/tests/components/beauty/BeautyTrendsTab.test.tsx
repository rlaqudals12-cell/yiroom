/**
 * BeautyTrendsTab 테스트
 * WS-3: 트렌드 탭 렌더링 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock 하위 컴포넌트
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/beauty/BeautyFeed', () => ({
  BeautyFeed: ({ limit }: { limit: number }) => (
    <div data-testid="beauty-feed" data-limit={limit}>
      뷰티 피드
    </div>
  ),
}));

import BeautyTrendsTab from '@/components/beauty/BeautyTrendsTab';

describe('BeautyTrendsTab', () => {
  it('data-testid="beauty-trends-tab"이 존재한다', () => {
    render(<BeautyTrendsTab />);
    expect(screen.getByTestId('beauty-trends-tab')).toBeInTheDocument();
  });

  it('BeautyFeed가 limit=6으로 렌더링된다', () => {
    render(<BeautyTrendsTab />);
    const feed = screen.getByTestId('beauty-feed');
    expect(feed).toBeInTheDocument();
    expect(feed).toHaveAttribute('data-limit', '6');
  });
});
