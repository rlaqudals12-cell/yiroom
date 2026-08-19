import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CurationCard } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/CurationCard';
import type { Curation, CurationProduct } from '@/lib/analysis/integrated';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const curation: Curation = { items: [] };

function makeProduct(overrides: Partial<CurationProduct> = {}): CurationProduct {
  return {
    id: 'product-1',
    name: '수분 세럼',
    brand: '이룸랩',
    priceKrw: 20000,
    reason: '높은 평점',
    matchScore: 99,
    imageUrl: null,
    ...overrides,
  };
}

describe('CurationCard 개인 적합도 정직성', () => {
  it('개인 제품 태그가 없으면 BEST·적합도는 숨기고 안내와 사실 라벨만 보여준다', async () => {
    const ui = await CurationCard({
      curation,
      products: [makeProduct({ personalMatched: false })],
    });

    render(ui);

    expect(screen.getByTestId('curation-match-guidance')).toHaveTextContent(
      '제품 태그가 부족해 개인 적합도와 BEST 표시는 숨기고 제품 정보만 보여드려요.'
    );
    expect(screen.queryByTestId('curation-rank-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('curation-rank-reason')).not.toBeInTheDocument();
    expect(screen.getByText('높은 평점')).toBeInTheDocument();
  });

  it('personalMatched=true인 제품에만 BEST와 적합도를 보여준다', async () => {
    const ui = await CurationCard({
      curation,
      products: [
        makeProduct({
          personalMatched: true,
          reason: '건성 피부 적합 — 내 프로필에 잘 맞아요',
          matchScore: 88,
        }),
      ],
    });

    render(ui);

    expect(screen.getByTestId('curation-rank-badge')).toBeInTheDocument();
    expect(screen.getByTestId('curation-rank-reason')).toHaveTextContent('나와의 적합도 88점');
    expect(screen.queryByTestId('curation-match-guidance')).not.toBeInTheDocument();
  });
});
