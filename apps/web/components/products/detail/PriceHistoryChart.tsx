'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProductPriceHistory } from '@/types/product';

interface PriceHistoryChartProps {
  priceHistory: ProductPriceHistory[];
  currentPrice: number;
}

export function PriceHistoryChart({ priceHistory, currentPrice }: PriceHistoryChartProps) {
  // 차트 데이터 변환 (오래된 순으로 정렬)
  const chartData = useMemo(() => {
    return [...priceHistory]
      .reverse()
      .map((item) => ({
        date: new Date(item.recordedAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
        price: item.priceKrw,
      }));
  }, [priceHistory]);

  // 가격 통계 계산
  const stats = useMemo(() => {
    if (priceHistory.length === 0) {
      return { min: currentPrice, max: currentPrice, avg: currentPrice, trend: 'stable' as const };
    }

    const prices = priceHistory.map((p) => p.priceKrw);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

    // 최근 가격 대비 트렌드
    const recentPrice = priceHistory[0]?.priceKrw ?? currentPrice;
    const oldPrice = priceHistory[priceHistory.length - 1]?.priceKrw ?? currentPrice;
    const trend: 'up' | 'down' | 'stable' =
      recentPrice > oldPrice * 1.05 ? 'up' : recentPrice < oldPrice * 0.95 ? 'down' : 'stable';

    return { min, max, avg, trend };
  }, [priceHistory, currentPrice]);

  // 가격 포맷
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">가격 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            아직 가격 기록이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">가격 히스토리</CardTitle>
          <div className="flex items-center gap-1 text-sm">
            {stats.trend === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-green-600">하락세</span>
              </>
            )}
            {stats.trend === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-red-600">상승세</span>
              </>
            )}
            {stats.trend === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">안정</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 가격 통계 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">최저가</p>
            <p className="text-sm font-semibold text-green-600">{formatPrice(stats.min)}원</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">평균가</p>
            <p className="text-sm font-semibold text-gray-700">{formatPrice(stats.avg)}원</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">최고가</p>
            <p className="text-sm font-semibold text-red-600">{formatPrice(stats.max)}원</p>
          </div>
        </div>

        {/* 차트 */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${formatPrice(value)}원`, '가격']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ fill: '#ec4899', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#ec4899' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 현재가 표시 */}
        {currentPrice !== stats.avg && (
          <p className="text-xs text-center text-gray-500">
            현재가 <span className="font-medium">{formatPrice(currentPrice)}원</span>
            {currentPrice <= stats.min && (
              <span className="text-green-600 ml-1">(역대 최저가)</span>
            )}
            {currentPrice < stats.avg && currentPrice > stats.min && (
              <span className="text-green-600 ml-1">(평균 이하)</span>
            )}
            {currentPrice > stats.avg && (
              <span className="text-red-500 ml-1">(평균 이상)</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
