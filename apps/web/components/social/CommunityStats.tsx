'use client';

import { useState, useEffect } from 'react';
import { Users, Utensils, Droplets, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommunityStatsData {
  mealRecords: number;
  waterRecords: number;
  workoutRecords: number;
  activeUsers: number;
}

interface CommunityStatsProps {
  className?: string;
  variant?: 'compact' | 'full';
}

/**
 * 익명 커뮤니티 통계 컴포넌트
 * "오늘 123명이 식단 기록" 같은 표시
 */
export function CommunityStats({ className, variant = 'compact' }: CommunityStatsProps) {
  const [stats, setStats] = useState<CommunityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/community/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('[CommunityStats] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 숫자 포맷 (1000 -> 1천)
  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${Math.floor(num / 10000)}만`;
    if (num >= 1000) return `${Math.floor(num / 1000)}천`;
    return num.toString();
  };

  if (isLoading) {
    return <div className={cn('animate-pulse bg-muted rounded-lg h-8', className)} />;
  }

  if (!stats || stats.activeUsers === 0) {
    return null;
  }

  // 컴팩트 버전: 한 줄 텍스트
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground',
          'bg-muted/50 rounded-full px-3 py-1.5',
          className
        )}
        data-testid="community-stats-compact"
      >
        <Users className="h-4 w-4" />
        <span>
          오늘 <strong className="text-foreground">{formatNumber(stats.activeUsers)}명</strong>이
          함께 기록 중
        </span>
      </div>
    );
  }

  // 전체 버전: 카드 형태
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg',
        'bg-gradient-to-r from-muted/30 to-muted/10',
        className
      )}
      data-testid="community-stats-full"
    >
      <StatItem
        icon={<Users className="h-4 w-4" />}
        label="활성 사용자"
        value={formatNumber(stats.activeUsers)}
        colorClass="text-blue-500"
      />
      <StatItem
        icon={<Utensils className="h-4 w-4" />}
        label="식단 기록"
        value={formatNumber(stats.mealRecords)}
        colorClass="text-module-nutrition"
      />
      <StatItem
        icon={<Droplets className="h-4 w-4" />}
        label="물 기록"
        value={formatNumber(stats.waterRecords)}
        colorClass="text-cyan-500"
      />
      <StatItem
        icon={<Dumbbell className="h-4 w-4" />}
        label="운동 기록"
        value={formatNumber(stats.workoutRecords)}
        colorClass="text-module-workout"
      />
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}

function StatItem({ icon, label, value, colorClass }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('p-1.5 rounded-full bg-background', colorClass)}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-lg font-semibold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
