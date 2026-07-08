/**
 * BeautyRecommendTab 테스트
 * 감사 수리(2026-07-08): 하드코딩 TOP5 랭킹(가짜 평점·리뷰수·순위) 제거 —
 * 실DB(cosmetic_products) 기반 추천 그리드가 유일한 제품 표면임을 검증
 *
 * 추천 0개 수리(2026-07-08):
 * - 카테고리/서브카테고리를 DB 실값(category=serum 등)으로 매핑
 * - skin_types/concerns 미태깅(null) 제품을 배제하지 않는 or-null 필터
 * - 매칭 필터 기본 OFF + 임계(80) 미달 시 자동 완화 안내
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock Supabase — cosmetic_products 실DB 조회를 흉내내는 체이너블 쿼리.
// DB 실값 기준(2026-07-08 prod 검증): category는 이미 세분류(serum/toner/...),
// 수집된 makeup 제품 대부분은 skin_types/concerns가 null이다.
const mockRows = [
  {
    id: 'prod-1',
    name: '히알루론 수분 크림',
    brand: '토리든',
    category: 'moisturizer',
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
  {
    id: 'prod-3',
    name: '비타민C 세럼',
    brand: '구달',
    category: 'serum',
    price_krw: 18000,
    rating: null,
    review_count: null,
    image_url: null,
    skin_types: null, // 미태깅 제품 — or-null 필터로 배제되지 않아야 함
    concerns: null,
    personal_color_seasons: null,
    key_ingredients: ['vitamin c'],
    target_age_groups: null,
  },
];

// 쿼리 빌더 호출 기록 (필터 값 검증용)
const queryCalls: { method: string; args: unknown[] }[] = [];

function createQueryMock() {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'limit', 'filter', 'order', 'in', 'or']) {
    query[method] = vi.fn((...args: unknown[]) => {
      queryCalls.push({ method, args });
      return query;
    });
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

// 매칭 엔진 흉내 — 모든 제품에 92% 부여
const mockGetMatchedProducts = <T extends AnyProduct>(products: T[]): ProductWithMatch<T>[] =>
  products.map((product) => ({ product, matchScore: 92, matchReasons: [] }));

// 낮은 매칭 점수 엔진 — 임계(80) 미달 시나리오 (스킨케어 점수 상한 ~77 재현)
const mockLowMatchProducts = <T extends AnyProduct>(products: T[]): ProductWithMatch<T>[] =>
  products.map((product) => ({ product, matchScore: 65, matchReasons: [] }));

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
    queryCalls.length = 0;
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

  it('기본 상태에서 매칭 필터는 OFF — 제품이 숨겨지지 않는다', async () => {
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    const toggle = screen.getByTestId('beauty-match-toggle');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    // 3개 제품 전부 표시
    expect(screen.getByText('3개 제품')).toBeInTheDocument();
  });

  it('skin_types 미태깅(null) 제품을 배제하지 않는다 (or-null 필터)', async () => {
    renderTab();

    // 미태깅 제품(prod-3)도 렌더링
    expect(await screen.findByText('비타민C 세럼')).toBeInTheDocument();

    // DB 쿼리가 ov 필터 단독이 아닌 or(ov, is.null) 형태여야 함
    const orCalls = queryCalls.filter((c) => c.method === 'or');
    expect(
      orCalls.some(
        (c) => typeof c.args[0] === 'string' && (c.args[0] as string).includes('skin_types.is.null')
      )
    ).toBe(true);
    // 구현이 ov 단독 filter로 회귀하지 않았는지 (null 제외 버그 방지)
    const filterCalls = queryCalls.filter((c) => c.method === 'filter');
    expect(filterCalls.some((c) => c.args[0] === 'skin_types')).toBe(false);
  });

  it('스킨케어 > 세럼/앰플 선택 시 DB 실값(category=serum)으로 조회해 N>0개가 나온다', async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    queryCalls.length = 0;
    await user.click(screen.getByRole('tab', { name: '스킨케어' }));
    await user.click(await screen.findByText('세럼/앰플'));

    // 유령 값(subcategory='serum' eq)이 아닌 category IN ('serum') 조회여야 함
    const inCalls = queryCalls.filter((c) => c.method === 'in');
    expect(
      inCalls.some((c) => c.args[0] === 'category' && (c.args[1] as string[]).includes('serum'))
    ).toBe(true);
    const eqCalls = queryCalls.filter((c) => c.method === 'eq');
    expect(eqCalls.some((c) => c.args[0] === 'subcategory')).toBe(false);

    // 결과가 0개가 아니어야 함 (사용자 스크린샷 버그 회귀 방지)
    expect(await screen.findByText('비타민C 세럼')).toBeInTheDocument();
    expect(screen.queryByText('아직 딱 맞는 제품을 찾지 못했어요')).not.toBeInTheDocument();
  });

  it('메이크업 대분류가 존재하고 DB category=makeup으로 조회한다', async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('히알루론 수분 크림');

    queryCalls.length = 0;
    await user.click(screen.getByRole('tab', { name: '메이크업' }));

    const inCalls = queryCalls.filter((c) => c.method === 'in');
    expect(
      inCalls.some((c) => c.args[0] === 'category' && (c.args[1] as string[]).includes('makeup'))
    ).toBe(true);
  });

  it('매칭 필터 ON + 임계(80) 미달이면 자동 완화 안내와 함께 전체를 보여준다', async () => {
    const user = userEvent.setup();
    renderTab({ getMatchedProducts: mockLowMatchProducts });
    await screen.findByText('히알루론 수분 크림');

    await user.click(screen.getByTestId('beauty-match-toggle'));

    // 0개로 숨기는 대신 안내 + 매칭률순 전체 표시
    expect(await screen.findByTestId('beauty-match-relaxed-notice')).toBeInTheDocument();
    expect(screen.getByText('히알루론 수분 크림')).toBeInTheDocument();
    expect(screen.queryByText('아직 딱 맞는 제품을 찾지 못했어요')).not.toBeInTheDocument();
  });

  it('매칭 필터 ON + 임계 이상 제품이 있으면 안내 없이 필터만 적용된다', async () => {
    const user = userEvent.setup();
    renderTab(); // 92% — 임계(80) 이상
    await screen.findByText('히알루론 수분 크림');

    await user.click(screen.getByTestId('beauty-match-toggle'));
    await screen.findByText('히알루론 수분 크림');

    expect(screen.queryByTestId('beauty-match-relaxed-notice')).not.toBeInTheDocument();
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
