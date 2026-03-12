'use client';

import { AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TrendAlert } from '@/lib/skin-diary';

interface AlertBannerProps {
  alerts: TrendAlert[];
}

const ALERT_ICONS = {
  deterioration: AlertTriangle,
  improvement: TrendingUp,
  milestone: Award,
} as const;

const ALERT_STYLES = {
  deterioration:
    'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
  improvement:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  milestone:
    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
} as const;

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="alert-banner">
      {alerts.map((alert, idx) => {
        const Icon = ALERT_ICONS[alert.type];
        return (
          <Alert
            key={`${alert.type}-${alert.category}-${idx}`}
            className={ALERT_STYLES[alert.type]}
          >
            <Icon className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">{alert.message}</p>
              {alert.suggestion && <p className="text-sm mt-1 opacity-80">{alert.suggestion}</p>}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
