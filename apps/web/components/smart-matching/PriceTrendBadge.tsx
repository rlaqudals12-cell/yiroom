'use client';

/**
 * 가격 트렌드 배지
 * @description 가격 상승/하락/안정 표시
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface PriceTrendBadgeProps {
  trend: 'rising' | 'falling' | 'stable';
  changePercent?: number;
  className?: string;
}

export function PriceTrendBadge({ trend, changePercent, className }: PriceTrendBadgeProps) {
  const t = useTranslations('smartMatchingUI');
  const config = {
    rising: {
      label: t('priceTrendBadge0'),
      icon: '↑',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
    falling: {
      label: t('priceTrendBadge1'),
      icon: '↓',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    stable: {
      label: t('priceTrendBadge2'),
      icon: '→',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  };

  const { label, icon, color } = config[trend];

  return (
    <Badge
      variant="outline"
      className={cn('text-xs', color, className)}
      data-testid="price-trend-badge"
    >
      <span className="mr-1">{icon}</span>
      {label}
      {changePercent !== undefined && changePercent !== 0 && (
        <span className="ml-1">
          ({changePercent > 0 ? '+' : ''}
          {changePercent.toFixed(1)}%)
        </span>
      )}
    </Badge>
  );
}
