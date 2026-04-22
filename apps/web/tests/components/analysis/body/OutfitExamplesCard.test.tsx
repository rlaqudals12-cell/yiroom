/**
 * OutfitExamplesCard 테스트 — ADR-098 C-1 3섹션 구조 ②
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OutfitExamplesCard } from '@/components/analysis/body/OutfitExamplesCard';
import { getOutfitExamples } from '@/lib/color-recommendations';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('OutfitExamplesCard', () => {
  it('퍼스널컬러가 있으면 해당 시즌 코디를 보여준다', () => {
    render(<OutfitExamplesCard bodyType="S" personalColorSeason="Spring" />);

    expect(screen.getByTestId('outfit-examples-card')).toBeInTheDocument();
    const springOutfits = getOutfitExamples('S', 'Spring');
    expect(springOutfits.length).toBeGreaterThan(0);
    expect(screen.getByText(springOutfits[0].title)).toBeInTheDocument();
  });

  it('퍼스널컬러가 없으면 PC 분석 유도 배너와 중립 시즌 fallback을 보여준다', () => {
    render(<OutfitExamplesCard bodyType="W" personalColorSeason={null} />);

    expect(screen.getByTestId('outfit-examples-card')).toBeInTheDocument();
    // PC 분석 유도 링크
    expect(screen.getByText(/퍼스널 컬러를 분석하면/)).toBeInTheDocument();
    // 중립 fallback(Autumn) 데이터가 렌더링됨
    const fallbackOutfits = getOutfitExamples('W', 'Autumn');
    expect(fallbackOutfits.length).toBeGreaterThan(0);
    expect(screen.getByText(fallbackOutfits[0].title)).toBeInTheDocument();
  });

  it('퍼스널컬러가 있을 때는 PC 분석 유도 배너를 숨긴다', () => {
    render(<OutfitExamplesCard bodyType="N" personalColorSeason="Winter" />);

    expect(screen.queryByText(/퍼스널 컬러를 분석하면/)).not.toBeInTheDocument();
  });

  it('각 코디에 아이템 목록과 occasion 배지를 렌더링한다', () => {
    render(<OutfitExamplesCard bodyType="S" personalColorSeason="Spring" />);

    const outfit = getOutfitExamples('S', 'Spring')[0];
    expect(screen.getByText(outfit.occasion)).toBeInTheDocument();
    outfit.items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });
});
