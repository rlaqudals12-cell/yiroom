/**
 * BeautyRecommendTab 테스트
 * 감사 수리(2026-07-08): 하드코딩 TOP5 랭킹(가짜 평점·리뷰수·순위) 제거 —
 * 실DB(cosmetic_products) 기반 추천 그리드가 유일한 제품 표면임을 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AnyProduct, ProductWithMatch } from '@/types/product';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

// Mock 하위 필터 컴포넌트 (Sheet 등 무거운 UI)
vi.mock('@/components/beauty/IngredientFavoriteFilter', () => ({
  IngredientFavoriteFilter: () => <div data-testid="ingredient-filter" />,
}));
vi.mock('@/components/beauty/AgeGroupFilter', () => ({
  AgeGroupFilter: () => <div data-testid="age-group-filter" />,
}));

// Mock Supabase — cosmetic_products 실DB 조회를 흉내내는 체이너블 쿼리
const mockRows = [
  {
    id: 'prod-1',
    name: '히알루론 수분 크림',
    brand: '토리든',
    category: 'cream',
    price_krw: 21000,
    rating: 4.5,
    review_count: 132,
    image_url: null,
    skin_types: ['dry'],
    concerns: ['hydration'],
    personal_color_seasons: null,
    key_ingredients: ['hyaluronic acid'],
    target_age_groups: null,
  },
  {
    id: 'prod-2',
    name: '세라마이드 토너',
    brand: '라운드랩',
    category: 'toner',
    price_krw: 15000,
    rating: null, // 평점 없는 실데이터 — UI에 별점 미표시되어야 함
    review_count: null,
    image_url: null,
    skin_types: ['dry'],
    concerns: ['hydration'],
    personal_color_seasons: null,
    key_ingredients: ['ceramide'],
    target_age_groups: null,
  },
];

function createQueryMock() {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'limit', 'filter', 'order']) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  // await query → { data, error }
  (query as { then?: unknown }).then = (
    resolve: (value: { data: typeof mockRows; error: null }) => void
  ) => resolve({ data: mockRows, error: null });
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: () => createQueryMock() }),
}));

import { BeautyRecommendTab } from '@/components/beauty/BeautyRecommendTab';

// 매칭 엔진 흉내 — 모든 제품에 92% 부여 (90%+ 매칭 필터 통과)
const mockGetMatchedProducts = <T extends AnyProduct>(products: T[]): ProductWithMatch<T>[] =>
  products.map((product) => ({ product, matchScore: 92, matchReasons: [] }));

function renderTab(overrides: Partial<React.ComponentProps<typeof BeautyRecommendTab>> = {}) {
  return render(
    <BeautyRecommendTab
      hasAnalysis={true}
      userSkinType="dry"
      userSkinConcerns={[]}
      personalColor={null}
      getMatchedProducts={mockGetMatchedProducts}
      {...overrides}
    />
  );
}

describe('BeautyRecommendTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('data-testid="beauty-recommend-tab"이 존재한다', () => {
    renderTab();
    expect(screen.getByTestId('beauty-recommend-tab')).toBeInTheDocument();
  });

  it('실DB 제품이 추천 그리드에 렌더링된다', async () => {
    renderTab();

    expect(await screen.findByText('히알루론 수분 크림')).toBeInTheDocument();
    expect(screen.getByText('세라마이드 토너')).toBeInTheDocument();
    expect(screen.getByTestId('beauty-product-prod-1')).toBeInTheDocument();
  });

  it('하드코딩 TOP5 랭킹 섹션이 존재하지 않는다 (가짜 랭킹 제거)', async () => {
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    expect(screen.queryByTestId('beauty-ranking')).not.toBeInTheDocument();
    expect(screen.queryByText(/TOP 5/)).not.toBeInTheDocument();
    // 가짜 랭킹 ID(r1~r25) 링크 카드가 없어야 함
    expect(screen.queryByTestId('beauty-product-r1')).not.toBeInTheDocument();
  });

  it('평점이 있는 제품만 별점을 표시한다 (null 평점 → 미표시)', async () => {
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    // prod-1: rating 4.5 + 리뷰 132 → 표시
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(132)')).toBeInTheDocument();
    // prod-2: rating null → 어떤 가짜 기본값(예: 4.0)도 표시하지 않음
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('정렬 옵션에 평점순/리뷰순/인기순이 없다 (데이터 실체 기반 정렬만)', async () => {
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    expect(screen.queryByText('평점순')).not.toBeInTheDocument();
    expect(screen.queryByText('리뷰순')).not.toBeInTheDocument();
    expect(screen.queryByText('인기순')).not.toBeInTheDocument();
    // 기본 정렬은 매칭률순
    expect(screen.getByTestId('beauty-sort-button')).toHaveTextContent('매칭률순');
  });

  it('매칭률 뱃지가 표시된다 (실계산 92%)', async () => {
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
  });

  it('hasAnalysis=false일 때 분석 유도 버튼이 /analysis/skin으로 연결된다', async () => {
    renderTab({ hasAnalysis: false });
    await screen.findByText('히알루론 수분 크림');

    const analysisButton = screen.getByText('분석하면 매칭률 확인');
    analysisButton.click();
    expect(mockPush).toHaveBeenCalledWith('/analysis/skin');
  });
});
