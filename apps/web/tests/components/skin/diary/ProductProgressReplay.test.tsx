import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProductProgressReplay from '@/components/skin/diary/ProductProgressReplay';
import type { ProductProgressReplay as ProductProgressReplayData } from '@/lib/product-tracking';

const replay: ProductProgressReplayData = {
  product: {
    id: 'shelf-1',
    productId: 'product-1',
    productName: '세라마이드 크림',
    productBrand: '이룸랩',
    category: 'skincare',
    startDate: '2026-08-10T00:00:00.000Z',
    isActive: true,
  },
  beforeSnapshot: { date: '2026-08-09T00:00:00.000Z', skin: { hydration: 55 } },
  afterSnapshot: { date: '2026-08-25T00:00:00.000Z', skin: { hydration: 65 } },
  analysis: {
    productId: 'product-1',
    productName: '세라마이드 크림',
    durationDays: 15,
    changes: [
      {
        metricId: 'hydration',
        metricName: '수분도',
        before: 55,
        after: 65,
        change: 10,
        changePercent: 18,
        trend: 'improved',
      },
    ],
    summary: '기록 비교',
    reliability: 'medium',
  },
  includesFallback: false,
};

describe('ProductProgressReplay', () => {
  it('개봉일·기록 반응·전후 원값만 보여주고 인과를 부정한다', () => {
    render(
      <ProductProgressReplay
        items={[
          {
            id: 'shelf-1',
            brand: '이룸랩',
            openedAt: '2026-08-10T00:00:00.000Z',
            reactionLabel: '잘 맞아요로 기록',
            replay,
          },
        ]}
      />
    );

    expect(screen.getByTestId('product-progress-replay')).toHaveTextContent(
      '제품의 효과나 변화의 원인으로 단정하지 않아요'
    );
    expect(screen.getByTestId('product-progress-replay')).toHaveTextContent(
      '계속 사용했는지는 확인할 수 없으며'
    );
    expect(screen.getByText(/잘 맞아요로 기록/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /세라마이드 크림/ }));
    expect(screen.getByText('55 → 65')).toBeInTheDocument();
    expect(screen.queryByText(/개선|효과적|기여도/)).not.toBeInTheDocument();
  });

  it('전후 기록이 없으면 필요한 실제 데이터 조건을 알린다', () => {
    render(<ProductProgressReplay items={[]} />);
    expect(screen.getByText(/개봉일이 기록된 제품과 전후 피부 분석/)).toBeInTheDocument();
  });

  it('전후 중 예시 결과가 있으면 낮은 신뢰도를 접힌 제목에서도 알린다', () => {
    render(
      <ProductProgressReplay
        items={[
          {
            id: 'shelf-1',
            openedAt: '2026-08-10T00:00:00.000Z',
            reactionLabel: '반응 미기록',
            replay: { ...replay, includesFallback: true },
          },
        ]}
      />
    );

    expect(screen.getByText(/예시 결과 포함·낮은 신뢰도/)).toBeInTheDocument();
  });

  it('조회 실패를 데이터가 없는 상태와 구분한다', () => {
    render(<ProductProgressReplay items={[]} error />);
    expect(screen.getByRole('alert')).toHaveTextContent('제품 경과 기록을 불러오지 못했어요');
    expect(screen.queryByText(/개봉일이 기록된 제품과 전후 피부 분석/)).not.toBeInTheDocument();
  });
});
