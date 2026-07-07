/**
 * PriceTrendBadge 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceTrendBadge } from '@/components/smart-matching/PriceTrendBadge';

describe('PriceTrendBadge', () => {
  it('상승 트렌드를 표시한다', () => {
    render(<PriceTrendBadge trend="rising" />);

    // i18n 마이그레이션: 라벨은 smartMatchingUI.priceTrendBadge0 키로 렌더링 (테스트 목은 키 반환)
    expect(screen.getByText('priceTrendBadge0')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('하락 트렌드를 표시한다', () => {
    render(<PriceTrendBadge trend="falling" />);

    // i18n 마이그레이션: 라벨은 smartMatchingUI.priceTrendBadge1 키로 렌더링
    expect(screen.getByText('priceTrendBadge1')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('안정 트렌드를 표시한다', () => {
    render(<PriceTrendBadge trend="stable" />);

    // i18n 마이그레이션: 라벨은 smartMatchingUI.priceTrendBadge2 키로 렌더링
    expect(screen.getByText('priceTrendBadge2')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('변화율을 표시한다', () => {
    render(<PriceTrendBadge trend="falling" changePercent={-8.5} />);

    expect(screen.getByText('(-8.5%)')).toBeInTheDocument();
  });

  it('양수 변화율에 + 기호를 붙인다', () => {
    render(<PriceTrendBadge trend="rising" changePercent={5.2} />);

    expect(screen.getByText('(+5.2%)')).toBeInTheDocument();
  });

  it('0% 변화율은 표시하지 않는다', () => {
    render(<PriceTrendBadge trend="stable" changePercent={0} />);

    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    render(<PriceTrendBadge trend="stable" />);

    expect(screen.getByTestId('price-trend-badge')).toBeInTheDocument();
  });

  it('커스텀 className을 적용할 수 있다', () => {
    render(<PriceTrendBadge trend="rising" className="custom-class" />);

    expect(screen.getByTestId('price-trend-badge')).toHaveClass('custom-class');
  });
});
