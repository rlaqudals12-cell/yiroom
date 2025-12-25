'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations/Confetti';
import {
  YearlyReviewCard,
  YearlyStats,
  TopAchievements,
  WellnessJourney,
} from '@/components/yearly-review';
import { captureElementAsImage, shareImage, downloadImage, canShareFiles } from '@/lib/share';
import type { YearlyStats as YearlyStatsType } from '@/lib/reports/yearlyAggregator';

/**
 * 2025 연말 리뷰 페이지
 */
export default function YearlyReviewPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<YearlyStatsType | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 데이터 조회
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/reports/yearly?year=2025');
        if (!response.ok) {
          throw new Error('Failed to fetch yearly stats');
        }
        const data = await response.json();
        setStats(data.stats);
        setUserName(data.userName || '');
        setShowConfetti(true);
      } catch (err) {
        console.error('[YearlyReview] Error:', err);
        setError('연말 리뷰를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // 공유 핸들러
  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    setSharing(true);
    try {
      const blob = await captureElementAsImage(cardRef.current, {
        backgroundColor: '#7c3aed',
        scale: 2,
      });

      if (!blob) {
        console.error('[YearlyReview] Failed to capture image');
        return;
      }

      if (canShareFiles()) {
        await shareImage(blob, '2025-연말리뷰.png', '나의 2025 연말 리뷰를 확인해보세요!');
      } else {
        await downloadImage(blob, '2025-연말리뷰.png');
      }
    } catch (err) {
      console.error('[YearlyReview] Share error:', err);
    } finally {
      setSharing(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="yearly-review-loading">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">2025 연말 리뷰</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="yearly-review-error">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">2025 연말 리뷰</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || '데이터를 불러올 수 없습니다.'}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">대시보드로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="yearly-review-page">
      <Confetti trigger={showConfetti} />

      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">2025 연말 리뷰</h1>
      </div>

      {/* 공유 카드 */}
      <div className="mb-6">
        <YearlyReviewCard ref={cardRef} stats={stats} userName={userName} />
      </div>

      {/* 공유 버튼 */}
      <div className="mb-6">
        <ShareButton
          onShare={handleShare}
          loading={sharing}
          fullWidth
          size="lg"
        />
      </div>

      {/* 상세 통계 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">상세 기록</h2>
        <YearlyStats stats={stats} />
        <TopAchievements stats={stats} />
        <WellnessJourney stats={stats} />
      </div>

      {/* 푸터 */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>2025년 한 해 동안 이룸과 함께해 주셔서 감사합니다.</p>
        <p className="mt-1">2026년에도 건강한 한 해 되세요!</p>
      </div>
    </div>
  );
}
