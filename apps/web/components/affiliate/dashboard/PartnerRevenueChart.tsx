/**
 * 파트너별 수익 차트
 * @description 파트너별 클릭/전환/수익 비교
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PartnerRevenue } from '@/lib/affiliate/stats';

interface PartnerRevenueChartProps {
  partners: PartnerRevenue[];
  isLoading?: boolean;
}

// 파트너별 색상
const partnerColors: Record<string, string> = {
  coupang: 'bg-red-500',
  iherb: 'bg-green-500',
  musinsa: 'bg-black',
};

const partnerBgColors: Record<string, string> = {
  coupang: 'bg-red-100',
  iherb: 'bg-green-100',
  musinsa: 'bg-gray-200',
};

export function PartnerRevenueChart({ partners, isLoading }: PartnerRevenueChartProps) {
  if (isLoading) {
    return (
      <Card data-testid="partner-revenue-loading">
        <CardHeader>
          <CardTitle>파트너별 수익</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxCommission = Math.max(...partners.map((p) => p.commissionKrw), 1);
  const totalCommission = partners.reduce((sum, p) => sum + p.commissionKrw, 0);

  return (
    <Card data-testid="partner-revenue-chart">
      <CardHeader>
        <CardTitle>파트너별 수익</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {partners.map((partner) => {
          const percentage = (partner.commissionKrw / maxCommission) * 100;
          const share = totalCommission > 0
            ? ((partner.commissionKrw / totalCommission) * 100).toFixed(1)
            : '0';

          return (
            <div key={partner.partnerId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${partnerColors[partner.partnerId] || 'bg-gray-400'}`}
                  />
                  <span className="font-medium">{partner.partnerName}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">₩{partner.commissionKrw.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{share}%</div>
                </div>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${partnerBgColors[partner.partnerId] || 'bg-gray-100'}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>클릭: {partner.clicks.toLocaleString()}</span>
                <span>전환: {partner.conversions}</span>
                <span>전환율: {partner.conversionRate.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
