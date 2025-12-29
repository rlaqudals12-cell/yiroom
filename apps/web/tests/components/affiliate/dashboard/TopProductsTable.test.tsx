/**
 * TopProductsTable 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopProductsTable } from '@/components/affiliate/dashboard/TopProductsTable';
import type { TopProduct } from '@/lib/affiliate/stats';

const mockProducts: TopProduct[] = [
  {
    productId: 'p1',
    productName: '프리미엄 비타민C 1000mg',
    partnerId: 'iherb',
    clicks: 100,
    conversions: 5,
    commissionKrw: 5000,
  },
  {
    productId: 'p2',
    productName: '무신사 스탠다드 반팔티',
    partnerId: 'musinsa',
    clicks: 80,
    conversions: 3,
    commissionKrw: 3600,
  },
  {
    productId: 'p3',
    productName: '닥터자르트 크림',
    partnerId: 'coupang',
    clicks: 60,
    conversions: 2,
    commissionKrw: 2000,
  },
];

describe('TopProductsTable', () => {
  it('로딩 상태를 표시한다', () => {
    render(<TopProductsTable products={mockProducts} isLoading={true} />);

    expect(screen.getByTestId('top-products-loading')).toBeInTheDocument();
  });

  it('인기 제품 테이블을 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByTestId('top-products-table')).toBeInTheDocument();
    expect(screen.getByText('인기 제품 TOP 10')).toBeInTheDocument();
  });

  it('순위를 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('제품 이름을 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText('프리미엄 비타민C 1000mg')).toBeInTheDocument();
    expect(screen.getByText('무신사 스탠다드 반팔티')).toBeInTheDocument();
    expect(screen.getByText('닥터자르트 크림')).toBeInTheDocument();
  });

  it('파트너 배지를 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText('iherb')).toBeInTheDocument();
    expect(screen.getByText('musinsa')).toBeInTheDocument();
    expect(screen.getByText('coupang')).toBeInTheDocument();
  });

  it('클릭 및 전환 정보를 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText(/클릭 100/)).toBeInTheDocument();
    expect(screen.getByText(/전환 5/)).toBeInTheDocument();
  });

  it('수익을 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText('₩5,000')).toBeInTheDocument();
    expect(screen.getByText('₩3,600')).toBeInTheDocument();
    expect(screen.getByText('₩2,000')).toBeInTheDocument();
  });

  it('빈 배열일 때 메시지를 표시한다', () => {
    render(<TopProductsTable products={[]} />);

    expect(screen.getByText('아직 클릭 데이터가 없습니다')).toBeInTheDocument();
  });

  it('전환율을 표시한다', () => {
    render(<TopProductsTable products={mockProducts} />);

    expect(screen.getByText('전환율 5.0%')).toBeInTheDocument();
  });
});
