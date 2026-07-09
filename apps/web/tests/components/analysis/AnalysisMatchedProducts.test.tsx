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

  it('4개 이상이면 상위 3개는 순위, 나머지는 기존 그리드로 표시한다', async () => {
    mockFetchProducts([
      { product: makeCosmetic('p1', '세럼A'), matchScore: 95, matchReasons: ['건성'] },
      { product: makeCosmetic('p2', '세럼B'), matchScore: 90, matchReasons: ['여름 쿨톤'] },
      { product: makeCosmetic('p3', '세럼C'), matchScore: 85, matchReasons: ['저자극'] },
      { product: makeCosmetic('p4', '세럼D'), matchScore: 60, matchReasons: ['지성'] },
    ]);

    render(<AnalysisMatchedProducts analysisType="skin" maxProducts={4} />);

    await screen.findByTestId('matched-products-ranked');
    expect(screen.getAllByTestId('rank-badge')).toHaveLength(3);
    const rest = screen.getByTestId('matched-products-rest');
    expect(rest).toBeInTheDocument();
    // 4번째 제품(적합도 60점)은 그리드에 "적합도 60점" 배지로 표시
    expect(rest).toHaveTextContent('적합도 60점');
  });

  it('제품이 없으면 안내 폴백을 표시한다', async () => {
    mockFetchProducts([]);

    render(<AnalysisMatchedProducts analysisType="skin" />);

    await waitFor(() => {
      expect(screen.getByTestId('matched-products-empty')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('rank-badge')).not.toBeInTheDocument();
  });
});
