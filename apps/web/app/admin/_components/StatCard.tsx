'use client';

import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Palette,
  Sparkles,
  Dumbbell,
  Apple,
  Package,
  Heart,
  Activity,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';

// 사용 가능한 아이콘 맵
const iconMap: Record<string, LucideIcon> = {
  users: Users,
  userPlus: UserPlus,
  palette: Palette,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  apple: Apple,
  package: Package,
  heart: Heart,
  activity: Activity,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
};

export type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: IconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  const Icon = iconMap[icon] || Package;

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-gray-100',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-gray-400 font-normal ml-1">지난주 대비</span>
            </p>
          )}
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
    </div>
  );
}
