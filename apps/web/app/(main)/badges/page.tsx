'use client';

/**
 * 뱃지/업적 페이지
 * - 획득수/전체 요약
 * - 2열 그리드
 * - 획득: 아이콘+설명, 미획득: Lock+opacity 40%
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Award,
  Lock,
  Star,
  Zap,
  Heart,
  Flame,
  Camera,
  Dumbbell,
  Apple,
  Smile,
  Palette,
  Sparkles,
  Trophy,
  Target,
  Crown,
  Gem,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category: string;
}

// 아이콘 매핑
const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  zap: Zap,
  heart: Heart,
  flame: Flame,
  camera: Camera,
  dumbbell: Dumbbell,
  apple: Apple,
  smile: Smile,
  palette: Palette,
  sparkles: Sparkles,
  trophy: Trophy,
  target: Target,
  crown: Crown,
  gem: Gem,
  award: Award,
};

// 카테고리 색상
const CATEGORY_COLORS: Record<string, string> = {
  analysis: '#6366F1',
  workout: '#F97316',
  nutrition: '#22C55E',
  social: '#EC4899',
  streak: '#EAB308',
  milestone: '#8B5CF6',
  default: '#6B7280',
};

export default function BadgesPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBadges = useCallback(async (): Promise<void> => {
    if (!isLoaded || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/badges');
      if (!res.ok) throw new Error('데이터를 불러올 수 없어요');
      const result = await res.json();
      setBadges(result.data?.badges ?? []);
    } catch {
      setError('뱃지 데이터를 불러오는 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="badges-page">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-60 mb-6" />
        <Skeleton className="h-20 rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && badges.length === 0) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="badges-page">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadBadges} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (badges.length === 0) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="badges-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            뱃지
          </h1>
        </div>
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            아직 등록된 뱃지가 없어요.
            <br />
            분석이나 기록을 시작하면 뱃지를 획득할 수 있어요!
          </p>
        </div>
      </div>
    );
  }

  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="badges-page">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-amber-500" />
          뱃지
        </h1>
        <p className="text-sm text-muted-foreground mt-1">이룸과 함께 쌓아온 업적을 확인하세요</p>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 요약 카드 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">획득한 뱃지</p>
              <p className="text-2xl font-bold">
                <span className="text-amber-500">{earnedCount}</span>
                <span className="text-muted-foreground text-lg"> / {totalCount}</span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{progressPercent}% 달성</p>
        </CardContent>
      </Card>

      {/* 뱃지 그리드 (2열) */}
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => {
          const IconComponent = ICON_MAP[badge.icon] ?? Award;
          const color = CATEGORY_COLORS[badge.category] ?? CATEGORY_COLORS.default;

          return (
            <Card
              key={badge.id}
              className={`relative transition-all ${
                badge.earned ? 'hover:shadow-md' : 'opacity-40'
              }`}
            >
              <CardContent className="pt-5 pb-4 px-4 text-center">
                {badge.earned ? (
                  <>
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color }} />
                    </div>
                    <p className="text-sm font-medium leading-tight mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {badge.description}
                    </p>
                    {badge.earnedAt && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {new Date(badge.earnedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        획득
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-muted">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium leading-tight mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {badge.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
