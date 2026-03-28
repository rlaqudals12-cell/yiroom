'use client';

/**
 * 게이미피케이션 위젯
 * - 레벨 프로그레스 표시
 * - 최근 획득 배지 3개 표시
 * - 전체 배지 페이지 링크
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Award, ChevronRight, Trophy } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { LevelProgress, BadgeCard } from '@/components/gamification';
import { InfoTooltip } from '@/components/common';
import {
  getUserLevelInfo,
  getRecentBadges,
  getUserBadges,
  getAllBadges,
  type LevelInfo,
  type UserBadge,
} from '@/lib/gamification';

interface GamificationWidgetProps {
  userId?: string;
}

export default function GamificationWidget({ userId }: GamificationWidgetProps) {
  const t = useTranslations('dashboard');
  const supabase = useClerkSupabaseClient();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([]);
  const [totalBadges, setTotalBadges] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGamificationData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 레벨 정보 조회
        const level = await getUserLevelInfo(supabase, userId);
        setLevelInfo(level);

        // 최근 배지 조회
        const badges = await getRecentBadges(supabase, userId, 3);
        setRecentBadges(badges);

        // 전체 획득 배지 수 조회 (정확한 카운트)
        const allUserBadges = await getUserBadges(supabase, userId);
        setEarnedCount(allUserBadges.length);

        // 전체 배지 수 조회
        const allBadges = await getAllBadges(supabase);
        setTotalBadges(allBadges.length);
      } catch (error) {
        console.error('[GamificationWidget] 데이터 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGamificationData();
  }, [supabase, userId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="bg-white border border-border rounded-2xl p-6 animate-pulse shadow-sm"
        data-testid="gamification-widget-loading"
      >
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-12 bg-muted rounded mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  // 유저 없음
  if (!userId) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      data-testid="gamification-widget"
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-foreground">{t('gamification.myGrowth')}</h3>
                <InfoTooltip content={t('gamification.levelTooltip')} variant="help" size="sm" />
              </div>
              <p className="text-sm text-primary">
                {t('gamification.levelTier', {
                  level: levelInfo?.level || 1,
                  tier: levelInfo?.tierName || t('gamification.beginner'),
                })}
              </p>
            </div>
          </div>

          {/* 배지 통계 */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <p className="text-sm text-muted-foreground">{t('gamification.earnedBadges')}</p>
              <InfoTooltip content={t('gamification.badgeTooltip')} variant="help" size="sm" />
            </div>
            <p className="text-xl font-bold text-primary">
              {earnedCount}
              <span className="text-sm text-muted-foreground">/{totalBadges}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 레벨 프로그레스 */}
      <div className="p-4 bg-secondary/30">
        {levelInfo ? (
          <LevelProgress levelInfo={levelInfo} size="md" showDetails={true} />
        ) : (
          <div className="text-center py-2 text-sm text-muted-foreground">
            {t('gamification.loadingLevel')}
          </div>
        )}
      </div>

      {/* 최근 획득 배지 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {t('gamification.recentBadges')}
            </span>
          </div>
          <Link
            href="/profile/badges"
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t('common.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentBadges.length > 0 ? (
          <div className="flex gap-2">
            {recentBadges.map((ub) =>
              ub.badge ? (
                <BadgeCard
                  key={ub.id}
                  badge={ub.badge}
                  isEarned={true}
                  earnedAt={ub.earnedAt}
                  size="sm"
                  showDetails={false}
                />
              ) : null
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground">{t('gamification.noBadgesYet')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('gamification.noBadgesHint')}</p>
          </div>
        )}
      </div>

      {/* XP 획득 팁 */}
      {levelInfo && levelInfo.level < 5 && (
        <div className="mx-4 mb-4 bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-primary">
            <span className="font-medium">{t('gamification.tipLabel')}</span>{' '}
            {t('gamification.tipXp')}
          </p>
        </div>
      )}
    </div>
  );
}
