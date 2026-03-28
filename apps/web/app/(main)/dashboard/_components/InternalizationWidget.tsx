'use client';

/**
 * 대시보드 내재화 위젯 — ConnectionAwareness 통계 시각화
 *
 * 사용자의 자기 이해 내재화 진행도를 4단계 분포 차트로 표시
 * North Star: "월간 자립적 판단 횟수" 기반
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Brain, TrendingUp } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import type { ConnectionStats } from '@/lib/connection-awareness';
import { getConnectionStats } from '@/lib/connection-awareness';

// 상태별 색상 (label은 컴포넌트 내 t()에서 주입)
const STATUS_CONFIG = {
  exposed: {
    labelKey: 'internalization.exposed',
    color: 'bg-slate-300 dark:bg-slate-600',
    textColor: 'text-slate-500',
  },
  recognized: {
    labelKey: 'internalization.recognized',
    color: 'bg-violet-300 dark:bg-violet-700',
    textColor: 'text-violet-500',
  },
  internalized: {
    labelKey: 'internalization.internalized',
    color: 'bg-indigo-400 dark:bg-indigo-600',
    textColor: 'text-indigo-500',
  },
  independent: {
    labelKey: 'internalization.independent',
    color: 'bg-emerald-400 dark:bg-emerald-600',
    textColor: 'text-emerald-500',
  },
} as const;

export default function InternalizationWidget() {
  const t = useTranslations('dashboard');
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function load(): Promise<void> {
      try {
        const result = await getConnectionStats(supabase, user!.id);
        setStats(result);
      } catch {
        // 테이블 없으면 무시
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  // 데이터 없으면 숨김
  if (!stats || stats.totalConnections === 0) return null;

  const rate = Math.round(stats.internalizationRate * 100);
  const growthMessage =
    rate >= 50 ? t('internalization.deepUnderstanding') : t('internalization.newDiscoveries');

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm"
      data-testid="dashboard-internalization-widget"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-sm text-foreground">{t('internalization.title')}</h3>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-sm font-bold text-foreground">{rate}%</span>
        </div>
      </div>

      {/* 분포 바 */}
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex mb-3">
        {(['exposed', 'recognized', 'internalized', 'independent'] as const).map((status) => {
          const count = stats.byStatus[status];
          if (count === 0) return null;
          const pct = (count / stats.totalConnections) * 100;
          const config = STATUS_CONFIG[status];

          return (
            <div
              key={status}
              className={`${config.color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${t(config.labelKey)}: ${count}`}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-between text-xs">
        {(['exposed', 'recognized', 'internalized', 'independent'] as const).map((status) => {
          const count = stats.byStatus[status];
          const config = STATUS_CONFIG[status];

          return (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              <span className={count > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {t(config.labelKey)} {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* 성장 인정 메시지 — D7: 호기심→발견→성장→자신감 */}
      <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
        <p className="text-xs text-muted-foreground">
          {stats.byStatus.independent > 0 ? (
            <>{t('internalization.independentMsg', { count: stats.byStatus.independent })}</>
          ) : (
            growthMessage
          )}
        </p>
      </div>
    </section>
  );
}
