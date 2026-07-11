/**
 * 뷰티 페이지 테스트 — 2탭 구조 (추천/케어)
 * WS-3에서 3탭이었으나 데모 폴리시(d8479120, 2026-06-16)에서 트렌드 탭 제거 → 2탭
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js
// ADR-101 큐레이션 진입 보강으로 useSearchParams 추가됨 (Phase G)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link — 성분 스캔 진입점(<Link href="/scan">) 렌더 검증용
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock useUserMatching
// personalColor는 테스트마다 바꿔 검증할 수 있도록 가변(mock 접두사 = vitest 호이스팅 허용)
let mockPersonalColor = '봄 라이트';
vi.mock('@/hooks/useUserMatching', () => ({
  useUserMatching: () => ({
    skinType: 'combination',
    skinConcerns: ['hydration', 'pore'],
    personalColor: mockPersonalColor,
    hasAnalysis: true,
    getMatchedProducts: vi.fn().mockReturnValue([]),
  }),
}));

// Mock Clerk (피부나이 실지표 로드용 useUser 사용)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isLoaded: true }),
}));

// Mock Supabase 클라이언트 (skin_analyses 실지표 조회)
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => {
      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit']) {
        query[method] = () => query;
      }
      query.maybeSingle = () => Promise.resolve({ data: null, error: null });
      return query;
    },
  }),
}));

// Mock 하위 컴포넌트
vi.mock('@/components/beauty/BeautyRecommendTab', () => ({
  BeautyRecommendTab: () => <div data-testid="beauty-recommend-tab">추천 탭</div>,
}));
vi.mock('@/components/beauty/BeautyCareTab', () => ({
  default: () => <div data-testid="beauty-care-tab">케어 탭</div>,
}));
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import BeautyPage from '@/app/(main)/beauty/page';

describe('BeautyPage 2탭 구조', () => {
  beforeEach(() => {
    mockPersonalColor = '봄 라이트';
  });

  it('data-testid="beauty-page"가 존재한다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-page')).toBeInTheDocument();
  });

  it('영문 시즌(Summer)을 한국어(여름 쿨톤)로 표시한다 (영문 라벨 누수 방지)', () => {
    mockPersonalColor = 'Summer';
    render(<BeautyPage />);

    expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
    expect(screen.queryByText('Summer')).not.toBeInTheDocument();
  });

  it('2개 탭 트리거가 렌더링된다 (트렌드 탭은 데모 폴리시에서 제거됨)', () => {
    render(<BeautyPage />);

    expect(screen.getByTestId('beauty-tab-recommend')).toBeInTheDocument();
    expect(screen.getByTestId('beauty-tab-care')).toBeInTheDocument();
    expect(screen.queryByTestId('beauty-tab-trends')).not.toBeInTheDocument();
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

  it('성분 스캔 진입점이 렌더링되고 /scan으로 연결된다', () => {
    render(<BeautyPage />);
    const entry = screen.getByTestId('beauty-scan-entry');
    expect(entry).toBeInTheDocument();
    expect(entry).toHaveAttribute('href', '/scan');
    // 바코드/제품 검색과 구분되는 "성분 스캔" 라벨 + 적합도 안내
    expect(screen.getByText('성분 스캔')).toBeInTheDocument();
    expect(screen.getByText('제품 성분표를 찍으면 나와의 적합도를 알려드려요')).toBeInTheDocument();
  });

  it('케어 탭 전환이 동작한다', async () => {
    const user = userEvent.setup();
    render(<BeautyPage />);

    await user.click(screen.getByTestId('beauty-tab-care'));
    expect(screen.getByTestId('beauty-care-tab')).toBeInTheDocument();
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
