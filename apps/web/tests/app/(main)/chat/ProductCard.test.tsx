/**
 * 코치 채팅 ProductCard 테스트
 * - 제휴(어필리에이트) 링크 카드는 '제휴' 뱃지 + 제휴 고지를 노출 (표시광고법·FTC §255.5)
 * - 내부 상세 이동 카드(제휴 아님)는 고지를 노출하지 않음
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/app/(main)/chat/_components/ProductCard';
import type { ProductRecommendation } from '@/types/chat';

const affiliateProduct: ProductRecommendation = {
  productId: 'p1',
  productName: '수분 세럼',
  reason: '건성 피부에 맞아요',
  affiliateUrl: 'https://coupang.com/p/1',
};

const internalProduct: ProductRecommendation = {
  productId: 'p2',
  productName: '진정 토너',
  reason: '민감성에 맞아요',
};

describe('chat ProductCard', () => {
  it('제품 정보를 렌더링한다', () => {
    render(<ProductCard product={internalProduct} />);
    expect(screen.getByTestId('product-card')).toBeInTheDocument();
    expect(screen.getByText('진정 토너')).toBeInTheDocument();
  });

  it('제휴 링크 카드는 제휴 뱃지와 고지를 노출한다', () => {
    render(<ProductCard product={affiliateProduct} />);

    expect(screen.getByText('제휴')).toBeInTheDocument();
    expect(screen.getByText(/수수료를 제공받습니다/)).toBeInTheDocument();
  });

  it('내부 상세 이동 카드는 제휴 고지를 노출하지 않는다', () => {
    render(<ProductCard product={internalProduct} />);

    expect(screen.queryByText('제휴')).not.toBeInTheDocument();
    expect(screen.queryByText(/수수료를 제공받습니다/)).not.toBeInTheDocument();
  });
});
