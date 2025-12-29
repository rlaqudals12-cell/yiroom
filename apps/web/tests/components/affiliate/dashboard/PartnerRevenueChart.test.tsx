/**
 * PartnerRevenueChart 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerRevenueChart } from '@/components/affiliate/dashboard/PartnerRevenueChart';
import type { PartnerRevenue } from '@/lib/affiliate/stats';

const mockPartners: PartnerRevenue[] = [
  {
    partnerId: 'coupang',
    partnerName: '쿠팡',
    clicks: 500,
    conversions: 15,
    salesKrw: 750000,
    commissionKrw: 22500,
    conversionRate: 3.0,
  },
  {
    partnerId: 'iherb',
    partnerName: 'iHerb',
    clicks: 300,
    conversions: 10,
    salesKrw: 500000,
    commissionKrw: 15000,
    conversionRate: 3.33,
  },
  {
    partnerId: 'musinsa',
    partnerName: '무신사',
    clicks: 200,
    conversions: 5,
    salesKrw: 250000,
    commissionKrw: 7500,
    conversionRate: 2.5,
  },
];

describe('PartnerRevenueChart', () => {
  it('로딩 상태를 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} isLoading={true} />);

    expect(screen.getByTestId('partner-revenue-loading')).toBeInTheDocument();
  });

  it('파트너별 수익 차트를 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} />);

    expect(screen.getByTestId('partner-revenue-chart')).toBeInTheDocument();
    expect(screen.getByText('파트너별 수익')).toBeInTheDocument();
  });

  it('모든 파트너 이름을 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} />);

    expect(screen.getByText('쿠팡')).toBeInTheDocument();
    expect(screen.getByText('iHerb')).toBeInTheDocument();
    expect(screen.getByText('무신사')).toBeInTheDocument();
  });

  it('파트너별 수익을 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} />);

    expect(screen.getByText('₩22,500')).toBeInTheDocument();
    expect(screen.getByText('₩15,000')).toBeInTheDocument();
    expect(screen.getByText('₩7,500')).toBeInTheDocument();
  });

  it('클릭 수를 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} />);

    expect(screen.getByText(/클릭: 500/)).toBeInTheDocument();
    expect(screen.getByText(/클릭: 300/)).toBeInTheDocument();
    expect(screen.getByText(/클릭: 200/)).toBeInTheDocument();
  });

  it('전환율을 표시한다', () => {
    render(<PartnerRevenueChart partners={mockPartners} />);

    expect(screen.getByText(/전환율: 3.00%/)).toBeInTheDocument();
    expect(screen.getByText(/전환율: 3.33%/)).toBeInTheDocument();
    expect(screen.getByText(/전환율: 2.50%/)).toBeInTheDocument();
  });
});
