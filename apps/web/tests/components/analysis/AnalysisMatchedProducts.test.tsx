import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AnalysisMatchedProducts } from '@/components/analysis/AnalysisMatchedProducts';
import type { CosmeticProduct } from '@/types/product';

// next/image · next/link 모킹 (jsdom 렌더용)
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function makeCosmetic(id: string, name: string): CosmeticProduct {
  return {
    id,
    name,
    brand: `${name} 브랜드`,
    category: 'serum',
    priceKrw: 30000,
    imageUrl: `https://example.com/${id}.jpg`,
  };
}

interface MatchedRow {
  product: CosmeticProduct;
  matchScore: number;
  matchReasons: string[];
}

function mockFetchProducts(rows: MatchedRow[]): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ products: rows }),
  }) as unknown as typeof fetch;
}

describe('AnalysisMatchedProducts (BEST 순위 표현)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('상위 3개에 BEST 1/2/3 메달 배지를 렌더한다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 70, matchReasons: ['건성'] },
      { product: makeCosmetic('p2', '세럼B'), matchScore: 92, matchReasons: ['여름 쿨톤'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 81, matchReasons: ['저자극'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    const badges = await screen.findAllByTestId('rank-badge');
    expect(badges).toHaveLength(3);
    // 적합도 내림차순 정렬 → BEST 1 = 92점 세럼B
    expect(badges[0]).toHaveTextContent('BEST 1');
    expect(badges[1]).toHaveTextContent('BEST 2');
    expect(badges[2]).toHaveTextContent('BEST 3');
  });

  it('각 순위에 "나와의 적합도 N점" 이유 한 줄을 표시한다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p2', '세럼B'), matchScore: 92, matchReasons: ['여름 쿨톤', '건성'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 81, matchReasons: ['저자극'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    const reasons = await screen.findAllByTestId('rank-reason');
    expect(reasons[0]).toHaveTextContent('나와의 적합도 92점 — 여름 쿨톤·건성에 모두 맞아요');
    expect(reasons[1]).toHaveTextContent('나와의 적합도 81점 — 저자극에 맞아요');
  });

  it('BEST 1·2 고유 이유가 다르면 비교 캡션을 표시한다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p2', '세럼B'), matchScore: 92, matchReasons: ['여름 쿨톤', '건성'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 81, matchReasons: ['건성', '저자극'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    const comparison = await screen.findByTestId('rank-comparison');
    expect(comparison).toHaveTextContent('BEST 1은 여름 쿨톤, BEST 2는 저자극이 강점이에요');
  });

  it('BEST 1·2 이유가 동일하면 비교 캡션을 생략한다(지어내지 않음)', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p2', '세럼B'), matchScore: 92, matchReasons: ['건성'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 81, matchReasons: ['건성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    await screen.findByTestId('matched-products-ranked');
    expect(screen.queryByTestId('rank-comparison')).not.toBeInTheDocument();
  });

  it('4개면 상위 3개만 순위로 노출하고 남는 1개는 고아 카드로 떨구지 않는다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 95, matchReasons: ['건성'] },
      { product: makeCosmetic('p2', '세럼B'), matchScore: 90, matchReasons: ['여름 쿨톤'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 85, matchReasons: ['저자극'] },
      { product: makeCosmetic('p4', '세럼D'), matchScore: 60, matchReasons: ['지성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" maxProducts={4} />);

    await screen.findByTestId('matched-products-ranked');
    expect(screen.getAllByTestId('rank-badge')).toHaveLength(3);
    // 남는 1개는 별도 그리드(고아)로 렌더하지 않는다 — "맞춤 제품 더 보기"로 정리
    expect(screen.queryByTestId('matched-products-rest')).not.toBeInTheDocument();
  });

  it('나머지가 2개 이상이면 BEST와 동일한 열 그리드(sm:grid-cols-3)로 카드 폭을 통일한다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 95, matchReasons: ['건성'] },
      { product: makeCosmetic('p2', '세럼B'), matchScore: 90, matchReasons: ['여름 쿨톤'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 85, matchReasons: ['저자극'] },
      { product: makeCosmetic('p4', '세럼D'), matchScore: 60, matchReasons: ['지성'] },
      { product: makeCosmetic('p5', '세럼E'), matchScore: 55, matchReasons: ['복합성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" maxProducts={5} />);

    const rest = await screen.findByTestId('matched-products-rest');
    // BEST 그리드와 동일한 3열 → 카드 폭 일치(4열이던 크기 어긋남 회귀 방지)
    expect(rest.className).toContain('sm:grid-cols-3');
    expect(rest).toHaveTextContent('적합도 60점');
    expect(rest).toHaveTextContent('적합도 55점');
  });

  it('BEST 그리드는 3열 균등, 이유 줄은 최소 높이를 예약해 첫 카드만 커 보이는 어긋남을 막는다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 92, matchReasons: ['여름 쿨톤', '건성'] },
      { product: makeCosmetic('p2', '세럼B'), matchScore: 88, matchReasons: ['저자극'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 80, matchReasons: ['건성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    const ranked = await screen.findByTestId('matched-products-ranked');
    // 3열 균등 그리드 → BEST 1·2·3 카드 폭 일치
    expect(ranked.className).toContain('sm:grid-cols-3');
    // 이유 줄 높이 예약 → 줄 수 차이로 셀 높이가 어긋나지 않음
    const reasons = screen.getAllByTestId('rank-reason');
    expect(reasons).toHaveLength(3);
    reasons.forEach((r) => expect(r.className).toContain('min-h-'));
  });

  it('제품이 없으면 안내 폴백을 표시한다', async () => {
    mockFetchProducts([]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    await waitFor(() => {
      expect(screen.getByTestId('matched-products-empty')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('rank-badge')).not.toBeInTheDocument();
  });

  it('추천 제품이 있으면 제휴 고지를 섹션 하단에 표시한다 (표시광고법·FTC §255.5)', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 92, matchReasons: ['건성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    await screen.findByTestId('matched-products-ranked');
    expect(screen.getByText(/수수료를 제공받습니다/)).toBeInTheDocument();
  });

  describe('"맞춤 제품 더 보기" 도착지 (0개 페이지 회귀 방지)', () => {
    // 근본 수리: 기존 `/products?category=cosmetic&sort=match`는 'cosmetic'이 카테고리 값이 아니라
    // (prod 실측 category='cosmetic' → 0행) 어디서도 매칭되지 않았고, /products는 /beauty로
    // 리다이렉트되며 파라미터가 유실됐다. 화장품 정본(/beauty)으로 filter 프리셋과 함께 보낸다.
    async function moreLinkHref(analysisType: string): Promise<string | null> {
      mockFetchProducts([
        { product: makeCosmetic('p1', '제품A'), matchScore: 90, matchReasons: ['건성'] },
      ]);
      render(<AnalysisMatchedProducts analysisType={analysisType} />);
      const link = await screen.findByText('맞춤 제품 더 보기');
      return link.closest('a')?.getAttribute('href') ?? null;
    }

    it('피부 분석 → /beauty?filter=skin (스킨케어 프리셋)', async () => {
      expect(await moreLinkHref('skin')).toBe('/beauty?filter=skin');
    });

    it('퍼스널컬러 → /beauty?filter=personal-color (메이크업 프리셋)', async () => {
      expect(await moreLinkHref('personal-color')).toBe('/beauty?filter=personal-color');
    });

    it('메이크업 → /beauty?filter=personal-color (색조 프리셋)', async () => {
      expect(await moreLinkHref('makeup')).toBe('/beauty?filter=personal-color');
    });

    it('더 이상 죽은 category=cosmetic 링크를 만들지 않는다 (0개 페이지 원인 제거)', async () => {
      const href = await moreLinkHref('skin');
      expect(href).not.toContain('category=cosmetic');
      expect(href).not.toContain('sort=match');
      expect(href?.startsWith('/beauty')).toBe(true);
    });
  });
});
